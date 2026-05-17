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

// Prompts (advanced usage)
export {
  buildStrategyMatchingSystemPrompt,
  buildStrategyMatchingUserPrompt,
  parseStrategyMatchingResponse,
  buildStrategyEnhancementSystemPrompt,
  buildStrategyEnhancementUserPrompt,
  parseStrategyEnhancementResponse
} from './prompts/strategy-matching-prompt'