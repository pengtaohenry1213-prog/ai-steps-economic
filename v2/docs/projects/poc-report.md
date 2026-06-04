# PoC 报告 — 立项书生成模块

> W3 产出物 | 生成时间：2026-06-04
> PoC 目标：验证 B → A 合并可行性

---

## 一、PoC 目标

### 1.1 目标描述

验证「B 的立项书 UI」能正常调用「A 的策略匹配/增强能力」，通过 ACL 转换为「B 的 ProposalContent 结构」，最终存储到 Supabase。

### 1.2 成功标准

| 指标 | 达标条件 |
|------|---------|
| 流程跑通 | 完整流程：用户输入 → 策略匹配 → 策略增强 → 立项书生成 → Supabase 存储 |
| UI 正常 | B 的 WorkflowDashboard 能显示立项书内容 |
| 数据完整 | ProposalContent 所有字段正确填充 |
| 无阻断错误 | 控制台无 Error 级日志 |

### 1.3 验证步骤

```
1. 启动项目 A（apps/web）
   $ cd v2 && npm run dev

2. 启动项目 B（workflow-dashboard）
   $ cd v2/apps/workflow-dashboard && npm run dev

3. 用户输入测试用例
   输入： "我想做一个电商平台，包含用户管理、商品管理、订单管理"

4. 验证流程
   4.1 策略匹配 → MatchResult（Adapter #1）
   4.2 策略增强 → EnhancedStrategy（Adapter #2）
   4.3 立项书生成 → ProposalDocument（Adapter #3）
   4.4 ACL 转换 → ProposalContent
   4.5 Supabase 写入 → proposals 表

5. 验证 B UI 显示
   - 立项书标题正确
   - background/currentIssues/goals 正确
   - scope.inScope.P0/P1 正确
   - humanGate.pmo/security 正确
```

---

## 二、技术设计

### 2.1 ACL 适配器实现位置

```
packages/strategy-core/src/adapters/
├── matchResultAdapter.ts      # Adapter #1
├── enhancedStrategyAdapter.ts # Adapter #2
└── proposalAdapter.ts        # Adapter #3 (核心)
```

### 2.2 ProposalAdapter 核心转换逻辑

```typescript
// proposalAdapter.ts

import type { ProposalDocument } from '../types'
import type { ProposalContent } from '../../workflow-dashboard/src/types'

export function toProposalContent(doc: ProposalDocument): ProposalContent {
  return {
    name: doc.projectName,
    type: doc.projectType,
    decisionMakers: doc.decisionMakers,
    background: doc.background,
    currentIssues: Array.isArray(doc.currentIssues)
      ? doc.currentIssues
      : [doc.currentIssues],
    goals: Array.isArray(doc.goals) ? doc.goals : [doc.goals],
    scope: {
      inScope: {
        P0: doc.scope.inScope.P0,
        P1: doc.scope.inScope.P1,
        P2: doc.scope.inScope.P2 ?? [],
      },
      outScope: doc.scope.outScope,
    },
    acceptance: doc.acceptance,
    milestones: doc.milestones,
    risks: doc.risks,
    humanGate: {
      pmo: doc.humanGate.pmo,
      security: doc.humanGate.security,
    },
    fullText: formatProposalAsMarkdown(doc), // 保留原文
  }
}
```

---

## 三、PoC 执行记录

### 3.1 环境准备

| 组件 | 状态 | 备注 |
|------|------|------|
| 项目 A (apps/web) | ⬜ 未开始 | — |
| 项目 B (workflow-dashboard) | ⬜ 未开始 | — |
| Supabase 本地实例 | ⬜ 未开始 | — |
| ACL 适配器 | ⬜ 未开始 | — |

### 3.2 执行日志

| 时间 | 步骤 | 结果 | 备注 |
|------|------|------|------|
| — | — | — | — |

### 3.3 遇到的问题

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| — | — | — |

---

## 四、PoC 结果

### 4.1 功能验证

| 测试项 | 结果 | 日志/截图 |
|--------|------|----------|
| 策略匹配 | ⬜ 待测 | — |
| 策略增强 | ⬜ 待测 | — |
| 立项书生成 | ⬜ 待测 | — |
| ACL 转换 | ⬜ 待测 | — |
| Supabase 存储 | ⬜ 待测 | — |
| B UI 显示 | ⬜ 待测 | — |

### 4.2 数据一致性验证

| 对比项 | 旧路径（A） | 新路径（B→A） | 一致性 |
|--------|------------|---------------|--------|
| 立项书标题 | — | — | ⬜ 待测 |
| background | — | — | ⬜ 待测 |
| goals | — | — | ⬜ 待测 |
| scope.P0 | — | — | ⬜ 待测 |

---

## 五、结论

### 5.1 是否可扩展

- [ ] 是 — PoC 可作为后续模块（需求文档、架构文档）的模板
- [ ] 否 — 遇到阻断性问题，需要重新设计

### 5.2 发现

（PoC 执行后填写）

### 5.3 下一步

（PoC 执行后填写）

---

## 六、模板（供实际执行时填写）

### 使用说明

1. 复制此文件到 `docs/projects/poc-YYYY-MM-DD-report.md`
2. 在「执行记录」和「结果」区填写实际日志
3. 完成后保留此模板的空白版供下次使用

### 快速检查清单

- [ ] 项目 A 启动成功（端口 5173 或类似）
- [ ] 项目 B 启动成功（端口 3000 或类似）
- [ ] Supabase 连接正常
- [ ] ACL 适配器代码已写入
- [ ] 测试用例输入完成
- [ ] 立项书内容验证完成
- [ ] B UI 显示验证完成