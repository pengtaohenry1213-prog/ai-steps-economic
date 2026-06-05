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
  strategy: {
    todos: [
      { type: 'backend', content: '策略匹配', status: 'pending', depends_on: [] },
      { type: 'backend', content: '策略增强', status: 'pending', depends_on: ['strategy-1'] }
    ],
    humanGateRequired: false,
    output: '策略文档',
    roles: ['TechLead']
  },
  proposal: {
    todos: [
      { type: 'backend', content: '立项书生成', status: 'pending', depends_on: [] }
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
  steps: {
    todos: [
      { type: 'frontend', content: 'Steps 生成', status: 'pending', depends_on: [] },
      { type: 'frontend', content: 'Steps 验证', status: 'pending', depends_on: ['steps-1'] }
    ],
    humanGateRequired: false,
    output: 'Steps 文档',
    roles: ['Developer']
  },
  execution: {
    todos: [
      { type: 'frontend', content: '执行路线生成', status: 'pending', depends_on: [] },
      { type: 'frontend', content: '执行路线验证', status: 'pending', depends_on: ['execution-1'] }
    ],
    humanGateRequired: false,
    output: '执行路线',
    roles: ['Developer']
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
  { id: 'strategy', name: '策略', label: 'Strategy' },
  { id: 'proposal', name: '立项书', label: 'Proposal' },
  { id: 'requirement', name: '需求', label: 'Requirement' },
  { id: 'architecture', name: '架构', label: 'Architecture' },
  { id: 'steps', name: 'Steps', label: 'Steps' },
  { id: 'execution', name: '执行路线', label: 'Execution' }
] as const

export interface StageSpec {
  /** 规范文档标题 */
  title: string
  /** 规范文档路径 */
  path: string
  /** 规范类型 */
  category: 'frontend' | 'backend' | 'database' | 'security' | 'testing' | 'git' | 'prompt' | 'process' | 'cursor'
  /** 说明 */
  description?: string
}

export const STAGE_SPECS: Record<string, StageSpec[]> = {
  strategy: [
    { title: 'Prompt模板库', path: 'docs/AI工程化开发手册/Prompt 模板库（AI 工程化开发版）.md', category: 'prompt', description: '策略匹配Prompt' },
    { title: 'AI工程化团队规范', path: 'docs/AI工程化开发手册/AI工程化团队规范（企业级）.md', category: 'process', description: '策略增强规范' }
  ],
  proposal: [
    { title: 'Prompt模板库', path: 'docs/AI工程化开发手册/Prompt 模板库（AI 工程化开发版）.md', category: 'prompt', description: '立项书生成Prompt' },
    { title: 'AI工程化团队规范', path: 'docs/AI工程化开发手册/AI工程化团队规范（企业级）.md', category: 'process', description: '立项书规范' }
  ],
  requirement: [
    { title: 'Prompt模板库', path: 'docs/AI工程化开发手册/Prompt 模板库（AI 工程化开发版）.md', category: 'prompt', description: 'PRD生成、需求分析Prompt' },
    { title: 'AI工程化团队规范', path: 'docs/AI工程化开发手册/AI工程化团队规范（企业级）.md', category: 'process', description: 'Prompt分层规范' }
  ],
  architecture: [
    { title: '前端工程化SOP', path: 'docs/AI工程化开发手册/前端工程化 SOP（Vue3 + TS + Vben Admin）.md', category: 'frontend' },
    { title: '后端工程化SOP', path: 'docs/AI工程化开发手册/后端工程化 SOP（Node.js + NestJS）.md', category: 'backend' },
    { title: '数据库设计规范', path: 'docs/AI工程化开发手册/数据库设计规范（AI 工程化版）.md', category: 'database' },
    { title: '安全工程规范', path: 'docs/AI工程化开发手册/安全工程规范（AI 工程化版）.md', category: 'security' }
  ],
  steps: [
    { title: '前端工程化SOP', path: 'docs/AI工程化开发手册/前端工程化 SOP（Vue3 + TS + Vben Admin）.md', category: 'frontend', description: 'Steps生成规范' },
    { title: 'AI工程化团队规范', path: 'docs/AI工程化开发手册/AI工程化团队规范（企业级）.md', category: 'process', description: 'Steps验证规范' }
  ],
  execution: [
    { title: 'Claude Code工作流', path: 'docs/AI工程化开发手册/Claude Code 工作流（工程化 AI 开发版）.md', category: 'cursor', description: '执行路线规范' },
    { title: 'Cursor使用规范', path: 'docs/AI工程化开发手册/Cursor 使用规范（AI 工程化开发版）.md', category: 'cursor', description: '执行验证规范' }
  ]
}

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