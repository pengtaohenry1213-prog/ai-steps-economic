# AI 驱动开发工作台 (Workflow Dashboard)

可视化工作流管理工具，用于监控和管理 AI 驱动开发流程。

---

## 背景故事：为什么有这个工具

### 起源：从一次真实的项目升级说起

2025 年，我们团队接到了一个经济模型项目的升级任务。当时的痛点很典型：

1. **AI 生成代码质量不可控** - AI 一次生成整个系统，bug 多、维护性差
2. **Human-in-the-loop 缺失** - AI 输出直接上线，没人审核
3. **上下文丢失** - 过一段时间回头看，不知道 AI 为什么这么设计
4. **迭代失控** - 改一个地方引出三个新 bug

### 解决方案：分块 + Human Gate

我们探索出一套"小步快跑"的方法：

```
前期文档准备 → 技术选型 → 项目搭建 → step1.md ~ stepN.md 分块AI开发 → Human Gate验收
```

**核心思想**：

- 把大系统拆成 **step1.md、step2.md...** 每个 step 是一个**可闭环的小功能**
- AI 只专注于完成一个小功能，**降低了上下文复杂度**
- 每个 step 完成后必须经过 **PM/PMO 审批**，AI 不再"自由发挥"
- 发现问题及时 **feedback loop**，不让 bug 传到下一阶段

### 产品化：Workflow Dashboard

`workflow-dashboard` 就是这套方法论的**系统化实现**：

- 把文档模式的 step（N 个 .md 文件）变成**可视化的状态管理**
- 把人工记录的审批流程变成**自动化的 Human Gate 面板**
- 把散落的反馈变成**结构化的 Feedback Loop 机制**

> 简单来说：它是一个 **AI 开发的"驾驶舱"**，让你看到 AI 在做什么、做到哪一步了、卡在哪里了。

---

## 全生命周期阶段

Workflow Dashboard 管理的是一个**完整的产品开发生命周期**，不是单纯的技术流程，而是**业务+技术双驱动**的流程：

| 阶段 | 名称 | 核心产出 | 负责人 |
|------|------|----------|--------|
| **init** | 立项目 | 立项书（AI 生成） | 项目发起人 |
| **requirement** | 需求分析 | 需求补充文档 + 差距分析 | 产品经理 |
| **architecture** | 架构设计 | 架构设计文档 + step1.md~stepN.md | 技术负责人 |
| **initialization** | 项目初始化 | 项目脚手架（代码框架） | Tech Lead |
| **development** | 开发执行 | 可运行的代码 | 开发者/AI |
| **testing** | 测试验证 | 测试计划 + 测试报告 | 测试工程师 |
| **acceptance** | 验收确认 | 验收报告 | PMO |
| **packaging** | 打包发布 | 发布包 | 运维 |
| **deployment** | 部署上线 | 运行中的系统 | 运维 |
| **operation** | 运营支持 | 监控/运维文档 | 运营 |

### 流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                        全生命周期流程                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   init → requirement → architecture → initialization            │
│     │          │              │               │                   │
│     │          │              │               │                   │
│     └──────────┴──────────────┴───────────────┘                   │
│                         │                                        │
│                         ▼                                        │
│              ┌─────────────────────┐                            │
│              │   development        │                            │
│              │   (step1~stepN)     │                            │
│              └─────────┬───────────┘                            │
│                        │                                        │
│                        ▼                                        │
│              ┌─────────────────────┐                            │
│              │   feedback loop     │◄─────────────────────┐     │
│              │   (测试/验收发现问题) │                      │     │
│              └─────────┬───────────┘                      │     │
│                        │                                 │     │
│                        ▼                                 │     │
│   ┌──────────────────────────────────────────────────┐   │     │
│   │  testing → acceptance → packaging → deployment   │───┘     │
│   └──────────────────────────────────────────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Human Gate 双审机制

每个关键阶段都需要经过 **Human Gate（人工门控）** 审批：

