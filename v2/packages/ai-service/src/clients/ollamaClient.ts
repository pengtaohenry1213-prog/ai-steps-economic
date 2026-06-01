/**
 * Ollama 客户端
 * 支持本地 Ollama 模型服务
 */

import type { GenerateRequest, GenerateResponse } from '../types'

export interface OllamaClientConfig {
  baseUrl?: string
  defaultModel?: string
}

export class OllamaClient {
  private baseUrl: string
  private defaultModel: string

  constructor(config: OllamaClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3001'
    this.defaultModel = config.defaultModel || 'deepseek-r1'
  }

  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const model = request.model || this.defaultModel

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: request.prompt,
          stream: request.stream ?? false,
          options: request.options
        })
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Ollama Server error: ${response.status}`
        }
      }

      const data = await response.json() as { response?: string; model?: string }

      return {
        success: true,
        data: {
          response: data.response || '',
          model: data.model || model
        }
      }
    } catch (e) {
      return {
        success: false,
        error: `Request failed: ${e instanceof Error ? e.message : 'Unknown error'}`
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET'
      })
      return response.ok
    } catch {
      return false
    }
  }
}

export function createOllamaClient(config?: OllamaClientConfig): OllamaClient {
  return new OllamaClient(config)
}