/**
 * 响应归一化核心逻辑
 */

import type { Ref, ComputedRef } from 'vue'
import type { StandardResponse, RawResponse, ParseResult } from './types'

/**
 * 去除思考标签
 */
export function removeThinkingTags(text: string): string {
  return text
    .replace(/^<think>[\s\S]*?<\/think>\s*/gi, '')
    .replace(/^<think>[\s\S]*?<\/think>\s*/gi, '')
    .trim()
}

/**
 * 提取 JSON 块
 */
export function extractJson(text: string): Record<string, unknown> | null {
  let cleaned = text

  // 尝试从 ```json ... ``` 块中提取
  const jsonBlockMatch = cleaned.match(/```json([\s\S]*?)```/i)
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[1].trim())
    } catch {
      // 解析失败，尝试其他方式
    }
  }

  // 尝试从 ``` ... ``` 块中提取
  const codeBlockMatch = cleaned.match(/```\s*([\s\S]*?)\s*```/m)
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim())
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed
      }
    } catch {
      // 不是 JSON
    }
  }

  // 如果上面失败，尝试直接解析整个字符串（如果是纯 JSON）
  try {
    const directParse = JSON.parse(cleaned.trim())
    if (typeof directParse === 'object' && !Array.isArray(directParse)) {
      return directParse
    }
  } catch {
    // 不是纯 JSON
  }

  return null
}

/**
 * 提取 Markdown 内容（去除所有代码块）
 */
export function extractMarkdown(text: string): string {
  let cleaned = text

  // 去除 ```json ... ``` 块
  cleaned = cleaned.replace(/```json[\s\S]*?```/gi, '')
  // 去除普通 ``` ... ``` 块
  cleaned = cleaned.replace(/```[\s\S]*?```/gi, '')
  // 去除单行代码 ` ... `
  cleaned = cleaned.replace(/`[^`]+`/g, '')
  // 去除思考标签
  cleaned = removeThinkingTags(cleaned)

  return cleaned.trim()
}

/**
 * 解析原始响应为标准格式
 */
export function parseRawResponse(raw: unknown, defaultModel = 'unknown', defaultDuration = 0): ParseResult {
  let text = ''

  // 处理不同格式
  if (typeof raw === 'string') {
    text = raw
  } else if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>

    // 优先从 response 字段提取
    if (obj.response && typeof obj.response === 'string') {
      text = obj.response
    }
    // 其次从 content 字段提取
    else if (obj.content && typeof obj.content === 'string') {
      text = obj.content
    }
    // 从 data 字段提取
    else if (obj.data && typeof obj.data === 'object') {
      const data = obj.data as Record<string, unknown>
      if (data.rawText && typeof data.rawText === 'string') {
        text = data.rawText
      } else if (data.response && typeof data.response === 'string') {
        text = data.response
      } else if (data.content && typeof data.content === 'string') {
        text = data.content
      }
    }
    // 如果都没有，尝试 JSON 序列化
    else {
      try {
        text = JSON.stringify(obj)
      } catch {
        text = String(obj)
      }
    }
  } else {
    text = String(raw)
  }

  // 去除思考标签
  text = removeThinkingTags(text)

  // 提取 JSON
  const structured = extractJson(text) || {}

  // 提取 Markdown
  const content = extractMarkdown(text)

  return {
    content,
    structured
  }
}

/**
 * 创建标准响应对象
 */
export function createStandardResponse<T = unknown>(
  content: string,
  structured: T,
  model: string,
  duration: number
) {
  return {
    success: true,
    data: {
      content,
      structured,
      model,
      duration
    },
    timestamp: new Date().toISOString()
  }
}

/**
 * 创建错误响应对象
 */
export function createErrorResponse<T = unknown>(error: string, model = 'unknown'): StandardResponse<T> {
  return {
    success: false,
    data: {
      content: '',
      structured: {} as T,
      model,
      duration: 0
    },
    error,
    timestamp: new Date().toISOString()
  }
}