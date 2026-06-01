/**
 * @ai-toolkit/lifecycle-core
 * 项目生命周期管理核心 SDK
 * 框架无关的状态管理
 */

export type * from './types'
export * from './constants'

export { createLifecycleStore } from './types'

import type { LifecycleState, LifecycleStageStatus, LifecycleStage } from './types'
import { LIFECYCLE_STAGES, initializeStages as initStages } from './constants'

export interface LifecycleCoreConfig {
  projectId?: string
  storageKey?: string
}

export class LifecycleCore {
  private state: LifecycleState
  private storageKey: string

  constructor(config: LifecycleCoreConfig = {}) {
    this.storageKey = config.storageKey || 'lifecycle_core_state'
    this.state = this.loadFromStorage() || {
      stages: initStages(),
      currentStageId: 'init'
    }
  }

  getState(): LifecycleState {
    return { ...this.state }
  }

  setState(state: LifecycleState): void {
    this.state = { ...state }
    this.saveToStorage()
  }

  getStage(stageId: string): LifecycleStage | undefined {
    return this.state.stages.find(s => s.id === stageId)
  }

  updateStageStatus(stageId: string, status: LifecycleStageStatus): void {
    const stage = this.state.stages.find(s => s.id === stageId)
    if (stage) {
      stage.status = status
      if (status === 'in_progress' && !stage.startTime) {
        stage.startTime = new Date().toISOString()
      }
      if (status === 'completed' || status === 'failed') {
        stage.endTime = new Date().toISOString()
      }
      this.saveToStorage()
    }
  }

  setCurrentStage(stageId: string): void {
    this.state.currentStageId = stageId
    this.saveToStorage()
  }

  nextStageId(): string | null {
    const currentIndex = this.state.stages.findIndex(s => s.id === this.state.currentStageId)
    if (currentIndex < this.state.stages.length - 1) {
      return this.state.stages[currentIndex + 1].id
    }
    return null
  }

  reset(): void {
    this.state = {
      stages: initStages(),
      currentStageId: 'init'
    }
    this.saveToStorage()
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state))
    } catch {
      // Storage might be unavailable
    }
  }

  private loadFromStorage(): LifecycleState | null {
    try {
      const data = localStorage.getItem(this.storageKey)
      if (!data) return null
      return JSON.parse(data) as LifecycleState
    } catch {
      return null
    }
  }

  getAllStages(): LifecycleStage[] {
    return [...this.state.stages]
  }

  getCurrentStage(): LifecycleStage | undefined {
    return this.state.stages.find(s => s.id === this.state.currentStageId)
  }
}

export function createLifecycleCore(config?: LifecycleCoreConfig): LifecycleCore {
  return new LifecycleCore(config)
}