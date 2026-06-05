/**
 * 文件处理服务
 * 负责文件内容提取、压缩、token 估算和分段
 */

export interface ProcessedFile {
  name: string
  content: string
  tokens: number
  truncated: boolean
}

export interface ProcessingResult {
  files: ProcessedFile[]
  totalTokens: number
  exceeded: boolean
  segmentCount: number
}

const MAX_CONTEXT_TOKENS = 28000
const SAFE_CONTEXT_LIMIT = 24000
const CHARS_PER_TOKEN_CN = 2
const CHARS_PER_TOKEN_EN = 5

export function estimateTokens(text: string): number {
  let charCount = 0
  for (const char of text) {
    if (char.charCodeAt(0) > 127) {
      charCount += CHARS_PER_TOKEN_CN
    } else {
      charCount += CHARS_PER_TOKEN_EN
    }
  }
  return Math.ceil(charCount / (CHARS_PER_TOKEN_CN + CHARS_PER_TOKEN_EN) * 2)
}

const PROPOSAL_KEYWORDS = [
  '项目', '背景', '目标', '范围', '需求', '功能', '里程碑', '风险', '验收', '立项',
  '问题', '技术', '架构', '版本', '测试', '部署',
  '市场', '收益', '竞品', '决策', '判断', 'P0', 'P1', 'P2', 'Human Gate', 'WBS',
  '项目类型', '内部研发', '客户项目', '产品策划', '技术预研', '敏捷迭代',
  '可行性', '竞品分析', '用户调研', '风险评估', '立项书', '范围定义',
  '基本', '信息', '名称', '类型', '决策者', '负责人', '周期', '预算', '资源',
  '现状', '痛点', '驱动', '价值', '收益', '投入', '产出', '对比', '差异化'
]
const REQUIREMENT_KEYWORDS = [
  '需求', '功能', '用例', '用户', '场景', '交互', '接口', '数据', '性能', '安全', '非功能',
  '背景', '目标', '里程碑', '风险', '立项书', 'PRD', '优先级', 'P0', 'P1', 'P2',
  '用户故事', '异常流程', '边界条件', '用例分析', '需求收集', '产品需求',
  '故事', '功能点', '模块', '页面', '按鈕', '表单', '列表', '详情', '搜索', '筛选',
  '导出', '导入', '上传', '下载', '审批', '流程', '状态', '流转', '触发', '条件'
]
const ARCHITECTURE_KEYWORDS = [
  '架构', '设计', '技术选型', '组件', '模块', '接口', '数据流', '部署', '技术栈',
  '前端', '后端', '数据库', '缓存', '队列', 'API', 'REST', 'GraphQL', '微服务',
  '系统', '子系统', '服务', '层', '层次', '架构图', '拓扑', '节点', '网关', '代理',
  '负载均衡', '容灾', '高可用', '可扩展', '性能', '安全', '监控', '日志'
]

function getKeywordsForType(type: string): string[] {
  switch (type) {
    case 'proposal':
      return PROPOSAL_KEYWORDS
    case 'requirement':
      return REQUIREMENT_KEYWORDS
    case 'architecture':
      return ARCHITECTURE_KEYWORDS
    default:
      return PROPOSAL_KEYWORDS
  }
}

function isRelevantLine(line: string, keywords: string[]): boolean {
  const lowerLine = line.toLowerCase()
  return keywords.some(keyword => lowerLine.includes(keyword))
}

function extractSemanticChunks(content: string, promptType: string = 'proposal'): string {
  const keywords = getKeywordsForType(promptType)
  const lines = content.split('\n')
  const result: string[] = []
  let currentSection: string[] = []
  let inRelevantSection = false
  let sectionStartIdx = 0

  const flushSection = () => {
    if (currentSection.length > 0) {
      const sectionText = currentSection.join('\n')
      if (estimateTokens(sectionText) > 50) {
        result.push(`\n=== 相关段落 ${result.length + 1} ===\n`)
        result.push(sectionText)
      }
      currentSection = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('#')) {
      flushSection()

      if (isRelevantLine(line, keywords)) {
        inRelevantSection = true
        currentSection = [line]
        sectionStartIdx = i
      } else {
        inRelevantSection = false
      }
    } else if (inRelevantSection) {
      if (line.trim() === '' || line.trim().startsWith('-') || line.trim().startsWith('*') || line.startsWith('|')) {
        currentSection.push(line)
      } else if (line.length < 200) {
        currentSection.push(line)
      } else if (isRelevantLine(line, keywords)) {
        currentSection.push(line)
      } else {
        // 即使不包含当前阶段关键词，也保留前 100 字符（跨阶段上下文）
        currentSection.push(line.substring(0, 100) + '...')
      }

      if (currentSection.length > 100) {
        flushSection()
        inRelevantSection = false
      }
    } else if (isRelevantLine(line, keywords)) {
      if (currentSection.length > 0 && !inRelevantSection) {
        flushSection()
      }
      currentSection = [line]
      inRelevantSection = true
    }
  }

  flushSection()
  return result.join('\n')
}

