# 合并路径设计 — Strangler Fig 模式

> W3 产出物 | 生成时间：2026-06-04
> 基于 ADR-001 决策：B → A 合并方向

---

## 一、绞杀点规划

### 绞杀策略：渐进式包裹，而非一次性替换

**核心原则**：从「立项书生成」切入，这是 A 和 B 共有的、最成熟的、风险最低的模块。

```
当前状态（A 的流程）
用户输入 → 策略匹配 → 策略增强 → 立项书生成 → 需求文档 → 架构文档 → Steps

绞杀后状态（合并后）
用户输入 → 策略匹配 → 策略增强
                    ↓
              ACL（防腐层）
                    ↓
         B 的 ProposalContent 结构 ← 立项书/需求/架构统一存储
                    ↓
         B 的 11 阶段生命周期 + HG 双审
```

---

## 二、ACL（Anti-Corruption Layer）设计

### 2.1 三层适配器

```typescript
// 位置：packages/strategy-core/src/adapters/

// ① MatchResult 适配器
interface MatchResultAdapter {
  standardize(raw: A.MatchResult): B.MatchResultStandardized
  // 补全 optional fields
  // 字段名映射 (strategy.id → id)
}

// ② EnhancedStrategy 适配器
interface EnhancedStrategyAdapter {
  standardize(raw: A.EnhancedStrategy): B.EnhancedStrategyStandardized
  // 补全 phases[] 等可选嵌套
  // 统一字段格式
}

// ③ ProposalDocument → ProposalContent 适配器（核心）
interface ProposalAdapter {
  toProposalContent(doc: A.ProposalDocument): B.ProposalContent
  toProposalDocument(content: B.ProposalContent): A.ProposalDocument
  // A 的严格结构 → B 的灵活结构（写入时）
  // B 的灵活结构 → A 的严格结构（读出时）
}
```

### 2.2 ACL 位置示意图

```
MatchResult ──────────────┼──▶ Adapter #1: MatchResult 标准化
                           │       ↓
EnhancedStrategy ──────────┼──▶ Adapter #2: EnhancedStrategy 标准化
                           │       ↓
ProposalDocument ──────────┼──▶ Adapter #3: ProposalContent 双向映射
                           │       ↓
                        ACL Layer（运行时转换）
                           │       ↓
              B 的 LifecycleStage.proposalContent（统一存储）
```

---

## 三、合并时序图

### Phase 1：PoC 阶段（立项书生成）

```
B 的立项书 UI（workflow-dashboard/src/views/WorkflowDashboard.vue）
    ↓ 调用
A 的策略匹配入口（DocumentGenerator.matchStrategyWithAIService）
    ↓ MatchResult
A 的策略增强（DocumentGenerator.enhanceStrategyWithAIService）
    ↓ EnhancedStrategy
ACL Layer（Adapter #1 + #2 + #3）
    ↓ 转换
A 的 ProposalDocument → B 的 ProposalContent
    ↓ 保存
Supabase（proposals 表）
    ↓
B 的 LifecycleStage.proposalContent 填充
```

**验证点**：B 的立项书页面能显示 A 生成的内容

### Phase 2：需求文档生成

```
复用 Phase 1 的 ACL
    ↓
A 的 generateAllDeliverables 生成 requirements
    ↓
ACL → ProposalContent.requirement
    ↓
Supabase
```

### Phase 3：架构文档生成

```
复用 Phase 1 的 ACL
    ↓
A 的 generateAllDeliverables 生成 architecture
    ↓
ACL → ProposalContent.architecture
    ↓
Supabase
```

### Phase 4：Steps 生成 + Todo 拆解

```
A 的 generateStepDocumentsFromArchitecture
    ↓
B 的 Todo 结构（前端/后端/测试/修复）
    ↓
LifecycleStage.steps[].todos
```

### Phase 5：Human Gate 双审引入

```
LifecycleStage.humanGate { hg1, hg2 }
    ↓
HG1: init/requirement/architecture/iteration 入口审
HG2: testing/acceptance 出口审
    ↓
Supabase human_gate 记录
```

### Phase N：ACL 退役

```
当所有模块都切换到 B 的数据结构后
    ↓
ACL Layer 简化为直通
    ↓
删除 adapters/ 目录（可选）
```

---

## 四、Branch by Abstraction 策略

### 分支策略

```
main ──────────────────────────────────────────────────────
         │                                                    │
    feature/merge-poc                                   feature/merge-phase2
         │                                                    │
    只改立项书生成流程                                       扩展到需求/架构文档
         │                                                    │
    测试通过后 merge 回 main                               测试通过后 merge 回 main
         │                                                    │
              │                                                      │
         feature/merge-phase3-n                           最终合并
                   │                                              │
              持续集成 main 上的所有模块                        清理 ACL
                                                                   │
                                                            main（完成）
```

### 提交节奏

| 阶段 | 分支 | 提交内容 |
|------|------|---------|
| PoC | `feature/merge-poc` | ACL 适配器 + 立项书生成 |
| Phase 2 | `feature/merge-phase2` | 需求文档 |
| Phase 3 | `feature/merge-phase3` | 架构文档 |
| Phase 4 | `feature/merge-phase4` | Steps + Todo |
| Phase 5 | `feature/merge-phase5` | HG 双审 |
| 合并 | `feature/merge-final` | ACL 退役 + 清理 |

---

## 五、Parallel Run 设计

### 并行运行验证

PoC 阶段需要同时跑新旧两条路径，验证输出一致性：

```
用户输入
    ↓
  ┌─────────────────────────────────────┐
  │         ACL Layer（PoC 验证点）      │
  └─────────────────────────────────────┘
    ↓                    ↓
旧路径                新路径
(A 本地存储)         (B → Supabase)
    ↓                    ↓
验证一致性            验证一致性
    ↓                    ↓
  ┌─────────────────────────────────────┐
  │         diff 输出报告                │
  │   Content 等价？Schema 兼容？        │
  └─────────────────────────────────────┘
```

**验证指标**：
- 立项书内容一致率 > 95%
- 数据结构兼容率 100%
- 无数据丢失

---

## 六、关键风险点

| 风险 | 缓解措施 |
|------|---------|
| A 的 ProposalDocument 字段比 B 更严格，转换可能丢失精度 | ACL 里做双向验证，丢字段时 warn + log |
| B 的 proposalContent 支持 string 或 array，A 只有 array | ACL 做类型推断，string 时自动转 array |
| Supabase 写入性能 | 先写 localStorage 热缓存，再异步同步 Supabase |
| HG 双审引入改变 A 的原有流程 | Phase 5 再引入，Phase 1-4 不动 HG |

---

## 七、下一步

基于此路径设计，执行 PoC：
→ 见 `docs/projects/poc-report.md`