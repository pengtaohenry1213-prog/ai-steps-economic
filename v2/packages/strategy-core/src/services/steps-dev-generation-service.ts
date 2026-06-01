/**
 * Steps-dev 生成服务
 * 基于所有 stepN.md 生成 steps-dev.md
 */

import type { StepsDevDocument, StepDocument } from '../types'
import {
  buildStepsDevSystemPrompt,
  buildStepsDevUserPrompt,
  parseStepsDevResponse
} from '../prompts/steps-dev-generation-prompt'

interface AIServiceInterface {
  chat(messages: Array<{ role: string; content: string }>, options?: { model?: string; temperature?: number; max_tokens?: number }): Promise<{ success: boolean; data?: { content: string; model: string }; error?: string }>
}

export async function generateStepsDevDocument(
  aiService: AIServiceInterface,
  steps: StepDocument[],
  modelId?: string
): Promise<StepsDevDocument | null> {
  const systemPrompt = buildStepsDevSystemPrompt()

  const stepsContent = steps.map(step => {
    return `## ${step.stepNumber}. Step ${step.stepNumber}: ${step.taskObjective}
- 前置依赖：${step.prerequisites}
- v1复用量：${step.v1ReuseRate}
`
  }).join('\n\n')

  const userPrompt = buildStepsDevUserPrompt(stepsContent)

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

    const parsed = parseStepsDevResponse(result.data.content)
    if (!parsed) {
      console.error('解析 steps-dev 响应失败')
      return null
    }

    return {
      phases: parsed.phases,
      executionSequence: parsed.executionSequence,
      roleMapping: parsed.roleMapping,
      progressTracking: parsed.progressTracking
    }
  } catch (e) {
    console.error('生成 steps-dev 文档失败:', e)
    return null
  }
}

export function formatStepsDevAsMarkdown(doc: StepsDevDocument): string {
  const phasesTable = doc.phases.map(p => {
    return `| ${p.name} | ${p.steps.join('、')} | ${p.dependencyLogic} |`
  }).join('\n')

  const sequenceTable = doc.executionSequence.map(s => {
    return `| ${s.step} | ${s.taskObjective} | ${s.description} |`
  }).join('\n')

  const roleTable = Object.entries(doc.roleMapping).map(([role, steps]) => {
    return `| ${role} | ${steps.join('、')} |`
  }).join('\n')

  const progressTable = doc.progressTracking.map(p => {
    return `| ${p.step} | ${p.status} | ${p.humanGate} | ${p.role} | - | ${p.planFile} | ${p.completedDate} |`
  }).join('\n')

  return `# 开发路线

此文档是产品实现步骤与 Agent 执行指南，由 **TechLead** 负责维护。

## Agent 执行方案（Plan 中间层）

> 每次执行 step 前，先用 Plan 模式生成 \`.cursor/plans/stepN-plan.md\`，再由 Agent 执行。
> 详见 [.cursor/plans/README.md](./.cursor/plans/README.md)

### 工作流约定

| 顺序 | 步骤 | 说明 |
| ---- | ------------- | -------------------------------------------------------------------------- |
| 1 | **读取规格** | 读取 \`doc/steps/stepN.md\` 了解任务目标、要求、强约束 |
| 2 | **生成 Plan** | Plan 模式生成 \`.cursor/plans/stepN-plan.md\`（todos + 文件清单 + 验收标准） |
| 3 | **执行 Plan** | Agent 模式按 todos 顺序执行代码 |
| 4 | **验收闭环** | 对照 Plan 里的验收标准逐项确认 |

### 为什么用 Plan 作为中间层

- **规格与执行解耦**：\`stepN.md\` 是「做什么」，\`stepN-plan.md\` 是「怎么做、做成什么样」
- **减少执行跑偏**：todos 相当于执行路线图，AI 不会漏掉步骤或误解需求
- **可追溯**：每次执行都有 Plan 记录存档，回溯「当时为什么这么实现」比翻对话记录清晰

---

## 正确的开发顺序

### 阶段划分与依赖逻辑

| 阶段 | 包含步骤 | 核心依赖逻辑 |
| ------ | -------- | ------------------------------------------------ |
${phasesTable}

### 为什么这样排序

${doc.phases[0] ? `- **${doc.phases[0].name}**：${doc.phases[0].dependencyLogic}` : ''}
${doc.phases[1] ? `- **${doc.phases[1].name}**：${doc.phases[1].dependencyLogic}` : ''}

### 各阶段详细步骤

${doc.phases.map(phase => {
  const stepsInPhase = doc.executionSequence.filter(s => phase.steps.includes(s.step))
  if (stepsInPhase.length === 0) return ''

  const stepDetails = stepsInPhase.map(s => {
    return `| ${s.step} | ${s.taskObjective} | ${s.description} |`
  }).join('\n')

  return `#### ${phase.name}

| step | 任务目标 | 说明 |
| ----- | ---------------------- | ----------------------------------------- |
${stepDetails}`
}).join('\n\n')}

---

## 执行进度追踪

| step | 状态 | Human Gate | 角色 | 负责人 | Plan 文件 | 完成日期 |
| ------ | ------ | ------------- | ------------------ | ------ | ------------------------ | -------- |
${progressTable}

> 状态说明：✅ 已完成、🔄 进行中、⬜ 待开始。执行完一个 step 后更新此表。
>
> Human Gate：人工审核点，用于 Cursor IDE 中给人提醒检查（**人工审核，非 AI 自动化闭环**）。
>
> 角色说明：Frontend（UI）= 前端 UI 组件开发、Frontend（集成）= 前后端联调、Backend = 后端 API/服务实现。

### 角色对应规则

| 角色 | 负责的 step |
| ---------------- | ------------------------------------ |
${roleTable}
`
}