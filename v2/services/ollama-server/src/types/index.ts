/**
 * Ollama Server Types
 * Shared type definitions for the Ollama HTTP API service
 */

// Prompt Types (aligned with aiPrompts.ts)
export type PromptType =
  | 'proposal'
  | 'requirement'
  | 'architecture'
  | 'prd'
  | 'test_plan'
  | 'acceptance'
  | 'deployment'

// Ollama API Types
export interface GenerateOptions {
  temperature?: number
  top_p?: number
  top_k?: number
  num_predict?: number
  stop?: string[]
}

export interface GenerateRequest {
  model: string
  prompt: string
  stream?: boolean
  options?: GenerateOptions
}

export interface GenerateResponse {
  model: string
  response: string
  done: boolean
}

// Stage-based Generation
export interface FileInput {
  name: string
  content: string
}

export type ResponseFormat = 'json-only' | 'markdown-only' | 'both'

export interface GenerateByStageRequest {
  stageId: string
  files: FileInput[]
  model?: string
  provider?: 'ollama' | 'openai'
  baseUrl?: string
  apiKey?: string
  responseFormat?: ResponseFormat
}

export interface GenerateByStageResponse {
  response: string
  stageId: string
  model: string
}

/**
 * Standard Response Format (统一格式)
 * 所有模型返回的数据都会归一化为此格式
 */
export interface StandardResponse {
  success: boolean
  data: {
    /** 模型名称 */
    model: string
    /** 处理耗时 ms */
    duration: number
    /** 结构化 JSON 文本（用于系统解析/存储） */
    jsonText: string
    /** Markdown 文本（用于人工阅读预览） */
    markdownText: string
    /** 原始完整响应（备选） */
    rawText?: string
  }
  error?: string
  timestamp: string
}

// API Response Wrappers
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  timestamp: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
  timestamp: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// Health Check
export interface HealthStatus {
  status: 'ok' | 'error'
  ollamaConnected: boolean
  timestamp: string
}

// Models List
export interface OllamaModel {
  name: string
  modified_at: string
  size?: number
}

export interface ModelsResponse {
  models: OllamaModel[]
}
