/**
 * MiniMax 适配器
 */

import type { StandardResponse } from '../types'
import { parseRawResponse, createStandardResponse } from '../normalizer'

/**
 * MiniMax 原始响应格式（OpenAI 兼容）
 */
export interface MiniMaxRawResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
    type?: string
  }
}

/**
 * 归一化 MiniMax 响应
 */
export function normalizeMiniMax<T = unknown>(
  raw: unknown,
  model: string,
  duration: number
): StandardResponse<T> {
  // MiniMax 返回 OpenAI 兼容格式
  const response = raw as MiniMaxRawResponse

  // 检查错误
  if (response.error) {
    return {
      success: false,
      data: {
        content: '',
        structured: {} as T,
        model: model || 'MiniMax',
        duration
      },
      error: response.error.message || 'MiniMax API error',
      timestamp: new Date().toISOString()
    }
  }

  // 提取内容
  let content = ''
  if (response.choices && response.choices[0]?.message?.content) {
    content = response.choices[0].message.content
  }

  // 解析内容
  const parsed = parseRawResponse(content, model, duration)

  return createStandardResponse<T>(
    parsed.content,
    parsed.structured as T,
    model || 'MiniMax',
    duration
  )
}