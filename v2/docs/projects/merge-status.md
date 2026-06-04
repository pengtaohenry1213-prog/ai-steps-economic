# 项目合并现状对比 --- 现状描述（告诉你"是什么"）

> W1 产出物 | 生成时间：2026-06-04

---

## 一、项目概览

|维度|项目A (apps/web)|项目B (workflow-dashboard)|
|----|----------------|--------------------------|
|**定位**|AI 策略生成 + 文档生成工具|生命周期管理 + AI 生成仪表板|
|**核心能力**|策略匹配 → 策略增强 → 多级文档生成|立项→需求→架构→初始化 线性流程|
|**生命周期阶段**|6 个核心阶段（合并后）|11 个完整阶段（含运维/迭代）|
|**Human Gate**|无（设计时未强调）|HG1/HG2 双审机制|
|**成熟度**|策略层成熟，UI 较简单|UI 完善，流程细化|
|**数据存储**|localStorage 缓存|Supabase + localStorage|

---

## 二、数据模型对比

### 项目A 核心数据结构

```
EnhancedStrategyResult
├── basicResult: MatchResult
│   ├── strategy: StrategyInfo (id, name)
│   ├── industry: IndustryInfo (id, name)
│   ├── confidence: number
│   └── reasoning: string
├── userInput: string
├── enhancedStrategy: EnhancedStrategy
│   ├── title, definition
│   ├── applicableScenarios / notApplicableScenarios
│   ├── coreCharacteristics / coreConflict
│   ├── phases: PhaseInfo[] (6个阶段)
│   ├── moduleDevModes: ModuleDevMode[]
│   ├── recommendedToolChain
│   └── typicalRisks / successCriteria
└── strategyTemplate / industryArch: string

ProposalDocument / RequirementsDocument / ArchitectureDocument / StepDocument
  └── 各自独立的字段结构
```

**关键差异**：

- A 有独立的 `MatchResult` 匹配结果结构
- A 有 `EnhancedStrategy` 增强策略，包含 6 个 phases
- A 的文档（立项书/需求/架构）各自独立序列化

### 项目B 核心数据结构

```
LifecycleStage
├── id, name, label
├── status: lifecycleStageId
├── steps: string[] (Step ID 列表)
├── proposalContent: ProposalContent
└── feedbackLoop: boolean

Step
├── id, name, stage
├── status: 'pending' | 'in_progress' | 'completed' | 'failed'
├── todos: Todo[]
├── humanGate: { hg1: HumanGate, hg2: HumanGate }
├── lifecycleStageId?: string
└── planFile, createdAt, completedAt

HumanGate
├── type: 'HG1' | 'HG2'
├── pmo: 'PASS' | 'CONDITIONAL' | 'REJECT' | 'pending'
├── security: 'PASS' | 'CONDITIONAL' | 'REJECT' | 'pending'
└── timestamp, reasons

ProposalContent
├── name, type, decisionMakers
├── background, currentIssues, goals
├── scope: { inScope: { P0/P1/P2 }, outScope }
├── acceptance, milestones, risks
└── humanGate, fullText
```

**关键差异**：

- B 有独立的 `LifecycleStage` 管理 11 个阶段
- B 有 `Todo` 任务拆解，细化到前端/后端/测试/修复
- B 有 `HumanGate` 双审机制（H1/HG2）
- B 的 `ProposalContent` 是嵌套在 Stage 里的

---

## 三、核心流程对比

### 项目A 流程

```
用户输入 + 文件上传
    ↓
策略匹配 (matchStrategyWithAIService)
    ↓
策略增强 (enhanceStrategyWithAIService)
    ↓
立项书生成 (generateAllDeliverablesWithAIService)
    ↓
需求文档生成
    ↓
架构文档生成
    ↓
Steps 生成 (generateStepDocumentsFromArchitecture)
    ↓
开发路线生成 (generateStepsDevDocument)
    ↓
打包下载
```

**特点**：

- 策略层是 A 的核心差异化能力
- 文档生成线性串行
- 无 Human Gate 机制

### 项目B 流程

```
用户输入 + 文件上传
    ↓
Init 阶段 → 立项书生成 (HG1)
    ↓
Requirement 阶段 → 需求文档生成 (HG1)
    ↓
Architecture 阶段 → 架构文档生成 (HG1)
    ↓
Initialization 阶段 → 初始化项目 (无 HG)
    ↓
Development 阶段 → 开发 (无 HG)
    ↓
Testing 阶段 → 测试 (HG2)
    ↓
Acceptance 阶段 → 验收 (HG2)
    ↓
Packaging → Deployment → Operation → Iteration
```

**特点**：

- 11 个完整生命周期阶段
- HG1 在 init/requirement/architecture/iteration 入口
- HG2 在 testing/acceptance 出口
- 支持 feedbackLoop 反馈循环

---

## 四、技术栈对比

|维度|项目A|项目B|
|----|----|----|
|**前端框架**|Vue3 + Pinia (推测)|Vue3 + Pinia ✓|
|**AI 调用**|createAIService() 统一入口|ollamaService / aiService 双模式|
|**后端服务**|假设 NestJS（未确认）|无后端，纯前端|
|**数据库**|localStorage|Supabase (proposals, proposal_versions, lifecycle_snapshots)|
|**文件处理**|fileProcessor (压缩/截断)|未确认|
|**配置管理**|aiModels.ts, industryTemplates.ts|aiModels.ts, aiPrompts.ts, industryTemplates.ts|