- **HG1（执行前审查）**：检查背景/目标/验收标准是否合理
- **HG2（执行后复审）**：检查产出物是否满足要求

审批角色：

- **PMO**：项目管理办公室，检查业务/管理合规性
- **Security**：安全负责人，检查安全/合规/权限

决策选项：`PASS` / `CONDITIONAL` / `REJECT`

---

## Step 文档体系

### 什么是 Step

**Step** 是开发任务的最小执行单元。每个 Step 对应一个**可闭环的小功能**，比如：

- Step 1: vxe-table 封装，支持双击编辑
- Step 2: HyperFormula 公式引擎集成
- Step 3: 模型版本管理 CRUD

### Step 文档格式（stepN.md）

每个 Step 的详细说明保存在 `docs/steps/step1.md` 等文件中：

```markdown
# Step 1: vxe-table 封装

## 任务目标
- v1复用量：40%
- 核心功能：vxe-table封装，支持双击编辑、虚拟滚动
- 用户交互：用户可通过双击单元格进入编辑模式
- 数据流转：编辑 → 校验 → 保存 → 刷新

## 里程碑映射
- M1: 表格渲染（Day 5）

## 约束条件
- 遵循前端工程化 SOP（Vue3 + TS）
- 遵循数据库设计规范
- 遵循安全工程规范

## 验收标准
### 功能验收
- [ ] vxe-table表格渲染正确，支持树形展示
- [ ] Mock数据正确加载，显示3个模型+3个版本

### 性能验收
| 指标 | 标准 |
|------|------|
| 表格加载 | <2s（1000行数据） |
| 公式计算 | <100ms（100个公式） |

### 安全验收
- [ ] 敏感数据字段脱敏
- [ ] 操作日志记录

## 涉及文件
- src/views/vxe-table(catalog).vue
- src/api/model.ts
- src/stores/modelStore.ts

## 前置依赖
- 无

## 风险提示
- 【高】HyperFormula与v1公式语法不兼容：逐一验证，编写兼容层
```

### Step 与 Dashboard 的关系

| 产物 | 存储位置 | 说明 |
|------|----------|------|
| Step 文档 | `v2/dev/{projectName}/docs/steps/stepN.md` | AI 开发的执行指南 |
| 状态管理 | Workflow Dashboard (Pinia/localStorage) | 可视化监控 |
| 审批记录 | Workflow Dashboard (Human Gate Panel) | 双审追溯 |

---

## 功能特性

| 模块 | 说明 |
|------|------|
| **整体进度** | 顶部展示全生命周期 10 个阶段进度 |
| **Stage 卡片** | 每个阶段独立卡片，显示状态、开始时间、产出物 |
| **Step 列表** | 管理所有 step，支持按状态筛选（全部/待开始/进行中/已完成） |
| **Todo 图谱** | Kahn 拓扑排序可视化，展示任务依赖关系和执行顺序 |
| **Human Gate** | HG1/HG2 双审机制，PMO + Security 分别决策 |
| **AI 分析** | 基于立项书进行需求差距分析，给出补充建议 |
| **反馈循环** | 测试/验收/打包/部署阶段发现问题，自动回到开发阶段 |
| **Agent 日志** | 实时展示 Planner/Frontend/Backend/Test/Reviewer 执行日志 |
| **状态持久化** | localStorage + Supabase 快照，刷新不丢失 |

---

## 技术栈

- Vue 3 + Composition API
- Pinia（状态管理）
- Element Plus（UI 组件库）
- Vite（构建工具）
- TypeScript
- Supabase（数据持久化 + RLS）

---

## 快速开始

```bash
cd v2/apps/workflow-dashboard
npm install
npm run dev
```

访问 <http://localhost:3001>

---

## 使用指南

### 1. 全生命周期流程

**立项目（init）**：
1. 上传项目相关文档（产品路线图、需求描述等）
2. AI 分析文档，生成立项书
3. Human Gate 审批（PMO + Security）
4. 审批通过后进入需求阶段

