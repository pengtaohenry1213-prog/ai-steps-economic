/**
 * 标准 AI 响应格式
 * 所有模型返回的数据都会归一化为此格式
 */
import type { Ref, ComputedRef } from 'vue'

export interface StandardResponse<T = unknown> {
  success: boolean
  data: {
    /** 主要内容（Markdown 格式，用于预览） */
    content: string
    /** 结构化数据（JSON 解析后的对象） */
    structured: T
    /** 模型名称 */
    model: string
    /** 处理耗时 ms */
    duration: number
  }
  error?: string
  timestamp: string
}

/**
 * 原始响应格式（各模型不同）
 */
export interface RawResponse {
  [key: string]: unknown
}

/**
 * 适配器函数签名
 */
export type AdapterFn<T = unknown> = (
  raw: RawResponse,
  model: string,
  duration: number
) => StandardResponse<T>

/**
 * 适配器注册表
 */
export interface AdapterRegistry {
  [modelKey: string]: AdapterFn<unknown>
}

/**
 * 解析结果
 */
export interface ParseResult {
  content: string
  structured: Record<string, unknown>
}

/**
 * useAIResponse 返回类型
 */
export interface UseAIResponseReturn<T = unknown> {
  /** 标准格式数据 */
  data: Ref<StandardResponse<T> | null>
  /** 主要内容（Markdown） */
  content: ComputedRef<string>
  /** 结构化数据 */
  structured: ComputedRef<T | null>
  /** 模型名称 */
  model: ComputedRef<string>
  /** 加载状态 */
  loading: Ref<boolean>
  /** 错误信息 */
  error: Ref<string | null>
  /** 是否成功 */
  isSuccess: ComputedRef<boolean>
  /** 处理耗时 */
  duration: ComputedRef<number>
  /** 手动格式化方法 */
  normalize: (raw: unknown, model: string, duration?: number) => void
}

/**
 * AI API 请求参数
 */
export interface AIRequestParams {
  stageId?: string
  files?: { name: string; content: string }[]
  model?: string
  provider?: 'ollama' | 'openai'
  baseUrl?: string
  apiKey?: string
}

/**
 * AI API 响应（来自服务器）
 */
export interface AIAPIResponse {
  success: boolean
  data?: {
    rawText?: string
    structured?: Record<string, unknown>
    model?: string
    duration?: number
  }
  error?: string
  timestamp?: string
}