# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI 工程化开发项目，采用 AI 工程化流程规范。代码主体位于 `v2/` 目录，是一个 pnpm monorepo。

## 技术栈

- **前端**：Vue3 + TypeScript + Vben Admin + Element Plus
- **后端**：Node.js + Express（Ollama 服务）
- **SDK 包**：strategy-core、lifecycle-core、ai-service
- **数据库**：PostgreSQL + Supabase
- **AI 集成**：Ollama / OpenAI 兼容 API

## 快速命令（v2 目录）

```bash
cd v2

# 安装依赖
pnpm install

# 构建所有 SDK 包
pnpm run build

# 开发 web 应用（端口 5173）
pnpm run dev

# 类型检查
pnpm run typecheck

# 测试
pnpm run test
```

## 单个包命令

```bash
# 构建单个 SDK
pnpm --filter @ai-toolkit/strategy-core run build
pnpm --filter @ai-toolkit/lifecycle-core run build
pnpm --filter @ai-toolkit/ai-service run build

# 运行单个包的测试
pnpm --filter @ai-toolkit/strategy-core run test
pnpm --filter @ai-toolkit/ai-service run test

# 运行 example 测试脚本
pnpm --filter @ai-toolkit/strategy-core run test:example

# 开发 ollama-server
cd v2/services/ollama-server && pnpm run dev
```

## 架构

### Monorepo 结构

```
v2/
├── apps/
│   ├── web/                  # Vue3 主应用（策略匹配 UI）
│   └── workflow-dashboard/   # Vue3 仪表盘（已bak）
├── packages/
│   ├── strategy-core/        # 策略匹配核心 SDK
│   ├── lifecycle-core/       # 生命周期管理 SDK
│   ├── ai-service/           # AI 服务抽象层（支持 Ollama/OpenAI）
│   └── ai-adapter/          # AI 适配器实现
└── services/
    └── ollama-server/        # Express HTTP API（Ollama 代理）
```

### 核心 SDK 设计

- **strategy-core**：开发策略智能匹配，包含策略定义、行业分类、分阶段规划
- **lifecycle-core**：项目生命周期管理，包含阶段定义、步骤追踪
- **ai-service**：统一 AI 客户端接口，支持 `configureLLMClient()` 注入

### AI 适配器架构

`ai-service` 使用适配器模式，`clients/` 目录下实现具体的 AI 提供者：

```typescript
// 使用时注入真实客户端
import { configureLLMClient } from '@ai-toolkit/ai-service'
```

### 数据库

Supabase PostgreSQL，schema 文件位于 `v2/apps/web/` 根目录：
- `01_create_proposals.sql`
- `02_create_versions.sql`
- `03_create_indexes.sql`
- `04_enable_rls.sql`
- `05_create_snapshots.sql`

## AI 开发流程

使用 `.cursor/prompts/` 中的模板执行 Human Gate 双审流程：

```bash
/run-all step1    # 全自动执行
/planner step1    # 规划模块
/frontend step1    # 前端模块
/backend step1     # 后端模块
/test step1       # 测试模块
/reviewer step1    # 审查模块
```

## Cursor 规则

关键规则位于 `.cursor/rules/`：
- `coding-standards.md` - 代码标准（单一职责、DRY、类型安全等）
- `git-commit-rules.mdc` - Commit 格式 `{type}(stepN): {todo-id} {描述}`
- `backend.mdc` - 后端开发规范
- `frontend-vue3.mdc` - Vue3 前端规范

## 安全红线

- ❌ 禁止使用 `any` 类型
- ❌ 禁止硬编码密钥
- ❌ 禁止 SQL 字符串拼接
- ❌ 禁止 localStorage 存储 token
- ❌ 禁止直接返回 Entity 给前端
- ❌ 禁止 `console.log`

## 项目状态

维护 `PROJECT_STATE.md` 跟踪当前阶段、问题状态和下一步。
