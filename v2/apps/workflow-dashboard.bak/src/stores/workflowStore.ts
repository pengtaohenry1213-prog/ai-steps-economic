import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import type { Step, AgentLog, GateDecision } from '../types'

const STORAGE_KEY = 'workflow_dashboard_state'

interface WorkflowState {
  steps: Step[]
  currentStepId: string | null
  agentLogs: AgentLog[]
  retryCount: number
  maxRetries: number
}

export const useWorkflowStore = defineStore('workflow', {
  state: (): WorkflowState => {
    const savedData = loadFromStorage()
    return {
      steps: savedData.steps || [],
      currentStepId: savedData.currentStepId || null,
      agentLogs: savedData.agentLogs || [],
      retryCount: savedData.retryCount || 0,
      maxRetries: 3
    }
  },

  actions: {
    addStep(step: Step) {
      const exists = this.steps.find(s => s.id === step.id)
      if (exists) {
        ElMessage.warning(`Step "${step.id}" 已存在`)
        return
      }
      this.steps.push(step)
      this.saveToStorage()
    },

    deleteStep(stepId: string) {
      const index = this.steps.findIndex(s => s.id === stepId)
      if (index !== -1) {
        this.steps.splice(index, 1)
        if (this.currentStepId === stepId) {
          this.currentStepId = null
        }
        this.saveToStorage()
      }
    },

    resetStep(stepId: string) {
      const step = this.steps.find(s => s.id === stepId)
      if (step) {
        step.status = 'pending'
        step.todos.forEach(todo => {
          todo.status = 'pending'
        })
        step.humanGate = {
          hg1: { type: 'HG1', pmo: 'pending', security: 'pending' },
          hg2: { type: 'HG2', pmo: 'pending', security: 'pending' }
        }
        step.completedAt = undefined
        this.saveToStorage()
      }
    },

    retryStep(stepId: string) {
      const step = this.steps.find(s => s.id === stepId)
      if (step) {
        step.status = 'in_progress'
        step.todos.forEach(todo => {
          if (todo.status === 'failed') {
            todo.status = 'pending'
          }
        })
        this.saveToStorage()
      }
    },

    updateStep(step: Step) {
      const index = this.steps.findIndex(s => s.id === step.id)
      if (index !== -1) {
        this.steps[index] = step
        this.saveToStorage()
      }
    },

    updateStepStatus(stepId: string, status: Step['status']) {
      const step = this.steps.find(s => s.id === stepId)
      if (step) {
        step.status = status
        if (status === 'completed') {
          step.completedAt = new Date().toISOString()
        }
        this.saveToStorage()
      }
    },

    updateTodoStatus(stepId: string, todoId: string, status: Step['todos'][0]['status']) {
      const step = this.steps.find(s => s.id === stepId)
      if (step) {
        const todo = step.todos.find(t => t.id === todoId)
        if (todo) {
          todo.status = status
          this.saveToStorage()
        }
      }
    },

    setHumanGateDecision(stepId: string, gate: 'hg1' | 'hg2', role: 'pmo' | 'security', decision: GateDecision) {
      const step = this.steps.find(s => s.id === stepId)
      if (step) {
        const gateKey = gate === 'hg1' ? 'hg1' : 'hg2'
        const gateData = step.humanGate[gateKey]
        gateData[role] = decision
        gateData.timestamp = decision !== 'pending' ? new Date().toISOString() : undefined
        this.saveToStorage()
      }
    },

    addAgentLog(log: Omit<AgentLog, 'id' | 'timestamp'>) {
      const newLog: AgentLog = {
        ...log,
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date().toISOString()
      }
      this.agentLogs.push(newLog)
      this.saveToStorage()
    },

    incrementRetry() {
      this.retryCount++
      this.saveToStorage()
    },

    resetRetry() {
      this.retryCount = 0
      this.saveToStorage()
    },

    setCurrentStep(stepId: string | null) {
      this.currentStepId = stepId
      this.saveToStorage()
    },

    clearAllSteps() {
      this.steps = []
      this.currentStepId = null
      this.agentLogs = []
      this.saveToStorage()
    },

    async loadFromDocument() {
      ElMessage.info('从文档加载功能待实现')
    },

    initializeFromSnapshot(steps: Step[]) {
      this.steps = steps
      const inProgressStep = steps.find(s => s.status === 'in_progress')
      if (inProgressStep) {
        this.currentStepId = inProgressStep.id
      }
      this.saveToStorage()
    },

    saveToStorage() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        steps: this.steps,
        currentStepId: this.currentStepId,
        agentLogs: this.agentLogs,
        retryCount: this.retryCount
      }))
    }
  }
})

function loadFromStorage(): Partial<WorkflowState> {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}