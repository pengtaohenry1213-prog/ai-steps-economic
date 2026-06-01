# 12 阶段全生命周期与 AI 工程化规范映射

## 阶段与规范完整映射表

| 阶段 | 阶段名称 | 主要活动 | 对应规范文档 | Cursor Rules | Human Gate |
|------|---------|---------|-------------|-------------|------------|
| 1 | **立项** | 可行性分析、竞品调研 | `Prompt 模板库.md` | PM.mdc, tech-lead.mdc | HG1 |
| 2 | **需求** | PRD 生成、需求整理 | `Prompt 模板库.md`<br>`AI工程化团队规范.md` | PM.mdc | HG1 |
| 3 | **架构** | 系统设计、技术选型 | `前端工程化 SOP.md`<br>`后端工程化 SOP.md`<br>`数据库设计规范.md` | tech-lead.mdc | HG1 |
| 4 | **初始化** | 项目骨架、代码规范 | `前端工程化 SOP.md`<br>`Cursor 使用规范.md` | frontend-vue3.mdc<br>backend.mdc | - |
| 5 | **开发** | 前端组件、API 开发 | **全套 SOP 重点** | rules/*.mdc | - |
| 6 | **测试** | AI 专项测试、集成测试 | `Bug 排查 SOP.md`<br>`AI安全审查清单.md` | TEST.mdc | HG2 |
| 7 | **验收** | 验收文档生成 | `Prompt 模板库.md` | reviewer.mdc | HG2 |
| 8 | **打包** | Dockerfile、依赖扫描 | `安全工程规范.md` | security-rules.md | - |
| 9 | **部署** | 多环境部署 | `Vercel 部署规范.md` | deploy-rules.mdc | - |
| 10 | **运维** | 日志分析、监控告警 | `Bug 排查 SOP.md` | troubleshoot-issues.mdc | - |
| 11 | **迭代** | 需求收集、优化实现 | `Git 规范.md` | git-commit-rules.mdc | HG1 |

## 各阶段规范详解

### 阶段 1：立项（Init）

**活动**：市场可行性、竞品调研、收益评估

**规范引用**：
- `Prompt 模板库.md` - 市场分析 Prompt、竞品分析 Prompt
- `AI工程化团队规范.md` - 团队角色定义

**Cursor Rules**：
- `PM.mdc` - 产品经理规则
- `tech-lead.mdc` - 技术负责人规则

**Human Gate**：HG1（PMO + Security 评审）

---

### 阶段 2：需求（Requirement）

**活动**：PRD 生成、需求整理、业务方确认

**规范引用**：
- `Prompt 模板库.md` - PRD 生成 Prompt、需求分析 Prompt
- `AI工程化团队规范.md` - Prompt 分层（业务/工程/架构）

**Cursor Rules**：
- `PM.mdc` - 产品经理规则
- `PMO.mdc` - PMO 规则

**Human Gate**：HG1（需求评审）

---

### 阶段 3：架构（Architecture）

**活动**：系统架构设计、AI 模块设计、全栈方案设计

**规范引用**：
- `前端工程化 SOP.md` - 前端目录结构、组件规范
- `后端工程化 SOP.md` - 后端分层、API 规范
- `数据库设计规范.md` - 表设计、索引、迁移
- `安全工程规范.md` - 安全架构设计

**Cursor Rules**：
- `tech-lead.mdc` - 架构设计规则
- `frontend-vue3.mdc` - Vue3 规范
- `backend.mdc` - 后端规范
- `security-rules.md` - 安全规则

**Human Gate**：HG1（技术评审）

---

### 阶段 4：初始化（Initialization）

**活动**：项目骨架搭建、代码规范制定、Cursor Rules 配置

**规范引用**：
- `前端工程化 SOP.md` - 项目目录标准
- `Cursor 使用规范.md` - Cursor 正确使用方式
- `Claude Code 工作流.md` - Claude Code 工作流
- `Git 规范.md` - 仓库初始化

**Cursor Rules**（会自动从 `.cursor/rules/` 加载）：
- `frontend-vue3.mdc` - 前端规则
- `backend.mdc` - 后端规则
- `database.mdc` - 数据库规则
- `security-rules.md` - 安全规则

**输出**：可直接运行的项目骨架

---

### 阶段 5：开发（Development）

**活动**：前端组件开发、API 接口开发

**规范引用**（全部需要）：

| 文档 | 用途 |
|------|------|
| `前端工程化 SOP.md` | Vue3 + TS 规范、组件拆分 |
| `后端工程化 SOP.md` | NestJS 分层、DTO、异常处理 |
| `数据库设计规范.md` | ORM 使用、迁移管理 |
| `安全工程规范.md` | JWT、加密、SQL 注入防护 |
| `AI生成代码审查清单.md` | 代码审查 10 大类 |
| `Bug 排查 SOP.md` | 证据链排查法 |
| `Git 规范.md` | 分支策略、Commit 规范 |

**Cursor Rules**：

| Agent | 规则文件 | 对应规范 |
|-------|---------|---------|
| Frontend | `frontend-vue3.mdc` | `前端工程化 SOP.md` |
| Backend | `backend.mdc` | `后端工程化 SOP.md` |
| Database | `database.mdc` | `数据库设计规范.md` |
| Security | `security-rules.md` | `安全工程规范.md` |
| Reviewer | `reviewer.mdc` | `AI生成代码审查清单.md` |

**Human Gate**：无（开发阶段 Continuous）

---

### 阶段 6：测试（Testing）

**活动**：AI 专项测试、单元测试、集成测试

**规范引用**：
- `Bug 排查 SOP.md` - 证据链排查、边界测试
- `AI安全审查清单.md` - 安全测试、渗透测试
- `后端工程化 SOP.md` - 测试部分（单元测试覆盖率>70%）

**Cursor Rules**：
- `TEST.mdc` - 测试规则
- `security-rules.md` - 安全测试

**Human Gate**：HG2（测试验收）

---

### 阶段 7：验收（Acceptance）

**活动**：验收文档生成、用户手册

**规范引用**：
- `Prompt 模板库.md` - 文档生成部分（PRD/架构/测试计划）
- `AI工程化团队规范.md` - 文档自动生成

**Cursor Rules**：
- `reviewer.mdc` - 审查规则

**Human Gate**：HG2（PMO + Security 复审）

---

### 阶段 8：打包（Packaging）

**活动**：Dockerfile 编写、依赖安全扫描

**规范引用**：
- `安全工程规范.md` - 依赖漏洞、敏感信息
- `Vercel 部署规范.md` - 部署配置

**Cursor Rules**：
- `security-rules.md` - 安全扫描规则
- `deploy-rules.mdc` - 部署规则

---

### 阶段 9：部署（Deployment）

**活动**：多环境部署、本地调试

**规范引用**：
- `Vercel 部署规范.md` - 环境配置、部署流程
- `Git 规范.md` - 环境分支管理

**Cursor Rules**：
- `deploy-rules.mdc` - 部署规则

---

### 阶段 10：运维（Operation）

**活动**：日志分析、监控告警、热更新

**规范引用**：
- `Bug 排查 SOP.md` - 日志分析、根因定位
- `安全工程规范.md` - 安全监控

**Cursor Rules**：
- `troubleshoot-issues.mdc` - 问题排查规则

---

### 阶段 11：迭代（Iteration）

**活动**：需求收集、优化方案、开发实现

**规范引用**：
- `Git 规范.md` - 分支策略、Commit 规范
- `Prompt 模板库.md` - 需求分析 Prompt

**Cursor Rules**：
- `git-commit-rules.mdc` - Git 提交规则

**Human Gate**：HG1（新需求评审）

## 技术栈与规范对应

| 技术栈 | 主要规范文档 |
|-------|------------|
| Vue3 + TS | `前端工程化 SOP.md` + `frontend-vue3.mdc` |
| NestJS + TypeORM | `后端工程化 SOP.md` + `backend.mdc` |
| PostgreSQL | `数据库设计规范.md` + `database.mdc` |
| 安全 | `安全工程规范.md` + `security-rules.md` |
| 测试 | `Bug 排查 SOP.md` + `TEST.mdc` |

## Human Gate 与规范配合

### HG1（执行前审查）

| 检查项 | 对应规范 |
|-------|---------|
| 安全扫描 | `安全工程规范.md` |
| 合规校验 | `AI安全审查清单.md` |
| 质量校验 | `前端/后端 SOP.md` |

### HG2（执行后验收）

| 检查项 | 对应规范 |
|-------|---------|
| 结果校验 | `AI生成代码审查清单.md` |
| 安全复审 | `AI安全审查清单.md` |
| 日志校验 | `Bug 排查 SOP.md` |

## 快速索引

### 想查规范？找这里：

1. **前端规范** → `docs/AI工程化开发手册/前端工程化 SOP.md`
2. **后端规范** → `docs/AI工程化开发手册/后端工程化 SOP.md`
3. **数据库** → `docs/AI工程化开发手册/数据库设计规范.md`
4. **安全** → `docs/AI工程化开发手册/安全工程规范.md`
5. **测试/Bug** → `docs/AI工程化开发手册/Bug 排查 SOP.md`
6. **代码审查** → `docs/AI工程化开发手册/AI生成代码审查清单.md`
7. **安全审查** → `docs/AI工程化开发手册/AI安全审查清单.md`
8. **Cursor 用法** → `docs/AI工程化开发手册/Cursor 使用规范.md`
9. **Claude Code** → `docs/AI工程化开发手册/Claude Code 工作流.md`
10. **Prompt 模板** → `docs/AI工程化开发手册/Prompt 模板库.md`
11. **Git 规范** → `docs/AI工程化开发手册/Git 规范.md`
12. **接入指南** → `docs/AI工程化开发手册/AI工程化接入指南.md`
