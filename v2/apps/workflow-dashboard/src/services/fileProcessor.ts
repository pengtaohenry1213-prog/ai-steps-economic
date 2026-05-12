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

export function processFiles(files: { name: string; content: string }[]): ProcessingResult {
  const processedFiles: ProcessedFile[] = []
  let totalTokens = 0

  for (const file of files) {
    const compressed = extractKeyContent(file.content)
    const tokens = estimateTokens(compressed)

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