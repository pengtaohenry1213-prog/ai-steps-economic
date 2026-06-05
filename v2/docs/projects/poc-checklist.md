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

### Phase 1：立项书（init）验证

| 测试项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| 策略匹配 | 输入测试用例，点击生成 | MatchResult 返回，策略 ID 和行业 ID 正确 | ⬜ 待测 |
| 策略增强 | 匹配成功后继续 | EnhancedStrategy 返回，包含 phases/modules | ⬜ 待测 |
| 立项书生成 | 增强成功后继续 | ProposalDocument 返回，所有字段非空 | ⬜ 待测 |
| ACL 转换 | 立项书生成后 | ProposalContent 所有字段正确映射 | ⬜ 待测 |
| Supabase 存储 | ACL 转换后 | proposals 表有新记录（init） | ⬜ 待测 |
| B UI 显示 | 存储成功后 | 立项书标题/background/goals/scope 正确显示 | ⬜ 待测 |

### Phase 2：需求文档（requirement）验证

| 测试项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| 需求文档生成 | 立项阶段完成后，进入需求阶段，点击生成 | RequirementsDocument 返回，所有字段非空 | ⬜ 待测 |
| ACL 转换 | 需求文档生成后 | toRequirementsContent() 正确调用 | ⬜ 待测 |
| Supabase 存储 | ACL 转换后 | proposals 表有新记录（requirement） | ⬜ 待测 |
| B UI 显示 | 存储成功后 | 需求文档标题/功能需求/非功能需求正确显示 | ⬜ 待测 |

### Phase 3：架构文档（architecture）验证

| 测试项 | 操作 | 预期结果 | 状态 |
|--------|------|----------|------|
| 架构文档生成 | 需求阶段完成后，进入架构阶段，点击生成 | ArchitectureDocument 返回，所有字段非空 | ⬜ 待测 |
| ACL 转换 | 架构文档生成后 | toArchitectureContent() 正确调用 | ⬜ 待测 |
| Supabase 存储 | ACL 转换后 | proposals 表有新记录（architecture） | ⬜ 待测 |
| B UI 显示 | 存储成功后 | 架构文档标题/techStack/modules 正确显示 | ⬜ 待测 |

### 数据一致性验证

| 对比项 | init | requirement | architecture |
|--------|------|-------------|---------------|
| 标题 | ⬜ 待测 | ⬜ 待测 | ⬜ 待测 |
| background | ⬜ 待测 | ⬜ 待测 | ⬜ 待测 |
| goals | ⬜ 待测 | ⬜ 待测 | ⬜ 待测 |
| scope.P0 | ⬜ 待测 | ⬜ 待测 | ⬜ 待测 |

---

## 五、遇到问题怎么办

| 问题现象 | 可能原因 | 解决方向 |
|----------|----------|----------|
| 策略匹配无响应 | AI 服务未连接 | 检查 ollamaService / aiService 配置 |
| 立项书字段缺失 | ACL 转换逻辑不完整 | 检查 proposalAdapter.toProposalContent |
| 需求文档字段缺失 | ACL 转换逻辑不完整 | 检查 proposalAdapter.toRequirementsContent |
| 架构文档字段缺失 | ACL 转换逻辑不完整 | 检查 proposalAdapter.toArchitectureContent |
| Supabase 写入失败 | 权限或网络问题 | 检查 supabaseClient 配置 |
| B UI 无显示 | 数据未正确传递 | 检查 proposalContent 是否正确填充 |

---

## 六、完成后

Phase 1-3 验证完成后：

1. **更新 PoC 报告**：将执行日志填入 `docs/projects/poc-report.md`
2. **确认是否可扩展**：
   - [x] 是 → ACL 已支持立项书/需求/架构三个模块
   - [ ] 否 → 记录阻断性问题，重新设计
3. **可选：继续 UI 层迁移** — 把项目 B 的 LifecycleDashboard 迁移到项目 A

---

## 快速链接

| 文档 | 路径 |
|------|------|
| W4 执行记录 | `docs/projects/w4-execution-record.md` |
| ADR #002 | `docs/adr/002-acl-adapter-integration.md` |
| 个人复盘 | `docs/personal/retro-w1w4.md` |
| 合并路径设计 | `docs/projects/merge-strangler-path.md` |
| W1 现状摸底 | `docs/projects/merge-status.md` |
| W2 6R 评估 | `docs/projects/merge-6r-evaluation.md` |
| ADR #001 | `docs/adr/001-merge-direction.md` |