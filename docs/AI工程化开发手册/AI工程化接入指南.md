# AI工程化接入指南

本文档说明如何将 `docs/AI工程化开发手册/` 的规范体系与 `.cursor/` Agent 系统结合使用，实现真正的 AI 工程化开发。

---

# 一、规范体系架构

```
ai-steps-economic/
├── docs/
│   └── AI工程化开发手册/          # 规范知识库（人类可读）
│       ├── 前端工程化 SOP.md
│       ├── 后端工程化 SOP.md
│       ├── 数据库设计规范.md
│       ├── 安全工程规范.md
│       └── ...
│
├── .cursor/
│   ├── rules/                    # AI 行为规则（AI 必须遵守）
│   │   ├── backend.mdc
│   │   ├── frontend-vue3.mdc
│   │   ├── security.mdc
│   │   └── ...
│   ├── prompts/                  # AI 执行模板
│   │   ├── 00-run-all.md
│   │   ├── pm-human-gate.md
│   │   └── ...
│   └── settings.json             # 角色配置
│
├── CLAUDE.md                     # Claude Code 项目根配置
└── ...
```

### 各部分职责

| 目录 | 职责 | 使用者 |
|------|------|--------|
| `docs/AI工程化开发手册/` | 详细规范说明、场景描述、模板 | 人类（PM、开发者）|
| `.cursor/rules/` | AI 写代码的强制规则 | AI 工具（Cursor/Claude）|
| `.cursor/prompts/` | AI 任务执行的流程模板 | AI 工具 |
| `CLAUDE.md` | 告诉 AI 在哪里找规范 | Claude Code |

---

# 二、如何在新项目中使用

---

## 2.1 项目初始化

### Step 1：复制规范目录

```bash
# 在新项目根目录
mkdir -p docs/AI工程化开发手册
# 复制规范文档到新项目
```

### Step 2：配置 Cursor Roles

在 `.cursor/settings.json` 中确保有：

```json
{
  "cursorrules": {
    "rules": {
      "Backend Agent": {
        "rules": [".cursor/rules/backend.mdc"]
      },
      "Security Agent": {
        "rules": [".cursor/rules/security.mdc"]
      }
    }
  }
}
```

### Step 3：配置 Claude Code

在项目根目录创建 `CLAUDE.md`（见下一节）

---

## 2.2 日常工作流

```
需求/任务
    ↓
PM 编写 stepN.md
    ↓
Human Gate 1（PMO + Security 评审）
    ↓
Cursor/Claude 执行开发
    ↓
AI 自动读取 .cursor/rules/ 中的规范
    ↓
代码生成
    ↓
Human Gate 2（结果验收）
    ↓
Git 提交
```

---

# 三、Cursor/Claude Code 如何对接规范

