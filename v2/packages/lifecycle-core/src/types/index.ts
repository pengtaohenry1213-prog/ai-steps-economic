/**
 * 生命周期核心类型定义
 * 框架无关的 SDK 类型
 */

export type LifecycleStageStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface LifecycleStage {
  id: string
  name: string
  label: string
  status: LifecycleStageStatus
  steps: string[]
  startTime?: string
  endTime?: string
  proposalContent?: Record<string, unknown> | null
  isGenerating?: boolean
  feedbackLoop?: boolean
}

export interface LifecycleState {
  stages: LifecycleStage[]
  currentStageId: string
}

export interface ProposalContent {
  name?: string
  fullText?: string
  [key: string]: unknown
}

export interface DocumentValidationResult {
  isValid: boolean
  score: number
  missingFields: string[]
  errors: Array<{ field: string; message: string }>
}

export interface LifecycleStore {
  getState(): LifecycleState
  setState(state: LifecycleState): void
  updateStageStatus(stageId: string, status: LifecycleStageStatus): void
  setCurrentStage(stageId: string): void
  nextStageId(): string | null
  getStage(stageId: string): LifecycleStage | undefined
  saveToStorage?(): void
}

export function createLifecycleStore(initialState?: Partial<LifecycleState>): LifecycleStore {
  let state: LifecycleState = {
    stages: [],
    currentStageId: 'init',
    ...initialState
  }

  return {
    getState() {
      return { ...state }
    },

    setState(newState: LifecycleState) {
      state = { ...newState }
    },

    updateStageStatus(stageId: string, status: LifecycleStageStatus) {
      const stage = state.stages.find(s => s.id === stageId)
      if (stage) {
        stage.status = status
        if (status === 'in_progress' && !stage.startTime) {
          stage.startTime = new Date().toISOString()
        }
        if (status === 'completed' || status === 'failed') {
          stage.endTime = new Date().toISOString()
        }
      }
    },

    setCurrentStage(stageId: string) {
      state.currentStageId = stageId
    },

    nextStageId(): string | null {
      const currentIndex = state.stages.findIndex(s => s.id === state.currentStageId)
      if (currentIndex < state.stages.length - 1) {
        return state.stages[currentIndex + 1].id
      }
      return null
    },

    getStage(stageId: string) {
      return state.stages.find(s => s.id === stageId)
    }
  }
}