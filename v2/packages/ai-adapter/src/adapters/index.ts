/**
 * 适配器注册表
 */

import type { AdapterFn, AdapterRegistry, StandardResponse, RawResponse } from '../types'
import { normalizeOllama } from './ollama'
import { normalizeMiniMax } from './minimax'

/**
 * 适配器注册表
 * key: 模型 ID 或 provider
 * value: 适配器函数
 */
export const adapters: AdapterRegistry = {
  // Ollama 系列
  'ollama': normalizeOllama,
  'deepseek-r1': normalizeOllama,

  // OpenAI 兼容系列
  'MiniMax-M2.7': normalizeMiniMax,
  'gpt-4': normalizeMiniMax,
  'gpt-3.5-turbo': normalizeMiniMax,

  // 默认适配器
  'default': normalizeOllama
}

/**
 * 获取适配器
 */
export function getAdapter(model: string): AdapterFn {
  const adapter = adapters[model]
  if (adapter) {
    return adapter
  }

  // 尝试通过 provider 推断
  if (model.includes('minimax') || model.includes('openai') || model.includes('gpt')) {
    return adapters['MiniMax-M2.7']
  }

  // 默认使用 Ollama 适配器
  return adapters['default']
}

/**
 * 归一化任意模型响应
 */
export function normalize<T = unknown>(
  raw: unknown,
  model: string,
  duration: number = 0
): StandardResponse<T> {
  const adapter = getAdapter(model) as AdapterFn<T>
  return adapter(raw as RawResponse, model, duration)
}

export { normalizeOllama } from './ollama'
export { normalizeMiniMax } from './minimax';