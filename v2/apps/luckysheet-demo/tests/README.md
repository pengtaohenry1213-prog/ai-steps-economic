# Luckysheet 协作测试套件

> 本目录包含 Luckysheet 多人协作功能的单元测试和 E2E 测试。

## 目录结构

```
tests/
├── unit/
│   └── yjsCollab.test.ts      # yjsCollab.ts 单元测试（Vitest）
├── e2e/
│   └── collab-scenarios.test.ts # 多人协作场景 E2E 测试（Playwright）
└── README.md                   # 本文档
```

## 测试框架

- **单元测试**：Vitest（`vitest`）
- **E2E 测试**：Playwright（`@playwright/test`）

## 快速开始

### 1. 安装依赖

```bash
cd apps/luckysheet-demo
pnpm add -D vitest @playwright/test
pnpm add -D @vitest/ui # 可选：Vitest UI
```

### 2. 配置 Vitest

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.test.ts']
  }
})
```

### 3. 配置 Playwright

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:5173',
    headless: true
  },
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI
  }
})
```

### 4. 运行测试

```bash
# 单元测试
pnpm --filter luckysheet-demo run test:unit

# E2E 测试
pnpm --filter luckysheet-demo run test:e2e

# 同时运行所有测试
pnpm --filter luckysheet-demo run test
```

## 测试场景覆盖

### 单元测试（yjsCollab.test.ts）

| 测试用例 | 描述 | 对应场景 |
|---------|------|---------|
| `connect()创建provider` | 调用 connect() 后 provider 不为 null | 基础 |
| `disconnect()销毁provider` | disconnect() 后 connected=false | 基础 |
| `disconnect后重建provider` | 断开后再次 connect 应正常重建 | 基础 |
| `重复connect不重复创建` | 重复调用 connect() 应直接返回 | 基础 |
| `setCellValue/getCellValue` | 设置后立即读取返回值一致 | 基础 |
| `多单元格互不影响` | 不同单元格设置值互不干扰 | 基础 |
| `getAllCellValues` | 获取所有单元格值 Map | 基础 |
| `LWW冲突拦截` | 本地 clock>=远程时远程写入被丢弃 | P0 |
| `awareness用户列表` | awareness change 时正确解析用户 |基础 |
| `awareness null守卫` | provider销毁后 awareness 事件不抛错 | Bug Fix |
| `onUsersChange回调` | 用户列表变化时触发回调 | 基础 |
| `onCellChange回调` | 单元格变化时触发回调 | 基础 |
| `getDebugInfo` | 返回正确的调试信息 | 基础 |
| `全局单例行为` | disconnect 后单例重置 | 基础 |

### E2E 测试（collab-scenarios.test.ts）

| 测试用例 | 描述 | 对应文档场景 |
|---------|------|------------|
| `场景A：单格编辑冲突` | A修改→B加入→A值不被覆盖 | A/H (P0) |
| `场景C：公式同步` | A设公式→B加入→B显示公式 | C (P1) |
| `场景D：结构变化` | A插入行→B表格不错位 | D (P1) |
| `场景I：状态持久化` | 刷新后状态保留（预期失败） | I (P2) |
| `场景J：协作期间导入` | 导入文件无数据残留 | J (已知风险) |
| `场景K：协作期间导出` | 导出内容与UI一致 | K (✅已实现) |
| `网络闪断重连` | 断网后自动重连，数据不丢失 | 缺失场景 |
| `用户列表感知` | B加入→A看到B的用户色块 | 基础 |
| `断开协作UI重置` | 断开后按钮/状态恢复 | 基础 |

##已知问题（测试预期失败）

以下测试用例对应文档中标记为 ⚠️ 的问题，测试预期失败（标记为 `console.log` 而非 `expect`）：

| 测试 | 问题 | 优先级 |
|------|------|-------|
| `场景A` | A修改→B加入→A值被覆盖 | P0 |
| `场景C` | 公式同步为文本 | P1 |
| `场景D` | 插入行导致key错位 | P1 |
| `场景I` | Y.Doc状态不持久化 | P2 |
| `场景J` | destroy后yCells未清空 | 已知风险 |
| `网络闪断` | 自动重连行为未知 | 缺失场景 |

## 报告问题

测试发现与预期不符时：

1. 检查 `console.log` 输出（E2E 测试中的诊断日志）
2. 查看 `ws://localhost:4444` signaling server 是否运行
3. 确认 `pnpm run dev`启动无报错
4. 查看浏览器 DevTools Console 中的 `[Yjs]` 日志