/**
 * Plan 生成服务
 * 将 stepN.md 转换为 stepN-plan.md
 */

import type { PlanDocument } from '../types'
import {
  buildPlanGenerationSystemPrompt,
  buildPlanGenerationUserPrompt,
  parsePlanGenerationResponse
} from '../prompts/plan-generation-prompt'

interface AIServiceInterface {
  chat(messages: Array<{ role: string; content: string }>, options?: { model?: string; temperature?: number; max_tokens?: number }): Promise<{ success: boolean; data?: { content: string; model: string }; error?: string }>
}

export async function generatePlanFromStep(
  aiService: AIServiceInterface,
  stepContent: string,
  stepNumber: number,
  modelId?: string
): Promise<PlanDocument | null> {
  const systemPrompt = buildPlanGenerationSystemPrompt()
  const userPrompt = buildPlanGenerationUserPrompt(stepContent)

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

    const parsed = parsePlanGenerationResponse(result.data.content)
    if (!parsed) {
      console.error('解析 Plan 响应失败')
      return null
    }

    return {
      stepNumber: parsed.stepNumber || stepNumber,
      overview: parsed.overview || '',
      stagePhases: parsed.stagePhases || [],
      keyRisks: parsed.keyRisks || [],
      todos: parsed.todos || [],
      files: parsed.files || [],
      acceptance: parsed.acceptance || []
    }
  } catch (e) {
    console.error('生成 Plan 失败:', e)
    return null
  }
}

export function formatPlanAsMarkdown(plan: PlanDocument): string {
  const todoRows = plan.todos.map(t => {
    const dependsOnStr = t.depends_on.length > 0 ? ` (依赖: ${t.depends_on.join(', ')})` : ''
    return `| ${t.id} | ${t.type} | ${t.content}${dependsOnStr} | ${t.acceptance} |`
  }).join('\n')

  const fileRows = plan.files.map(f => `| ${f.path} | ${f.operation} | ${f.description} |`).join('\n')

  const acceptanceRows = plan.acceptance.map(a => `| ${a.item} | ${a.verification} | ${a.status} |`).join('\n')

  const stageRows = plan.stagePhases.map(s => `| ${s.stage} | ${s.name} | ${s.dependency} | ${s.deliverables} | ${s.duration} |`).join('\n')

  const riskRows = plan.keyRisks.map(r => `- **${r.risk}**: ${r.mitigation}`).join('\n')

  return `# Plan - Step ${plan.stepNumber}

## 阶段核心目标
${plan.overview}

## 阶段划分

| 阶段序号 | 阶段名称 | 阶段依赖 | 产出物 | 预估耗时 |
|----------|----------|----------|--------|----------|
${stageRows || '| | | | |'}

## 关键依赖与风险

${riskRows || '无'}

## Todos

| ID | Type | 内容 | 验收标准 |
|----|------|------|----------|
${todoRows || '| | | | |'}

## Files

| 文件 | 操作类型 | 说明 |
|------|----------|------|
${fileRows || '| | | |'}

## Acceptance

| 验收项 | 验证方式 | 状态 |
|--------|----------|------|
${acceptanceRows || '| | | |'}
`
}