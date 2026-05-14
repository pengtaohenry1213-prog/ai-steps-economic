# AI 工程化开发项目

本项目使用 AI 工程化开发流程，采用 `docs/AI工程化开发手册/` 规范体系。

---

## 技术栈

- 前端：Vue3 + TypeScript + Vben Admin
- 后端：Node.js + NestJS + TypeORM
- 数据库：PostgreSQL
- AI 工具：Cursor / Claude Code

---

## 开发规范

所有开发规范位于 `docs/AI工程化开发手册/`：

| 文档 | 内容 |
|------|------|
| `前端工程化 SOP（Vue3 + TS + Vben Admin）.md` | 前端目录结构、组件规范、TypeScript 规范 |
| `后端工程化 SOP（Node.js + NestJS）.md` | 后端分层、DTO 规范、异常处理 |
| `数据库设计规范（AI 工程化版）.md` | 表设计、索引、迁移管理 |
| `安全工程规范（AI 工程化版）.md` | JWT、加密、SQL注入防护 |
| `AI安全审查清单.md` | 安全检查项、漏洞修复 |
| `AI生成代码审查清单.md` | 代码审查 10 大类 |
| `Git 规范（AI 工程化开发版）.md` | 分支策略、Commit 规范 |
| `Bug 排查 SOP（AI 工程化开发版）.md` | 证据链排查法 |
| `Cursor 使用规范（AI 工程化开发版）.md` | Cursor 正确使用方式 |
| `Claude Code 工作流（工程化 AI 开发版）.md` | Claude Code 工作流 |

---

## AI 开发流程

### Human Gate 双审流程

```
需求评审
    ↓
🔴 Human Gate 1（执行前审查）
    ↓
执行开发：Planner → Frontend → Backend → Test → Reviewer
    ↓
🟢 Human Gate 2（执行后验收）
    ↓
Git 提交
```

### AI 任务执行

使用 `.cursor/prompts/` 中的模板：

```bash
/run-all step1    # 全自动执行
/planner step1    # 规划模块
/frontend step1    # 前端模块
/backend step1     # 后端模块
/test step1       # 测试模块
/reviewer step1    # 审查模块
```

详细流程见 `.cursor/prompts/00-run-all.md`

---

## 项目状态管理

维护 `PROJECT_STATE.md` 跟踪项目状态：

```markdown
当前阶段：
当前功能：
已完成：
当前问题：
禁止修改：
下一步：
```

---

## 开发要求

1. **开发前**：先阅读对应技术栈的 SOP 文档
2. **开发中**：严格遵循分层架构规范
3. **提交前**：
   - ESLint 检查通过
   - TypeScript 类型检查通过
   - 测试覆盖率 > 70%
4. **安全**：AI 生成代码必须通过安全审查清单

---

## 目录结构

```
ai-steps-economic/
├── docs/
│   └── AI工程化开发手册/      # 规范文档（19个）
├── .cursor/
│   ├── rules/                 # AI 行为规则
│   ├── prompts/               # Agent 执行模板
│   └── settings.json          # 角色配置
├── src/                       # 源代码
└── PROJECT_STATE.md           # 项目状态
```

---

## 快速命令

```bash
# 代码检查
npm run lint

# 类型检查
npm run typecheck

# 测试
npm run test

# 构建
npm run build
```

---

## 安全红线（AI 禁止）

- ❌ 禁止使用 `any` 类型
- ❌ 禁止硬编码密钥
- ❌ 禁止 SQL 字符串拼接
- ❌ 禁止 localStorage 存储 token
- ❌ 禁止直接返回 Entity 给前端
- ❌ 禁止 console.log

---

更多信息见 `docs/AI工程化开发手册/AI工程化接入指南.md`
