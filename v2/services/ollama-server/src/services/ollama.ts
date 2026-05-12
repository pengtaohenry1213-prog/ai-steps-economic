/**
 * Ollama Service
 * Core logic for interacting with local Ollama API
 */

import type {
  GenerateRequest,
  GenerateOptions,
  OllamaModel,
} from '../types/index.js'

interface OllamaGenerateResponse {
  model: string
  response: string
  done: boolean
}

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

const DEFAULT_OPTIONS: GenerateOptions = {
  temperature: 0.7,
  top_p: 0.9,
}

/**
 * Call Ollama API to generate text
 */
export async function generateText(request: GenerateRequest): Promise<string> {
  const { model, prompt, options } = request
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: mergedOptions,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as OllamaGenerateResponse
  return data.response
}

/**
 * Call OpenAI-compatible API to generate text
 */
export async function generateTextOpenAI(
  model: string,
  prompt: string,
  baseUrl: string,
  apiKey: string,
  options?: GenerateOptions
): Promise<string> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: mergedOptions.temperature ?? 0.7,
      max_tokens: mergedOptions.num_predict ?? 4096
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`)
  }

  const data = await response.json() as OpenAIChatCompletionResponse

  if (!data.choices || !data.choices[0]?.message?.content) {
    throw new Error('Invalid API response format')
  }

  let content = data.choices[0].message.content

  // Remove thinking tags (e.g., <think>... from DeepSeek-R1 and similar models)
  content = content.replace(/^<think>[\s\S]*?<\/think>\s*/i, '').trim()

  return content
}

/**
 * Test Ollama connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Get available models from Ollama
 */
interface OllamaTagsResponse {
  models?: OllamaModel[]
}

export async function getModels(): Promise<OllamaModel[]> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error(`Failed to get models: ${response.status}`)
  }

  const data = await response.json() as OllamaTagsResponse
  return data.models || []
}

/**
 * Get Ollama base URL (for configuration)
 */
export function getOllamaBaseUrl(): string {
  return OLLAMA_BASE_URL
}

/**
 * Set Ollama base URL (for dynamic configuration)
 */
export function setOllamaBaseUrl(url: string): void {
  // Note: In production, you might want to store this in a config or env variable
  console.warn('Dynamic base URL change is not implemented. Use OLLAMA_BASE_URL environment variable.')
}
