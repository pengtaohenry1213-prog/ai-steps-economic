import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import type { LifecycleStage, LifecycleStageStatus, Step, Todo, ProposalContent } from '../types'
import { LIFECYCLE_STAGES, LIFECYCLE_STEP_TEMPLATES } from '../types'
import { saveProposal, loadProposal, deleteProposal as deleteProposalFromDb } from '../services/proposalService'
import { saveSnapshot, loadLatestSnapshot, deleteAllSnapshots } from '../services/lifecycleSnapshotService'
import { validateDocument, getRequiredFields, getCompletenessScore } from '../schemas/documentSchemas'
import { generateProjectFiles, generateCursorRules, type GeneratedFile } from '../services/projectGenerator'

const STORAGE_KEY = 'lifecycle_dashboard_state'
const PROJECT_ID = 'default-project'

interface LifecycleState {
  stages: LifecycleStage[]
  currentStageId: string
}

export interface DocumentValidationResult {
  isValid: boolean
  score: number
  missingFields: string[]
  errors: Array<{ field: string; message: string }>
}

export const useLifecycleStore = defineStore('lifecycle', {
  state: (): LifecycleState => {
    const savedData = loadFromStorage()
    return {
      stages: savedData.stages || initializeStages(),
      currentStageId: savedData.currentStageId || 'init'
    }
  },

  actions: {
    async initializeFromDatabase() {
      const savedData = loadFromStorage()
      const hasExistingData = savedData.stages?.some(stage =>
        stage.status !== 'pending' ||
        stage.steps?.length > 0 ||
        stage.proposalContent
      )
      if (hasExistingData) {
        return
      }

      let hasAnyData = false
      const stagesToLoad = ['init', 'requirement', 'architecture', 'development', 'testing', 'acceptance']
      for (const stageId of stagesToLoad) {
        try {
          const { data } = await loadProposal(PROJECT_ID, stageId)
          if (data?.content) {
            hasAnyData = true
            const stage = this.stages.find(s => s.id === stageId)
            if (stage) {
              stage.proposalContent = data.content
              // 根据 proposal status 更新 stage status
              if (data.status === 'approved') {
                stage.status = 'completed'
              } else if (data.status === 'in_review') {
                stage.status = 'in_progress'
              } else if (data.status === 'draft') {
                // draft 状态：如果有 proposalContent，设置 in_progress
                stage.status = 'in_progress'
              } else if (data.status === 'rejected') {
                stage.status = 'failed'
              }
            }
          }
        } catch (err) {
          console.error(`Failed to load proposal for stage ${stageId}:`, err)
        }
      }

      // 如果从数据库恢复了数据，设置当前阶段为第一个有数据的阶段
      if (hasAnyData) {
        const firstActiveStage = this.stages.find(s =>
          s.status === 'in_progress' || s.status === 'completed'
        )
        if (firstActiveStage) {
          this.currentStageId = firstActiveStage.id
        }
        this.saveToStorage()
      }
    },

    async saveFullSnapshot(workflowSteps: Step[] = []) {
      try {
        await saveSnapshot({
          projectId: PROJECT_ID,
          lifecycleStages: this.stages,
          currentStageId: this.currentStageId,
          workflowSteps
        })
      } catch (err) {
        console.error('Failed to save lifecycle snapshot:', err)
      }
    },

    async loadFromSnapshot(): Promise<{ lifecycleState: { stages: LifecycleStage[]; currentStageId: string } | null; workflowSteps: Step[] | null }> {
      try {
        const { data, error } = await loadLatestSnapshot(PROJECT_ID)
        if (error) {
          console.error('Failed to load snapshot:', error)
          return { lifecycleState: null, workflowSteps: null }
        }
        if (data?.lifecycle_state && data?.workflow_steps) {
          return {
            lifecycleState: data.lifecycle_state,
            workflowSteps: data.workflow_steps
          }
        }
      } catch (err) {
        console.error('Failed to load snapshot:', err)
      }
      return { lifecycleState: null, workflowSteps: null }
    },

    async resetLifecycleWithSnapshot(workflowStore: { clearAllSteps: () => void }) {
      this.stages = initializeStages()
      this.currentStageId = 'init'
      this.saveToStorage()

      if (workflowStore) {
        workflowStore.clearAllSteps()
      }

      await this.deleteAllProposals()
      await deleteAllSnapshots(PROJECT_ID)
    },
    updateStageStatus(stageId: string, status: LifecycleStageStatus, workflowStore?: { steps: Step[]; updateStepStatus: (id: string, s: Step['status']) => void }) {
      const stage = this.stages.find(s => s.id === stageId)
      if (stage) {
        stage.status = status
        if (status === 'in_progress' && !stage.startTime) {
          stage.startTime = new Date().toISOString()
        }
        if (status === 'completed' || status === 'failed') {
          stage.endTime = new Date().toISOString()
        }

        // 同步更新 workflowStore 中对应 step 的状态
        if (workflowStore && stage.steps.length > 0) {
          const targetStatus = status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'in_progress'
          stage.steps.forEach(stepId => {
            workflowStore.updateStepStatus(stepId, targetStatus)
          })
        }

        this.saveToStorage()
      }
    },

    // 保存到 Supabase 和 localStorage
    async saveProposalContent(stageId: string, content: ProposalContent | null): Promise<boolean> {
      if (!content) return false

      const stage = this.stages.find(s => s.id === stageId)
      if (!stage) return false

      try {
        const title = extractTitle(content)
        const { error } = await saveProposal({
          projectId: PROJECT_ID,
          stageId,
          title,
          content
        })

        if (error) {
          console.error('Failed to save proposal to Supabase:', error)
          ElMessage.error('保存失败：' + error.message)
          return false
        }

        stage.proposalContent = content
        this.saveToStorage()
        return true
      } catch (err) {
        console.error('Failed to save proposal:', err)
        ElMessage.error('保存失败')
        return false
      }
    },

    // 完成时先保存到 Supabase，成功后再更新 localStorage
    async completeProposalContent(stageId: string, content: ProposalContent | null): Promise<boolean> {
      if (!content) return false

      try {
        const title = extractTitle(content)
        const { error } = await saveProposal({
          projectId: PROJECT_ID,
          stageId,
          title,
          content
        })

        if (error) {
          console.error('Failed to save proposal to Supabase:', error)
          return false
        }

        const stage = this.stages.find(s => s.id === stageId)
        if (stage) {
          stage.proposalContent = content
          this.saveToStorage()
        }
        return true
      } catch (err) {
        console.error('Failed to save proposal to Supabase:', err)
        return false
      }
    },

    async loadProposalFromDb(stageId: string): Promise<ProposalContent | null> {
      try {
        const { data, error } = await loadProposal(PROJECT_ID, stageId)
        if (error) {
          console.error('Failed to load proposal from Supabase:', error)
          return null
        }
        if (data?.content) {
          const stage = this.stages.find(s => s.id === stageId)
          if (stage) {
            stage.proposalContent = data.content
            this.saveToStorage()
          }
          return data.content
        }
      } catch (err) {
        console.error('Failed to load proposal from Supabase:', err)
      }
      return null
    },

    async deleteProposalContent(stageId: string) {
      const stage = this.stages.find(s => s.id === stageId)
      if (stage) {
        stage.proposalContent = null
        this.saveToStorage()

        // 双写：同时从 Supabase 删除
        try {
          await deleteProposalFromDb(PROJECT_ID, stageId)
        } catch (err) {
          console.error('Failed to delete proposal from Supabase:', err)
        }
      }
    },

    startStage(stageId: string, workflowStore: { addStep: (step: Step) => void }) {
      const stage = this.stages.find(s => s.id === stageId)
      if (!stage || stage.status !== 'pending') return

      const template = LIFECYCLE_STEP_TEMPLATES[stageId]
      if (!template) return

      const stepId = `step-${stageId}`
      const todos: Todo[] = template.todos.map((todo, index) => ({
        ...todo,
        id: `${stageId}-${index + 1}`
      }))

      const newStep: Step = {
        id: stepId,
        name: `${stage.name}阶段`,
        stage: stage.label,
        lifecycleStageId: stageId,
        status: 'in_progress',
        todos,
        humanGate: {
          hg1: { type: 'HG1', pmo: 'pending', security: 'pending' },
          hg2: { type: 'HG2', pmo: 'pending', security: 'pending' }
        },
        createdAt: new Date().toISOString()
      }

      workflowStore.addStep(newStep)
      stage.steps.push(stepId)

      stage.status = 'in_progress'
      stage.startTime = new Date().toISOString()
      this.currentStageId = stageId
      this.saveToStorage()
    },

    triggerFeedbackLoop(fromStageId: string) {
      const stage = this.stages.find(s => s.id === fromStageId)
      if (stage) {
        stage.feedbackLoop = true
      }
      const developmentStage = this.stages.find(s => s.id === 'development')
      if (developmentStage && developmentStage.status !== 'completed') {
        this.currentStageId = 'development'
      }
      this.saveToStorage()
    },

    setCurrentStage(stageId: string) {
      this.currentStageId = stageId
      this.saveToStorage()
    },

    nextStage() {
      const currentIndex = this.stages.findIndex(s => s.id === this.currentStageId)
      if (currentIndex < this.stages.length - 1) {
        this.currentStageId = this.stages[currentIndex + 1].id
        this.saveToStorage()
      }
    },

    // 完成当前阶段后，自动启动下一阶段（如果下一阶段还在 pending）
    autoAdvanceToNextStage(workflowStore: { addStep: (step: Step) => void; steps: Step[]; updateStepStatus: (id: string, s: Step['status']) => void }) {
      const nextStageId = this.nextStageId()
      if (!nextStageId) return

      const nextStage = this.stages.find(s => s.id === nextStageId)
      if (!nextStage || nextStage.status !== 'pending') return

      const template = LIFECYCLE_STEP_TEMPLATES[nextStageId]
      if (!template) return

      const stepId = `step-${nextStageId}`
      const todos: Todo[] = template.todos.map((todo, index) => ({
        ...todo,
        id: `${nextStageId}-${index + 1}`
      }))

      const newStep: Step = {
        id: stepId,
        name: `${nextStage.name}阶段`,
        stage: nextStage.label,
        lifecycleStageId: nextStageId,
        status: 'in_progress',
        todos,
        humanGate: {
          hg1: { type: 'HG1', pmo: 'pending', security: 'pending' },
          hg2: { type: 'HG2', pmo: 'pending', security: 'pending' }
        },
        createdAt: new Date().toISOString()
      }

      workflowStore.addStep(newStep)
      nextStage.steps.push(stepId)
      nextStage.status = 'in_progress'
      nextStage.startTime = new Date().toISOString()
      this.currentStageId = nextStageId
      this.saveToStorage()
    },

    nextStageId(): string | null {
      const currentIndex = this.stages.findIndex(s => s.id === this.currentStageId)
      if (currentIndex < this.stages.length - 1) {
        return this.stages[currentIndex + 1].id
      }
      return null
    },

    async resetLifecycle(workflowStore?: { clearAllSteps: () => void }) {
      this.stages = initializeStages()
      this.currentStageId = 'init'
      this.saveToStorage()

      if (workflowStore) {
        workflowStore.clearAllSteps()
      }

      await this.deleteAllProposals()
      await deleteAllSnapshots(PROJECT_ID)
    },

    async deleteAllProposals() {
      for (const stage of this.stages) {
        try {
          await deleteProposalFromDb(PROJECT_ID, stage.id)
        } catch (err) {
          console.error(`Failed to delete proposal for stage ${stage.id}:`, err)
        }
      }
    },

    removeStepFromStage(stageId: string, stepId: string) {
      const stage = this.stages.find(s => s.id === stageId)
      if (stage) {
        const index = stage.steps.indexOf(stepId)
        if (index !== -1) {
          stage.steps.splice(index, 1)
          if (stage.steps.length === 0) {
            stage.status = 'pending'
            stage.proposalContent = null
          }
          this.saveToStorage()
        }
      }
    },

    setStageGenerating(stageId: string, isGenerating: boolean) {
      const stage = this.stages.find(s => s.id === stageId)
      if (stage) {
        stage.isGenerating = isGenerating
        this.saveToStorage()
      }
    },

    validateProposalContent(stageId: string, content: ProposalContent | null): DocumentValidationResult {
      if (!content) {
        return {
          isValid: false,
          score: 0,
          missingFields: getRequiredFields(stageId),
          errors: [{ field: 'document', message: '文档内容为空' }]
        }
      }

      const result = validateDocument(stageId, content)

      if (result.success) {
        const score = getCompletenessScore(stageId, content as Record<string, unknown>)
        const requiredFields = getRequiredFields(stageId)
        const missingFields = requiredFields.filter(field => {
          const value = (content as Record<string, unknown>)[field]
          if (Array.isArray(value)) return value.length === 0
          return value === undefined || value === null || value === ''
        })

        return {
          isValid: missingFields.length === 0,
          score,
          missingFields,
          errors: []
        }
      }

      return {
        isValid: false,
        score: getCompletenessScore(stageId, content as Record<string, unknown>),
        missingFields: (result.errors || []).map(e => e.path),
        errors: (result.errors || []).map(e => ({ field: e.path, message: e.message }))
      }
    },

    async executeInitialization(): Promise<{ success: boolean; files: GeneratedFile[] }> {
      const architectureStage = this.stages.find(s => s.id === 'architecture')
      console.log('[Initialization] architectureStage:', architectureStage)
      console.log('[Initialization] proposalContent:', architectureStage?.proposalContent)

      if (!architectureStage?.proposalContent) {
        ElMessage.warning('未找到架构文档，请先完成架构阶段')
        return { success: false, files: [] }
      }

      const archDoc = architectureStage.proposalContent as unknown as {
        fullText?: string
        name?: string
        overview?: string
        techStack?: string[]
        architectureType?: string
        components?: string[]
        steps?: Array<{ id: string; title: string; target: string; constraints: string[]; acceptance: string[]; files: string[]; dependsOn: string }>
      }

      console.log('[Initialization] archDoc fullText:', archDoc.fullText?.slice(0, 200))

      // Get projectName from init stage first (where it was properly extracted from proposal)
      const initStage = this.stages.find(s => s.id === 'init')
      let projectName = initStage?.proposalContent?.name

      // If not found in init stage, try architecture doc
      if (!projectName) {
        projectName = archDoc.name || archDoc.overview
      }

      // Fallback: extract from architecture markdown title
      if (!projectName && archDoc.fullText) {
        const nameMatch = archDoc.fullText.match(/^#\s+(.+)$/m)
        if (nameMatch) {
          // Remove common suffixes like "项目立项书", "架构设计文档", "需求文档", "项目架构", etc.
          projectName = nameMatch[1]
            .replace(/项目立项书$/, '')
            .replace(/立项书$/, '')
            .replace(/架构设计文档$/, '')
            .replace(/需求文档$/, '')
            .replace(/项目架构$/, '')
            .replace(/项目需求$/, '')
            .trim() || undefined
        }
      }

      // Final fallback
      if (!projectName) {
        projectName = 'my-project'
      }

      let techStack = archDoc.techStack
      let components = archDoc.components

      if ((!techStack || techStack.length === 0) && archDoc.fullText) {
        const techStackFromMd = extractTechStackFromMarkdown(archDoc.fullText)
        techStack = techStackFromMd.length > 0 ? techStackFromMd : ['Vue3', 'TypeScript', 'Vite', 'Pinia']
      }

      if ((!components || components.length === 0) && archDoc.fullText) {
        components = extractComponentsFromMarkdown(archDoc.fullText)
      }

      console.log('[Initialization] extracted projectName:', projectName)
      console.log('[Initialization] extracted techStack:', techStack)
      console.log('[Initialization] extracted components:', components)

      // Extract steps from architecture if not in structured data
      let steps = archDoc.steps
      if ((!steps || steps.length === 0) && archDoc.fullText) {
        steps = extractStepsFromMarkdown(archDoc.fullText, components)
      }
      console.log('[Initialization] extracted steps:', steps?.length)

      const normalizedProjectName = projectName.toLowerCase().replace(/\s+/g, '-')
      const config = {
        projectName: normalizedProjectName,
        techStack: techStack || ['Vue3', 'TypeScript', 'Vite', 'Pinia'],
        architectureType: archDoc.architectureType || 'SPA',
        components: components || [],
        outputPath: '/Users/taopeng/workspace/AI_2026/ai-steps-economic/v2/dev/'
      }

      console.log('[Initialization] config:', config)

      try {
        const generatedFiles = await generateProjectFiles(config)
        console.log('[Initialization] generatedFiles count:', generatedFiles.length)
        const cursorRules = generateCursorRules()

        // Generate step documents from steps array
        const stepFiles = generateStepDocuments(steps || [], components || [])

        // All file paths are prefixed with projectName so the zip extracts to v2/dev/{projectName}/
        const allFiles = [
          ...generatedFiles.map(f => ({ ...f, path: `${projectName}/${f.path}` })),
          ...cursorRules.map(r => ({ path: `${projectName}/${r.path}`, content: r.content })),
          ...stepFiles.map(sf => ({ path: `${projectName}/${sf.path}`, content: sf.content }))
        ]

        return { success: true, files: allFiles }
      } catch (err) {
        console.error('Failed to generate project:', err)
        return { success: false, files: [] }
      }
    },

    saveToStorage() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        stages: this.stages,
        currentStageId: this.currentStageId
      }))
    }
  }
})

