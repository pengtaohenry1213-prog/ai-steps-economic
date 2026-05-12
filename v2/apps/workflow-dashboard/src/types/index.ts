export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export type GateDecision = 'PASS' | 'CONDITIONAL' | 'REJECT' | 'pending'

export interface Todo {
  id: string
  type: 'frontend' | 'backend' | 'test' | 'fix'
  content: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  depends_on: string[]
}

export interface HumanGate {
  type: 'HG1' | 'HG2'
  pmo: GateDecision
  security: GateDecision
  timestamp?: string
  reasons?: string[]
}

export interface Step {
  id: string
  name: string
  stage: string
  lifecycleStageId?: string
  status: StepStatus
  todos: Todo[]
  humanGate: {
    hg1: HumanGate
    hg2: HumanGate
  }
  planFile?: string
  createdAt: string
  completedAt?: string
}

export interface TeamMember {
  id: string
  name: string
  role: 'PMO' | 'PM' | 'TechLead' | 'Security' | 'Developer' | 'Tester'
  department: string
  cursorRule?: string
  humanGateRole?: 'pmo' | 'security'
}

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 'pmo-1', name: '梁渭波', role: 'PMO', department: '产品部', cursorRule: '.cursor/rules/PMO.mdc', humanGateRole: 'pmo' },
  { id: 'pm-1', name: '朱登煌', role: 'PM', department: '产品部', cursorRule: '.cursor/rules/PM.mdc' },
  { id: 'tech-lead-1', name: '彭涛', role: 'TechLead', department: '技术部', cursorRule: '.cursor/rules/tech-lead.mdc' },
  { id: 'security-1', name: '尚小雨', role: 'Security', department: '安全部', humanGateRole: 'security' },
  { id: 'dev-1', name: '彭涛', role: 'Developer', department: '开发部' },
  { id: 'tester-1', name: '尚小雨', role: 'Tester', department: '测试部' }
]

export const LIFECYCLE_STEP_TEMPLATES: Record<string, {
  todos: Omit<Todo, 'id'>[]
  humanGateRequired: boolean
  output: string
  roles: string[]
  techLeadId?: string
}> = {
  init: {
    todos: [
      { type: 'backend', content: '市场可行性分析', status: 'pending', depends_on: [] },
      { type: 'backend', content: '竞品调研', status: 'pending', depends_on: [] },
      { type: 'backend', content: '收益评估', status: 'pending', depends_on: [] }
    ],
    humanGateRequired: true,
    output: '立项书',
    roles: ['PMO', 'TechLead'],
    techLeadId: 'tech-lead-1'
  },
  requirement: {
    todos: [
      { type: 'backend', content: 'PRD 生成', status: 'pending', depends_on: [] },
      { type: 'frontend', content: '需求整理与格式化', status: 'pending', depends_on: ['requirement-1'] },
      { type: 'frontend', content: '业务方确认', status: 'pending', depends_on: ['requirement-2'] }
    ],
    humanGateRequired: true,
    output: 'PRD 文档',
    roles: ['PMO', 'PM']
  },
  architecture: {
    todos: [
      { type: 'backend', content: '系统架构设计', status: 'pending', depends_on: [] },
      { type: 'frontend', content: 'AI 模块设计', status: 'pending', depends_on: ['architecture-1'] },
      { type: 'frontend', content: '全栈方案设计', status: 'pending', depends_on: ['architecture-1'] }
    ],
    humanGateRequired: true,
    output: '架构文档',
    roles: ['TechLead']
  },
  initialization: {
    todos: [
      { type: 'frontend', content: '项目骨架搭建', status: 'pending', depends_on: [] },
      { type: 'frontend', content: '代码规范制定', status: 'pending', depends_on: ['initialization-1'] },
      { type: 'backend', content: '依赖安装配置', status: 'pending', depends_on: ['initialization-1'] },
      { type: 'backend', content: 'Cursor Rules 配置', status: 'pending', depends_on: ['initialization-3'] }
    ],
    humanGateRequired: false,
    output: '可运行项目',
    roles: ['Developer']
  },
  development: {
    todos: [
      { type: 'frontend', content: '前端组件开发', status: 'pending', depends_on: [] },
      { type: 'backend', content: 'API 接口开发', status: 'pending', depends_on: ['development-1'] }
    ],
    humanGateRequired: false,
    output: '代码',
    roles: ['Developer']
  },
  testing: {
    todos: [
      { type: 'test', content: 'AI 专项测试设计', status: 'pending', depends_on: [] },
      { type: 'frontend', content: '单元测试', status: 'pending', depends_on: [] },
      { type: 'test', content: '集成测试', status: 'pending', depends_on: ['testing-1', 'testing-2'] }
    ],
    humanGateRequired: true,
    output: '测试报告',
    roles: ['Tester', 'Developer']
  },
  acceptance: {
    todos: [
      { type: 'frontend', content: '验收文档生成', status: 'pending', depends_on: [] },
      { type: 'frontend', content: '验收整理与导出', status: 'pending', depends_on: ['acceptance-1'] }
    ],
    humanGateRequired: true,
    output: '验收报告',
    roles: ['PM', 'PMO']
  },
  packaging: {
    todos: [
      { type: 'backend', content: 'Dockerfile 编写', status: 'pending', depends_on: [] },
      { type: 'backend', content: '部署脚本配置', status: 'pending', depends_on: ['packaging-1'] },
      { type: 'frontend', content: '本地构建验证', status: 'pending', depends_on: ['packaging-1'] }
    ],
    humanGateRequired: false,
    output: '镜像/包',
    roles: ['Developer']
  },
  deployment: {
    todos: [
      { type: 'backend', content: '多环境部署方案', status: 'pending', depends_on: [] },
      { type: 'frontend', content: '本地调试', status: 'pending', depends_on: ['deployment-1'] }
    ],
    humanGateRequired: false,
    output: '运行服务',
    roles: ['Developer', 'TechLead']
  },
  operation: {
    todos: [
      { type: 'backend', content: '日志分析系统', status: 'pending', depends_on: [] },
      { type: 'frontend', content: '监控告警配置', status: 'pending', depends_on: ['operation-1'] },
      { type: 'backend', content: '热更新机制', status: 'pending', depends_on: ['operation-1'] }
    ],
    humanGateRequired: false,
    output: '监控告警',
    roles: ['Developer']
  },
  iteration: {
    todos: [
      { type: 'backend', content: '需求收集分析', status: 'pending', depends_on: [] },
      { type: 'frontend', content: '优化方案生成', status: 'pending', depends_on: ['iteration-1'] },
      { type: 'frontend', content: '开发实现', status: 'pending', depends_on: ['iteration-2'] }
    ],
    humanGateRequired: true,
    output: '新版本',
    roles: ['PM', 'Developer']
  }
}

