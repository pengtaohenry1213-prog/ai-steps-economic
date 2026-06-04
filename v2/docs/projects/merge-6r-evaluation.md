# 6R 评估表 — 项目合并方向决策

> W2 产出物 | 生成时间：2026-06-04

---

## 一、评估背景

基于 W1 现状摸底结果（`docs/projects/merge-status.md`），对两个项目的功能模块进行 6R 分类评估。
合并方向：**B → A**（B 迁移到 A，保留 A 的策略匹配/增强能力）

---

## 二、6R 定义速查

| 策略 | 含义 | 适用场景 |
|------|------|----------|
| **Retain** | 保持原样，不变 | 核心差异化能力，稳定成熟 |
| **Rehost** | 直接迁移，不改架构 | 快速搬迁，不改代码 |
| **Replatform** | 小幅改造适配新平台 | 有限改动，适配新环境 |
| **Refactor** | 重构代码适应新架构 | 优化结构，合并逻辑 |
| **Repurchase** | 换新 SaaS / 新工具 | 用现成方案替代 |
| **Retire** | 停用 | 废弃功能，不需要 |

---

## 三、功能模块 6R 评估表

### 核心差异化能力（Retain — 不动）

| 模块 | 来自 | 6R | 理由 |
|------|------|-----|------|
| 策略匹配 | 项目A | **Retain** | A 的核心差异化能力，成熟度高，合并后作为统一入口 |
| 策略增强 | 项目A | **Retain** | A 的核心差异化能力，为后续文档生成提供增强上下文 |

### UI 层迁移（Replatform — 迁移到 A）

| 模块 | 来自 | 6R | 理由 |
|------|------|-----|------|
| UI/交互层 | 项目B | **Replatform** | B 的 UI 完善、交互细节完成度高，迁移到 A 的项目结构中 |
| Human Gate 双审 | 项目B | **Replatform** | B 的 HG1/HG2 机制补充 A 的流程规范，引入到 A |
| Todo 任务拆解 | 项目B | **Replatform** | B 的细化 Todo（前端/后端/测试/修复）粒度更细，合并后采用 |
| 11 阶段生命周期 | 项目B | **Replatform** | B 的 11 阶段覆盖更完整（到运维/迭代），引入到 A |
| AI 双模式服务 | 项目B | **Replatform** | B 的 Ollama/OpenAI 双模式支持，合并到 A 作为统一 AI 服务层 |
| 提案/快照服务 | 项目B | **Replatform** | B 的 proposalService/lifecycleSnapshotService，迁移并适配 A 的数据模型 |

### 文档生成合并（Refactor — 合并到统一结构）

| 模块 | 来自 | 6R | 理由 |
|------|------|-----|------|
| 立项书生成 | A+B 都有 | **Refactor** | 两者都有立项书生成能力，合并到统一的 ProposalContent 结构 |
| 需求文档生成 | A+B 都有 | **Refactor** | 两者都有需求文档生成能力，合并到 B 的 proposalContent.requirement 结构 |
| 架构文档生成 | A+B 都有 | **Refactor** | 两者都有架构文档生成能力，合并到 B 的 proposalContent.architecture 结构 |

### 基础设施（Repurchase — 统一换成 Supabase）

| 模块 | 来自 | 6R | 理由 |
|------|------|-----|------|
| 数据持久化 | 项目A: localStorage | **Repurchase** | A 用 localStorage，B 用 Supabase，统一到 Supabase 更可靠 |
| 状态缓存 | 项目A: localStorage | **Repurchase** | 合并后统一用 Supabase + localStorage 混合（热缓存用 localStorage，冷数据用 Supabase） |

---

## 四、6R 汇总

| 6R 策略 | 模块数 | 模块列表 |
|---------|--------|---------|
| **Retain** | 2 | 策略匹配、策略增强 |
| **Replatform** | 7 | UI/交互层、Human Gate 双审、Todo 任务拆解、11 阶段生命周期、AI 双模式服务、提案/快照服务 |
| **Refactor** | 3 | 立项书生成、需求文档生成、架构文档生成 |
| **Repurchase** | 2 | 数据持久化、状态缓存 |
| **Rehost** | 0 | — |
| **Retire** | 0 | — |

---

## 五、合并工作量估算

| 类型 | 工作量 | 说明 |
|------|--------|------|
| Retain | 低 | 直接保留，不改动 |
| Replatform | 中 | 需要适配 A 的数据模型，但不需要重写 |
| Refactor | 中高 | 需要统一文档结构，设计数据映射 |
| Repurchase | 高 | 涉及数据迁移和缓存策略重新设计 |

---

## 六、下一步

基于此评估表，撰写 ADR #001 确定合并方向决策。
→ 见 `docs/adr/001-merge-direction.md`