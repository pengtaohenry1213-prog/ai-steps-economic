/**
 * 策略匹配服务类型定义
 * 框架无关的 SDK 类型定义
 */

export interface StrategyInfo {
  id: string
  name: string
  description: string
}

export interface IndustryInfo {
  id: string
  name: string
  description: string
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