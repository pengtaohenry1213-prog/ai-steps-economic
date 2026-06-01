/**
 * @ai-toolkit/ai-service
 * 统一 AI 服务 SDK
 * 支持 Ollama 本地模型和 OpenAI 兼容 API
 */

export type * from './types'

import { OpenAIClient, createOpenAIClient } from './clients/openAIClient'
import { OllamaClient, createOllamaClient } from './clients/ollamaClient'

export { OpenAIClient, createOpenAIClient }
export { OllamaClient, createOllamaClient }

export interface AIServiceConfig {
  provider: 'ollama' | 'openai'
  baseUrl: string
  apiKey?: string
  defaultModel?: string
}

export class AIService {
  private client: OllamaClient | OpenAIClient
  private provider: 'ollama' | 'openai'

  constructor(config: AIServiceConfig) {
    this.provider = config.provider

    if (config.provider === 'ollama') {
      this.client = new OllamaClient({ baseUrl: config.baseUrl })
    } else {
      this.client = new OpenAIClient({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey || '',
        defaultModel: config.defaultModel
      })
    }
  }

  async chat(messages: Array<{ role: string; content: string }>, options?: {
    temperature?: number
    max_tokens?: number
    model?: string
  }): Promise<{ success: boolean; data?: { content: string; model: string }; error?: string }> {
    if (this.provider === 'ollama') {
      const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n')
      const result = await (this.client as OllamaClient).generate({
        model: options?.model || 'deepseek-r1',
        prompt,
        options: {
          temperature: options?.temperature,
          num_predict: options?.max_tokens
        }
      })
      return {
        success: result.success,
        data: result.data ? { content: result.data.response, model: result.data.model } : undefined,
        error: result.error
      }
    } else {
      return await (this.client as OpenAIClient).chat({
        model: options?.model || 'gpt-4',
        messages: messages as Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
        temperature: options?.temperature,
        max_tokens: options?.max_tokens
      })
    }
  }

  async testConnection(): Promise<boolean> {
    return this.client.testConnection()
  }
}

export function createAIService(config: AIServiceConfig): AIService {
  return new AIService(config)
}