**需求阶段（requirement）**：
1. AI 基于立项书进行**差距分析**
2. 结合用户上传的补充文档（竞品分析、用户调研等）
3. 生成需求补充文档
4. Human Gate 审批

**架构阶段（architecture）**：
1. AI 基于需求文档生成架构设计
2. 自动拆分为 `step1.md` ~ `stepN.md`
3. 每个 Step 包含：任务目标、里程碑、约束条件、验收标准、风险提示
4. Human Gate 审批

**初始化阶段（initialization）**：
1. AI 基于架构文档和 Step 文档生成项目脚手架
2. 输出：`v2/dev/{projectName}/` 目录结构
3. 包含：package.json、Cursor Rules、docs/steps/ 等

**开发阶段（development）**：
1. 按照 Step 文档顺序执行开发
2. 每个 Step 是一个可闭环的小功能
3. Human Gate 双审（HG1 前置审查 → HG2 后置复审）

### 2. 创建 Step

1. 点击左侧「新建」按钮
2. 填写 Step ID、名称、Stage
3. 点击确定

### 3. 管理 Todos

在 Step 详情页：

1. 点击「添加 Todo」创建任务
2. 填写 Todo 的：
   - **ID**: 唯一标识（如 `todo-1`）
   - **类型**: frontend / backend / test / fix
   - **内容**: 任务描述
   - **依赖**: 依赖的其他 Todo ID

3. 系统自动计算拓扑排序，确定执行顺序

### 4. Human Gate 审批

**HG1（执行前审查）**：

- PMO 决策：检查背景/目标/验收标准
- Security 决策：检查安全/合规/权限

**HG2（执行后复审）**：

- PMO 决策：检查验收标准是否满足
- Security 决策：检查结果/日志

决策选项：PASS / CONDITIONAL / REJECT

### 5. 反馈循环

```
开发 → 测试 → 验收 → 打包 → 部署
  ↑                              │
  └──────── 发现问题 ←────────────┘
```

任一阶段发现问题，都回到开发重新修复。

---

## 数据结构

```typescript
interface Step {
  id: string              // step-test
  name: string            // 欢迎页面功能
  stage: string           // Stage1
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  todos: Todo[]
  humanGate: {
    hg1: { pmo: GateDecision, security: GateDecision }
    hg2: { pmo: GateDecision, security: GateDecision }
  }
  createdAt: string
}

interface Todo {
  id: string              // todo-1
  type: 'frontend' | 'backend' | 'test' | 'fix'
  content: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  depends_on: string[]     // ['todo-1']
}

interface LifecycleStage {
  id: string              // 'init' | 'requirement' | 'architecture' | ...
  name: string             // '立项目' | '需求阶段' | ...
  label: string            // 'Stage 1' | 'Stage 2' | ...
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  steps: string[]         // step IDs
  proposalContent: ProposalContent
  feedbackLoop: boolean    // 是否触发反馈循环
  startTime: string
  endTime: string
}
```

---

## 与 Cursor 的配合

### 开发工作流

1. **架构阶段**：Dashboard 自动生成 `docs/steps/step1.md` ~ `stepN.md`
2. **开发阶段**：在 Cursor 中打开 `v2/dev/{projectName}/` 目录
3. **执行开发**：按照 step 顺序，一个一个完成，每个 step 都是一个可闭环的小功能
4. **状态同步**：在 Dashboard 中手动更新 step 状态（未来计划自动化）
5. **Human Gate**：每个 step 完成后在 Dashboard 中提交 PMO + Security 审批

### 推荐的 Cursor Rules

项目初始化时会自动生成以下 Cursor Rules：
- `tech-lead.mdc` - 技术决策规范
- `frontend-vue3.mdc` - 前端规范（Vue3 + TypeScript）
- `backend.mdc` - 后端规范（NestJS + TypeORM）
- `database.mdc` - 数据库规范（PostgreSQL + RLS）
- `security-rules.md` - 安全规范

