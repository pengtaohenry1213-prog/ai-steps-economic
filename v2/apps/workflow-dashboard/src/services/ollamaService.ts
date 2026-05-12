/**
 * Ollama AI 服务 (HTTP Client)
 * 通过 HTTP 调用本地 Ollama Server
 * 数据流：
 *  用户上传文件
 *     ↓
 * readFileContent() 读取原始内容
 *     ↓
 * processFiles() 压缩+截断
 *     ↓
 * generateContentByStage(processed.files) 传给AI
 *     ↓
 * 服务端/promptService 直接使用（不再重复处理）
 * 
 */

import { getPromptTypeByStageId, buildPrompt } from './promptService'
import type { ProcessedFile } from './fileProcessor'
import { getModelById, type AIModel } from '../config/aiModels'
import { generateText as callOpenAI } from './aiService'

const SERVER_BASE_URL = import.meta.env.VITE_OLLAMA_SERVER_URL || ''  // Empty = use Vite proxy in dev

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

export interface GenerateByStageRequest {
  stageId: string
  files: { name: string; content: string }[]
  model?: string
  provider?: 'ollama' | 'openai'
  baseUrl?: string
  apiKey?: string
  responseFormat?: 'json-only' | 'markdown-only' | 'both'
}

export interface GenerateByStageResponse {
  success: boolean
  data?: {
    jsonText: string
    markdownText: string
    rawText?: string
    model: string
    duration: number
  }
  error?: string
}

export interface HealthStatus {
  success: boolean
  data?: {
    status: 'ok' | 'error'
    ollamaConnected: boolean
    timestamp: string
  }
  error?: string
}

export interface OllamaModel {
  name: string
  modified_at: string
  size?: number
}

export interface ModelsResponse {
  success: boolean
  data?: {
    models: OllamaModel[]
  }
  error?: string
}

/**
 * 调用 Ollama Server 生成文本
 */
export async function generateText(request: GenerateRequest): Promise<string> {
  const response = await fetch(`${SERVER_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    throw new Error(`Ollama Server error: ${response.status}`)
  }

  const data: GenerateResponse = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Generation failed')
  }

  return data.data.response
}

/**
 * 根据阶段 ID 和文件生成 AI 内容
 * 支持通过 signal 取消请求
 * 支持 Ollama 和 OpenAI 兼容 API
 * 返回归一化的 StandardResponse 格式
 */
export async function generateContentByStage(
  stageId: string,
  files: ProcessedFile[],
  model: string | AIModel = 'deepseek-r1',
  signal?: AbortSignal
): Promise<{ jsonText: string; markdownText: string; model: string; duration: number }> {
  // 获取模型配置
  const modelConfig = typeof model === 'string'
    ? getModelById(model) || { id: model, name: model, provider: 'ollama' as const }
    : model

  // First try the integrated endpoint
  try {
    const requestBody: GenerateByStageRequest = {
      stageId,
      files,
      model: modelConfig.id,
      provider: modelConfig.provider,
      baseUrl: modelConfig.baseUrl,
      apiKey: modelConfig.apiKey
    }

    const response = await fetch(`${SERVER_BASE_URL}/api/generate-by-stage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal
    })

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`)
    }

    const data: GenerateByStageResponse = await response.json()

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Generation failed')
    }

    return {
      jsonText: data.data.jsonText,
      markdownText: data.data.markdownText,
      model: data.data.model,
      duration: data.data.duration
    }
  } catch (error) {
    // Fallback to local prompt building for Ollama only
    if (modelConfig.provider !== 'ollama') {
      throw error
    }
    console.warn('Server endpoint failed, falling back to local prompt building:', error)
  }

  // Ollama fallback: build prompt locally and call
  const promptType = getPromptTypeByStageId(stageId)
  const prompt = buildPrompt({ type: promptType, files, stageId })
  const text = await callOpenAI(modelConfig, prompt)

  return {
    jsonText: '',
    markdownText: text,
    model: modelConfig.id,
    duration: 0
  }
}

/**
 * 流式生成 AI 内容 - SSE 版本
 * 通过回调实时返回生成的文本片段
 */
export async function generateContentByStageStream(
  stageId: string,
  files: ProcessedFile[],
  model: string | AIModel,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
  responseFormat: 'json-only' | 'markdown-only' | 'both' = 'markdown-only'
): Promise<{ duration: number }> {
  const modelConfig = typeof model === 'string'
    ? getModelById(model) || { id: model, name: model, provider: 'ollama' as const }
    : model

  const requestBody: GenerateByStageRequest = {
    stageId,
    files,
    model: modelConfig.id,
    provider: modelConfig.provider,
    baseUrl: modelConfig.baseUrl,
    apiKey: modelConfig.apiKey,
    responseFormat
  }

  const response = await fetch(`${SERVER_BASE_URL}/api/generate-by-stage?stream=true`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody),
    signal
  })

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Response body is not readable')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let fullResponse = ''
  let duration = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        try {
          const parsed = JSON.parse(data)
          if (parsed.type === 'chunk' && parsed.content) {
            fullResponse += parsed.content
            onChunk(parsed.content)
          } else if (parsed.type === 'done') {
            duration = parsed.duration
          } else if (parsed.type === 'error') {
            throw new Error(parsed.error)
          }
        } catch {
          // Skip non-JSON lines
        }
      }
    }
  }

  return { duration }
}

// Re-export AIModel for external use
export type { AIModel } from '../config/aiModels'

/**
 * 测试 Ollama Server 连接
 */
export async function testOllamaConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/api/health`, {
      method: 'GET'
    })

    if (!response.ok) {
      return false
    }

    const data: HealthStatus = await response.json()
    return data.success && data.data?.ollamaConnected === true
  } catch {
    return false
  }
}

