/**
 * @ai-steps/ai-adapter
 * 通用 AI 响应适配器
 */

// 类型
export type {
  StandardResponse,
  RawResponse,
  AdapterFn,
  AdapterRegistry,
  ParseResult,
  UseAIResponseReturn,
  AIRequestParams,
  AIAPIResponse
} from './types'

// 核心归一化
export {
  removeThinkingTags,
  extractJson,
  extractMarkdown,
  parseRawResponse,
  createStandardResponse,
  createErrorResponse
} from './normalizer'

// 适配器
export {
  adapters,
  getAdapter,
  normalize
} from './adapters'

export { normalizeOllama } from './adapters/ollama'
export { normalizeMiniMax } from './adapters/minimax'

// Hooks
export { useAIResponse } from './hooks'