---

## 文件结构

```
src/
├── views/
│   ├── LifecycleDashboard.vue  # 全生命周期总览
│   ├── StepList.vue            # Step 列表
│   └── StepDetail.vue          # Step 详情
├── components/
│   ├── TodoGraph.vue           # Todo 依赖图（Kahn 拓扑排序）
│   ├── AgentLog.vue            # Agent 执行日志
│   ├── HumanGatePanel.vue      # Human Gate 审批面板
│   ├── GapAnalysisViewer.vue   # 需求差距分析结果
│   ├── DocumentEditor.vue      # 文档编辑器（结构化）
│   ├── DocumentEditorSimple.vue # 文档编辑器（Markdown）
│   └── ModelSelector.vue       # AI 模型选择
├── stores/
│   ├── lifecycleStore.ts       # 全生命周期状态
│   └── workflowStore.ts        # Step/Todo 状态
├── services/
│   ├── aiService.ts            # AI 服务封装
│   ├── ollamaService.ts        # Ollama 本地模型
│   ├── supabaseClient.ts       # Supabase 客户端
│   └── projectGenerator.ts     # 项目脚手架生成
├── config/
│   ├── aiPrompts.ts            # AI Prompt 配置
│   └── industryTemplates.ts   # 行业标准模板
└── types/
    └── index.ts                # TypeScript 类型定义
```

---

## 与原方法论的关系

### 兼容"轻量文件模式"

如果你不想用 Dashboard，也可以继续使用原始的**文件模式**：

```
v2/dev/{projectName}/
├── docs/
│   └── steps/
│       ├── step1.md
│       ├── step2.md
│       └── stepN.md
├── src/
│   └── ...
└── .cursor/
    └── rules/
        └── ...
```

每个 `stepN.md` 就是一个小功能的执行指南，AI 按顺序执行，Human Gate 审批可以手动记录。

### Dashboard 是文件模式的"增强版"

| 特性 | 文件模式 | Dashboard 模式 |
|------|----------|----------------|
| 状态管理 | 手动（Markdown/Excel） | 可视化（Pinia） |
| 审批流程 | 手动记录 | 自动化面板 |
| 依赖可视化 | 文本描述 | Kahn 图谱 |
| 反馈循环 | 口头传达 | 结构化触发 |
| 历史追溯 | 散落文件 | 集中存储 |

两者**可以并存**：Dashboard 的状态实际上是从 `docs/steps/stepN.md` 解析出来的，反过来，你也可以手动编辑 `stepN.md` 然后刷新 Dashboard。

---

## 常见问题

### Q: Human Gate 审批可以跳过吗？

不建议。Human Gate 是质量保证的关键环节。如果强制跳过，Dashboard 会记录"未审批"，影响后续阶段的判断。

### Q: Feedback Loop 触发后会发生什么？

当 testing/acceptance/packaging/deployment 任一阶段标记为"失败"时：
1. 该阶段会被标记为 `feedbackLoop: true`
2. `currentStage` 自动跳回 `development`
3. 开发者重新修复问题，完成后再次流转

### Q: 支持哪些 AI 模型？

- **本地模型**：Ollama（deepseek-r1、qwen2.5 等）
- **外网模型**：OpenAI API（GPT-4、GPT-4o 等）

可在 Dashboard 的模型选择器中切换。

---

## 附录：参考规范

- [前端工程化 SOP（Vue3 + TS + Vben Admin）](../../docs/AI工程化开发手册/前端工程化 SOP（Vue3 + TS + Vben Admin）.md)
- [后端工程化 SOP（Node.js + NestJS）](../../docs/AI工程化开发手册/后端工程化 SOP（Node.js + NestJS）.md)
- [数据库设计规范（AI 工程化版）](../../docs/AI工程化开发手册/数据库设计规范（AI 工程化版）.md)
- [安全工程规范（AI 工程化版）](../../docs/AI工程化开发手册/安全工程规范（AI 工程化版）.md)