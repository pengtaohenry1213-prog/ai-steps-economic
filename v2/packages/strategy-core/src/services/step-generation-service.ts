/**
 * StepN 生成服务
 * 基于架构文档生成 step1.md ~ stepN.md
 */

import type { StepDocument, ArchitectureDocument } from '../types'
import {
  buildStepGenerationSystemPrompt,
  buildStepGenerationUserPrompt,
  parseStepGenerationResponse
} from '../prompts/step-generation-prompt'

interface AIServiceInterface {
  chat(messages: Array<{ role: string; content: string }>, options?: { model?: string; temperature?: number; max_tokens?: number }): Promise<{ success: boolean; data?: { content: string; model: string }; error?: string }>
}

interface ParsedStep {
  stepNumber: number
  taskObjective: string
  detailedDescription: string
  outOfScope: string[]
  v1ReuseRate: string
  technicalSolution: string
  constraints: string[]
  acceptanceCriteria: {
    functionality: string[]
    performance: Array<{ indicator: string; standard: string }>
    security: string[]
  }
  testCriteria: {
    functionality: string[]
    performance: Array<{ indicator: string; standard: string; testMethod: string }>
    security: string[]
  }
  testAcceptanceFlow: string
  role: string
  associatedRules: string[]
  associatedPrompts: string[]
  todos: Array<{ id: string; content: string; status: string }>
  involvedFiles: string[]
  prerequisites: string
  prerequisiteOutputs: string[]
  riskWarnings: Array<{ risk: string; mitigation: string }>
  relatedSpecs: string[]
  milestoneMapping: string
}

export async function generateStepDocumentsFromArchitecture(
  aiService: AIServiceInterface,
  architectureContent: string,
  modelId?: string
): Promise<StepDocument[] | null> {
  const systemPrompt = buildStepGenerationSystemPrompt()
  const userPrompt = buildStepGenerationUserPrompt(architectureContent)

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

    const parsed = parseStepGenerationResponse(result.data.content)
    if (!parsed || !parsed.steps) {
      console.error('解析 stepN 响应失败')
      return null
    }

    return parsed.steps.map((step: ParsedStep): StepDocument => ({
      stepNumber: step.stepNumber,
      taskObjective: step.taskObjective,
      detailedDescription: step.detailedDescription,
      outOfScope: step.outOfScope || [],
      v1ReuseRate: step.v1ReuseRate,
      technicalSolution: step.technicalSolution,
      constraints: step.constraints.length > 0 ? step.constraints : [
        '遵循前端工程化 SOP（docs/AI工程化开发手册/前端工程化 SOP（Vue3 + TS + Vben Admin）.md）',
        '遵循后端工程化 SOP（docs/AI工程化开发手册/后端工程化 SOP（Node.js + NestJS）.md）',
        '遵循数据库设计规范（docs/AI工程化开发手册/数据库设计规范（AI 工程化版）.md）',
        '遵循安全工程规范（docs/AI工程化开发手册/安全工程规范（AI 工程化版）.md）'
      ],
      acceptanceCriteria: {
        functionality: step.acceptanceCriteria?.functionality || [],
        performance: step.acceptanceCriteria?.performance || [],
        security: step.acceptanceCriteria?.security || []
      },
      testCriteria: {
        functionality: step.testCriteria?.functionality || [],
        performance: step.testCriteria?.performance || [],
        security: step.testCriteria?.security || []
      },
      testAcceptanceFlow: step.testAcceptanceFlow || '测试 → 验证 → 确认 → Human Gate 验收',
      role: step.role || 'Frontend Agent',
      associatedRules: step.associatedRules || ['.cursor/rules/frontend.mdc'],
      associatedPrompts: step.associatedPrompts || ['.cursor/prompts/run-step.md'],
      todos: step.todos || [],
      involvedFiles: step.involvedFiles,
      prerequisites: step.prerequisites || '无',
      prerequisiteOutputs: step.prerequisiteOutputs || [],
      riskWarnings: step.riskWarnings || [],
      relatedSpecs: step.relatedSpecs || [
        '前端工程化 SOP',
        '后端工程化 SOP',
        '安全工程规范'
      ],
      milestoneMapping: step.milestoneMapping
    }))
  } catch (e) {
    console.error('生成 stepN 文档失败:', e)
    return null
  }
}

export function formatStepAsMarkdown(step: StepDocument): string {
  const perfRows = step.acceptanceCriteria.performance.map(p => `| ${p.indicator} | ${p.standard} |`).join('\n')
  const testPerfRows = step.testCriteria.performance.map(p => `| ${p.indicator} | ${p.standard} | ${p.testMethod} |`).join('\n')
  const todoItems = step.todos.map(t => `- [ ] ${t.id}: ${t.content}`).join('\n')

  return `# Step ${step.stepNumber}: ${step.taskObjective}

## 任务目标
${step.taskObjective}

## 详细说明
${step.detailedDescription}
${!step.detailedDescription.includes('v1复用量') ? `- v1复用量：${step.v1ReuseRate}` : ''}
${step.technicalSolution && !step.detailedDescription.includes('技术方案') ? `- 技术方案：${step.technicalSolution}` : ''}

## Out of Scope（当前 Step 不做的事情）
${step.outOfScope.length > 0 ? step.outOfScope.map(o => `- ${o}`).join('\n') : '- 无'}

## 执行任务（TODO）
${todoItems || '待生成 TODO 子任务'}

## 约束条件
${step.constraints.map(c => `- ${c}`).join('\n')}

## 验收标准
### 功能验收
${step.acceptanceCriteria.functionality.map(f => `- [ ] ${f}`).join('\n')}

### 性能验收
| 指标 | 标准 |
|------|------|
${perfRows}

### 安全验收
${step.acceptanceCriteria.security.map(s => `- ${s}`).join('\n')}

## 测试标准
### 功能测试
${step.testCriteria.functionality.length > 0 ? step.testCriteria.functionality.map(t => `- ${t}`).join('\n') : '待测试标准补充'}

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
${testPerfRows || '待测试标准补充'}

### 安全测试
${step.testCriteria.security.length > 0 ? step.testCriteria.security.map(s => `- ${s}`).join('\n') : '待测试标准补充'}

## 测试验收流程
${step.testAcceptanceFlow}

## 涉及文件
${step.involvedFiles.length > 0 ? step.involvedFiles.map(f => `- ${f}`).join('\n') : '待架构文档补充'}

## 前置依赖
${step.prerequisites}

## 前置产出验证
${step.prerequisiteOutputs.length > 0 ? step.prerequisiteOutputs.map(p => `- ${p}`).join('\n') : '无'}

## 风险提示
${step.riskWarnings.length > 0 ? step.riskWarnings.map(r => `- **${r.risk}**: ${r.mitigation}`).join('\n') : '无'}

## 关联规范
- 角色：${step.role}
- 关联规则：${step.associatedRules.join(', ')}
- 关联执行：${step.associatedPrompts.join(', ')}
${step.relatedSpecs.map(s => `- ${s}`).join('\n')}

## 里程碑映射
${step.milestoneMapping}
`
}