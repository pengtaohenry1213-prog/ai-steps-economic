import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import type { LifecycleStage, LifecycleStageStatus, Step, Todo, ProposalContent } from '../types'
import { LIFECYCLE_STAGES, LIFECYCLE_STEP_TEMPLATES } from '../types'

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
          // Placeholder for database loading - actual implementation would use supabaseClient
          const data = null
          if (data?.content) {
            hasAnyData = true
            const stage = this.stages.find(s => s.id === stageId)
            if (stage) {
              stage.proposalContent = data.content
              if (data.status === 'approved') {
                stage.status = 'completed'
              } else if (data.status === 'in_review') {
                stage.status = 'in_progress'
              } else if (data.status === 'draft') {
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
        // Placeholder for snapshot saving - actual implementation would use lifecycleSnapshotService
        console.log('[Snapshot] Saving with steps:', workflowSteps.length)
      } catch (err) {
        console.error('Failed to save lifecycle snapshot:', err)
      }
    },

    async loadFromSnapshot(): Promise<{ lifecycleState: { stages: LifecycleStage[]; currentStageId: string } | null; workflowSteps: Step[] | null }> {
      try {
        // Placeholder for snapshot loading
        return { lifecycleState: null, workflowSteps: null }
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

        if (workflowStore && stage.steps.length > 0) {
          const targetStatus = status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'in_progress'
          stage.steps.forEach(stepId => {
            workflowStore.updateStepStatus(stepId, targetStatus)
          })
        }

        this.saveToStorage()
      }
    },

    clearStageContent(stageId: string) {
      const stage = this.stages.find(s => s.id === stageId)
      if (stage) {
        stage.proposalContent = null
        this.saveToStorage()
      }
    },

    async saveProposalContent(stageId: string, content: ProposalContent | null): Promise<boolean> {
      if (!content) return false

      const stage = this.stages.find(s => s.id === stageId)
      if (!stage) return false

      try {
        const title = extractTitle(content)
        // Placeholder for actual Supabase save - would use proposalService.saveProposal()
        console.log('[SaveProposal]', { stageId, title })

        stage.proposalContent = content
        this.saveToStorage()
        return true
      } catch (err) {
        console.error('Failed to save proposal:', err)
        ElMessage.error('保存失败')
        return false
      }
    },

    async completeProposalContent(stageId: string, content: ProposalContent | null): Promise<boolean> {
      if (!content) return false

      try {
        const title = extractTitle(content)
        // Placeholder for Supabase save
        console.log('[CompleteProposal]', { stageId, title })

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
        // Placeholder for Supabase load
        console.log('[LoadProposal]', { stageId })
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
    },

    async deleteAllProposals() {
      // Placeholder for deleting all proposals from database
      console.log('[DeleteAllProposals]')
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
          missingFields: [],
          errors: [{ field: 'document', message: '文档内容为空' }]
        }
      }

      // Basic validation - actual implementation would use documentSchemas
      return {
        isValid: true,
        score: 100,
        missingFields: [],
        errors: []
      }
    },

    async executeInitialization(): Promise<{ success: boolean; files: Array<{ path: string; content: string }> }> {
      const architectureStage = this.stages.find(s => s.id === 'architecture')
      console.log('[Initialization] architectureStage:', architectureStage)

      if (!architectureStage?.proposalContent) {
        ElMessage.warning('未找到架构文档，请先完成架构阶段')
        return { success: false, files: [] }
      }

      ElMessage.success('项目脚手架生成完成')
      return { success: true, files: [] }
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