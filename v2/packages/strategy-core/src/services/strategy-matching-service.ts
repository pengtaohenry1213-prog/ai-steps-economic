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

interface AIServiceInterface {
  chat(messages: Array<{ role: string; content: string }>, options?: { model?: string; temperature?: number; max_tokens?: number }): Promise<{ success: boolean; data?: { content: string; model: string }; error?: string }>
}

let llmClient: LLMClient | null = null

export function configureLLMClient(client: LLMClient): void {
  llmClient = client
}

export function isLLMConfigured(): boolean {
  return llmClient !== null
}

export async function matchStrategy(request: MatchingRequest): Promise<MatchingResponse> {
  if (!llmClient) {
    return {
      success: false,
      error: 'LLM 客户端未配置，请先调用 configureLLMClient()'
    }
  }

  const systemPrompt = buildStrategyMatchingSystemPrompt()
  const userPrompt = buildStrategyMatchingUserPrompt(request)

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

export async function matchStrategyWithAIService(
  aiService: AIServiceInterface,
  request: MatchingRequest,
  modelId?: string
): Promise<MatchingResponse> {
  const systemPrompt = buildStrategyMatchingSystemPrompt()
  const userPrompt = buildStrategyMatchingUserPrompt(request)

  try {
    const result = await aiService.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      { model: modelId }
    )
    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'AI 服务调用失败' }
    }
    return parseStrategyMatchingResponse(result.data.content)
  } catch (e) {
    return {
      success: false,
      error: `AI 服务调用失败: ${e instanceof Error ? e.message : '未知错误'}`
    }
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

export async function enhanceStrategyWithAIService(
  aiService: AIServiceInterface,
  basicResult: MatchResult,
  userInput: string,
  modelId?: string
): Promise<EnhancedStrategyResult | null> {
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
    const result = await aiService.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      { model: modelId }
    )
    if (!result.success || !result.data) {
      console.error('AI 服务调用失败:', result.error)
      return null
    }
    const enhancedStrategy = parseStrategyEnhancementResponse(result.data.content)

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

export function getFullStrategyInfo(strategyId: string) {
  return STRATEGIES.find(s => s.id === strategyId) || null
}

export function getFullIndustryInfo(industryId: string) {
  return INDUSTRIES.find(i => i.id === industryId) || null
}

export function getAllStrategies() {
  return [...STRATEGIES]
}

export function getAllIndustries() {
  return [...INDUSTRIES]
}

const STRATEGY_TEMPLATES: Record<string, string> = {
  T1: `# T1 - 从0到1创新型新项目

**定义**：业务需求高度不确定，没有现有代码基础，核心目标是**快速验证 PMF（产品市场契合度）**。

## 适用边界

### ✅ 适用场景
- 探索新市场，验证商业模式
- MVP 快速迭代
- 创始团队有限，需要快速试错

### ❌ 不适用场景
- 需求明确、已有成熟方案
- 核心系统、不可失败的场景

## 核心特点
- 业务需求：高度不确定
- 技术风险：中高（新技术探索）
- 交付压力：快速验证优先
- 团队特征：小型创始团队

## 分阶段开发模式
1. **需求验证阶段**：快速 MVP，2-4 周
2. **迭代优化阶段**：基于反馈调整，2-4 周
3. **市场验证阶段**：小范围推广，持续迭代

## Human Gate
- L0：快速验证，不设限制
- L1：核心功能必须可用
`,
  T2: `# T2 - 从0到1稳定型新项目

**定义**：业务需求明确但采用新技术栈，核心目标是**可控风险下准确实现需求**。

## 适用边界

### ✅ 适用场景
- 业务需求明确，但技术栈有更新
- 需要引入新框架/语言
- 团队有一定学习成本

### ❌ 不适用场景
- 业务需求不确定（用 T1）
- 技术栈完全成熟（用 T3）

## 核心特点
- 业务需求：明确
- 技术风险：中等（新技术学习曲线）
- 交付压力：质量优先
- 团队特征：需培训新技术

## 分阶段开发模式
1. **技术验证阶段**：新技术调研 1-2 周
2. **架构设计阶段**：确定技术方案 1-2 周
3. **迭代开发阶段**：按功能迭代 4-8 周
`,
  T3: `# T3 - 成熟型新项目

**定义**：业务需求明确，技术栈成熟，核心目标是**高效标准化交付**。

## 适用边界

### ✅ 适用场景
- 业务需求明确，有详细文档
- 技术栈成熟稳定
- 有明确上线时间

### ❌ 不适用场景
- 业务需求不明确（用 T1/T2）
- 核心系统大升级（用 T4）

## 核心特点
- 业务需求：明确
- 技术风险：低
- 交付压力：效率优先
- 团队特征：经验丰富
`,
  T4: `# T4 - 核心系统大升级

**定义**：对核心生产系统进行架构重构，核心目标是**零中断平稳升级**。

## 适用边界

### ✅ 适用场景
- 银行核心系统升级
- 支付系统重构
- 核心业务系统迁移

### ❌ 不适用场景
- 新建系统（用 T3）
- 非核心系统（用 T5）

## 核心特点
- 业务需求：增量明确
- 技术风险：极高
- 交付压力：稳定优先
- 团队特征：资深专家
`,
  T5: `# T5 - 常规功能迭代

**定义**：在成熟系统上功能扩展，核心目标是**快速交付不影响稳定性**。

## 适用边界

### ✅ 适用场景
- 成熟系统功能扩展
- 不涉及核心架构变更
- 需要保持向后兼容

### ❌ 不适用场景
- 核心架构重构（用 T4）
- 新建系统（用 T3）
`,
  T6: `# T6 - Bug修复

**定义**：修复现有系统的缺陷。

## 核心特点
- 目标明确：定位并修复 bug
- 时间紧迫：线上问题优先
- 影响评估：明确范围
`,
  T7: `# T7 - 技术债务清理/代码重构

**定义**：清理技术债务，提升代码质量。

## 核心特点
- 渐进式改进
- 不改变业务功能
- 持续集成验证
`,
  T8: `# T8 - 原型验证/概念演示

**定义**：快速生成可运行的原型验证想法。

## 核心特点
- 速度第一
- 不考虑生产级质量
- 快速验证想法
`,
  T9: `# T9 - 线上紧急故障处理

**定义**：处理生产环境的紧急故障。

## 核心特点
- 最高优先级
- 快速止血
- 事后复盘
`,
  T10: `# T10 - 内部工具/脚本开发

**定义**：开发内部使用的工具和脚本。

## 核心特点
- 用户群体小
- 效率优先
- 无需复杂测试
`,
  T11: `# T11 - 第三方系统集成

**定义**：与第三方系统进行对接集成。

## 核心特点
- 明确接口规范
- 联调测试
- 兼容性考虑
`,
  T12: `# T12 - 数据迁移/同步

**定义**：数据的迁移或同步工作。

## 核心特点
- 数据完整性
- 回滚方案
- 增量迁移
`,
  T13: `# T13 - 安全加固/合规改造

**定义**：安全加固或合规相关的改造。

## 核心特点
- 安全第一
- 合规优先
- 影响评估
`,
  T14: `# T14 - 性能优化

**定义**：系统性能优化。

## 核心特点
- 性能指标明确
- 基准测试
- 渐进优化
`
}

const INDUSTRY_ARCH: Record<string, string> = {
  software: `# 软件互联网行业架构

## 技术特点
- 前端：Vue3/React + TypeScript
- 后端：Node.js/Go/Java
- 数据库：PostgreSQL/MySQL
- 缓存：Redis
- 消息队列：Kafka/RabbitMQ

## 架构模式
- 微服务架构
- 云原生部署
- CI/CD 自动化

## 安全要点
- JWT 认证
- HTTPS 加密
- SQL 注入防护
`,
  healthcare: `# 医疗健康行业架构

## 技术特点
- HL7/FHIS 医疗标准
- 等保三级合规
- 高可用要求

## 安全要点
- 数据加密
- 访问审计
- HIPAA 合规
`,
  finance: `# 金融服务行业架构

## 技术特点
- 银行核心系统
- 分布式架构
- 事务一致性

## 安全要点
- PCI-DSS 合规
- 交易风控
- 审计日志
`,
  manufacturing: `# 制造业行业架构

## 技术特点
- MES/ERP 系统
- 工业协议支持
- 实时性要求

## 安全要点
- 工控安全
- 数据采集安全
`,
  retail: `# 传统零售行业架构

## 技术特点
- 电商平台
- 库存管理
- 支付集成

## 安全要点
- 支付安全
- 用户数据保护
`
}

export function loadStrategyTemplate(strategyId: string): string {
  return STRATEGY_TEMPLATES[strategyId] || ''
}

export function loadIndustryArch(industryId: string): string {
  return INDUSTRY_ARCH[industryId] || ''
}