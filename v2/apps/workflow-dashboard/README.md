# AI 驱动开发工作台 (Workflow Dashboard)

可视化工作流管理工具，用于监控和管理 AI 驱动开发流程。

## 功能特性

| 模块 | 说明 |
|------|------|
| **整体进度** | 顶部展示开发→测试→验收→打包→部署 5个阶段进度 |
| **Step 列表** | 管理所有 step，支持按状态筛选（全部/待开始/进行中/已完成） |
| **Todo 图谱** | Kahn 拓扑排序可视化，展示任务依赖关系和执行顺序 |
| **Human Gate** | HG1/HG2 双审机制，PMO + Security 分别决策 |
| **Agent 日志** | 实时展示 Planner/Frontend/Backend/Test/Reviewer 执行日志 |
| **状态持久化** | localStorage 自动保存刷新不丢失 |

## 技术栈

- Vue 3 + Composition API
- Pinia（状态管理）
- Element Plus（UI 组件库）
- Vite（构建工具）
- TypeScript

## 快速开始

```bash
cd v2/apps/workflow-dashboard
npm install
npm run dev
```

访问 <http://localhost:3001>

## 使用指南

### 1. 创建 Step

1. 点击左侧「新建」按钮
2. 填写 Step ID、名称、Stage
3. 点击确定

### 2. 管理 Todos

在 Step 详情页：

1. 点击「添加 Todo」创建任务
2. 填写 Todo 的：
   - **ID**: 唯一标识（如 `todo-1`）
   - **类型**: frontend / backend / test / fix
   - **内容**: 任务描述
   - **依赖**: 依赖的其他 Todo ID

3. 系统自动计算拓扑排序，确定执行顺序

### 3. Human Gate 审批

**HG1（执行前审查）**：

- PMO 决策：检查背景/目标/验收标准
- Security 决策：检查安全/合规/权限

**HG2（执行后复审）**：

- PMO 决策：检查验收标准是否满足
- Security 决策：检查结果/日志

决策选项：PASS / CONDITIONAL / REJECT

### 4. 反馈循环

```
开发 → 测试 → 验收 → 打包 → 部署
  ↑                              │
  └──────── 发现问题 ←────────────┘
```

任一阶段发现问题，都回到开发重新修复。

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
```

## 与 Cursor 的配合

1. 在 Cursor 中执行 step 文件
2. 在 Dashboard 中手动同步状态（未来可自动化）
3. 监控 Human Gate 审批进度
4. 查看 Agent 执行日志

## 文件结构

```
src/
├── views/
│   ├── StepList.vue      # Step 列表
│   └── StepDetail.vue    # Step 详情
├── components/
│   ├── TodoGraph.vue     # Todo 依赖图
│   ├── AgentLog.vue      # Agent 日志
│   ├── HumanGatePanel.vue # Human Gate 面板
│   └── ProgressBar.vue    # 进度条
├── stores/
│   └── workflowStore.ts   # Pinia 状态管理
└── types/
    └── index.ts          # TypeScript 类型
```