function initializeStages(): LifecycleStage[] {
  return LIFECYCLE_STAGES.map(stage => ({
    id: stage.id,
    name: stage.name,
    label: stage.label,
    status: 'pending' as LifecycleStageStatus,
    steps: [],
    feedbackLoop: false,
    proposalContent: null
  }))
}

function loadFromStorage(): Partial<LifecycleState> {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return {}
    const parsed = JSON.parse(data)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch (e) {
    console.error('Failed to parse localStorage data:', e)
    return {}
  }
}

function extractTitle(content: ProposalContent): string {
  if (typeof content.basicInfo === 'string') {
    const match = content.basicInfo.match(/^#\s+(.+)/m)
    return match ? match[1] : 'Untitled Proposal'
  }
  return content.name || 'Untitled Proposal'
}

function extractTechStackFromMarkdown(markdown: string): string[] {
  const techStack: string[] = []
  const techPatterns = [
    { pattern: /Vue3|Vue\s*3/i, tech: 'Vue3' },
    { pattern: /TypeScript|TS\b/i, tech: 'TypeScript' },
    { pattern: /Vite/i, tech: 'Vite' },
    { pattern: /Pinia/i, tech: 'Pinia' },
    { pattern: /TailwindCSS|Tailwind/i, tech: 'TailwindCSS' },
    { pattern: /vxe-table|vxe-table/i, tech: 'vxe-table' },
    { pattern: /HyperFormula|hyperformula/i, tech: 'HyperFormula' },
    { pattern: /Vitest/i, tech: 'Vitest' },
    { pattern: /Turborepo|turborepo/i, tech: 'Turborepo' },
    { pattern: /Supabase/i, tech: 'Supabase' },
    { pattern: /Yjs|Yjs/i, tech: 'Yjs' }
  ]

  for (const { pattern, tech } of techPatterns) {
    if (pattern.test(markdown) && !techStack.includes(tech)) {
      techStack.push(tech)
    }
  }

  return techStack
}

function extractComponentsFromMarkdown(markdown: string): string[] {
  const components: string[] = []

  const sectionMatch = markdown.match(/##\s*3\.\s*核心组件设计|##\s*[Cc]omponents?/)
  if (sectionMatch) {
    const sectionStart = markdown.indexOf(sectionMatch[0])
    const nextSection = markdown.indexOf('##', sectionStart + 10)
    const sectionContent = nextSection > 0
      ? markdown.slice(sectionStart, nextSection)
      : markdown.slice(sectionStart)

    const listItems = sectionContent.match(/^\d+[.)]\s*`.+?`|^-\s*`.+?`|^\*\s*`.+?`/gm)
    if (listItems) {
      for (const item of listItems) {
        const match = item.match(/`([^`]+)`/)
        if (match) {
          components.push(match[1])
        }
      }
    }
  }

  const componentNames = markdown.match(/(?:组件|模块|Component|Module)[:：]\s*([^\n]+)/gi)
  if (componentNames) {
    for (const name of componentNames) {
      const match = name.match(/[:：]\s*([^\n]+)/)
      if (match) {
        const parts = match[1].split(/[,，、]/).map(p => p.trim()).filter(p => p)
        components.push(...parts)
      }
    }
  }

  return [...new Set(components)]
}

interface StepInfo {
  id: string
  title: string
  target: string
  constraints: string[]
  acceptance: string[]
  files: string[]
  dependsOn: string
}

function extractStepsFromMarkdown(markdown: string, components: string[]): StepInfo[] {
  const steps: StepInfo[] = []

  // Look for "Step N:" or "StepN:" patterns in the markdown
  const stepMatches = markdown.matchAll(/^#{1,3}\s*Step\s*(\d+):?\s*(.+)$/gm)

  for (const match of stepMatches) {
    const stepNum = parseInt(match[1])
    const stepTitle = match[2].trim()

    // Extract content after this step header until the next step or section
    const stepStart = match.index!
    const nextStepMatch = markdown.slice(stepStart + match[0].length).match(/^#{1,3}\s*Step\s*\d+:/m)
    const nextStepStart = nextStepMatch ? stepStart + match[0].length + (nextStepMatch.index || 0) : markdown.length
    const stepContent = markdown.slice(stepStart, nextStepStart)

    // Extract files mentioned in the step
    const files: string[] = []
    const fileMatches = stepContent.matchAll(/`([^`]+\.(vue|ts|tsx|js|jsx))`/g)
    for (const fileMatch of fileMatches) {
      files.push(fileMatch[1])
    }

    steps.push({
      id: `step${stepNum}`,
      title: stepTitle,
      target: stepTitle,
      constraints: [
        '遵循前端工程化 SOP',
        '遵循后端工程化 SOP',
        '遵循数据库设计规范',
        '遵循安全工程规范'
      ],
      acceptance: [
        '功能可正常运行',
        '单元测试覆盖率 > 70%',
        '无安全漏洞'
      ],
      files: files.length > 0 ? files : [`src/views/${stepTitle}.vue`],
      dependsOn: stepNum > 1 ? `step${stepNum - 1}` : ''
    })
  }

  // If no steps found, generate from components
  if (steps.length === 0 && components.length > 0) {
    components.forEach((component, index) => {
      steps.push({
        id: `step${index + 1}`,
        title: component,
        target: `实现 ${component} 模块`,
        constraints: [
          '遵循前端工程化 SOP',
          '遵循后端工程化 SOP',
          '遵循数据库设计规范',
          '遵循安全工程规范'
        ],
        acceptance: [
          '功能可正常运行',
          '单元测试覆盖率 > 70%',
          '无安全漏洞'
        ],
        files: [`src/views/${component}.vue`],
        dependsOn: index > 0 ? `step${index}` : ''
      })
    })
  }

  // Fallback: if still no steps, create a default step
  if (steps.length === 0) {
    steps.push({
      id: 'step1',
      title: '基础功能开发',
      target: '实现项目基础功能模块',
      constraints: [
        '遵循前端工程化 SOP',
        '遵循后端工程化 SOP',
        '遵循数据库设计规范',
        '遵循安全工程规范'
      ],
      acceptance: [
        '功能可正常运行',
        '单元测试覆盖率 > 70%',
        '无安全漏洞'
      ],
      files: ['src/views/Home.vue'],
      dependsOn: ''
    })
  }

  return steps
}

interface StepFile {
  path: string
  content: string
}

function generateStepDocuments(steps: StepInfo[], components: string[]): StepFile[] {
  const stepFiles: StepFile[] = []

  for (const step of steps) {
    const stepMarkdown = `# Step ${step.id.replace('step', '')}: ${step.title}

## 任务目标
${step.target}

## 约束条件
${step.constraints.map(c => `- ${c}`).join('\n')}

## 验收标准
${step.acceptance.map(a => `- [ ] ${a}`).join('\n')}

## 涉及文件
${step.files.map(f => `- ${f}`).join('\n')}

## 前置依赖
${step.dependsOn ? `- ${step.dependsOn}.md` : '- 无'}
`

    stepFiles.push({
      path: `docs/steps/${step.id}.md`,
      content: stepMarkdown
    })
  }

  return stepFiles
}