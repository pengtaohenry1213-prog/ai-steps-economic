import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import type { LifecycleStage, LifecycleStageStatus, Step, Todo, ProposalContent } from '../types'
import { LIFECYCLE_STAGES, LIFECYCLE_STEP_TEMPLATES } from '../types'
import { saveProposal, loadProposal, deleteProposal as deleteProposalFromDb } from '../services/proposalService'
import { saveSnapshot, loadLatestSnapshot, deleteAllSnapshots } from '../services/lifecycleSnapshotService'
import { validateDocument, getRequiredFields, getCompletenessScore } from '../schemas/documentSchemas'

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

    resetLifecycle(workflowStore?: { clearAllSteps: () => void }) {
      this.stages = initializeStages()
      this.currentStageId = 'init'
      this.saveToStorage()

      if (workflowStore) {
        workflowStore.clearAllSteps()
      }

      this.deleteAllProposals()
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
  const match = content.basicInfo?.match(/^#\s+(.+)/m)
  return match ? match[1] : 'Untitled Proposal'
}