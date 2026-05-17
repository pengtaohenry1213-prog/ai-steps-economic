/**
 * 策略匹配服务
 * 基于 LLM 直接判断，实现需求到开发策略+行业的智能匹配
 */

import type {
  MatchingRequest,
  MatchingResponse,
  MatchResult
} from '../types/strategy-matching'
import {
  buildStrategyMatchingSystemPrompt,
  buildStrategyMatchingUserPrompt,
  parseStrategyMatchingResponse
} from '../prompts/strategy-matching-prompt'
import { STRATEGIES, INDUSTRIES } from '../types/strategy-matching'

interface LLMClient {
  chat(prompt: string, systemPrompt: string): Promise<string>
}

let llmClient: LLMClient | null = null

/**
 * 配置 LLM 客户端
 */
export function configureLLMClient(client: LLMClient): void {
  llmClient = client
}

/**
 * 检查 LLM 客户端是否已配置
 */
export function isLLMConfigured(): boolean {
  return llmClient !== null
}

/**
 * 执行策略匹配
 * 1. 构建策略匹配的 system prompt
 * 2. 构建用户请求的 prompt
 * 3. 调用 LLM 客户端进行匹配
 * 4. 解析 LLM 返回的 JSON
 * 5. 返回匹配结果
 */
export async function matchStrategy(request: MatchingRequest): Promise<MatchingResponse> {
  if (!llmClient) {
    return {
      success: false,
      error: 'LLM 客户端未配置，请先调用 configureLLMClient()'
    }
  }

  const systemPrompt = buildStrategyMatchingSystemPrompt() // 构建策略匹配的 system prompt
  const userPrompt = buildStrategyMatchingUserPrompt(request) // 构建用户请求的 prompt

  try {
    const response = await llmClient.chat(userPrompt, systemPrompt)
    return parseStrategyMatchingResponse(response)
  } catch (e) {
    return {
      success: false,
      error: `LLM 调用失败: ${e instanceof Error ? e.message : '未知错误'}`
    }
  }
}

/**
 * 根据匹配结果获取策略和行业的完整信息
 */
export function getFullStrategyInfo(strategyId: string): MatchResult['strategy'] | null {
  const strategy = STRATEGIES.find(s => s.id === strategyId)
  return strategy || null
}

/**
 * 根据匹配结果获取行业的完整信息
 */
export function getFullIndustryInfo(industryId: string): MatchResult['industry'] | null {
  const industry = INDUSTRIES.find(i => i.id === industryId)
  return industry || null
}

/**
 * 获取所有可用策略
 */
export function getAllStrategies() {
  return [...STRATEGIES]
}

/**
 * 获取所有可用行业
 */
export function getAllIndustries() {
  return [...INDUSTRIES]
}