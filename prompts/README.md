# AI 代码工具 + Step 驱动开发 + 多 Agent 协作

## 核心定位

基于 AI 代码工具（Cursor）构建的自动化开发系统，通过 **Step 驱动开发** + **多 Agent 自动执行** + **Human Gate 双审** + **自验证闭环**，实现高效项目开发。

## 系统规范

- Spec Coding 文档规范
- Human Gate 评审规范
- AI 代码工具规范

---

## 📋 核心模板体系

系统聚焦 **规划、执行、排查、复盘** 4 类核心场景：

| 序号 | 场景 | 模板 |
|------|------|------|
| 1 | 做整体规划 | `plan-template.md` |
| 2 | 写单步任务 | `step-template.md` |
| 3 | 需求不清晰 | 需求澄清模板 |
| 4 | 写技术方案 | 技术方案设计模板 |
| 5 | 排查问题失败 | 故障排查模板 |
| 6 | 对比方案优劣 | 多方案对比模板 |
| 7 | 代码规范审查 | 代码审查模板 |
| 8 | 项目总结优化 | 项目复盘模板 |

---

## 🚀 运行模式

### 1. 一键运行（全自动模式）

一次性完成全流程自动执行，无需人工干预：

```bash
/run-all step1
```

**AI 自动完成**：Human Gate 1 → 生成 Plan → 分工执行 → 编写代码 → 自动化测试 → 代码审查 → Human Gate 2 → 验收

### 2. 调试模式（单步精准调试）

针对指定模块单独执行，方便开发调试：

```bash
/planner step1    # 规划模块
/frontend step1   # 前端模块
/backend step1     # 后端模块
/test step1       # 测试模块
/reviewer step1    # 审查模块
```

---

## 🔄 Human Gate 双 Gate 流程

```plaintext
┌─────────────────────────────────────────────────────────────┐
│  PM 制定 Plan + Step                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  🔴 Human Gate 1（执行前）                                    │
│  PMO + Security 评审                                         │
│  - 安全扫描、权限校验、脱敏审计                                 │
│  - 质量校验：可执行、可验收、可回溯                             │
│  结果：PASSED / REJECTED / WARNING                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  执行 Step → 生成产物                                         │
│  Planner → Frontend → Backend → Test → Reviewer             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  🟢 Human Gate 2（执行后）                                    │
│  PMO + Security 复审                                         │
│  - 结果校验：无漏洞、无敏感数据                                 │
│  - 日志校验：操作已记录、可追溯                                 │
│  结果：ACCEPTED / ROLLBACK                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Prompts 角色文件

| 文件 | 角色 | 说明 |
|------|------|------|
| `01-planner.md` | Planner Agent | 生成 Plan |
| `frontend.mdc` | Frontend Agent | 前端开发（规则文件） |
| `03-backend.md` | Backend Agent | 后端开发 |
| `04-test.md` | Test Agent | 测试验证 |
| `05-reviewer.md` | Reviewer Agent | 代码审查 |
| `pm-human-gate.md` | PM Human Gate | 需求评审 |
| `pmo-human-gate-prompt.md` | PMO Human Gate | 项目管理评审 |
| `security-human-gate.md` | Security Human Gate | 安全评审 |
| `tech-lead-human-gate.md` | Tech Lead Human Gate | 技术评审 |
| `test-human-gate.md` | Test Human Gate | 测试评审 |
| `plan-step-human-gate.md` | PM+PMO+Security Gate | 组合 Gate |
| `security-hard-rules.prompt.md` | Security 硬规则 | 安全禁令 |
| `00-run-all.md` | AI Tech Lead | 总控 Agent |
| `run-step.md` | 自动化开发 Agent | 单步执行 |
| `execute-plan.md` | 执行型 AI Agent | 执行 Plan |

---

## 📋 当前完整角色体系

### 开发角色

| 角色 | 规则文件 |
|------|----------|
| Planner Agent | `planner.mdc` |
| Frontend Agent | `frontend.mdc` |
| Backend Agent | `backend.mdc` |
| Test Agent | `TEST.mdc` |
| Reviewer Agent | `reviewer.mdc` |
| Fix Agent | `fix.mdc` |

### 产品/管理角色

| 角色 | 规则文件 |
|------|----------|
| PM Agent | `PM.mdc` |
| PMO Agent | `PMO.mdc` |
| Tech Lead Agent | `tech-lead.mdc` |

### Human Gate 角色

| 角色 | 规则文件 |
|------|----------|
| PM Human Gate Agent | `pm-human-gate.md` |
| PMO Human Gate Agent | `pmo-human-gate-prompt.md` |
| Security Human Gate Agent | `security-human-gate.md` |
| Tech Lead Human Gate Agent | `tech-lead-human-gate.md` |
| Test Human Gate Agent | `test-human-gate.md` |
| Reviewer Human Gate Agent | `review-gate.mdc` |

### 技术栈角色

| 角色 | 规则文件 |
|------|----------|
| React Agent | `react.mdc` |
| Vue3 Agent | `frontend-vue3.mdc` |
| Next.js Agent | `fullstack-react-nextjs.mdc` |
| FastAPI Python Agent | `fastapi-python.mdc` |
| Flask Python Agent | `flask-python.mdc` |
| Go Agent | `go.mdc` |
| Java Agent | `java.mdc` |
| PHP Agent | `php.mdc` |
| Android Agent | `android.mdc` |
| Chrome Extension Agent | `chrome-extension.mdc` |
| DBA Agent | `DBA.mdc` |
| Fullstack Agent | `fullstack.mdc` |

### 专项角色

| 角色 | 规则文件 |
|------|----------|
| UI Agent | `UI.mdc` |
| UX Agent | `UX.mdc` |
| Deploy Agent | `deploy-rules.mdc` |
| Security Agent | `security-rules.md` |
| Spec Coding Agent | `spec-coding.mdc` |
| Troubleshooting Agent | `troubleshoot-issues.mdc` |

---

## 🎯 核心价值

```
本系统 = Step 驱动开发 + 多 Agent 自动执行 + Human Gate 双审 + 自验证闭环
```
