/**
 * 策略匹配服务
 * 基于 LLM 直接判断，实现需求到开发策略+行业的智能匹配
 * 框架无关的 SDK
 */

import type {
  MatchingRequest,
  MatchingResponse,
  LLMClient,
  MatchResult,
  EnhancedStrategyResult
} from '../types'
import {
  buildStrategyMatchingSystemPrompt,
  buildStrategyMatchingUserPrompt,
  parseStrategyMatchingResponse,
  buildStrategyEnhancementSystemPrompt,
  buildStrategyEnhancementUserPrompt,
  parseStrategyEnhancementResponse
} from '../prompts/strategy-matching-prompt'
import { STRATEGIES, INDUSTRIES } from '../constants'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

let llmClient: LLMClient | null = null

/**
 * 配置 LLM 客户端
 * @param client - LLM 客户端
 * 
 * @example
 * ```ts
 * configureLLMClient(realLLMClient)
 * 
 * realLLMClient对象: { async chat(userPrompt: string, systemPrompt: string): Promise<string> }
 * ```
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
 * matchStrategy(request)
  ├── 1. buildStrategyMatchingSystemPrompt()
  │       生成包含 T1-T14 策略表和5个行业定义的 System Prompt
  ├── 2. buildStrategyMatchingUserPrompt(request)
  ├── 3. llmClient.chat(userPrompt, systemPrompt)  ← AI 处理
  ├── 4. parseStrategyMatchingResponse(response)
  └── 5. 返回结果

  ## 各环节数据示例

  // Step 1: System Prompt
  "你是开发策略匹配专家，负责根据用户需求精准匹配「开发策略类型」和「行业类型」。
  ## 开发策略类型（T1-T14）
  | ID | 名称 | 适用场景 |
  | T1 | 从0到1创新型新项目 | 业务需求高度不确定... |
  ...

  ## 行业类型
  | ID | 名称 | 特征 |
  | software | 软件互联网 | 快速迭代... |
  ...
  "

  // Step 2: User Prompt
  "请分析以下需求，匹配开发策略类型和行业类型：

  需求描述：
  我们是个三甲医院，要开发一个门诊管理系统

  输出 JSON 格式结果（只输出 JSON，不要其他内容）："

  // Step 3: LLM 返回（AI处理）
  `{
    "strategy": { "id": "T3", "name": "成熟型新项目" },
    "industry": { "id": "healthcare", "name": "医疗健康" },
    "confidence": 0.90,
    "reasoning": "三甲医院门诊管理系统属于医疗健康行业..."
  }`

  // Step 4: 解析后结果
  {
    success: true,
    data: {
      strategy: { id: "T3", name: "成熟型新项目" },
      industry: { id: "healthcare", name: "医疗健康" },
      confidence: 0.90,
      reasoning: "三甲医院门诊管理系统属于医疗健康行业..."
    }
  }
 */
export async function matchStrategy(request: MatchingRequest): Promise<MatchingResponse> {
  if (!llmClient) {
    return {
      success: false,
      error: 'LLM 客户端未配置，请先调用 configureLLMClient()'
    }
  }

  // 构建 Prompt
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
export function getFullStrategyInfo(strategyId: string) {
  return STRATEGIES.find(s => s.id === strategyId) || null
}

/**
 * 根据匹配结果获取行业的完整信息
 */
export function getFullIndustryInfo(industryId: string) {
  return INDUSTRIES.find(i => i.id === industryId) || null
}

/**
 * 获取所有可用的策略
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

const __dirname = dirname(fileURLToPath(import.meta.url))

const STRATEGY_TEMPLATE_MAP: Record<string, string> = {
  T1: 'T1-innovative-startup.md',
  T2: 'T2-stable-startup.md',
  T3: 'T3-mature-project.md',
  T4: 'T4-core-system-upgrade.md',
  T5: 'T5-feature-iteration.md',
  T6: 'T6-bug-fix.md',
  T7: 'T7-refactoring.md',
  T8: 'T8-prototype.md',
  T9: 'T9-emergency.md',
  T10: 'T10-internal-tools.md',
  T11: 'T11-integration.md',
  T12: 'T12-data-migration.md',
  T13: 'T13-security.md',
  T14: 'T14-optimization.md'
}

const INDUSTRY_ARCH_MAP: Record<string, string> = {
  software: '软件互联网-领域架构策略.md',
  manufacturing: '制造业-领域架构策略.md',
  healthcare: '医疗健康-领域架构策略.md',
  finance: '金融服务-领域架构策略.md',
  retail: '传统零售-领域架构策略.md'
}

function getStrategiesDir(): string {
  return resolve(__dirname, '../constants/strategies')
}

function getIndustryArchDir(): string {
  return resolve(__dirname, '../constants/strategies/行业标准/领域架构策略')
}

export function loadStrategyTemplate(strategyId: string): string {
  const fileName = STRATEGY_TEMPLATE_MAP[strategyId]
  if (!fileName) return ''

  const filePath = resolve(getStrategiesDir(), fileName)
  try {
    return readFileSync(filePath, 'utf-8')
  } catch {
    return ''
  }
}

export function loadIndustryArch(industryId: string): string {
  const fileName = INDUSTRY_ARCH_MAP[industryId]
  if (!fileName) return ''

  const filePath = resolve(getIndustryArchDir(), fileName)
  try {
    return readFileSync(filePath, 'utf-8')
  } catch {
    return ''
  }
}

export async function enhanceStrategy(
  basicResult: MatchResult,
  userInput: string
): Promise<EnhancedStrategyResult | null> {
  if (!llmClient) {
    return null
  }

  const strategyTemplate = loadStrategyTemplate(basicResult.strategy.id)
  const industryArch = loadIndustryArch(basicResult.industry.id)

  if (!strategyTemplate) {
    return null
  }

  const systemPrompt = buildStrategyEnhancementSystemPrompt()
  const userPrompt = buildStrategyEnhancementUserPrompt(
    basicResult.strategy.id,
    basicResult.strategy.name,
    basicResult.industry.id,
    basicResult.industry.name,
    strategyTemplate,
    industryArch,
    userInput
  )

  try {
    const response = await llmClient.chat(userPrompt, systemPrompt)
    const enhancedStrategy = parseStrategyEnhancementResponse(response)

    if (!enhancedStrategy) {
      return null
    }

    return {
      basicResult,
      userInput,
      enhancedStrategy,
      strategyTemplate,
      industryArch
    }
  } catch (e) {
    console.error('增强策略失败:', e)
    return null
  }
}