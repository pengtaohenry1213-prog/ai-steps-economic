/**
 * @ai-toolkit/strategy-core
 * 开发策略智能匹配核心 SDK
 */

// Types
export type * from './types'

// Constants
export * from './constants'

// Services
export {
  configureLLMClient,
  isLLMConfigured,
  matchStrategy,
  matchStrategyWithAIService,
  getFullStrategyInfo,
  getFullIndustryInfo,
  getAllStrategies,
  getAllIndustries,
  loadStrategyTemplate,
  loadIndustryArch,
  enhanceStrategy,
  enhanceStrategyWithAIService
} from './services/strategy-matching-service'

export {
  generateAllDeliverablesWithAIService,
  formatProposalAsMarkdown,
  formatRequirementsAsMarkdown,
  formatArchitectureAsMarkdown
} from './services/document-generation-service'

export {
  generateStepDocumentsFromArchitecture,
  formatStepAsMarkdown
} from './services/step-generation-service'

export {
  splitStepsIntoFiles,
  getStepFilePath,
  type SplitStepFile,
  type SplitResult
} from './services/step-split-service'

export {
  generateStepsDevDocument,
  formatStepsDevAsMarkdown
} from './services/steps-dev-generation-service'

export {
  generatePlanFromStep,
  formatPlanAsMarkdown
} from './services/plan-generation-service'

// Adapters (ACL Layer)
export {
  toProposalContent,
  toProposalDocument,
  toRequirementsContent,
  toArchitectureContent,
  formatProposalDocumentAsMarkdown,
  toProposalContentFromAny,
  aclToB,
} from './adapters'
export {
  buildStrategyMatchingSystemPrompt,
  buildStrategyMatchingUserPrompt,
  parseStrategyMatchingResponse,
  buildStrategyEnhancementSystemPrompt,
  buildStrategyEnhancementUserPrompt,
  parseStrategyEnhancementResponse
} from './prompts/strategy-matching-prompt'