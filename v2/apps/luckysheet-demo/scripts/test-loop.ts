/**
 * Luckysheet 测试循环自动化脚本
 *
 * 功能：
 * - chokidar 监听 src/ 和 tests/ 下的 .ts / .vue 文件变更
 * - 防抖 5 秒（连续变更时，只在最后变更 5 秒后触发）
 * - 自动运行 pnpm --filter luckysheet-demo run test:e2e
 * - 测试失败时调用 Claude API 分析失败原因，输出到终端
 *
 * 运行：pnpm --filter luckysheet-demo run test:loop
 * 前置：ANTHROPIC_API_KEY 环境变量已设置
 */

import { watch, FSWatcher } from 'chokidar'
import { spawn } from 'child_process'

const WATCH_PATTERNS = [
  'src/**/*.ts',
  'src/**/*.vue',
  'tests/**/*.ts',
  'tests/**/*.vue'
]

const DEBOUNCE_MS = 5000

let watcher: FSWatcher | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let isRunning = false

// ─── 文件监听 ────────────────────────────────────────────────────────────────

function startWatching() {
  console.log('[TestLoop] 🚀 监听文件变更中...')
  console.log('[TestLoop] 模式：文件变更后 5 秒防抖，然后运行 E2E 测试')
  console.log('[TestLoop] 按 Ctrl+C 停止\n')

  watcher = watch(WATCH_PATTERNS, {
    persistent: true,
    ignoreInitial: true,
    cwd: process.cwd()
  })

  watcher.on('all', (event, filePath: string) => {
    if (isRunning) {
      console.log(`[TestLoop] ⏳ 测试运行中，跳过变更: ${filePath}`)
      return
    }
    console.log(`[TestLoop] 📝 文件变更: ${filePath}（${DEBOUNCE_MS / 1000}s 后触发测试）`)
    debounce()
  })

  watcher.on('error', (err) => {
    console.error('[TestLoop] ❌ 监听错误:', err)
  })
}

function debounce() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    runTests()
  }, DEBOUNCE_MS)
}

// ─── 测试运行 ────────────────────────────────────────────────────────────────

async function runTests(): Promise<void> {
  if (isRunning) return
  isRunning = true

  console.log('\n[TestLoop] 🎬 运行 E2E 测试...\n')

  const startTime = Date.now()

  return new Promise((resolve) => {
    let output = ''

    const child = spawn('pnpm', ['--filter', 'luckysheet-demo', 'run', 'test:e2e'], {
      cwd: process.cwd(),
      timeout: 300000
    })

    child.stdout?.on('data', (data) => {
      output += data.toString()
    })

    child.stderr?.on('data', (data) => {
      output += data.toString()
    })

    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1)

      if (code === 0) {
        console.log(`[TestLoop] ✅ 测试全部通过（${duration}s）`)
      } else {
        const failures = extractFailures(output)
        console.log(`[TestLoop] ❌ 测试失败（${duration}s）`)
        callClaudeAPI(failures).then(resolve).catch(resolve)
        return
      }
      isRunning = false
      resolve()
    })

    child.on('error', (err) => {
      console.error('[TestLoop] ❌ 测试执行异常:', err)
      isRunning = false
      resolve()
    })
  })
}

// ─── 失败信息提取 ────────────────────────────────────────────────────────────

function extractFailures(output: string): string {
  // 提取 Playwright 失败的关键信息
  const lines = output.split('\n')
  const failureLines: string[] = []
  let inFailure = false

  for (const line of lines) {
    if (line.includes('✘') || line.includes('failed')) {
      inFailure = true
    }
    if (inFailure) {
      failureLines.push(line)
      if (line.trim() === '' || failureLines.length > 60) {
        break
      }
    }
  }

  return failureLines.join('\n').slice(0, 3000) // 限制长度
}

// ─── Claude API 分析 ─────────────────────────────────────────────────────────

async function callClaudeAPI(failures: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[TestLoop] ⚠️ ANTHROPIC_API_KEY 未设置，跳过 Claude 分析')
    console.log('\n--- 失败信息（手动分析）---')
    console.log(failures)
    console.log('--- 失败信息结束 ---\n')
    return
  }

  console.log('\n[TestLoop] 🤖 调用 Claude API 分析中...\n')

  try {
    const { Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-7-20250605',
      max_tokens: 1536,
      messages: [
        {
          role: 'user',
          content: `Luckysheet E2E 测试失败了，请分析失败原因并给出修复方案。

失败信息：
\`\`\`
${failures}
\`\`\`

相关文件路径：
- apps/luckysheet-demo/src/services/yjsCollab.ts
- apps/luckysheet-demo/src/components/LuckysheetWrapper.vue
- apps/luckysheet-demo/tests/e2e/collab-scenarios.test.ts

请直接给出修复代码，不需要解释。`
        }
      ]
    })

    console.log('\n══════════════════════════════════════════════')
    console.log('🤖 Claude 分析结果：')
    console.log('══════════════════════════════════════════════')
    console.log(response.content[0].text)
    console.log('══════════════════════════════════════════════\n')
  } catch (err) {
    console.error('[TestLoop] ❌ Claude API 调用失败:', err)
    console.log('\n--- 失败信息（Claude 调用失败）---')
    console.log(failures)
    console.log('--- 失败信息结束 ---\n')
  }
}

// ─── 入口 ────────────────────────────────────────────────────────────────────

function stop() {
  console.log('\n[TestLoop] 👋 停止监听')
  if (watcher) {
    watcher.close()
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  process.exit(0)
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)

startWatching()
