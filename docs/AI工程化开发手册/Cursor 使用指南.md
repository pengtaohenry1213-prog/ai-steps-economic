# Cursor 使用指南

## 概述

本指南说明 Cursor 如何接管 workflow-dashboard 初始化完成后的开发阶段。

## 工作划分

| 阶段 | 管理位置 |
|------|----------|
| init（立项） | workflow-dashboard |
| requirement（需求） | workflow-dashboard |
| architecture（架构） | workflow-dashboard |
| initialization（初始化） | workflow-dashboard → Cursor 交接 |
| **development（开发）** | **Cursor** |
| **testing（测试）** | **Cursor** |
| **acceptance（验收）** | **Cursor** |
| **packaging（打包）** | **Cursor** |
| **deployment（部署）** | **Cursor** |
| **operation（运维）** | **Cursor** |
| **iteration（迭代）** | **Cursor** |

## Cursor 启动流程

### 1. 读取 Step 文档

初始化阶段完成后，workflow-dashboard 会生成 Step 文档到 `docs/steps/step{N}.md`。

Cursor 启动时读取最新的 Step 文档：

```
docs/steps/step{N}.md
```

### 2. 执行开发流程

按 `run-step.md` 中的流程执行：

```
Step 0: Human Gate 1（仅 development+ 阶段执行，init~initialization 跳过）
Step 1: 生成 Plan
Step 2: 执行 Plan
Step 3: 实测测试
Step 4: 验收
Step 5: Human Gate 2（仅 testing/acceptance 阶段执行）
Step 6: 最终提交
```

### 3. 规范文档

Cursor 执行时自动遵循 `.cursor/rules/` 中的规范，并参考 `docs/AI工程化开发手册/` 中的详细文档。

## Human Gate 执行规则

| 阶段 | HG1 | HG2 |
|------|-----|-----|
| init ~ initialization | ❌ 不需要 | ❌ 不需要 |
| development | ✅ 需要 | ❌ 不需要 |
| testing | ✅ 需要 | ✅ 需要 |
| acceptance | ✅ 需要 | ✅ 需要 |
| packaging ~ iteration | ❌ 不需要 | ❌ 不需要 |

## 目录约定

- Step 文档：`docs/steps/step{N}.md`
- Plan 文件：`.cursor/plans/step{N}-plan.md`
- 规范文档：`docs/AI工程化开发手册/*.md`
- Cursor 规则：`.cursor/rules/*.mdc`