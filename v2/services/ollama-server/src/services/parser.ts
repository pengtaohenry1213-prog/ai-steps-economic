/**
 * Content Parser Service
 * Parse AI output content into structured sections
 */

export interface ProposalContent {
  basicInfo: string
  background: string
  scope: {
    inScope: string[]
    outScope: string[]
  }
  acceptance: string
  milestones: string
  risks: string
  humanGate: string
}

// Section title aliases: any of the aliases matches the canonical section key
const SECTION_ALIASES: Record<string, string> = {
  '1. 项目基本信息': '1. 项目基本信息',
  '1. 项目概述': '1. 项目基本信息',
  '1. 概述': '1. 项目基本信息',
  '项目基本信息': '1. 项目基本信息',
  '项目概述': '1. 项目基本信息',
  '概述': '1. 项目基本信息',
  '2. 项目背景与目标': '2. 项目背景与目标',
  '项目背景与目标': '2. 项目背景与目标',
  '背景与目标': '2. 项目背景与目标',
  '3. 项目范围': '3. 项目范围',
  '项目范围': '3. 项目范围',
  '范围定义': '3. 项目范围',
  '范围': '3. 项目范围',
  '4. 验收标准': '4. 验收标准',
  '验收标准': '4. 验收标准',
  '5. 里程碑计划': '5. 里程碑计划',
  '里程碑计划': '5. 里程碑计划',
  '里程碑': '5. 里程碑计划',
  '6. 风险评估': '6. 风险评估',
  '风险评估': '6. 风险评估',
  '风险': '6. 风险评估',
  '7. Human Gate': '7. Human Gate',
  'Human Gate': '7. Human Gate',
  '7. Human Gate 评审': '7. Human Gate',
  'Human Gate 评审': '7. Human Gate',
}

/**
 * Resolve an alias to its canonical section key
 */
function resolveSection(sectionTitle: string): string {
  return SECTION_ALIASES[sectionTitle] ?? sectionTitle
}

/**
 * Parse proposal content from AI output
 */
export function parseProposalContent(aiOutput: string): ProposalContent {
  return {
    basicInfo: extractSection(aiOutput, '1. 项目基本信息'),
    background: extractSection(aiOutput, '2. 项目背景与目标'),
    scope: {
      inScope: extractListItems(aiOutput, 'In Scope'),
      outScope: extractListItems(aiOutput, 'Out of Scope'),
    },
    acceptance: extractSection(aiOutput, '4. 验收标准'),
    milestones: extractSection(aiOutput, '5. 里程碑计划'),
    risks: extractSection(aiOutput, '6. 风险评估'),
    humanGate: extractSection(aiOutput, '7. Human Gate'),
  }
}

/**
 * Extract a section from content by title (supports aliases)
 */
function extractSection(content: string, canonicalTitle: string): string {
  const aliases = Object.entries(SECTION_ALIASES)
    .filter(([, v]) => v === canonicalTitle)
    .map(([k]) => k)

  const lines = content.split('\n')
  const result: string[] = []
  let inSection = false

  for (const line of lines) {
    if (!inSection) {
      const resolved = resolveSection(line.trim())
      if (aliases.some((a) => line.includes(a)) || resolved === canonicalTitle) {
        inSection = true
        result.push(line)
      }
    } else {
      if (
        line.match(/^##?\s+\d+\./) ||
        line.match(/^#+\s+[一二三四五六七八九十]/) ||
        line === '---'
      ) {
        break
      }
      result.push(line)
    }
  }

  return result.join('\n').trim()
}

/**
 * Extract list items from content
 */
function extractListItems(content: string, listName: string): string[] {
  const items: string[] = []
  const lines = content.split('\n')
  let inList = false

  for (const line of lines) {
    if (line.includes(listName)) {
      inList = true
      continue
    }

    if (inList) {
      if (
        line.match(/^##?\s+\d+\./) ||
        line.match(/^#+\s+[一二三四五六七八九十]/)
      ) {
        break
      }

      const match = line.match(/^[-*]\s*(.+)/) || line.match(/^\d+\.\s*(.+)/)
      if (match) {
        items.push(match[1])
      }
    }
  }

  return items
}