---

## 五、对外接口对比

### 项目A 接口

```typescript
// AI 服务
generateText(model, prompt, options?)
chatCompletions(messages, model, signal?)

// SDK 函数
matchStrategyWithAIService()
enhanceStrategyWithAIService()
generateAllDeliverablesWithAIService()
generateStepDocumentsFromArchitecture()
formatProposalAsMarkdown() / formatRequirementsAsMarkdown() / formatArchitectureAsMarkdown()
```

### 项目B 接口

```typescript
// AI 服务
generateText(model, prompt, options?)
generateContentByStage(stageId, files, model, signal?)
generateContentByStageStream(stageId, files, model, onChunk, signal?, responseFormat?)

// 提案服务
saveProposal(params) / loadProposal(projectId, stageId)
getProposalHistory(proposalId) / deleteProposal(projectId, stageId)

// 快照服务
saveSnapshot(params) / loadLatestSnapshot(projectId)
deleteAllSnapshots(projectId)
```

---

## 六、合并关键差异点

|差异维度|项目A|项目B|合并建议|
|--------|----|----|--------|
|**生命周期**|6 阶段简模型|11 阶段完整模型|**保留 B 的 11 阶段**，A 的 phases 可映射到 B 的前6个|
|**Human Gate**|无|HG1/HG2 双审|**引入 B 的 HG 机制**到 A 的流程|
|**策略匹配**|A 的核心能力|B 无|✅ **保留 A 的策略匹配/增强作为入口**|
|**任务拆解**|粗粒度 Steps|细化 Todo (前/后/测/修)|合并后**采用 B 的 Todo 粒度**|
|**数据存储**|localStorage|Supabase + localStorage|统一到 **Supabase**（数据持久化更可靠）|
|**文档结构**|独立文档序列化|嵌套在 ProposalContent|统一为 **B 的 ProposalContent 结构**|
|**AI 调用**|单一日志记录|流式生成 + 模型切换|合并为 **B 的双模式 AI 服务**|

---

## 七、3 分钟陈述稿

> 检验标准：能否 3 分钟内讲清楚以下三点

**项目A（apps/web）**：

- 是一个 AI 驱动的文档生成工具，核心是「策略匹配 → 策略增强」能力
- 输入用户需求，自动匹配策略模板、增强后生成立项书→需求→架构→Steps
- 成熟度高的是策略层和数据结构，但 UI 简单，流程只有 6 个阶段

**项目B（workflow-dashboard）**：

- 是一个生命周期管理仪表板，覆盖立项→需求→架构→初始化→开发→测试→验收→打包→部署→运维→迭代共 11 个阶段
- 强项是 Human Gate 双审机制、任务细化（Todo）、UI 交互细节
- 缺战略匹配/增强能力

**合并价值（B→A）**：

- A 保留策略匹配/增强作为入口（核心差异化能力）
- B 的 11 阶段生命周期 + Human Gate 机制补充 A 的流程
- B 的 UI/交互层迁移到 A，实现「皮包骨」——成熟 AI 能力 + 完善交互体验

## 八、从 merge-status.md 可以提炼出这样的功能模块清单

  ┌─────────────────┬──────────┬───────────────────────────────┐
  │      模块       │   来自   │            6R 标签            │
  ├─────────────────┼──────────┼───────────────────────────────┤
  │ 策略匹配        │ 项目A    │ Retain（保留）                │
  ├─────────────────┼──────────┼───────────────────────────────┤
  │ 策略增强        │ 项目A    │ Retain（保留）                │
  ├─────────────────┼──────────┼───────────────────────────────┤
  │ 立项书生成      │ A+B 都有 │ Refactor（合并）              │
  ├─────────────────┼──────────┼───────────────────────────────┤
  │ 需求文档生成    │ A+B 都有 │ Refactor（合并）              │
  ├─────────────────┼──────────┼───────────────────────────────┤
  │ 架构文档生成    │ A+B 都有 │ Refactor（合并）              │
  ├─────────────────┼──────────┼───────────────────────────────┤
  │ Human Gate 双审 │ 项目B    │ Replatform（引入到 A）        │
  ├─────────────────┼──────────┼───────────────────────────────┤
  │ 11 阶段生命周期 │ 项目B    │ Replatform（引入到 A）        │
  ├─────────────────┼──────────┼───────────────────────────────┤
  │ Todo 任务拆解   │ 项目B    │ Replatform（引入到 A）        │
  ├─────────────────┼──────────┼───────────────────────────────┤
  │ AI 双模式服务   │ 项目B    │ Replatform（合并到 A）        │
  ├─────────────────┼──────────┼───────────────────────────────┤
  │ 数据持久化      │ 项目B    │ Repurchase（统一到 Supabase） │
  ├─────────────────┼──────────┼───────────────────────────────┤
  │ UI/交互层       │ 项目B    │ Replatform（迁移到 A）        │
  └─────────────────┴──────────┴───────────────────────────────┘

---
