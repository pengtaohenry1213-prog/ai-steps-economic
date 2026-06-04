# PoC 验证清单 — 立项书生成模块

> W3 执行指南 | 生成时间：2026-06-04

---

## 一、前置条件

在开始 PoC 之前，确保以下环境就绪：

| 检查项 | 状态 | 备注 |
|--------|------|------|
| 项目 A 代码已同步 | ⬜ 待检查 | `git pull` |
| 项目 B 代码已同步 | ⬜ 待检查 | `git pull` |
| Supabase 本地/云端实例可访问 | ⬜ 待检查 | 检查连接配置 |
| Node.js 版本正确 | ⬜ 待检查 | `node -v` |
| 依赖已安装 | ⬜ 待检查 | `npm install` |

---

## 二、ACL 适配器代码检查

ACL 适配器是 PoC 的核心，确保以下文件已创建：

```
packages/strategy-core/src/adapters/
├── matchResultAdapter.ts      # Adapter #1
├── enhancedStrategyAdapter.ts # Adapter #2
└── proposalAdapter.ts        # Adapter #3（核心）
```

| 文件 | 状态 | 备注 |
|------|------|------|
| `matchResultAdapter.ts` | ⬜ 待创建 | — |
| `enhancedStrategyAdapter.ts` | ⬜ 待创建 | — |
| `proposalAdapter.ts` | ⬜ 待创建 | — |

**如需生成适配器代码**，请告知，我可以帮你生成。

---

## 三、执行步骤

### 步骤 1：启动项目 A

```bash
# 终端 1
cd v2
npm run dev
```

预期：
- 服务启动在 `http://localhost:5173`（或配置的其他端口）
- 控制台无 Error

### 步骤 2：启动项目 B

```bash
# 终端 2
cd v2/apps/workflow-dashboard
npm run dev
```

预期：
- 服务启动在 `http://localhost:3000`（或配置的其他端口）
- 控制台无 Error

### 步骤 3：执行测试用例

在浏览器中打开项目 B 的立项书页面（通常是 WorkflowDashboard 或对应的路由）。

输入以下测试用例：

```
我想做一个电商平台，包含用户管理、商品管理、订单管理
```

### 步骤 4：触发流程

点击「生成」或类似按钮，触发：
1. 策略匹配（matchStrategyWithAIService）
2. 策略增强（enhanceStrategyWithAIService）
3. 立项书生成（generateAllDeliverablesWithAIService）
4. ACL 转换（proposalAdapter.toProposalContent）
5. Supabase 存储（proposalService.saveProposal）

---

## 四、验证清单

### 功能验证

| 测试项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| 策略匹配 | 输入测试用例，点击生成 | MatchResult 返回，策略 ID 和行业 ID 正确 | ⬜ 待测 |
| 策略增强 | 匹配成功后继续 | EnhancedStrategy 返回，包含 phases/modules | ⬜ 待测 |
| 立项书生成 | 增强成功后继续 | ProposalDocument 返回，所有字段非空 | ⬜ 待测 |
| ACL 转换 | 立项书生成后 | ProposalContent 所有字段正确映射 | ⬜ 待测 |
| Supabase 存储 | ACL 转换后 | proposals 表有新记录 | ⬜ 待测 |
| B UI 显示 | 存储成功后 | 立项书标题/background/goals/scope 正确显示 | ⬜ 待测 |

### 数据一致性验证

| 对比项 | 旧路径（A） | 新路径（B→A） | 一致性 |
|--------|------------|---------------|--------|
| 立项书标题 | — | — | ⬜ 待测 |
| background | — | — | ⬜ 待测 |
| goals | — | — | ⬜ 待测 |
| scope.P0 | — | — | ⬜ 待测 |
| humanGate.pmo | — | — | ⬜ 待测 |

---

## 五、遇到问题怎么办

| 问题现象 | 可能原因 | 解决方向 |
|----------|----------|----------|
| 策略匹配无响应 | AI 服务未连接 | 检查 ollamaService / aiService 配置 |
| 立项书字段缺失 | ACL 转换逻辑不完整 | 检查 proposalAdapter.toProposalContent |
| Supabase 写入失败 | 权限或网络问题 | 检查 supabaseClient 配置 |
| B UI 无显示 | 数据未正确传递 | 检查 proposalContent 是否正确填充 |

---

## 六、完成后

PoC 执行完成后：

1. **填充 PoC 报告**：将执行日志填入 `docs/projects/poc-report.md`
2. **确认是否可扩展**：
   - [ ] 是 → 可作为后续模块（需求文档、架构文档）的模板
   - [ ] 否 → 记录阻断性问题，重新设计
3. **进入 W4**：执行 + 复盘 + ADR #002

---

## 快速链接

| 文档 | 路径 |
|------|------|
| 合并路径设计 | `docs/projects/merge-strangler-path.md` |
| PoC 报告模板 | `docs/projects/poc-report.md` |
| W1 现状摸底 | `docs/projects/merge-status.md` |
| W2 6R 评估 | `docs/projects/merge-6r-evaluation.md` |
| ADR #001 | `docs/adr/001-merge-direction.md` |