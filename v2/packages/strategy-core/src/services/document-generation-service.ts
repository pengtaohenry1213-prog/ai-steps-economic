/**
 * 四文档生成服务
 * 基于 LLM 生成 立项书/需求文档/架构书
 */

import type {
  MatchResult,
  EnhancedStrategyResult,
  ProposalDocument,
  RequirementsDocument,
  ArchitectureDocument,
  AllDeliverables
} from '../types'
import {
  buildAllDeliverablesSystemPrompt,
  buildAllDeliverablesUserPrompt,
  parseAllDeliverablesResponse
} from '../prompts/document-generation-prompt'
import { loadStrategyTemplate, loadIndustryArch } from './strategy-matching-service'

interface AIServiceInterface {
  chat(messages: Array<{ role: string; content: string }>, options?: { model?: string; temperature?: number; max_tokens?: number }): Promise<{ success: boolean; data?: { content: string; model: string }; error?: string }>
}

interface EnhancedStrategy {
  title: string
  definition: string
  applicableScenarios: string[]
  notApplicableScenarios: string[]
  coreCharacteristics: string[]
  coreConflict: string
  phases: any[]
  moduleDevModes: any[]
  keyNotes: string[]
  recommendedToolChain: any[]
  typicalRisks: any[]
  successCriteria: string[]
  industryAdaptation: string
}

export async function generateAllDeliverablesWithAIService(
  aiService: AIServiceInterface,
  basicResult: MatchResult,
  userInput: string,
  modelId?: string,
  existingStrategy?: EnhancedStrategy
): Promise<AllDeliverables | null> {
  const strategyTemplate = loadStrategyTemplate(basicResult.strategy.id)
  const industryArch = loadIndustryArch(basicResult.industry.id)

  if (!strategyTemplate) {
    console.error('未找到策略模板:', basicResult.strategy.id)
    return null
  }

  const systemPrompt = buildAllDeliverablesSystemPrompt()
  const userPrompt = buildAllDeliverablesUserPrompt(
    basicResult.strategy.id,
    basicResult.strategy.name,
    basicResult.industry.id,
    basicResult.industry.name,
    userInput,
    existingStrategy
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

    const parsed = parseAllDeliverablesResponse(result.data.content, existingStrategy)
    if (!parsed) {
      console.error('解析 AI 响应失败')
      return null
    }

    const strategyResult: EnhancedStrategyResult = {
      basicResult,
      userInput,
      enhancedStrategy: existingStrategy || parsed.strategy,
      strategyTemplate,
      industryArch
    }

    const proposal: ProposalDocument = parsed.proposal
    const requirements: RequirementsDocument = parsed.requirements
    const architecture: ArchitectureDocument = parsed.architecture

    return {
      strategy: strategyResult,
      proposal,
      requirements,
      architecture
    }
  } catch (e) {
    console.error('生成四文档失败:', e)
    return null
  }
}

export function formatProposalAsMarkdown(proposal: ProposalDocument): string {
  const milestonesTable = proposal.milestones.map(m => {
    return `| ${m.phase} | ${m.day} | ${m.deliverables.join(', ')} |`
  }).join('\n')

  const risksTable = proposal.risks.map(r => {
    return `| ${r.risk} | ${r.trigger} | ${r.mitigation} | ${r.owner} |`
  }).join('\n')

  const acceptanceFunctionality = proposal.acceptance.functionality.map(a => `- ${a}`).join('\n')

  const performanceRows = Object.entries(proposal.acceptance.performance).map(([k, v]) => {
    return `| ${k} | ${v} |`
  }).join('\n')

  return `# ${proposal.projectName}立项书

## 一、项目基本信息

| 项 | 内容 |
|---|---|
| 项目名称 | ${proposal.projectName} |
| 项目类型 | ${proposal.projectType} |
| 决策者 | ${proposal.decisionMakers.join(', ')} |

## 二、项目背景与目标

### 背景
${proposal.background}

### 当前问题
${proposal.currentIssues.map(i => `- ${i}`).join('\n')}

### 目标
${proposal.goals.map(g => `- ${g}`).join('\n')}

## 三、范围定义

### P0（核心功能）
${proposal.scope.inScope.P0.map(p => `- ${p}`).join('\n')}

### P1（重要功能）
${proposal.scope.inScope.P1.map(p => `- ${p}`).join('\n')}

### 不包含范围
${proposal.scope.outScope.map(o => `- ${o}`).join('\n')}

## 四、里程碑计划

| 阶段 | 天数 | 交付物 |
|---|---|
${milestonesTable}

## 五、风险评估

| 风险 | 触发条件 | 应对措施 | 责任人 |
|---|---|
${risksTable}

## 六、Human Gate 审查

### PMO 审查点
${proposal.humanGate.pmo.map(p => `- ${p}`).join('\n')}

### 安全审查点
${proposal.humanGate.security.map(s => `- ${s}`).join('\n')}

## 七、验收标准

### 功能验收
${acceptanceFunctionality}

### 性能验收
| 指标 | 标准 |
|---|
${performanceRows}

### 安全验收
${proposal.acceptance.security.map(s => `- ${s}`).join('\n')}
`
}

