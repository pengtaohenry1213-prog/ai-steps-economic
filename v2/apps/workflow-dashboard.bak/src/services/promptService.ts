/**
 * AI Prompt 服务
 * 根据阶段类型生成对应的 AI Prompt
 */

import { AI_PROMPTS, getPromptConfig, type PromptType } from '@/config/aiPrompts'
import { LIFECYCLE_STEP_TEMPLATES, TEAM_MEMBERS } from '@/types'
import { processFiles, getFileWarnings, type ProcessingResult, type ProcessedFile } from './fileProcessor'

export interface BuildPromptOptions {
  type: PromptType
  files: { name: string; content: string }[] | ProcessedFile[]
  customParams?: Record<string, string>
  stageId?: string
}

/**
 * 根据类型和输入文件构建完整的 Prompt
 */
export function buildPrompt(options: BuildPromptOptions): string {
  const config = getPromptConfig(options.type)
  // 如果已经是 ProcessedFile（已处理过），直接使用；否则处理
  const processed = options.files.length > 0 && 'truncated' in options.files[0]
    ? { files: options.files as ProcessedFile[], totalTokens: 0, exceeded: false, segmentCount: 1 }
    : processFiles(options.files as { name: string; content: string }[])

  const fileContents = processed.files.map(f =>
    `=== ${f.name} ===\n${f.content}`
  ).join('\n\n---\n\n')

  const { role, task, inputDescription, outputFormat, constraints, qualityChecks } = config
  const roleDescription = [
    `【角色】${role.title}`,
    role.certifications ? `【资质】${role.certifications}` : '',
    `【专长】${role.expertise.join('、')}`
  ].filter(Boolean).join('\n')

  // 构建约束说明
  const constraintsText = constraints.map(c => `- ${c}`).join('\n')

  // 构建质量检查说明
  const qualityChecksText = qualityChecks.map(q => `- [ ] ${q}`).join('\n')

  // 构建 JSON Schema 模板
  const jsonSchemaText = JSON.stringify(outputFormat.jsonSchema, null, 2)

  // 构建完整 Prompt
  let promptText = `${roleDescription}
【任务】${task}

【输入文档】
${inputDescription}
${fileContents}

【输出要求】
1. ${constraintsText}

【输出格式】（必须同时包含 JSON 和 Markdown）

## JSON 结构（用于系统解析）
\`\`\`json
${jsonSchemaText}
\`\`\`

## Markdown 格式（用于人工阅读）

${outputFormat.markdownTemplate}

【质量检查】
生成完成后，请自检：
${qualityChecksText}`

  // 注入团队成员信息和 cursorRule（所有有定义 roles 的阶段）
  if (options.stageId) {
    const template = LIFECYCLE_STEP_TEMPLATES[options.stageId]
    if (template?.roles?.length) {
      const roleMembers = template.roles?.map(roleName => {
        const member = TEAM_MEMBERS.find(m => m.role === roleName)
        return member ? `${roleName}(${member.name})${member.cursorRule ? ` [参考规则](${member.cursorRule})` : ''}` : roleName
      }).filter(Boolean) || []

      const techLead = template.techLeadId ? TEAM_MEMBERS.find(m => m.id === template.techLeadId) : null
      const pmo = TEAM_MEMBERS.find(m => m.humanGateRole === 'pmo')
      const security = TEAM_MEMBERS.find(m => m.humanGateRole === 'security')

      const teamInfo = `\n\n【团队信息】\n技术负责人：${techLead?.name || '待定'} ${techLead?.cursorRule ? `[参考规则](${techLead.cursorRule})` : ''}\nHuman Gate 审批人：PMO(${pmo?.name || '待定'})、Security(${security?.name || '待定'})\n相关角色：${roleMembers.join('、')}`
      promptText = promptText.replace('【输入文档】', `${teamInfo}\n\n【输入文档】`)
    }
  }

  return promptText
}

export function buildProposalAnalysisPrompt(files: { name: string; content: string }[], stageId?: string): string {
  return buildPrompt({ type: 'proposal', files, stageId })
}

/**
 * 根据阶段 ID 获取对应的 Prompt 类型
 */
export function getPromptTypeByStageId(stageId: string): PromptType {
  const stageToPromptType: Record<string, PromptType> = {
    'init': 'proposal',
    'requirement': 'requirement',
    'architecture': 'architecture',
    'initialization': 'prd',
    'development': 'prd',
    'testing': 'test_plan',
    'acceptance': 'acceptance',
    'packaging': 'deployment',
    'deployment': 'deployment',
    'operation': 'deployment',
    'iteration': 'requirement'
  }

  return stageToPromptType[stageId] || 'proposal'
}

/**
 * 获取所有支持的 Prompt 类型
 */
export function getSupportedPromptTypes(): { type: PromptType; name: string }[] {
  return Object.values(AI_PROMPTS).map(p => ({
    type: p.type,
    name: p.name
  }))
}

/**
 * 获取 Prompt 类型的简要描述
 */
export function getPromptTypeDescription(type: PromptType): string {
  const config = getPromptConfig(type)
  return `${config.name} - ${config.task}`
}

export { processFiles, getFileWarnings }
export type { ProcessingResult }
