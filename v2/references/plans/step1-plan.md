# step1-plan.md

> Plan 文件 — step1 前端初始化查漏补缺
> 生成时间：2026-03-28
> 角色：Frontend

---

## 背景

根据 `doc/steps/step1.md` 规格对 `packages/frontend/` 项目进行现状核对，发现核心文件（路由、Pinia、Axios、入口、页面组件）均已存在，但目录结构和配置文件存在缺漏。

---

## Gap 分析

| # | 问题 | 规格来源 |
|---|------|----------|
| 1 | `src/api/` 目录不存在 | step1.md：「按 views / components / utils / api 分层搭建目录结构」 |
| 2 | `src/types/` 目录不存在 | step1.md：目录结构要求 types/ |
| 3 | `src/components/` 目录不存在 | step1.md：目录结构要求 components/ |
| 4 | 无 `.env.example` | 前端规范要求环境变量示例文件 |
| 5 | 无 ESLint / Prettier 配置 | `frontend.mdc`：「以项目 ESLint / Prettier 配置为准」 |
| 6 | `vite-env.d.ts` 无 `@` 类型声明 | 补全 Vite 环境变量类型，避免 any 警告 |

---

## Todos

- [x] 创建 `src/api/`、`src/types/`、`src/components/` 空目录（带 .gitkeep）
- [x] 创建 `.env.example` 环境变量示例
- [x] 创建 `.eslintrc.cjs`（Vue3 + TS + Prettier 规则）
- [x] 创建 `.prettierrc`（2 空格、引号风格与 AI_Coding_Style.md 一致）
- [x] 补充 `vite-env.d.ts` 的 `VITE_API_BASE_URL` 类型声明

---

## 验收标准

1. `src/` 下所有规格要求的子目录（api、types、components、utils、store、router、views）均存在
2. `.env.example` 存在于 `packages/frontend/` 根目录
3. ESLint + Prettier 配置文件存在且规则与 AI_Coding_Style.md 一致
4. `vite-env.d.ts` 包含环境变量类型声明，无 `any`
5. 所有改动汇总为一条 `chore:` commit

---

## 变更文件清单

| 文件 | 操作 |
|------|------|
| `packages/frontend/src/api/.gitkeep` | 新建 |
| `packages/frontend/src/types/.gitkeep` | 新建 |
| `packages/frontend/src/components/.gitkeep` | 新建 |
| `packages/frontend/.env.example` | 新建 |
| `packages/frontend/.eslintrc.cjs` | 新建 |
| `packages/frontend/.prettierrc` | 新建 |
| `packages/frontend/src/vite-env.d.ts` | 编辑（补充 ImportMetaEnv） |