function extractKeyContent(content: string): string {
  const lines = content.split('\n')
  const result: string[] = []
  let inCodeBlock = false
  let codeBlockContent: string[] = []
  let codeBlockLines = 0

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeBlockContent = [line]
        codeBlockLines = 1
      } else {
        codeBlockContent.push(line)
        codeBlockLines++
        if (codeBlockLines > 20) {
          result.push(codeBlockContent.slice(0, 3).join('\n'))
          result.push(`...[代码块共 ${codeBlockLines} 行]...`)
          result.push(codeBlockContent.slice(-3).join('\n'))
        } else {
          result.push(codeBlockContent.join('\n'))
        }
        inCodeBlock = false
        codeBlockContent = []
        codeBlockLines = 0
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      codeBlockLines++
      continue
    }

    if (line.startsWith('#')) {
      result.push(line)
    } else if (line.trim() === '' || line.trim().startsWith('-') || line.trim().startsWith('*')) {
      result.push(line)
    } else if (line.length < 200) {
      result.push(line)
    } else {
      const words = line.split(/[\s，。、；：""''（）()]+/)
      if (words.length > 3) {
        result.push(line.substring(0, 150) + '...')
      }
    }
  }

  if (inCodeBlock && codeBlockContent.length > 0) {
    result.push(codeBlockContent.slice(0, 3).join('\n'))
    result.push(`...[代码块共 ${codeBlockLines} 行]...`)
  }

  return result.join('\n')
}

function truncateContent(content: string, maxTokens: number): { content: string; truncated: boolean } {
  const lines = content.split('\n')
  let tokenCount = 0
  const keptLines: string[] = []
  let truncated = false

  for (const line of lines) {
    const lineTokens = estimateTokens(line)
    if (tokenCount + lineTokens > maxTokens) {
      truncated = true
      break
    }
    keptLines.push(line)
    tokenCount += lineTokens
  }

  return {
    content: keptLines.join('\n'),
    truncated
  }
}

export function processFiles(files: { name: string; content: string }[], promptType: string = 'proposal'): ProcessingResult {
  const processedFiles: ProcessedFile[] = []
  let totalTokens = 0

  for (const file of files) {
    const semanticContent = extractSemanticChunks(file.content, promptType)
    const fallbackContent = extractKeyContent(file.content)
    const semanticTokens = estimateTokens(semanticContent)
    const fallbackTokens = estimateTokens(fallbackContent)

    let compressed: string
    let tokens: number

    if (semanticTokens >= 100) {
      compressed = semanticContent
      tokens = semanticTokens
    } else if (fallbackTokens >= 100) {
      compressed = fallbackContent
      tokens = fallbackTokens
    } else {
      compressed = fallbackContent
      tokens = fallbackTokens
    }

    if (tokens > SAFE_CONTEXT_LIMIT) {
      const { content, truncated } = truncateContent(compressed, SAFE_CONTEXT_LIMIT)
      processedFiles.push({
        name: file.name,
        content,
        tokens: estimateTokens(content),
        truncated
      })
      totalTokens += estimateTokens(content)
    } else {
      processedFiles.push({
        name: file.name,
        content: compressed,
        tokens,
        truncated: false
      })
      totalTokens += tokens
    }
  }

  const totalAllTokens = totalTokens
  const exceeded = totalAllTokens > MAX_CONTEXT_TOKENS

  let segmentCount = 1
  if (exceeded) {
    segmentCount = Math.ceil(totalAllTokens / SAFE_CONTEXT_LIMIT)
  }

  return {
    files: processedFiles,
    totalTokens: totalAllTokens,
    exceeded,
    segmentCount
  }
}

export function getFileWarnings(result: ProcessingResult): string[] {
  const warnings: string[] = []

  for (const file of result.files) {
    if (file.truncated) {
      warnings.push(`【${file.name}】内容已截断，原始 token 超过 ${SAFE_CONTEXT_LIMIT}`)
    }
  }

  if (result.exceeded) {
    warnings.push(`总内容 ${result.totalTokens} tokens 超出上下文限制，将分段处理`)
  }

  return warnings
}