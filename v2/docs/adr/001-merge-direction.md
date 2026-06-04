# ADR-001: 合并 v2/apps/web 和 v2/apps/workflow-dashboard

> W2 产出物 | 生成时间：2026-06-04

---

## 状态

**已接受**

---

## 上下文

### 项目现状

两个项目功能重叠但数据结构不同：

| 项目 | 定位 | 成熟度 | 核心优势 |
|------|------|--------|---------|
| 项目A (apps/web) | AI 策略生成 + 文档生成 | 高（策略层） | 策略匹配/增强能力 |
| 项目B (workflow-dashboard) | 生命周期管理仪表板 | 中（UI层） | Human Gate 双审、11阶段生命周期、细化 Todo |

### 数据结构差异

- **项目A**：独立文档结构（ProposalDocument / RequirementsDocument / ArchitectureDocument），localStorage 缓存
- **项目B**：嵌套 ProposalContent 结构，Supabase + localStorage 持久化

### 合并诉求

项目A 成熟的 AI 策略能力需要被复用，项目B 的 UI 和流程细节需要被整合。

---

## 决策

**采用 B → A 合并方向**：将项目B 的功能迁移到项目A，保留项目A 的策略匹配/增强能力作为统一入口。

### 具体决策

| 模块 | 合并策略 | 说明 |
|------|----------|------|
| 策略匹配 | **Retain** | 保留作为统一入口，核心差异化能力 |
| 策略增强 | **Retain** | 保留， 为后续文档生成提供增强上下文 |
| UI/交互层 | **Replatform** | 从 B 迁移到 A |
| Human Gate 双审 | **Replatform** | 引入 B 的 HG1/HG2 到 A |
| Todo 任务拆解 | **Replatform** | 引入 B 的细化粒度到 A |
| 11 阶段生命周期 | **Replatform** | 引入 B 的完整生命周期到 A |
| AI 双模式服务 | **Replatform** | 合并 B 的 Ollama/OpenAI 双模式到 A |
| 提案/快照服务 | **Replatform** | 迁移 B 的服务层，适配 A 数据模型 |
| 文档生成（立项/需求/架构） | **Refactor** | 统一为 B 的 ProposalContent 结构 |
| 数据持久化 | **Repurchase** | 统一从 localStorage 升级到 Supabase |

### 数据流设计

```
用户输入
    ↓
策略匹配 (Retain) → 策略增强 (Retain)
    ↓
立项书生成 (Refactor) → B 的 ProposalContent 结构
    ↓
需求文档生成 (Refactor) → ProposalContent.requirement
    ↓
架构文档生成 (Refactor) → ProposalContent.architecture
    ↓
11阶段生命周期 (Replatform) + Human Gate (Replatform) + Todo (Replatform)
    ↓
数据持久化 (Repurchase) → Supabase
```

---

## 后果

### 正面影响

1. **保留核心能力**：A 的策略匹配/增强作为统一入口，不被破坏
2. **流程规范**：引入 B 的 Human Gate 双审机制，提升质量管控
3. **完整生命周期**：从 6 阶段扩展到 11 阶段，覆盖运维/迭代
4. **数据可靠**：localStorage → Supabase，持久化更可靠
5. **UI 体验**：复用 B 完善的交互细节

### 负面影响

1. **数据迁移成本**：A 的 localStorage 数据需要迁移到 Supabase
2. **schema 统一**：A 的独立文档结构需要重构为 B 的嵌套 ProposalContent
3. **学习曲线**：团队需要熟悉新的生命周期模型

---

## 替代方案

### 方案一：A → B（已否决）

将项目A 迁移到项目B。

**否决理由**：

- A 的策略匹配/增强是核心差异化能力，迁移到 B 需要大动数据结构
- A 的数据结构已成熟，重构风险高
- B 的 UI 层相对独立，不应该为了"皮"牺牲"骨"

### 方案二：共存（各自独立维护）（已否决）

**否决理由**：

- 维护两套代码库，成本翻倍
- 策略匹配能力无法复用
- 数据不同步，长期技术债务

### 方案三：新建项目（已否决）

将两个项目功能合并到全新的项目C。

**否决理由**：

- 成本最高（全新开发）
- A 的成熟能力无法直接复用
- 过度设计，不符合当前业务优先级

---

## 参考

- W1 现状摸底：`docs/projects/merge-status.md`
- 6R 评估表：`docs/projects/merge-6r-evaluation.md`
- Strangler Fig Pattern：<https://martinfowler.com/bliki/StranglerFigApplication.html>
