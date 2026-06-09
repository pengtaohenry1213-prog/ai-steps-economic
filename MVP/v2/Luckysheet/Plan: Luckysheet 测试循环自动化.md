# Plan: Luckysheet 测试循环自动化
  
## Context

用户修改 luckysheet 协作代码后，需要手动执行 pnpm --filter luckysheet-demo run test:e2e，复制粘贴结果给 Claude Code
分析。目标：文件变更 → 自动运行测试 → 失败时自动调用 Claude API 分析 → 结果输出到终端。

---
整体流程

文件保存
  → test-loop.ts（chokidar 监听）
    → 防抖等待 5 秒（debounce）
      → 运行 E2E 测试
        → 测试失败？
          → 调用 Claude API（ANTHROPIC_API_KEY）
            → Claude 分析失败原因
              → 终端输出分析结果

---
 
## 实现文件

1. apps/luckysheet-demo/scripts/test-loop.ts

TypeScript 脚本，功能：

- 使用 chokidar 监听 src/ 和 tests/ 下的 .ts 和 .vue 文件
- 防抖 5 秒（连续变更时，只在最后变更 5 秒后触发）
- 运行 pnpm --filter luckysheet-demo run test:e2e
- 解析 Playwright 输出，提取失败信息
- 测试失败时，调用 Claude API messages.create 接口
- Claude API 返回分析结果，直接 console.log 输出到终端

关键代码逻辑：

```ts
// 监听文件变更
const watcher = chokidar.watch(['src/**/*.ts', 'src/**/*.vue', 'tests/**/*.ts'], {
  persistent: true,
  ignoreInitial: true
})

let debounceTimer: NodeJS.Timeout

watcher.on('all', (event, path) => {
  console.log(`[TestLoop] File changed: ${path}`)
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    runTests()
  }, 5000) // 5 秒防抖
})

async function runTests() {
  console.log('[TestLoop] Running E2E tests...')
  const { stdout, stderr } = await execa('pnpm', ['--filter', 'luckysheet-demo', 'run', 'test:e2e'], {
    all: true,
    reject: false
  })

  const output = stdout + stderr

  if (output.includes('failed') || output.includes('✘')) {
    const failures = parseFailures(output)
    await callClaudeAPI(failures)
  } else {
    console.log('[TestLoop] ✅ All tests passed!')
  }
}

async function callClaudeAPI(failures: string) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await client.messages.create({
    model: 'claude-sonnet-4-7',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `E2E 测试失败了。失败信息：\n\n${failures}\n\n请分析失败原因，给出修复方案。`
    }]
  })
  console.log('\n[Claude 分析结果]\n' + response.content[0].text + '\n')
}
```

1. package.json 新增

```json
 {
   "scripts": {
     "test:loop": "tsx scripts/test-loop.ts"
   },
   "devDependencies": {
     "chokidar": "^4.0.0",
     "tsx": "^4.0.0",
     "@anthropic-ai/sdk": "^0.40.0"
   }
 }
```

---

## 安装依赖

```bash
 cd apps/luckysheet-demo
 pnpm install
```

## 启动测试循环（后台运行）

```bash
 pnpm run test:loop
```

修改任意 .ts 或 .vue 文件后，5 秒自动运行测试，失败时终端显示 Claude 分析结果。

---

## 验证方式

1. 修改 yjsCollab.ts 中任意代码，保存
2. 5 秒后自动运行测试
3. 测试失败时，Claude API 分析并输出到终端

---

待验证前提

- ANTHROPIC_API_KEY 环境变量已设置
- chokidar、tsx、@anthropic-ai/sdk 已安装

## 运行方式

### 终端 1：启动 dev server

```bash
cd /Users/taopeng/workspace/AI_2026/ai-steps-economic/v2/apps/luckysheet-demo
pnpm run dev
```

### 终端 2：启动测试循环（监听文件变更，自动跑测试）

```bash
cd /Users/taopeng/workspace/AI_2026/ai-steps-economic/v2
pnpm --filter luckysheet-demo run test:loop
```