/**
 * AI 模型类型定义
 * 框架无关的 SDK 类型
 */

export type ModelProvider = 'ollama' | 'openai'

export interface AIModel {
  id: string
  name: string
  provider: ModelProvider
  baseUrl?: string
  apiKey?: string
  default?: boolean
}

export interface GenerateOptions {
  temperature?: number
  top_p?: number
  top_k?: number
  num_predict?: number
}

export interface GenerateRequest {
  model: string
  prompt: string
  stream?: boolean
  options?: GenerateOptions
}

export interface GenerateResponse {
  success: boolean
  data?: {
    response: string
    model: string
  }
  error?: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
}

export interface ChatResponse {
  success: boolean
  data?: {
    content: string
    model: string
  }
  error?: string
}