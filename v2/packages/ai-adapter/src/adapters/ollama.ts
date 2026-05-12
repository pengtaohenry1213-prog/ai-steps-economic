/**
 * Ollama 适配器
 */

import type { StandardResponse, AdapterFn } from '../types'
import { parseRawResponse, createStandardResponse } from '../normalizer'

/**
 * Ollama 原始响应格式
 */
export interface OllamaRawResponse {
  model: string
  response: string
  done: boolean
}

/**
 * 归一化 Ollama 响应
 */
export function normalizeOllama<T = unknown>(
  raw: unknown,
  model: string,
  duration: number
): StandardResponse<T> {
  const parsed = parseRawResponse(raw, model, duration)

  return createStandardResponse<T>(
    parsed.content,
    parsed.structured as T,
    model || 'ollama',
    duration
  )
}