export function formatRequirementsAsMarkdown(requirements: RequirementsDocument): string {
  const functionalReqs = requirements.functionalRequirements.map(mod => {
    const reqRows = mod.requirements.map(r => {
      return `| ${r.id} | ${r.name} | ${r.priority} | ${r.description} | ${r.businessRules.join('; ')} | ${r.input} | ${r.output} | ${r.exceptionHandling} |`
    }).join('\n')

    return `#### ${mod.moduleId}. ${mod.moduleName}

| 功能ID | 功能名称 | 优先级 | 功能描述 | 业务规则 | 输入 | 输出 | 异常处理 |
|---|---|---|---|---|---|---|---|
${reqRows}`
  }).join('\n\n')

  return `# ${requirements.projectName}产品需求文档（PRD）

## 1. PRD基本信息

| 项 | 内容 |
|---|---|
| 项目名称 | ${requirements.projectName} |
| 项目类型 | ${requirements.projectType} |
| PRD版本 | ${requirements.version} |
| 产品经理 | ${requirements.basicInfo.productManager} |
| 技术负责人 | ${requirements.basicInfo.techLead} |
| 测试负责人 | ${requirements.basicInfo.testLead} |

## 2. 项目概述

### 2.1 项目背景
${requirements.overview.background}

### 2.2 项目目标

**核心目标**：${requirements.overview.goals.core}

**次要目标**：
${requirements.overview.goals.secondary.map(g => `- ${g}`).join('\n')}

**非目标**：
${requirements.overview.goals.nonGoals.map(g => `- ${g}`).join('\n')}

### 2.3 项目范围

**包含范围**：
${requirements.overview.scope.included.map(i => `- ${i}`).join('\n')}

**不包含范围**：
${requirements.overview.scope.excluded.map(e => `- ${e}`).join('\n')}

### 2.4 核心约束
${Object.entries(requirements.overview.constraints).map(([k, v]) => `- **${k}**：${v}`).join('\n')}

## 3. 用户角色与场景

${requirements.userRoles.map(role => `### ${role.name}
- 描述：${role.description}
- 核心需求：${role.needs}`).join('\n\n')}

## 4. 核心功能需求

${functionalReqs}

## 5. 非功能需求

### 5.1 性能需求
${Object.entries(requirements.nonFunctionalRequirements.performance).map(([k, v]) => `- ${k}：${v}`).join('\n')}

### 5.2 安全需求
${requirements.nonFunctionalRequirements.security.map(s => `- ${s}`).join('\n')}

### 5.3 兼容性需求
${requirements.nonFunctionalRequirements.compatibility.map(c => `- ${c}`).join('\n')}

### 5.4 可用性需求
${Object.entries(requirements.nonFunctionalRequirements.usability).map(([k, v]) => `- ${k}：${v}`).join('\n')}

### 5.5 可维护性需求
${Object.entries(requirements.nonFunctionalRequirements.maintainability).map(([k, v]) => `- ${k}：${v}`).join('\n')}

## 8. 测试策略与验收标准

### 8.1 测试范围
${requirements.testStrategy.testScope.map(s => `- ${s}`).join('\n')}

### 8.2 测试类型
${Object.entries(requirements.testStrategy.testTypes).map(([k, v]) => `- **${k}**：${v}`).join('\n')}

### 8.3 验收标准
${requirements.testStrategy.acceptanceCriteria.map(a => `- ${a}`).join('\n')}
`
}