/**
 * 获取可用模型列表
 */
export async function getAvailableModels(): Promise<OllamaModel[]> {
  const response = await fetch(`${SERVER_BASE_URL}/api/models`, {
    method: 'GET'
  })

  if (!response.ok) {
    throw new Error(`Failed to get models: ${response.status}`)
  }

  const data: ModelsResponse = await response.json()

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to get models')
  }

  return data.data.models
}

/**
 * 解析立项书内容（向后兼容）
 */
export function parseProposalContent(aiOutput: string): {
  basicInfo: string
  background: string
  scope: { inScope: string[]; outScope: string[] }
  acceptance: string
  milestones: string
  risks: string
  humanGate: string
} {
  return {
    basicInfo: extractSection(aiOutput, '1. 项目基本信息'),
    background: extractSection(aiOutput, '2. 项目背景与目标'),
    scope: {
      inScope: extractListItems(aiOutput, 'In Scope'),
      outScope: extractListItems(aiOutput, 'Out of Scope')
    },
    acceptance: extractSection(aiOutput, '4. 验收标准'),
    milestones: extractSection(aiOutput, '5. 里程碑计划'),
    risks: extractSection(aiOutput, '6. 风险评估'),
    humanGate: extractSection(aiOutput, '7. Human Gate')
  }
}

function extractSection(content: string, sectionTitle: string): string {
  const lines = content.split('\n')
  const result: string[] = []
  let inSection = false

  for (const line of lines) {
    if (line.includes(sectionTitle)) {
      inSection = true
      result.push(line)
    } else if (inSection) {
      if (line.match(/^##?\s+\d+\./) || line.match(/^#+\s+[一二三四五六七]/) || line === '---') {
        break
      }
      result.push(line)
    }
  }

  return result.join('\n').trim()
}

function extractListItems(content: string, listName: string): string[] {
  const items: string[] = []
  const lines = content.split('\n')
  let inList = false

  for (const line of lines) {
    if (line.includes(listName)) {
      inList = true
      continue
    }
    if (inList) {
      if (line.match(/^##?\s+\d+\./) || line.match(/^#+\s+[一二三四五六七]/)) {
        break
      }
      const match = line.match(/^[-*]\s*(.+)/) || line.match(/^\d+\.\s*(.+)/)
      if (match) {
        items.push(match[1])
      }
    }
  }

  return items
}
