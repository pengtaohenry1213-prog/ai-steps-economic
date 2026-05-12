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

export interface GenerateByStageRequest {
  stageId: string
  files: FileInput[]
  model?: string
  provider?: 'ollama' | 'openai'
  baseUrl?: string
  apiKey?: string
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
    /** 结构化数据（JSON 解析后的对象） */
    structured: Record<string, unknown>
    /** 原始完整文本（Markdown，用于预览） */
    rawText: string
    /** 模型名称 */
    model: string
    /** 处理耗时 ms */
    duration: number
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
