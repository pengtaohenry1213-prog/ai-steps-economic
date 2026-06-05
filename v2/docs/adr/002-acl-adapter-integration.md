# ADR-002: ACL 适配器设计与集成决策

> W4 产出物 | 生成时间：2026-06-04
> 基于 W3 PoC 结果：ACL 适配器已就绪但未集成到调用链

---

## 状态

**已接受**

---

## 上下文

### PoC 发现

W3 PoC 验证结果：
- 项目 B 能独立生成立项书，Supabase 存储正常，UI 显示正常
- ACL 适配器已生成（`packages/strategy-core/src/adapters/`），类型检查通过
- **ACL 未被调用**：B 的 `saveProposalContent` 直接写入 `fullText`，没有经过 ACL 转换

### 问题

项目 A 的策略匹配/增强能力尚未接入项目 B：
- A 的 `matchStrategyWithAIService()` 和 `enhanceStrategyWithAIService()` 没有在 B 的流程中被调用
- A 的 `ProposalDocument` 数据结构没有通过 ACL 转换为 B 的 `ProposalContent`
- 数据流是 B 独立生成 markdown → 直接存储，没有利用 A 的结构化输出

### 约束

1. B 的 UI 需要保持不变（B 的 Human Gate、双审机制）
2. A 的策略匹配/增强是核心能力，必须保留
3. ACL 层需要在调用链中透明插入，不能破坏现有流程

---

## 决策

### 决策 1：ACL 接入位置

**在 `lifecycleStore.saveProposalContent()` 之前插入 ACL 转换层**

```
原调用链：
B AI 生成 → saveProposalContent() → Supabase

新调用链：
B AI 生成 → A.matchStrategyWithAIService() [可选]
         → A.enhanceStrategyWithAIService() [可选]
         → ACL.toProposalContent() [无论是否走 A 的 SDK，都做转换]
         → saveProposalContent() → Supabase
```

**理由**：
- `saveProposalContent` 是 B 的数据存储统一入口，在此处接入 ACL 对代码侵入最小
- ACL 转换对调用方透明，无论数据来源是 A 的 SDK 还是 B 的 AI 服务，都走同一个转换层

### 决策 2：ACL 双模式支持

**ACL 适配器支持两种模式**

| 模式 | 输入 | 输出 | 用途 |
|------|------|------|------|
| 完整模式 | `ProposalDocument`（A 的结构化数据） | `ProposalContent`（B 的结构化数据） | 当 A 的 SDK 被调用时 |
| 简化模式 | markdown 文本 | `ProposalContent`（只填充 `fullText`） | 当 B 独立生成时 |

```typescript
// ACL 入口函数
export function toProposalContentFromAny(data: ProposalDocument | string): ProposalContent {
  if (isProposalDocument(data)) {
    return toProposalContent(data)  // 完整转换
  }
  return { fullText: data }  // 简化模式，只保留 fullText
}
```

**理由**：
- PoC 验证 B 能独立工作，ACL 转换应该在数据入口统一处理
- 双模式确保向后兼容：B 独立生成时也能走 ACL 层（虽然只填充 fullText）
- 不需要为"是否走 A 的 SDK"做复杂的条件分支

### 决策 3：ACL 转换优先级

**先实现"无 A 的 SDK 调用"的 ACL 转换（简化模式），再实现"有 A 的 SDK 调用"的完整模式**

阶段 1（简化模式）：
```
B AI 生成 markdown → ACL.toProposalContent(markdown) → ProposalContent.fullText → Supabase
```

阶段 2（完整模式）：
```
用户输入 → A.matchStrategyWithAIService() → MatchResult
        → A.enhanceStrategyWithAIService() → EnhancedStrategy
        → ACL.toProposalContent(proposalDoc) → ProposalContent（全字段） → Supabase
```

**理由**：
- PoC 已验证 B 能独立工作，阶段 1 是最小可行集成
- 阶段 1 可以立即验证 ACL 层是否正常工作
- 阶段 2 需要更多时间测试 A 的 SDK 集成

---

## 后果

### 正面影响

1. **ACL 层透明接入**：现有 B 的代码不需要大改，只在 `saveProposalContent` 前增加 ACL 转换
2. **向后兼容**：B 独立生成的 markdown 也能走 ACL 层，`fullText` 字段正常填充
3. **渐进式集成**：阶段 1 快速验证，阶段 2 按需扩展
4. **数据一致性**：无论数据来源如何，最终都存储为 B 的 `ProposalContent` 结构

### 负面影响

1. **阶段 1 只填充 `fullText`**：结构化字段（如 `name`、`background`、`goals`）需要阶段 2 才能完整填充
2. **ACL 需要维护两套转换逻辑**：简化模式和完整模式需要同时维护
3. **性能开销**：ACL 转换层增加了一次函数调用（可忽略）

---

## 替代方案

### 方案一：在 B 的 AI 生成入口接入 A 的 SDK

在 `generateContentByStageStream()` 之前就调用 A 的 SDK，替换 B 的 AI 生成。

**否决理由**：
- 破坏 B 的 AI 服务独立性
- 如果 A 的 SDK 失败，B 无法独立生成（违反 PoC 验证的"可独立工作"原则）
- 侵入性太大，需要重写 AI 生成流程

### 方案二：在 AI 生成之后、存储之前同步调用 A 的 SDK

AI 生成 → 同时调用 A 的 SDK → ACL 转换 → Supabase（双写）

**否决理由**：
- 双写增加复杂度，Supabase 存储两份数据
- 如果 A 的 SDK 失败，AI 生成也需要回滚
- 不符合"渐进式包裹"的 Strangler Fig 原则

### 方案三：完全重构 B 的 AI 生成，使用 A 的 SDK

替换 B 的 `generateContentByStageStream` 为 A 的 `generateAllDeliverablesWithAIService`

**否决理由**：
- 工作量最大，需要重写 AI 生成层
- B 的 AI 服务（Ollama/OpenAI 双模式）是 B 的核心能力，替换风险高
- 不符合 PoC 验证结果（B 能独立工作）

---

## 参考

- W3 PoC 报告：`docs/projects/poc-report.md`
- ACL 适配器代码：`packages/strategy-core/src/adapters/`
- ADR #001 合并方向：`docs/adr/001-merge-direction.md`
- Strangler Fig Pattern：https://martinfowler.com/bliki/StranglerFigApplication.html