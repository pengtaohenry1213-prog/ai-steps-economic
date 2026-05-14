# AI 工程化开发手册 - 使用指南

## 概述

AI 工程化开发手册是项目全生命周期开发规范的总览，涵盖 12 个阶段（init → iteration），为 AI 辅助开发提供标准化约束。

## 文档体系

### 规范文档（docs/AI工程化开发手册/）

| 分类 | 文档 | 用途 |
|------|------|------|
| 前端 | 前端工程化 SOP（Vue3 + TS + Vben Admin）.md | Vue3 + TypeScript 前端开发规范 |
| 后端 | 后端工程化 SOP（Node.js + NestJS）.md | Node.js/NestJS 后端分层架构 |
| 数据库 | 数据库设计规范（AI 工程化版）.md | 表设计、索引、迁移管理 |
| 安全 | 安全工程规范（AI 工程化版）.md | JWT、加密、SQL/XSS/CSRF 防护 |
| 安全 | AI安全审查清单.md | 16 类安全检查项 |
| 测试 | Bug 排查 SOP（AI 工程化开发版）.md | 问题定位与修复流程 |
| 代码质量 | AI生成代码审查清单.md | AI 生成代码质量审查 |
| Git | Git 规范（AI 工程化开发版）.md | 提交规范、分支策略 |
| 流程 | 12阶段与规范映射.md | 阶段与规范完整对应关系 |

### AI 行为约束（.cursor/rules/）

| 文件 | 约束内容 |
|------|----------|
| frontend-vue3.mdc | Vue3 前端开发必须遵循规范 |
| backend.mdc | Node.js/NestJS 后端开发必须遵循规范 |
| database.mdc | 数据库设计必须遵循规范 |
| security-rules.md | 安全开发必须遵循规范 |
| TEST.mdc | 测试任务必须遵循规范 |
| git-commit-rules.mdc | Git 提交必须遵循规范 |
| reviewer.mdc | Review 必须遵循审查清单 |
| troubleshoot-issues.mdc | 问题排查必须遵循 SOP |
| deploy-rules.mdc | 部署前必须完成安全检查 |

### AI 执行模板（.cursor/prompts/）

| 文件 | 用途 |
|------|------|
| frontend-agent.md | 前端任务 AI 执行模板 |
| backend-agent.md | 后端任务 AI 执行模板 |
| test-agent.md | 测试任务 AI 执行模板 |

## 12 阶段与规范映射

| 阶段 | 主要规范 |
|------|----------|
| init | 需求文档模板 |
| requirement | 需求分析 SOP |
| architecture | 前端/后端/数据库/安全 SOP |
| initialization | 环境搭建规范 |
| development | 前端/后端/数据库/安全 SOP + 代码审查清单 + Bug 排查 SOP |
| testing | Bug 排查 SOP + AI安全审查清单 |
| acceptance | 验收标准检查 |
| packaging | 打包规范 |
| deployment | 安全工程规范（部署检查） |
| operation | 运维手册 |
| iteration | 迭代管理 |

## 使用方式

### 1. AI 阅读 CLAUDE.md

Claude Code 启动时读取项目根目录的 `CLAUDE.md`，其中引用了所有规范文档路径。

### 2. Cursor 规则自动加载

在 `.cursor/rules/` 目录下的 `.mdc` 文件会被 Cursor 自动加载，AI 在执行相关任务时自动遵循规范引用。

### 3. workflow-dashboard 集成

workflow-dashboard 的 `STAGE_SPECS` 将每个阶段与规范文档动态关联，查看 Step 详情时会显示当前阶段相关的规范文档列表。

### 4. Human Gate 审批

Human Gate 1（HG1）和 Human Gate 2（HG2）双角色审批时，PMO 和 Security 需对照相关规范进行审查决策。

## 规范引用格式

在 .cursor/rules 文件中，统一使用以下格式引用规范文档：

```markdown
## 规范约定（引用）

**详细规范文档**：`docs/AI工程化开发手册/xxx.md`
```

## 更新维护

- 新增规范文档时，同步更新 `CLAUDE.md` 和 `STAGE_SPECS`
- 新增 .cursor/rules 文件时，在顶部 frontmatter 添加 description
- 定期对照 `12阶段与规范映射.md` 检查完整性