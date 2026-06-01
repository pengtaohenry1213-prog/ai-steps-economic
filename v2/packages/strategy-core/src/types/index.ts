/**
 * 策略匹配服务类型定义
 * 框架无关的 SDK 类型定义
 */

export interface StrategyInfo {
  id: string
  name: string
  description?: string
}

export interface IndustryInfo {
  id: string
  name: string
  description?: string
}

export interface MatchResult {
  strategy: StrategyInfo
  industry: IndustryInfo
  confidence: number
  reasoning: string
  judgmentBasis: string
}

export interface MatchingRequest {
  userInput: string
}

export interface MatchingResponse {
  success: boolean
  data?: MatchResult
  error?: string
}

export interface LLMClient {
  chat(prompt: string, systemPrompt: string): Promise<string>
}

export interface PhaseInfo {
  name: string
  goal: string
  devMode: string
  specLevel: string
  vibeRatio: string
  humanGate: string
  deliverables: string
  successCriteria: string
}

export interface ModuleDevMode {
  moduleType: string
  devMode: string
  humanGate: string
  note: string
}

export interface RiskInfo {
  riskType: string
  specificRisk: string
  mitigation: string
}

export interface ToolChain {
  phase: string
  tools: string
  note: string
}

export interface EnhancedStrategy {
  title: string
  definition: string
  applicableScenarios: string[]
  notApplicableScenarios: string[]
  coreCharacteristics: string[]
  coreConflict: string
  phases: PhaseInfo[]
  moduleDevModes: ModuleDevMode[]
  keyNotes: string[]
  recommendedToolChain: ToolChain[]
  typicalRisks: RiskInfo[]
  successCriteria: string[]
  industryAdaptation: string
}

export interface EnhancedStrategyResult {
  basicResult: MatchResult
  userInput: string
  enhancedStrategy: EnhancedStrategy
  strategyTemplate: string
  industryArch: string
}

export interface ProposalDocument {
  projectName: string
  projectType: string
  decisionMakers: string[]
  background: string
  currentIssues: string[]
  goals: string[]
  scope: {
    inScope: { P0: string[]; P1: string[] }
    outScope: string[]
  }
  milestones: Array<{ phase: string; day: number; deliverables: string[] }>
  risks: Array<{ risk: string; trigger: string; mitigation: string; owner: string }>
  humanGate: { pmo: string[]; security: string[] }
  acceptance: {
    functionality: string[]
    performance: Record<string, string>
    security: string[]
  }
}

export interface RequirementsDocument {
  projectName: string
  projectType: string
  version: string
  basicInfo: {
    productManager: string
    techLead: string
    testLead: string
  }
  overview: {
    background: string
    goals: { core: string; secondary: string[]; nonGoals: string[] }
    scope: { included: string[]; excluded: string[] }
    constraints: Record<string, string>
  }
  userRoles: Array<{ name: string; description: string; needs: string }>
  functionalRequirements: Array<{
    moduleId: string
    moduleName: string
    requirements: Array<{
      id: string
      name: string
      priority: string
      description: string
      businessRules: string[]
      input: string
      output: string
      exceptionHandling: string
    }>
  }>
  nonFunctionalRequirements: {
    performance: Record<string, string>
    security: string[]
    compatibility: string[]
    usability: Record<string, string>
    maintainability: Record<string, string>
  }
  testStrategy: {
    testScope: string[]
    testTypes: Record<string, string>
    acceptanceCriteria: string[]
  }
}

export interface ArchitectureDocument {
  projectType: string
  techStack: {
    frontend: Array<{ category: string; technology: string; note: string }>
    backend: Array<{ category: string; technology: string; note: string }>
    database: Array<{ type: string; technology: string; scenario: string }>
    ai: Array<{ category: string; technology: string; scenario: string }>
  }
  architectureLayers: string[]
  modules: {
    frontend: Array<{ module: string; description: string; aiEnhanced: boolean }>
    backend: Array<{ module: string; description: string; aiEnhanced: boolean }>
  }
  dataModel: {
    entities: Array<string | { name: string; description?: string }>
    relationships: string
    indexes: Array<string | { name?: string; table?: string; type?: string }>
  }
  apiDesign: {
    standards: string[]
    coreEndpoints: Array<{ category: string; endpoint: string; description: string }>
  }
  deploymentArchitecture: {
    environments: Array<{ name: string; usage: string; traffic: string }>
    deploymentMethods: Array<{ component: string; method: string; note: string }>
  }
  monitoring: {
    infrastructure: string[]
    applicationPerformance: string[]
    aiMonitoring: string[]
  }
}

export interface StepDocument {
  stepNumber: number
  taskObjective: string
  detailedDescription: string
  outOfScope: string[]
  v1ReuseRate: string
  technicalSolution: string
  constraints: string[]
  acceptanceCriteria: {
    functionality: string[]
    performance: Array<{ indicator: string; standard: string }>
    security: string[]
  }
  testCriteria: {
    functionality: string[]
    performance: Array<{ indicator: string; standard: string; testMethod: string }>
    security: string[]
  }
  testAcceptanceFlow: string
  role: string
  associatedRules: string[]
  associatedPrompts: string[]
  todos: Array<{ id: string; content: string; status: string }>
  involvedFiles: string[]
  prerequisites: string
  prerequisiteOutputs: string[]
  riskWarnings: Array<{ risk: string; mitigation: string }>
  relatedSpecs: string[]
  milestoneMapping: string
}

export interface AllDeliverables {
  strategy: EnhancedStrategyResult
  proposal: ProposalDocument
  requirements: RequirementsDocument
  architecture: ArchitectureDocument
}

export interface StepsDevDocument {
  phases: Array<{
    name: string
    steps: string[]
    dependencyLogic: string
  }>
  executionSequence: Array<{
    step: string
    taskObjective: string
    description: string
  }>
  roleMapping: Record<string, string[]>
  progressTracking: Array<{
    step: string
    status: string
    humanGate: string
    role: string
    planFile: string
    completedDate: string
  }>
}

export interface PlanTodo {
  id: string
  type: 'frontend' | 'backend' | 'test' | 'fix'
  content: string
  depends_on: string[]
  acceptance: string
}

export interface PlanDocument {
  stepNumber: number
  overview: string
  stagePhases: Array<{
    stage: string
    name: string
    dependency: string
    deliverables: string
    duration: string
  }>
  keyRisks: Array<{
    risk: string
    mitigation: string
  }>
  todos: PlanTodo[]
  files: Array<{
    path: string
    operation: '新增' | '修改'
    description: string
  }>
  acceptance: Array<{
    item: string
    verification: string
    status: string
  }>
}