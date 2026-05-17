/**
 * 策略匹配模块导出
 */

// Types
export * from './types/strategy-matching'

// Services
export {
  configureLLMClient,
  isLLMConfigured,
  matchStrategy,
  getFullStrategyInfo,
  getFullIndustryInfo,
  getAllStrategies,
  getAllIndustries
} from './services/strategy-matching-service'

// Prompts
export {
  buildStrategyMatchingSystemPrompt,
  buildStrategyMatchingUserPrompt,
  parseStrategyMatchingResponse
} from './prompts/strategy-matching-prompt'