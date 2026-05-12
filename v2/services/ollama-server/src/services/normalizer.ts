/**
 * Response Normalizer
 * 将不同模型的输出归一化为标准格式
 */

import type { StandardResponse } from '../types/index.js'

/**
 * 归一化模型响应为标准格式
 */
export function normalizeResponse(
  rawOutput: string,
  expectedSchema: object,
  model: string,
  duration: number
): StandardResponse {
  let cleaned = rawOutput

  // 1. 去除 thinking 标签 (<think>...)
  cleaned = cleaned.replace(/^<think>[\s\S]*?<\/think>\s*/gi, '').trim()

  // 2. 提取 JSON
  let structured: Record<string, unknown> = {}

  const jsonStart = cleaned.indexOf('```json')
  if (jsonStart !== -1) {
    const afterJsonStart = cleaned.substring(jsonStart + 7)
    const closingIdx = afterJsonStart.indexOf('```')
    if (closingIdx !== -1) {
      const jsonContent = afterJsonStart.substring(0, closingIdx)
      try {
        structured = JSON.parse(jsonContent.trim())
      } catch (e) {
        console.error('[Normalizer] JSON parse error:', e)
      }
    }
  }

  // 如果上面失败，尝试直接解析整个字符串
  if (Object.keys(structured).length === 0) {
    try {
      const directParse = JSON.parse(cleaned.trim())
      if (typeof directParse === 'object' && !Array.isArray(directParse)) {
        structured = directParse
      }
    } catch {
      // 不是纯 JSON
    }
  }

  // 3. 提取 Markdown（去除所有 JSON 块后的内容）
  let rawText = cleaned
  rawText = rawText.replace(/```json[\s\S]*?```/gi, '').trim()
  rawText = rawText.replace(/```[\s\S]*?```/gi, '').trim()

  // 4. 构建标准响应
  return {
    success: true,
    data: {
      structured,
      rawText,
      model,
      duration
    },
    timestamp: new Date().toISOString()
  }
}

/**
 * 创建错误响应
 */
export function createErrorResponse(error: string): StandardResponse {
  return {
    success: false,
    data: {
      structured: {},
      rawText: '',
      model: 'unknown',
      duration: 0
    },
    error,
    timestamp: new Date().toISOString()
  }
}