export interface AgentLog {
  id: string
  agent: 'planner' | 'frontend' | 'backend' | 'test' | 'reviewer'
  todoId?: string
  action: string
  timestamp: string
  status: 'started' | 'completed' | 'failed'
}

export type LifecycleStageStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface LifecycleStage {
  id: string
  name: string
  label: string
  status: LifecycleStageStatus
  startTime?: string
  endTime?: string
  steps: string[]
  feedbackLoop: boolean
  proposalContent?: ProposalContent | null
  isGenerating?: boolean
}

// 统一的 ProposalContent 类型，支持所有字段（用于运行时）
export interface ProposalContent {
  // 基本信息
  name?: string
  type?: string
  decisionMakers?: string[]
  basicInfo?: string | {
    name?: string
    type?: string
    decisionMakers?: string[]
    [key: string]: unknown
  }

  // 内容
  background?: string
  currentIssues?: string[]
  goals?: string[]

  // 范围
  scope?: {
    inScope?: { P0?: string[]; P1?: string[]; P2?: string[] } | string[]
    outScope?: string[]
  }

  // 验收标准
  acceptance?: {
    functionality?: string[]
    performance?: Record<string, string>
    security?: string[]
  } | string

  // 里程碑
  milestones?: string[] | string

  // 风险
  risks?: Array<{
    type?: string
    description?: string
    impact?: string
    countermeasure?: string
  }> | string

  // Human Gate
  humanGate?: {
    pmo?: string[]
    security?: string[]
  } | string

  // 完整文本
  fullText?: string
}

export interface GapAnalysisResult {
  hasCovered: string[]
  missingSuggestions: {
    category: string
    item: string
    reason: string
  }[]
  bestPractices: string[]
  summary: string
  fullText?: string
}

export const LIFECYCLE_STAGES = [
  { id: 'init', name: '立项', label: 'Init' },
  { id: 'requirement', name: '需求', label: 'Requirement' },
  { id: 'architecture', name: '架构', label: 'Architecture' },
  { id: 'initialization', name: '初始化', label: 'Init Project' },
  { id: 'development', name: '开发', label: 'Development' },
  { id: 'testing', name: '测试', label: 'Testing' },
  { id: 'acceptance', name: '验收', label: 'Acceptance' },
  { id: 'packaging', name: '打包', label: 'Packaging' },
  { id: 'deployment', name: '部署', label: 'Deployment' },
  { id: 'operation', name: '运维', label: 'Operation' },
  { id: 'iteration', name: '迭代', label: 'Iteration' }
] as const

export interface WorkflowState {
  steps: Step[]
  currentStepId: string | null
  agentLogs: AgentLog[]
  retryCount: number
  maxRetries: number

  addStep: (step: Step) => void
  updateStepStatus: (stepId: string, status: StepStatus) => void
  updateTodoStatus: (stepId: string, todoId: string, status: Todo['status']) => void
  setHumanGateDecision: (stepId: string, gate: 'hg1' | 'hg2', role: 'pmo' | 'security', decision: GateDecision) => void
  addAgentLog: (log: Omit<AgentLog, 'id' | 'timestamp'>) => void
  incrementRetry: () => void
  resetRetry: () => void
  setCurrentStep: (stepId: string | null) => void
}