Cursor/Claude Code 如何使用

  1. Cursor：会自动加载 .cursor/rules/*.mdc 中的规则
  2. Claude Code：会自动读取项目根目录的 CLAUDE.md
  3. Human Gate：通过 .cursor/prompts/ 中的模板执行

---

## 3.1 Cursor 使用规范文档

在 `.cursor/rules/` 中的规则文件会**自动被 Cursor 加载**。

当你切换到特定 Agent 角色时，对应的规则文件会被激活：

| Agent 角色 | 激活的规则文件 | 对应规范文档 |
|-----------|--------------|-------------|
| Frontend Agent | `frontend-vue3.mdc` | `前端工程化 SOP.md` |
| Backend Agent | `backend.mdc` | `后端工程化 SOP.md` |
| Security Agent | `security.mdc` | `安全工程规范.md` |

---

## 3.2 Claude Code 使用规范文档

Claude Code **不会自动读取** `.cursor/rules/`。

需要在项目根目录创建 `CLAUDE.md`：

```markdown
# 项目规范

本项目使用 AI 工程化开发流程。

## 技术栈

- 前端：Vue3 + TypeScript
- 后端：Node.js + NuxtJS
- 数据库：PostgreSQL/Supabase

## 规范文档

开发规范位于 `docs/AI工程化开发手册/`：

- [前端工程化 SOP](./docs/AI工程化开发手册/前端工程化%20SOP（Vue3%20+%20TS%20+%20Vben%20Admin）.md)
- [后端工程化 SOP](./docs/AI工程化开发手册/后端工程化%20SOP（Node.js%20+%20NestJS）.md)
- [数据库设计规范](./docs/AI工程化开发手册/数据库设计规范（AI%20工程化版）.md)
- [安全工程规范](./docs/AI工程化开发手册/安全工程规范（AI%20工程化版）.md)

## AI 开发要求

1. 开发前先阅读对应技术栈的 SOP 文档
2. 严格遵循规范中的分层架构
3. 代码必须通过安全审查
4. 遵循 Human Gate 双审流程

## Human Gate 流程

```

需求评审 → 执行前 Gate1 → 开发 → 测试 → Gate2 → 验收

```

详细流程见 `.cursor/prompts/00-run-all.md`
```

---

# 四、Human Gate 与规范配合

---

## 4.1 Human Gate 流程

```
┌─────────────────────────────────────────────┐
│  🔴 Human Gate 1（执行前）                    │
│  PMO + Security 评审                         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  执行 Step → 生成产物                         │
│  Planner → Frontend → Backend → Test        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  🟢 Human Gate 2（执行后）                    │
│  PMO + Security 复审                         │
└─────────────────────────────────────────────┘
```

---

## 4.2 各阶段对应的规范

| 阶段 | 使用的规范 | 审核要点 |
|------|-----------|---------|
| 需求评审 | `Prompt 模板库.md` | 需求是否清晰、是否可执行 |
| 执行前 Gate1 | `安全工程规范.md` | 是否有安全风险、是否合规 |
| 开发 | `前端/后端 SOP` | 代码是否符合规范 |
| 测试 | `测试工程化` 相关 | 测试覆盖率、边界情况 |
| 执行后 Gate2 | `AI生成代码审查清单.md` | 结果是否符合预期 |

---

# 五、规范文档与规则文件的对应关系

---

## 5.1 完整对应表

| 规范文档 | AI 规则文件 | 说明 |
|---------|------------|------|
| `前端工程化 SOP.md` | `frontend-vue3.mdc` | 前端开发规则 |
| `后端工程化 SOP（Node.js + NestJS）.md` | `backend.mdc` | 后端开发规则 |
| `数据库设计规范.md` | `database.mdc` | 数据库设计规则 |
| `安全工程规范.md` | `security.mdc` | 安全开发规则 |
| `AI生成代码审查清单.md` | `reviewer.mdc` | 代码审查规则 |
| `Bug 排查 SOP.md` | `troubleshoot-issues.mdc` | 问题排查规则 |
| `Git 规范.md` | `git-commit-rules.mdc` | Git 提交规则 |
| `Cursor 使用规范.md` | - | 人类使用指南 |
| `Claude Code 工作流.md` | - | 人类使用指南 |

---

## 5.2 规则文件更新流程

当 `docs/AI工程化开发手册/` 中的规范更新时：

```markdown
规范文档更新
    ↓
同步更新对应 .cursor/rules/*.mdc
    ↓
在 CHANGELOG.md 记录
```

---

# 六、快速开始清单

---

## 新项目初始化

- [ ] 1. 复制 `docs/AI工程化开发手册/` 到项目
- [ ] 2. 配置 `.cursor/settings.json` 角色映射
- [ ] 3. 创建 `CLAUDE.md` 引用规范
- [ ] 4. 创建 `PROJECT_STATE.md` 跟踪状态
- [ ] 5. 配置 `.gitignore`（包含 `.env`、`.cursor/rules` 等）

## 日常工作

- [ ] 1. 开始前阅读 `PROJECT_STATE.md`
- [ ] 2. 使用 `Human Gate` 流程评审
- [ ] 3. AI 开发时自动加载对应规则
- [ ] 4. 开发后使用审查清单自检
- [ ] 5. 提交前运行 `eslint`、`typecheck`

---

# 七、常见问题

---

## Q1：Cursor 和 Claude Code 有什么区别？

| 工具 | 特点 | 适用场景 |
|------|------|---------|
| Cursor | 更适合小步修改、实时协作 | 单个组件、单页开发 |
| Claude Code | 更适合架构分析、长上下文 | 中大型项目、重构 |

---

## Q2：rules 文件和 prompts 文件有什么区别？

| 文件类型 | 作用 | 示例 |
|---------|------|------|
| `.rules/*.mdc` | **约束 AI 怎么写代码** | 禁止使用 any、必须分层 |
| `.prompts/*.md` | **告诉 AI 怎么执行任务** | Human Gate 模板、角色定义 |

---

## Q3：规范文档更新后需要做什么？

1. 更新 `docs/AI工程化开发手册/` 中的 Markdown 文档
2. 同步更新 `.cursor/rules/` 中对应的 `.mdc` 文件
3. 在项目群/文档中通知团队
4. 记录到 CHANGELOG

---

# 八、总结

> **规范文档** 是人类可读的知识库
> **规则文件** 是 AI 必须遵守的行为准则
> **两者配合** = 真正的 AI 工程化开发

核心原则：

1. **文档先行** - 开发前先读规范
2. **规则内化** - AI 自动遵守规则
3. **Human Gate** - 关键节点人工审核
4. **持续迭代** - 规范和规则同步更新

---
