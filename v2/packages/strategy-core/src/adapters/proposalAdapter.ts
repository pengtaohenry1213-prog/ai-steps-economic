/**
 * Proposal Adapter — ACL Layer #3 (核心)
 * A 的 ProposalDocument ↔ B 的 ProposalContent 双向转换
 */

import type { ProposalDocument, EnhancedStrategy, RequirementsDocument, ArchitectureDocument } from '../types'
import { formatRequirementsAsMarkdown, formatArchitectureAsMarkdown } from '../services/document-generation-service'

// 导入 B 的 ProposalContent 类型（路径相对于 adapters 目录）
// 注意：实际使用时可能需要根据项目结构调整导入路径
export interface ProposalContent {
  name?: string
  type?: string
  decisionMakers?: string[]
  background?: string
  currentIssues?: string[]
  goals?: string[]
  scope?: {
    inScope?: { P0?: string[]; P1?: string[]; P2?: string[] } | string[]
    outScope?: string[]
  }
  acceptance?: {
    functionality?: string[]
    performance?: Record<string, string>
    security?: string[]
  } | string
  milestones?: string[] | string
  risks?: Array<{
    type?: string
    description?: string
    impact?: string
    countermeasure?: string
  }> | string
  humanGate?: {
    pmo?: string[]
    security?: string[]
  } | string
  fullText?: string
}

/**
 * A 的 ProposalDocument → B 的 ProposalContent
 * 用于：生成后存储到 Supabase（B 的数据结构）
 */
export function toProposalContent(doc: ProposalDocument): ProposalContent {
  return {
    name: doc.projectName,
    type: doc.projectType,
    decisionMakers: doc.decisionMakers,
    background: doc.background,
    currentIssues: Array.isArray(doc.currentIssues)
      ? doc.currentIssues
      : doc.currentIssues ? [doc.currentIssues] : [],
    goals: Array.isArray(doc.goals) ? doc.goals : doc.goals ? [doc.goals] : [],
    scope: {
      inScope: {
        P0: doc.scope?.inScope?.P0 ?? [],
        P1: doc.scope?.inScope?.P1 ?? [],
        P2: (doc.scope as any)?.inScope?.P2 ?? [],
      },
      outScope: doc.scope?.outScope ?? [],
    },
    acceptance: doc.acceptance ?? {
      functionality: [],
      performance: {},
      security: [],
    },
    milestones: normalizeMilestones(doc.milestones),
    risks: normalizeRisks(doc.risks),
    humanGate: {
      pmo: doc.humanGate?.pmo ?? [],
      security: doc.humanGate?.security ?? [],
    },
    fullText: formatProposalDocumentAsMarkdown(doc),
  }
}

/**
 * 将 RequirementsDocument 转换为 B 的 ProposalContent 结构
 * 用于：需求文档通过 ACL 存储到 Supabase
 */
export function toRequirementsContent(doc: RequirementsDocument): ProposalContent {
  return {
    name: doc.projectName,
    type: `需求文档-${doc.version}`,
    decisionMakers: [doc.basicInfo.productManager, doc.basicInfo.techLead, doc.basicInfo.testLead].filter(Boolean),
    background: doc.overview.background,
    currentIssues: [doc.overview.goals.nonGoals.join(', ')].filter(Boolean),
    goals: [doc.overview.goals.core],
    scope: {
      inScope: {
        P0: doc.overview.scope.included.slice(0, 5),
        P1: doc.overview.scope.included.slice(5),
      },
      outScope: doc.overview.scope.excluded,
    },
    acceptance: {
      functionality: doc.testStrategy.acceptanceCriteria,
      performance: doc.nonFunctionalRequirements.performance,
      security: doc.nonFunctionalRequirements.security,
    },
    fullText: formatRequirementsAsMarkdown(doc),
  }
}

/**
 * 将 ArchitectureDocument 转换为 B 的 ProposalContent 结构
 * 用于：架构文档通过 ACL 存储到 Supabase
 */
