/**
 * Response Normalizer
 * 将不同模型的输出归一化为标准格式
 */

import type { StandardResponse, ResponseFormat } from '../types/index.js'

/**
 * 归一化模型响应为标准格式
 */
export function normalizeResponse(
  rawOutput: string,
  expectedSchema: object,
  model: string,
  duration: number,
  responseFormat: ResponseFormat = 'both'
): StandardResponse {
  let cleaned = rawOutput

  // 1. 去除 thinking 标签 (<think>...)
  cleaned = cleaned.replace(/^<think>[\s\S]*?<\/think>\s*/gi, '').trim()

  // 2. 根据 responseFormat 提取 JSON 和 Markdown
  let jsonText = ''
  let markdownText = ''

  const jsonSectionMarkers = ['## JSON 结构', '## JSON 格式', '## JSON格式', '## JSON 格式（系统解析用）']
  const markdownSectionMarkers = ['## Markdown 格式', '## Markdown格式', '## Markdown 格式（人工阅读）']

  let jsonSectionIdx = -1
  let markdownSectionIdx = -1
  let foundJsonMarker = ''
  let foundMarkdownMarker = ''

  for (const marker of jsonSectionMarkers) {
    const idx = cleaned.indexOf(marker)
    if (idx !== -1) {
      jsonSectionIdx = idx
      foundJsonMarker = marker
      break
    }
  }

  for (const marker of markdownSectionMarkers) {
    const idx = cleaned.indexOf(marker)
    if (idx !== -1) {
      markdownSectionIdx = idx
      foundMarkdownMarker = marker
      break
    }
  }

  if (responseFormat === 'json-only') {
    // json-only: 整个响应应该是纯 JSON
    if (cleaned.startsWith('{')) {
      try {
        JSON.parse(cleaned)
        jsonText = cleaned
      } catch {
        // 尝试找 ```json 代码块
        const codeBlockMatch = cleaned.match(/```json\n([\s\S]*?)\n```/)
        if (codeBlockMatch) {
          jsonText = codeBlockMatch[1].trim()
        } else {
          jsonText = cleaned
        }
      }
    } else {
      const jsonStart = cleaned.indexOf('{')
      if (jsonStart !== -1) {
        const potentialJson = cleaned.substring(jsonStart)
        try {
          JSON.parse(potentialJson)
          jsonText = potentialJson
        } catch {
          const codeBlockMatch = cleaned.match(/```json\n([\s\S]*?)\n```/)
          if (codeBlockMatch) {
            jsonText = codeBlockMatch[1].trim()
          } else {
            jsonText = potentialJson
          }
        }
      } else {
        // 尝试找 ```json 代码块
        const codeBlockMatch = cleaned.match(/```json\n([\s\S]*?)\n```/)
        if (codeBlockMatch) {
          jsonText = codeBlockMatch[1].trim()
        } else {
          jsonText = cleaned
        }
      }
    }
    markdownText = ''
  } else if (responseFormat === 'markdown-only') {
    // markdown-only: 整个响应应该是纯 Markdown
    markdownText = cleaned
    jsonText = ''
  } else {
    // both: 需要分离 JSON 和 Markdown
    if (jsonSectionIdx !== -1 && markdownSectionIdx !== -1) {
      jsonText = cleaned.substring(jsonSectionIdx + foundJsonMarker.length, markdownSectionIdx).trim()
      markdownText = cleaned.substring(markdownSectionIdx + foundMarkdownMarker.length).trim()
    } else if (jsonSectionIdx !== -1) {
      jsonText = cleaned.substring(jsonSectionIdx + foundJsonMarker.length).trim()
      markdownText = ''
    } else if (markdownSectionIdx !== -1) {
      markdownText = cleaned.substring(markdownSectionIdx + foundMarkdownMarker.length).trim()
      jsonText = ''
    } else {
      // 无法分离，尝试回退提取
      markdownText = cleaned
      jsonText = ''

      // 回退：如果 markdownText 以 { 开头，可能是 JSON + --- + Markdown 的混合格式
      if (cleaned.trim().startsWith('{')) {
        const dividerIdx = cleaned.indexOf('\n---\n')
        if (dividerIdx !== -1) {
          const potentialJson = cleaned.substring(0, dividerIdx).trim()
          const potentialMarkdown = cleaned.substring(dividerIdx + 5).trim()
          try {
            JSON.parse(potentialJson)
            jsonText = potentialJson
            markdownText = potentialMarkdown
          } catch {
            // 不是有效 JSON，保持原样
          }
        } else {
          // 没有 --- 分隔符，尝试找 ```json 代码块
          const codeBlockMatch = cleaned.match(/```json\n([\s\S]*?)\n```/)
          if (codeBlockMatch) {
            jsonText = codeBlockMatch[1].trim()
            markdownText = cleaned.replace(codeBlockMatch[0], '').trim()
          }
        }
      }
    }
  }

  // 3. 构建标准响应
  return {
    success: true,
    data: {
      model,
      duration,
      jsonText,
      markdownText,
      rawText: cleaned
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
      model: 'unknown',
      duration: 0,
      jsonText: '',
      markdownText: '',
      rawText: ''
    },
    error,
    timestamp: new Date().toISOString()
  }
}