export function formatArchitectureAsMarkdown(architecture: ArchitectureDocument): string {
  const frontendStack = architecture.techStack.frontend.map(t => `| ${t.category} | ${t.technology} | ${t.note} |`).join('\n')
  const backendStack = architecture.techStack.backend.map(t => `| ${t.category} | ${t.technology} | ${t.note} |`).join('\n')
  const dbStack = architecture.techStack.database.map(t => `| ${t.type} | ${t.technology} | ${t.scenario} |`).join('\n')
  const aiStack = architecture.techStack.ai.map(t => `| ${t.category} | ${t.technology} | ${t.scenario} |`).join('\n')

  const frontendModules = architecture.modules.frontend.map(m => `| ${m.module} | ${m.description} | ${m.aiEnhanced ? '是' : '否'} |`).join('\n')
  const backendModules = architecture.modules.backend.map(m => `| ${m.module} | ${m.description} | ${m.aiEnhanced ? '是' : '否'} |`).join('\n')

  const endpoints = architecture.apiDesign.coreEndpoints.map(e => `| ${e.category} | ${e.endpoint} | ${e.description} |`).join('\n')

  const environments = architecture.deploymentArchitecture.environments.map(e => `| ${e.name} | ${e.usage} | ${e.traffic} |`).join('\n')
  const deploymentMethods = architecture.deploymentArchitecture.deploymentMethods.map(d => `| ${d.component} | ${d.method} | ${d.note} |`).join('\n')

  return `# ${architecture.projectType}项目架构设计文档

## 1. 架构概述

- 项目类型：${architecture.projectType}
- 架构风格：分层架构 + 模块化 + 可插拔

## 2. 技术栈选型

### 2.1 前端技术栈

| 类别 | 技术选型 | 说明 |
|---|---|
${frontendStack}

### 2.2 后端技术栈

| 类别 | 技术选型 | 说明 |
|---|---|
${backendStack}

### 2.3 数据存储

| 类型 | 技术选型 | 场景 |
|---|---|
${dbStack}

### 2.4 AI 能力

| 类别 | 技术选型 | 场景 |
|---|---|
${aiStack}

## 3. 系统分层架构

${architecture.architectureLayers.map(l => `- ${l}`).join('\n')}

## 4. 模块划分

### 4.1 前端模块

| 模块 | 说明 | AI增强 |
|---|---|
${frontendModules}

### 4.2 后端模块

| 模块 | 说明 | AI增强 |
|---|---|
${backendModules}

## 5. 数据模型设计

### 5.1 核心实体
${architecture.dataModel.entities.map(e => typeof e === 'string' ? e : `- ${e.name}: ${e.description || ''}`).join('\n')}

### 5.2 关系设计
${architecture.dataModel.relationships}

### 5.3 索引设计
${architecture.dataModel.indexes.map(i => typeof i === 'string' ? i : `- ${i.name || i.table || '索引'}: ${i.type || 'normal'}`).join('\n')}

## 6. API 设计

### 6.1 接口规范
${architecture.apiDesign.standards.map(s => `- ${s}`).join('\n')}

### 6.2 核心接口清单

| 类别 | 接口 | 说明 |
|---|---|
${endpoints}

## 7. 部署架构

### 7.1 环境规划

| 环境 | 用途 | 流量 |
|---|---|
${environments}

### 7.2 部署方式

| 组件 | 部署方案 | 说明 |
|---|---|
${deploymentMethods}

## 8. 监控与可观测性

### 8.1 监控体系

| 类型 | 工具 |
|---|---|
| 基础设施 | ${architecture.monitoring.infrastructure.join(', ')} |
| 应用性能 | ${architecture.monitoring.applicationPerformance.join(', ')} |
| AI监控 | ${architecture.monitoring.aiMonitoring.join(', ')} |
`
}