export function toArchitectureContent(doc: ArchitectureDocument): ProposalContent {
  const techStackStr = [
    ...doc.techStack.frontend.map(t => t.technology),
    ...doc.techStack.backend.map(t => t.technology),
    ...doc.techStack.database.map(t => t.technology),
    ...doc.techStack.ai.map(t => t.technology),
  ].join(', ')

  return {
    name: doc.projectType,
    type: '架构文档',
    background: `技术栈：${techStackStr}`,
    currentIssues: doc.architectureLayers,
    goals: [doc.techStack.frontend[0]?.category ?? '待确定'],
    scope: {
      inScope: {
        P0: doc.modules.frontend.map(m => m.module),
        P1: doc.modules.backend.map(m => m.module),
      },
    },
    acceptance: {
      functionality: ['架构设计合理', '模块划分清晰'],
      performance: {},
      security: [],
    },
    fullText: formatArchitectureAsMarkdown(doc),
  }
}
export function toProposalDocument(content: ProposalContent): ProposalDocument {
  return {
    projectName: content.name ?? '',
    projectType: content.type ?? '',
    decisionMakers: content.decisionMakers ?? [],
    background: content.background ?? '',
    currentIssues: normalizeToArray(content.currentIssues),
    goals: normalizeToArray(content.goals),
    scope: {
      inScope: normalizeScopeInScope(content.scope?.inScope),
      outScope: content.scope?.outScope ?? [],
    },
    acceptance: normalizeAcceptance(content.acceptance),
    milestones: normalizeMilestonesToAFormat(content.milestones),
    risks: normalizeRisksToAFormat(content.risks),
    humanGate: normalizeHumanGate(content.humanGate),
  }
}

/**
 * 将 milestone 数组转为字符串数组格式（B 的格式）
 */
function normalizeMilestones(
  milestones: Array<{ phase: string; day: number; deliverables: string[] }> | undefined
): string[] {
  if (!milestones) return []
  return milestones.map((m) => `[${m.day}天] ${m.phase}: ${m.deliverables.join(', ')}`)
}

/**
 * 将 risks 数组转为 B 的格式
 */
function normalizeRisks(
  risks: Array<{ risk: string; trigger: string; mitigation: string; owner: string }> | undefined
): Array<{ type?: string; description?: string; impact?: string; countermeasure?: string }> {
  if (!risks) return []
  return risks.map((r) => ({
    type: undefined,
    description: r.risk,
    impact: r.trigger,
    countermeasure: r.mitigation,
  }))
}

// ============ 辅助函数 ============

