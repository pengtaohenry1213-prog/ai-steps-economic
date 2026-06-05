# W4 执行记录 — ACL 适配器集成

> 生成时间：2026-06-05
> W4 产出物：ACL 适配器集成完成 + PoC 验证通过

---

## 一、W4 任务目标

| 任务 | 产出物 | 状态 |
|------|--------|------|
| ACL 集成 | 可运行代码 | ✅ 完成 |
| 写 ADR #002 | `docs/adr/002-acl-adapter-integration.md` | ✅ 完成 |
| 写个人复盘 | `docs/personal/retro-w1w4.md` | ✅ 完成 |
| PoC 验证 | 完整流程正常工作 | ✅ 完成 |

---

## 二、ACL 集成执行过程

### 2.1 初始方案

在 `packages/strategy-core/src/adapters/` 中创建 ACL 适配器：

- `matchResultAdapter.ts` — MatchResult 标准化
- `enhancedStrategyAdapter.ts` — EnhancedStrategy 标准化
- `proposalAdapter.ts` — ProposalDocument ↔ ProposalContent 双向转换（核心）
- `index.ts` — 统一导出

### 2.2 集成到项目 B

修改 `apps/workflow-dashboard/src/stores/lifecycleStore.ts`：

- `saveProposalContent()` — 增加 ACL 转换层
- `completeProposalContent()` — 增加 ACL 转换层

```typescript
// 导入 ACL 适配器
import { toProposalContentFromAny } from '@ai-toolkit/strategy-core'

// saveProposalContent 中调用
const aclContent = toProposalContentFromAny(content as any)
if (!aclContent) {
  console.error('[ACL] Failed to convert content')
  return false
}
```

### 2.3 遇到的问题及修复

#### 问题 1：重名冲突

`formatProposalAsMarkdown` 在 `adapters/proposalAdapter.ts` 和 `services/document-generation-service.ts` 中都有定义，导致 build 失败。

**修复**：重命名为 `formatProposalDocumentAsMarkdown`

#### 问题 2：isProposalDocument 判断失败

Console 输出显示：

```markdown
[ACL] isProposalDocument check: {hasData: true, ownKeys: Array(1), projectName: undefined, ...}
```

传入的是 B 的 `ProposalContent`（有 `name`/`type`，不是 `projectName`/`projectType`），但 `decisionMakers` 是可选的，导致判断失败。

**修复**：更新 `isProposalDocument` 的判断逻辑：

- A 的 ProposalDocument 有 `projectName` + `projectType`
- B 的 ProposalContent 有 `name` + `type`
- 支持只有 `fullText` 字段的对象走简化模式

#### 问题 3：toProposalContentFromAny 不支持对象

当传入的对象有 `fullText` 但没有结构化字段时，返回 null。

**修复**：增加对"有 fullText 的对象"的处理分支：

```typescript
if (typeof data === 'object' && data !== null) {
  if (typeof data.fullText === 'string') {
    return { fullText: data.fullText }
  }
}
```

---

## 三、最终代码结构

### 3.1 ACL 适配器（packages/strategy-core/src/adapters/）

```markdown
matchResultAdapter.ts      — MatchResult 标准化
enhancedStrategyAdapter.ts — EnhancedStrategy 标准化
proposalAdapter.ts         — 核心：ProposalDocument ↔ ProposalContent 双向转换
index.ts                   — 统一导出
```

### 3.2 关键函数

```typescript
// 入口函数：自动识别数据类型并转换
toProposalContentFromAny(data: ProposalDocument | string | any): ProposalContent | null

// ProposalDocument → ProposalContent（完整模式）
toProposalContent(doc: ProposalDocument): ProposalContent

// ProposalContent → ProposalDocument（反向转换）
toProposalDocument(content: ProposalContent): ProposalDocument

// 格式化 markdown（用于 fullText 字段）
formatProposalDocumentAsMarkdown(doc: ProposalDocument): string

// 类型判断
isProposalDocument(data: any): boolean
```

---

## 四、ACL 数据流

```bash
用户输入 → AI 生成 markdown → toProposalContentFromAny({ fullText: markdown })
    ↓
{ fullText: markdown } → saveProposalContent() → Supabase
```

```bash
用户输入 → A 的策略匹配/增强 → ProposalDocument → toProposalContent(proposalDoc)
    ↓
ProposalContent → saveProposalContent() → Supabase
```

---

## 五、PoC 验证结果

### 测试步骤

1. 启动项目 B：`cd v2/apps/workflow-dashboard && npm run dev`
2. 在 LifecycleDashboard 进入「立项」（init）阶段
3. 输入测试用例：「我想做一个电商平台，包含用户管理、商品管理、订单管理」
4. 点击「开始生成立项书」
5. AI 生成完成后，点击「保存」

### 验证结果

| 验证点 | 结果 |
|--------|------|
| AI 生成成功 | ✅ 有流式输出 |
| ACL 转换 | ✅ 无 `[ACL]` 错误 |
| 保存成功 | ✅ |
| Supabase 存储 | ✅ 数据正确 |
| UI 显示 | ✅ 正常显示 |

---

## 六、涉及文件清单

### 修改的文件

| 文件 | 修改内容 |
|------|---------|
| `packages/strategy-core/src/adapters/proposalAdapter.ts` | 实现 ACL 核心逻辑 |
| `packages/strategy-core/src/adapters/index.ts` | 导出 ACL 适配器 |
| `packages/strategy-core/src/index.ts` | 导出 ACL 到 package |
| `apps/workflow-dashboard/src/stores/lifecycleStore.ts` | 调用 ACL 适配器 |

### 新建的文件

| 文件 | 说明 |
|------|------|
| `packages/strategy-core/src/adapters/matchResultAdapter.ts` | MatchResult 适配器 |
| `packages/strategy-core/src/adapters/enhancedStrategyAdapter.ts` | EnhancedStrategy 适配器 |

---

## 七、参考文档

| 文档 | 路径 |
|------|------|
| W1 现状摸底 | `docs/projects/merge-status.md` |
| W2 6R 评估 | `docs/projects/merge-6r-evaluation.md` |
| ADR #001 合并方向 | `docs/adr/001-merge-direction.md` |
| W3 合并路径 | `docs/projects/merge-strangler-path.md` |
| W3 PoC 报告 | `docs/projects/poc-report.md` |
| ADR #002 技术决策 | `docs/adr/002-acl-adapter-integration.md` |
| 个人复盘 | `docs/personal/retro-w1w4.md` |

---

## 八、W4 完成标志

- [x] ACL 代码生成并通过类型检查
- [x] ACL 集成到项目 B 的 lifecycleStore
- [x] Debug 日志已清理
- [x] ADR #002 记录技术决策
- [x] 个人复盘 W1-W4
- [x] PoC 验证完整流程正常工作
