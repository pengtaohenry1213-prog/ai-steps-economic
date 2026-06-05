/**
 * AI 模型配置
 * 支持多 provider：本地 Ollama 和 OpenAI 兼容 API
 */

export type ModelProvider = 'ollama' | 'openai'

export interface AIModel {
  /** 模型标识符 */
  id: string
  /** 显示名称 */
  name: string
  /** 模型提供商 */
  provider: ModelProvider
  /** API 基础地址（仅外部模型需要） */
  baseUrl?: string
  /** API 密钥（仅外部模型需要） */
  apiKey?: string
  /** 是否为默认模型 */
  default?: boolean
}

export const AI_MODELS: AIModel[] = [
  {
    id: 'deepseek-r1',
    name: 'DeepSeek-R1 (本地)',
    provider: 'ollama',
    default: true
  },
  {
    id: 'MiniMax-M2.7',
    name: 'MiniMax-M2.7',
    provider: 'openai',
    baseUrl: import.meta.env.VITE_OPENAI_BASE_URL || '',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || ''
  }
]

/**
 * 获取默认模型
 */
export function getDefaultModel(): AIModel {
  return AI_MODELS.find(m => m.default) || AI_MODELS[0]
}

/**
 * 根据 ID 获取模型配置
 */
export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find(m => m.id === id)
}

/**
 * 获取本地 Ollama 模型列表
 */
export function getOllamaModels(): AIModel[] {
  return AI_MODELS.filter(m => m.provider === 'ollama')
}

/**
 * 获取外部 API 模型列表
 */
export function getExternalModels(): AIModel[] {
  return AI_MODELS.filter(m => m.provider === 'openai')
}
