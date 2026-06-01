/**
 * OpenAI 兼容客户端
 * 支持 MiniMax、Azure OpenAI 等 OpenAI 兼容 API
 * 内置重试机制，指数退避
 */

import type { ChatRequest, ChatResponse } from '../types'

export interface OpenAIClientConfig {
  baseUrl: string
  apiKey: string
  defaultModel?: string
  maxRetries?: number   // 最大重试次数，默认 3
}

const DEFAULT_MAX_RETRIES = 3

/**
 * 检测错误是否值得重试
 * - 网络错误（socket hang up、ECONNRESET 等）
 * - 5xx 服务器错误
 * - 429 限流
 */
function isRetryable(error: unknown, status?: number): boolean {
  if (status === undefined) {
    // 网络/连接错误（非 HTTP 响应）
    const msg = error instanceof Error ? error.message : String(error)
    return (
      msg.includes('socket hang up') ||
      msg.includes('ECONNRESET') ||
      msg.includes('ETIMEDOUT') ||
      msg.includes('NetworkError') ||
      msg.includes('fetch failed') ||
      msg.includes('aborted')
    )
  }
  // HTTP 5xx / 429
  return status >= 500 || status === 429
}

export class OpenAIClient {
  private baseUrl: string
  private apiKey: string
  private defaultModel: string
  private maxRetries: number

  constructor(config: OpenAIClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
    this.defaultModel = config.defaultModel || 'gpt-4'
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt = 1
  ): Promise<Response> {
    try {
      const response = await fetch(url, options)

      if (response.ok || !isRetryable(null, response.status)) {
        return response
      }

      // 5xx / 429 → 可重试
      if (attempt < this.maxRetries) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 16000) // 1s, 2s, 4s, 8s, 16s 上限
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.fetchWithRetry(url, options, attempt + 1)
      }

      return response
    } catch (e) {
      if (attempt < this.maxRetries && isRetryable(e)) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 16000)
        await new Promise(resolve => setTimeout(resolve, delay))
        return this.fetchWithRetry(url, options, attempt + 1)
      }
      // 达到重试上限或不可重试的错误，抛出以便外层 catch
      throw e
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model || this.defaultModel
    const url = `${this.baseUrl}/chat/completions`

    try {
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.max_tokens ?? 4096
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `OpenAI API error ${response.status}: ${errorText}`
        }
      }

      const data = await response.json() as {
        choices: Array<{ message: { content: string } }>
        model: string
      }

      if (!data.choices || !data.choices[0]?.message?.content) {
        return {
          success: false,
          error: 'Invalid API response format'
        }
      }

      return {
        success: true,
        data: {
          content: data.choices[0].message.content,
          model: data.model || model
        }
      }
    } catch (e) {
      return {
        success: false,
        error: `Request failed after ${this.maxRetries} retries: ${e instanceof Error ? e.message : 'Unknown error'}`
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })
      return response.ok
    } catch {
      return false
    }
  }
}

export function createOpenAIClient(config: OpenAIClientConfig): OpenAIClient {
  return new OpenAIClient(config)
}