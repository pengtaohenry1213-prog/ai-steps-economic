# 🤖 AI Code Review Bot（自动审查 PR）工程化方案

目标：

实现一个真正可落地的：

```text
提交PR
   ↓
自动触发 Review Bot
   ↓
分析代码
   ↓
发现问题
   ↓
自动评论PR
   ↓
阻止不合格代码合并
```

适用于：

- Vue3
    
- React
    
- TypeScript
    
- Node.js
    
- Monorepo
    
- Vben Admin
    
- GitHub / GitLab
    

---

# 🧠 一、整体架构（推荐方案）

```text
GitHub PR
   ↓
GitHub Actions
   ↓
AI Review Bot
   ├── ESLint
   ├── TypeScript Check
   ├── AST分析
   ├── LLM分析
   └── 安全扫描
   ↓
生成 Review Comment
   ↓
PR自动评论
```

---

# 📦 二、推荐技术栈（企业级）

|模块|推荐|
|---|---|
|CI|GitHub Actions|
|AST分析|ts-morph|
|代码扫描|ESLint|
|类型检查|TypeScript|
|安全扫描|Semgrep|
|AI分析|OpenAI / Claude|
|PR评论|danger-js|
|Monorepo|pnpm workspace|

---

# 🧱 三、项目结构（推荐）

```text
ai-review-bot/
├── scripts/
│   ├── review.ts
│   ├── analyze.ts
│   ├── prompt.ts
│   ├── comment.ts
│   └── ast/
├── rules/
│   ├── architecture.ts
│   ├── performance.ts
│   ├── security.ts
│   └── vue.ts
├── prompts/
├── reports/
├── .github/workflows/
└── package.json
```

---

# ⚙️ 四、GitHub Action 自动审查

---

# 📌 `.github/workflows/review.yml`

```yaml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: pnpm install

      - run: pnpm lint

      - run: pnpm typecheck

      - run: pnpm test

      - run: pnpm review
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

---

# 🧠 五、Review Bot 核心能力

---

# 📌 5.1 静态规则检查（第一层）

先用规则过滤：

## 检查：

- any
    
- 超长函数
    
- console.log
    
- 魔法数字
    
- deep watch
    
- 超大组件
    
- 重复代码
    

---

# 📌 5.2 AST分析（第二层）

使用：

```bash
ts-morph
```

分析：

- 函数复杂度
    
- import依赖
    
- 循环嵌套
    
- 类型设计
    
- hooks规范
    

---

# 📌 5.3 AI语义分析（第三层）

AI负责：

- 架构合理性
    
- 是否过度设计
    
- 是否符合Vue3最佳实践
    
- 是否存在隐藏风险
    

---

# 🧠 六、AST 自动检测（重点）

---

# 📌 检测 any

```ts
if (node.getText().includes(': any')) {
  issues.push('禁止使用 any');
}
```

---

# 📌 检测超长函数

```ts
if (functionLength > 100) {
  issues.push('函数过长，建议拆分');
}
```

---

# 📌 检测 console.log

```ts
if (source.includes('console.log')) {
  issues.push('禁止提交 console.log');
}
```

---

# 📌 检测 Vue 页面过大

```ts
if (lineCount > 300) {
  issues.push('Vue 页面超过300行');
}
```

---

# 🔐 七、安全扫描（非常重要）

推荐：

## 使用：

```text
Semgrep
```

---

# 📌 检测：

- XSS
    
- SQL注入
    
- token泄漏
    
- innerHTML
    
- eval
    
- 危险依赖
    

---

# 🧩 八、DangerJS 自动评论 PR

---

# 📌 安装

```bash
pnpm add danger -D
```

---

# 📌 dangerfile.ts

```ts
import { danger, fail, warn } from 'danger';

const modifiedFiles = danger.git.modified_files;

if (modifiedFiles.length > 20) {
  warn('PR过大，建议拆分');
}

if (modifiedFiles.some(f => f.includes('any'))) {
  fail('检测到 any 类型');
}
```

---

# 🤖 九、AI Prompt（核心）

---

# 📌 Review Prompt 模板

```text
你是资深前端架构师。

请审查以下PR代码：

重点检查：

1. Vue3最佳实践
2. TypeScript类型安全
3. 性能问题
4. 架构合理性
5. 潜在bug
6. 安全问题
7. 可维护性

输出：

- 问题等级（high/medium/low）
- 问题描述
- 修改建议
```

---

# 🚨 十、必须自动拦截的问题（建议）

---

# High Severity

直接 fail PR：

- any
    
- eval
    
- innerHTML
    
- console.log
    
- 未处理Promise
    
- 超长函数
    
- 循环依赖
    

---

# Medium Severity

warn：

- 复杂 if-else
    
- 重复逻辑
    
- 组件过大
    
- magic number
    

---

# 📊 十一、Review评分体系（推荐）

---

# 自动评分

```text
100 - 完美
80+ - 可合并
60+ - 需优化
60以下 - 拒绝
```

---

# 示例：

|项目|分数|
|---|---|
|类型安全|20|
|架构设计|20|
|性能|20|
|安全|20|
|可维护性|20|

---

# 🧠 十二、Vue3 专项规则（你重点）

---

# 检查：

- setup规范
    
- hooks拆分
    
- watch滥用
    
- computed缓存
    
- store污染
    
- 页面逻辑过重
    

---

# 🚀 十三、推荐最终组合（最强）

---

# 企业级推荐：

```text
ESLint
 + 
TypeScript
 +
Semgrep
 +
DangerJS
 +
AI Review
 +
GitHub Actions
```

---
