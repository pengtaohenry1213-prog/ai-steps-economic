/**
 * 生命周期阶段定义
 */

export interface LifecycleStageDefinition {
  id: string
  name: string
  label: string
}

export const LIFECYCLE_STAGES: LifecycleStageDefinition[] = [
  { id: 'init', name: '项目初始化', label: 'Init' },
  { id: 'requirement', name: '需求分析', label: 'Requirement' },
  { id: 'architecture', name: '架构设计', label: 'Architecture' },
  { id: 'development', name: '开发实现', label: 'Development' },
  { id: 'testing', name: '测试验收', label: 'Testing' },
  { id: 'acceptance', name: '上线验收', label: 'Acceptance' }
]

export const STAGE_ORDER = ['init', 'requirement', 'architecture', 'development', 'testing', 'acceptance'] as const

export type StageId = typeof STAGE_ORDER[number]

export function getStageById(id: string): LifecycleStageDefinition | undefined {
  return LIFECYCLE_STAGES.find(s => s.id === id)
}

export function getNextStageId(currentId: string): string | null {
  const currentIndex = STAGE_ORDER.indexOf(currentId as StageId)
  if (currentIndex >= 0 && currentIndex < STAGE_ORDER.length - 1) {
    return STAGE_ORDER[currentIndex + 1]
  }
  return null
}

export function initializeStages() {
  return LIFECYCLE_STAGES.map(stage => ({
    id: stage.id,
    name: stage.name,
    label: stage.label,
    status: 'pending' as const,
    steps: [] as string[],
    feedbackLoop: false,
    proposalContent: null
  }))
}