function normalizeToArray(value: string | string[] | undefined): string[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function normalizeScopeInScope(
  inScope: { P0?: string[]; P1?: string[]; P2?: string[] } | string[] | undefined
): { P0: string[]; P1: string[] } {
  if (!inScope) return { P0: [], P1: [] }
  if (Array.isArray(inScope)) {
    return { P0: inScope, P1: [] }
  }
  return {
    P0: inScope.P0 ?? [],
    P1: inScope.P1 ?? [],
  }
}

function normalizeAcceptance(
  acceptance: ProposalContent['acceptance']
): ProposalDocument['acceptance'] {
  if (!acceptance) {
    return { functionality: [], performance: {}, security: [] }
  }
  if (typeof acceptance === 'string') {
    // 如果是字符串，说明人类可读格式，需要解析
    return { functionality: [acceptance], performance: {}, security: [] }
  }
  return {
    functionality: acceptance.functionality ?? [],
    performance: acceptance.performance ?? {},
    security: acceptance.security ?? [],
  }
}

function normalizeMilestonesToAFormat(
  milestones: string[] | string | undefined
): Array<{ phase: string; day: number; deliverables: string[] }> {
  if (!milestones) return []
  const arr = normalizeToArray(milestones)
  return arr.map((m) => {
    // 尝试解析 [天数] 格式
    const match = m.match(/\[(\d+)天\]?\s*(.*):\s*(.*)/)
    if (match) {
      return {
        phase: match[2].trim(),
        day: parseInt(match[1], 10),
        deliverables: [match[3].trim()],
      }
    }
    return { phase: m, day: 0, deliverables: [m] }
  })
}

function normalizeRisksToAFormat(
  risks: Array<{ type?: string; description?: string; impact?: string; countermeasure?: string }> | string | undefined
): Array<{ risk: string; trigger: string; mitigation: string; owner: string }> {
  if (!risks) return []
  if (typeof risks === 'string') {
    return [{ risk: risks, trigger: '', mitigation: '', owner: '' }]
  }
  return risks.map((r) => ({
    risk: r.description ?? '',
    trigger: r.impact ?? '',
    mitigation: r.countermeasure ?? '',
    owner: '',
  }))
}

function normalizeHumanGate(
  hg: ProposalContent['humanGate']
): { pmo: string[]; security: string[] } {
  if (!hg) return { pmo: [], security: [] }
  if (typeof hg === 'string') {
    // 如果是字符串，需要解析（不太可能发生）
    return { pmo: [], security: [] }
  }
  return {
    pmo: hg.pmo ?? [],
    security: hg.security ?? [],
  }
}

/**
 * 将 ProposalDocument 格式化为 Markdown 字符串
 * 用于 B 的 fullText 字段
 */
export function formatProposalDocumentAsMarkdown(doc: ProposalDocument): string {
  const lines: string[] = []

  lines.push(`# ${doc.projectName}（${doc.projectType}）`)
  lines.push('')
  lines.push('## 背景')
  lines.push(doc.background)
  lines.push('')

  if (doc.currentIssues.length > 0) {
    lines.push('## 当前问题')
    doc.currentIssues.forEach((issue) => lines.push(`- ${issue}`))
    lines.push('')
  }

  if (doc.goals.length > 0) {
    lines.push('## 目标')
    doc.goals.forEach((goal) => lines.push(`- ${goal}`))
    lines.push('')
  }

  if (doc.scope?.inScope?.P0?.length) {
    lines.push('## 范围 - P0')
    doc.scope.inScope.P0.forEach((item) => lines.push(`- ${item}`))
    lines.push('')
  }

  if (doc.scope?.inScope?.P1?.length) {
    lines.push('## 范围 - P1')
    doc.scope.inScope.P1.forEach((item) => lines.push(`- ${item}`))
    lines.push('')
  }

  if (doc.milestones.length > 0) {
    lines.push('## 里程碑')
    doc.milestones.forEach((m) => lines.push(`- [${m.day}天] ${m.phase}: ${m.deliverables.join(', ')}`))
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * ACL 层的入口函数
 * 根据传入的数据类型自动选择合适的适配器
 *
 * 支持两种模式：
 * - 完整模式：输入 ProposalDocument，返回结构化的 ProposalContent
 * - 简化模式：输入 string（markdown），返回只有 fullText 的 ProposalContent
 */
export function toProposalContentFromAny(
  data: ProposalDocument | string | any
): ProposalContent | null {
  if (isProposalDocument(data)) {
    // 完整模式：A 的 ProposalDocument → B 的 ProposalContent
    return toProposalContent(data)
  }
  if (typeof data === 'string') {
    // 简化模式：markdown 文本 → 只有 fullText 的 ProposalContent
    return { fullText: data }
  }
  // 如果是对象但不是结构化的 ProposalDocument
  if (typeof data === 'object' && data !== null) {
    // 如果有 fullText，走简化模式
    if (typeof data.fullText === 'string') {
      return { fullText: data.fullText }
    }
    // 其他情况，记录 warn 并返回 null
    console.warn('[ACL] Unknown object type for toProposalContent:', Object.keys(data))
    return null
  }
  // 其他情况，记录 warn 并返回 null
  console.warn('[ACL] Unknown data type for toProposalContent:', typeof data)
  return null
}

export function isProposalDocument(data: any): data is ProposalDocument {
  // 如果没有任何结构化字段（有 fullText 但没有 name/type/projectName/projectType），走简化模式
  const hasProjectName = typeof data?.projectName === 'string' && data.projectName.length > 0
  const hasProjectType = typeof data?.projectType === 'string' && data.projectType.length > 0
  const hasName = typeof data?.name === 'string' && data.name.length > 0
  const hasType = typeof data?.type === 'string' && data.type.length > 0
  const hasFullText = typeof data?.fullText === 'string'

  // 如果没有任何结构化字段（有 fullText 但没有 name/type/projectName/projectType），走简化模式
  if (hasFullText && !hasName && !hasType && !hasProjectName && !hasProjectType) {
    return false
  }

  // A 的 ProposalDocument 有 projectName（不是 name）
  if (hasProjectName && hasProjectType) {
    return true
  }
  // B 的 ProposalContent 有 name 和 type
  if (hasName && hasType) {
    return true
  }
  return false
}