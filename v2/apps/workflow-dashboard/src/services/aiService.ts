/**
 * 统一 AI 服务
 * 支持 Ollama 本地模型和 OpenAI 兼容 API（MiniMax 等）
 */

import type { AIModel, ModelProvider } from '../config/aiModels'

const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_SERVER_URL || ''

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

/**
 * 调用 Ollama 生成文本
 */
async function callOllama(request: GenerateRequest): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
 * 调用 OpenAI 兼容 API 生成文本
 */
async function callOpenAICompatible(
  model: AIModel,
  prompt: string,
  options?: GenerateOptions
): Promise<string> {
  if (!model.baseUrl || !model.apiKey) {
    throw new Error('OpenAI 模型缺少 baseUrl 或 apiKey 配置')
  }

  const response = await fetch(`${model.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${model.apiKey}`
    },
    body: JSON.stringify({
      model: model.id,
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.num_predict ?? 4096
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()

  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new Error('Invalid API response format')
  }

  return data.choices[0].message.content
}

/**
 * 统一的文本生成接口
 */
export async function generateText(
  model: AIModel,
  prompt: string,
  options?: GenerateOptions
): Promise<string> {
  switch (model.provider) {
    case 'ollama':
      return callOllama({ model: model.id, prompt, options })
    case 'openai':
      return callOpenAICompatible(model, prompt, options)
    default:
      throw new Error(`Unknown model provider: ${model.provider}`)
  }
}

/**
 * 测试模型连接状态
 */
export async function testModelConnection(model: AIModel): Promise<boolean> {
  try {
    if (model.provider === 'ollama') {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/health`, {
        method: 'GET'
      })
      return response.ok
    } else if (model.provider === 'openai') {
      // 简单测试 API key 是否有效
      const response = await fetch(`${model.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${model.apiKey}`
        }
      })
      return response.ok
    }
    return false
  } catch {
    return false
  }
}
