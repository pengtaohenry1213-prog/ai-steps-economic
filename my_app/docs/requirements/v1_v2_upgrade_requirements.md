# v1 → v2 升级需求文档

> **文档版本**: v2.0.1（合并版）
> **创建日期**: 2026-05-09
> **更新日期**: 2026-05-10
> **基于**: v1_v2_analysis.md, v2_init_plan.md, specs/
>
> **阅读指引**：
> - 本文档为技术详细版，适合开发团队参考
> - 产品路线图请查阅 [v2_product_roadmap.md](./v2_product_roadmap.md)

---

## 一、项目背景与升级目标

### 1.1 背景

当前系统（v1）已实现经济模型系统的核心功能，包括模型管理、版本控制、公式计算和 Excel 导入导出。但存在以下局限：

| 局限 | 说明 | 业务影响 |
|------|------|----------|
| 公式引擎自研 | FunctionCore + Kahn 拓扑排序 | 维护成本高，XIRR 等复杂函数算法不精确 |
| 单人编辑 | 无实时协作能力 | 多部门协作效率低 |
| 后端 Mock | 基于 Nitro | 无法支持真实业务扩展 |

v2 是全新设计方案，采用 HyperFormula + Yjs CRDT + Supabase 架构，支持多人协作和 RAG 智能助手。

### 1.2 升级目标

| 目标 | 说明 |
|------|------|
| 公式零误差 | HyperFormula 确保财务公式 100% 准确 |
| 协作无冲突 | Yjs CRDT 支持多人同时编辑 |
| 内网可运行 | Supabase 本地化部署，无外网依赖 |
| 数据零泄漏 | 敏感字段全程脱敏 |
| 审计可追溯 | 完整操作日志记录 |

---

## 二、v1 / v2 核心差异对比

| 维度 | v1 (现有) | v2 (目标) |
|------|-----------|-----------|
| **公式引擎** | 自研 FunctionCore + Kahn拓扑排序 | HyperFormula |
| **协作机制** | 单人编辑（无实时协作） | Yjs CRDT 多人实时协作 |
| **智能助手** | 无 | RAG + LLM |
| **后端** | Nitro Mock | Supabase 本地化 |
| **状态管理** | Pinia | Zustand + Yjs Y.Map |
| **安全** | 前端权限控制 | RBAC + RLS + 审计日志 |
| **合规** | 无 | 等保二级/三级 |

---

## 三、功能需求清单

### 3.1 P0 核心功能（必须实现）

| 需求 | 描述 | v1 复用量 |
|------|------|-----------|
| **表格编辑** | vxe-table 封装，支持双击编辑、虚拟滚动 | 40% |
| **公式引擎** | HyperFormula + v1 财务函数(XNPV/NPV/IRR)混合方案 | 30% |
| **版本管理** | 模型版本 CRUD + 状态机(草稿→已提交→已锁定) | 80% |
| **Mock 数据层** | localStorage 替代真实后端 | 90% |

### 3.2 P1 增强功能（重要）

| 需求 | 描述 | v1 复用量 |
|------|------|-----------|
| **导入导出** | Excel 模板导入/导出 | 50% |
| **树形表格** | 指标层级展示 | 70% |
| **数据格式化** | 千分位、百分比、绝对值处理 | 90% |
| **权限控制** | RBAC 权限矩阵 | 100% |

### 3.3 P2 扩展功能（后续阶段）

| 需求 | 描述 | 工期 |
|------|------|------|
| **Yjs 协作** | 多人实时编辑、冲突解决、光标同步 | 2周 |
| **Supabase 后端** | PostgreSQL + Auth + Realtime | 2周 |
| **RAG 智能助手** | 向量检索 + LLM 自然语言查询 | 4周 |

---

## 四、技术改造点明细

### 4.1 公式引擎迁移

| v1 | v2 | 处理方式 |
|----|----|---------|
| FunctionCore (自研) | HyperFormula | 核心替换 |
| XIRR (Newton-Raphson) | HyperFormula XIRR | 直接使用 |
| XNPV (自研) | v1 实现复用 | 补充 HF 缺失 |
| NPV (自研) | v1 实现复用 | 禁用 HF 版本 |
| IRR (自研) | v1 实现复用 | 禁用 HF 版本 |
| SUMIF/IF 等 | HyperFormula | 直接使用 |

**混合方案配置**:
```typescript
const hf = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
  functions: {
    'NPV': { internal: false },
    'IRR': { internal: false },
  },
});
hf.registerFunction('XNPV', v1_xnpv_impl);
hf.registerFunction('NPV', v1_npv_impl);
hf.registerFunction('IRR', v1_irr_impl);
```

### 4.2 状态管理层迁移

| v1 | v2 | 说明 |
|----|----|------|
| Pinia Store (`useModelStore`) | Zustand Store | 状态结构复用 |
| `useData` hook | Yjs Y.Map | 适配 CRDT |
| `useFormula` hook | HyperFormula | 重写 |
| `useChangeData` hook | 审计日志 | 保留逻辑 |
| `usePageData` hook | Yjs Y.Array | 适配 CRDT |

### 4.3 数据库层迁移

| v1 | v2 | 说明 |
|----|----|------|
| MySQL 建表脚本 | PostgreSQL 建表脚本 | 语法微调 |
| localStorage Mock | v2 Mock Service | 接口不变 |

**迁移操作**: 复制 `v1/v1_db/sql/01_tables.sql` 到 v2，略作 PostgreSQL 语法适配。

### 4.4 API 层迁移

| v1 | v2 | 说明 |
|----|----|------|
| Nitro Mock | v2 Mock Service | 接口定义复用 |
| `/economodel/datamodel/page` | `/api/v1/datamodel/page` | 路径前缀调整 |

---

## 五、资产复用清单

### 5.1 可直接复用

| 资产 | 位置 | 预估工作量 |
|------|------|-----------|
| 数据库表结构 | `v1/v1_db/sql/01_tables.sql` | 0.5 人天 |
| Mock 测试数据 | `v1/v1_db/mock/01_core_data.json` | 0.5 人天 |
| API 接口定义 | `v1/v1_db/api/02_api_definition.json` | 1 人天 |
| 权限控制矩阵 | `v1/权限控制矩阵.md` | 0.5 人天 |
| 公式表达式格式 | `v1/v1_db/03_business_logic.json` | 1 人天 |
| 数据格式化逻辑 | `v1/数据格式化模块.md` | 0.5 人天 |
| 版本状态机 | `v1/版本状态机.md` | 0.5 人天 |
| **合计** | | **~4.5 人天** |

### 5.2 需改造后复用

| 资产 | 位置 | 预估工作量 |
|------|------|-----------|
| 状态管理 Hooks | `v1/核心状态管理模块-Hooks.md` | 2 人天 |
| 公式计算引擎 | `v1/公式计算模块.md` | 2 人天 |
| vxe-table 配置 | `v1/表格列配置模块.md` | 1 人天 |
| 单元格样式规则 | `v1/单元格组件模块.md` | 1 人天 |
| **合计** | | **~6 人天** |

### 5.3 仅作业务参考

| 资产 | 用途 |
|------|------|
| 原型设计页面 `v1/参考/经济模型原型_v.1.0/` | UI 设计参考 |
| Excel 模板 `v1/参考/经济模型-导入数据-excel/` | 数据格式参考 |
| 后端 Mock 路由结构 | API 设计参考 |

---

## 六、分阶段迁移计划

### Phase 0: 项目初始化（1天）

| 任务 | 时长 | 验收标准 |
|------|------|---------|
| 初始化 Monorepo 项目 | 0.5h | pnpm workspace 正常 |
| 配置 Vite + Vue3 + TypeScript | 0.5h | npm run dev 可运行 |
| 导入 v1 Mock 数据 | 0.5h | 数据文件就位 |

### Phase 1: 核心功能开发（3周）

**Week 1: 表格组件 + 数据层**

| 任务 | 时长 | 验收标准 |
|------|------|---------|
| 封装 VxeTableWrapper | 1d | 组件可配置 |
| 实现 Mock Service | 1d | 数据可 CRUD |
| 模型列表页 | 1d | 显示模型列表 |
| 版本列表页 | 1d | 显示版本列表 |

**Week 2: 公式引擎 + 编辑功能**

| 任务 | 时长 | 验收标准 |
|------|------|---------|
| 集成 HyperFormula | 1d | 引擎正常运行 |
| 补充 v1 财务函数 | 1d | 函数测试通过 |
| 单元格编辑功能 | 1d | 可编辑单元格 |
| 公式计算触发 | 1d | 公式自动计算 |
| 依赖图 + 循环检测 | 1d | 依赖关系正确 |

**Week 3: 版本管理 + 状态机 + 导入导出**

| 任务 | 时长 | 验收标准 |
|------|------|---------|
| 版本状态机实现 | 1d | 状态流转正常 |
| 版本保存/加载 | 1d | 数据持久化 |
| 导入功能 | 1d | Excel 模板导入 |
| 导出功能 | 1d | Excel 导出 |
| 数据格式化 | 0.5d | 千分位/百分比正常 |
| 权限控制 | 0.5d | 权限矩阵生效 |

### Phase 2: 完善与优化（1周）

| 任务 | 时长 | 验收标准 |
|------|------|---------|
| 集成测试 | 1d | 核心流程测试通过 |
| 性能优化 | 1d | 表格渲染 < 2s |
| 虚拟滚动验证 | 1d | 大数据量测试 |
| 单元测试补充 | 1d | 覆盖率 ≥ 70% |
| 文档完善 | 1d | README + 部署文档 |

### Phase 3: 后续扩展（可选）

| 功能 | 工期 | 前置条件 |
|------|------|----------|
| Yjs 多人协作 | 2周 | Phase 1-2 完成 |
| Supabase 后端 | 2周 | Yjs 协作验证 |
| RAG 智能助手 | 4周 | Supabase 就绪 |

---

## 七、风险评估与应对

### 7.1 高风险项

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| HyperFormula 与 v1 公式语法不兼容 | 公式无法迁移 | 逐一验证，编写兼容层 |
| Yjs CRDT 状态管理复杂度 | 开发周期延长 | 使用 spec-03 明确的设计 |
| 多人协作冲突处理 | 功能延期 | 第一阶段先做单人功能 |

### 7.2 中风险项

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| Mock 数据与真实业务差异 | 测试不充分 | 复用 v1 的 Excel 模板数据 |
| vxe-table 与 HyperFormula 绑定 | 集成复杂度 | 参考 spec-02 的实现方案 |
| 等保合规要求 | 额外工作量 | 预研 spec-09，架构设计预留 |

### 7.3 低风险项

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| v1 原型页面过时 | UI 参考价值降低 | 直接基于 v2 spec 设计 |
| 技术栈差异 | 学习成本 | 使用熟悉的 Vue 3 + vxe-table |

---

## 八、验收标准

### 8.1 功能验收

- [ ] v2 项目可正常运行（npm install + npm run dev）
- [ ] Mock 数据正确加载，显示 3 个模型 + 3 个版本
- [ ] vxe-table 表格渲染正确，支持树形展示
- [ ] 公式计算正确（SUM/XIRR/XNPV 等）
- [ ] 版本状态机流转正确（草稿→已提交→已锁定）

### 8.2 接口验收

- [ ] Mock API 接口可正常调用
- [ ] 数据保存/加载功能正常
- [ ] 导入导出功能正常

### 8.3 性能验收

- [ ] 表格加载 < 2s（1000 行数据）
- [ ] 公式计算 < 100ms（100 个公式）
- [ ] 虚拟滚动正常，滚动流畅

---

## 九、附录

### 9.1 相关文档索引

```
v1/
├── v1_v2_upgrade_plan.md      # v1 升级方案
├── v1_v2_analysis.md          # v1/v2 复用分析
├── v1_db/
│   ├── sql/01_tables.sql      # 数据库表结构
│   ├── mock/01_core_data.json # Mock 数据
│   └── api/02_api_definition.json # API 定义
├── 权限控制矩阵.md
├── 数据格式化模块.md
└── 版本状态机.md

v2/
├── v2_init_plan.md            # v2 初始化计划
└── specs/
    ├── spec-01-architecture.md   # 系统架构
    ├── spec-02-vxe-table.md       # 表格封装
    ├── spec-03-yjs-collab.md      # 协作同步
    ├── spec-04-formula.md         # 公式引擎
    ├── spec-05-rag.md             # RAG 流程
    ├── spec-06-supabase.md        # Supabase
    ├── spec-07-security.md         # 安全规则
    ├── spec-08-test.md            # 测试策略
    ├── spec-09-compliance.md      # 合规要求
    └── spec-10-agent.md           # Agent 设计
```

### 9.2 决策记录 (ADR)

**ADR-001: 为什么直接构建 v2 而非先重建 v1 后端**
- 状态: Accepted
- 日期: 2026-05-09
- 决策: 直接构建 v2，v1 作业务参考
- 理由: v1 架构无法平滑升级，重复工作成本高

**ADR-002: 为什么使用 HyperFormula + v1 财务函数混合方案**
- 状态: Accepted
- 日期: 2026-05-09
- 决策: HyperFormula 作为核心引擎，v1 XIRR/NPV/IRR/XNPV 作为补充
- 理由: HF 缺少 XNPV，NPV/IRR 算法与 v1 不同

---

## 十、二期规划技术方案（2026年度）

> 基于 `docs/v2/经济测算模型二期规划内容.md` 补充

### 10.1 二期功能技术详述

#### 10.1.1 公式智能提示与编辑器

| 需求 | 现有方案 | 二期实现 | 工作量 |
|------|----------|----------|--------|
| 公式智能提示 | 无 | CodeMirror6 集成轻量公式编辑器，支持 `${` 触发指标选择下拉框，搜索和模糊匹配 | 3 人天 |
| 公式语法高亮 | 无 | CodeMirror6 语法高亮插件，区分指标/常量/函数 | 2 人天 |
| 公式版本管理 | 无 | 保存公式历史版本，支持回滚和对比 | 2 人天 |

**注意**: 如果公式需要兼容 Excel 语法，需换用 HyperFormula + CodeMirror 集成方案。

#### 10.1.2 实时协作

| 需求 | 现有方案 | 二期实现 | 工作量 |
|------|----------|----------|--------|
| 多人实时编辑 | 无 | WebSocket/Supabase Realtime 实现多人同时编辑，实时同步变更 | 5 人天 |
| 锁机制 | 无 | 服务端中心化锁管理，防止编辑冲突 | 2 人天 |
| 操作日志 | useChangeData hook | 全量操作日志，支持审计和回溯 | 1 人天 |
| 评论与标注 | 无 | 单元格插槽扩展实现评论/标注/任务分配 | 3 人天 |

**技术栈**:
- 前端：Vue3.4+、Vite5、vxe-table@4.9.31、vxe-pc-ui、Pinia、原生 WebSocket/Supabase
- 后端：Node.js/Java、ws 服务/Supabase 表 realtime、lowdb/JSON 文件持久化

#### 10.1.3 错误定位与调试

| 需求 | 现有方案 | 二期实现 | 工作量 |
|------|----------|----------|--------|
| 错误定位 | 无 | Floyd 快慢指针算法计算闭环，快速定位计算错误单元格 | 2 人天 |
| 错误传播 | 无 | 显示错误如何传播到其他单元格 | 2 人天 |
| 错误类型 | 无 | 闭环、无效指标、无效公式、孤立指标四类 | 1 人天 |
| 无效公式原因 | 无 | ID 不存在、未添加 ID、未纳入拓扑排序图三类 | 1 人天 |
| 调试模式 | 无 | 复用 `validateSortedGraphWithFormula` 展示中间过程 | 2 人天 |
| 闭环兼容 | Kahn 拓扑排序 | 参考 Excel 迭代计算原理，循环多轮逼近近似结果 | 3 人天 |

#### 10.1.4 资源监控

| 需求 | 现有方案 | 二期实现 | 工作量 |
|------|----------|----------|--------|
| 公式监控 | 无 | `resource-monitor.ts` - 数量、复杂度、依赖链深度 | 1 人天 |
| 表格监控 | 无 | 行列数、可见范围、数据量统计 | 1 人天 |
| 计算引擎监控 | 无 | 监控引擎状态和性能指标 | 1 人天 |
| 健康检查 | 无 | `health-check.ts` - 循环依赖检测、公式语法验证、无效引用检测、孤立指标分析、数据完整性校验 | 2 人天 |

**可复用模块**: `dependencies.ts`、`useData.ts`、`usePageData.ts`、`useChangeData.ts` 现有统计模块

#### 10.1.5 自动备份与恢复

| 需求 | 现有方案 | 二期实现 | 工作量 |
|------|----------|----------|--------|
| 手动备份 | 无 | 点击保存触发，命名规则「[手动]版本名 日期时间」，接口落地服务端数据库 | 1 人天 |
| 定时备份 | 无 | 默认 10 分钟间隔可自定义，统一定时命名规则 | 2 人天 |
| 一键恢复 | 无 | 备份历史面板选择记录，覆盖恢复当前版本 | 2 人天 |
| 备份管理 | 无 | 列表展示时间/类型/名称，支持恢复、仅标识废弃不物理删除 | 1 人天 |
| 增量备份 | 无 | 本期暂不实现 | - |

#### 10.1.6 Supabase 本地部署方案

| 需求 | 现有方案 | 二期实现 | 工作量 |
|------|----------|----------|--------|
| Docker 本地部署 | 无 | 使用 docker-compose 一键部署，包含 PostgreSQL/Auth/Realtime/Storage | 1 人天 |
| 内网数据存储 | localStorage | Supabase PostgreSQL，支持事务和复杂查询 | 2 人天 |
| Realtime 协作 | WebSocket | Supabase Realtime 替代自建 WebSocket，监听数据库变更 | 2 人天 |
| 身份认证 | 无 | Supabase Auth，支持邮箱/OAuth，内网无需外网认证 | 1 人天 |
| Vue 3 集成 | 无 | @supabase/supabase-js，兼容现有 Pinia 状态管理 | 1 人天 |

**Docker Compose 配置要点**:
```yaml
services:
  postgres:
    image: supabase/postgres:15.1.1.117
  auth:
    image: supabase/gotrue:v11.5.1
  realtime:
    image: supabase/realtime:v2.10.1
  studio:
    image: supabase/studio:20241028-91e4b66
```

**Vue 3 集成示例**:
```typescript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('http://localhost:54321', 'your-anon-key')

// 实时监听数据变更
supabase.channel('model-changes').on('postgres_changes', {
  event: '*', schema: 'public', table: 'models'
}, (payload) => {
  // 处理变更
}).subscribe()
```

**适用场景**：二期实时协作 + 后期 RAG 向量数据存储

### 10.2 二期技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (Vue 3)                          │
├─────────────────────────────────────────────────────────────┤
│  vxe-table  │  Pinia  │  CodeMirror6 公式编辑器              │
│  HyperFormula + v1 财务函数  │  Yjs CRDT (协作层)            │
│  WebSocket Client  │  resource-monitor  │  health-check       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │      WebSocket Server         │
              │   (Node.js + ws/lowdb)        │
              └───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │      Supabase (可选)          │
              │   PostgreSQL + Realtime      │
              └───────────────────────────────┘
```

### 10.3 二期开发计划

| 阶段 | 工期 | 任务 | 交付物 |
|------|------|------|--------|
| **Phase 2.1** | 1 周 | 公式编辑器 CodeMirror6 集成、智能提示、语法高亮、版本管理 | 公式增强功能 |
| **Phase 2.2** | 2 周 | Supabase Docker 部署、Realtime 实时服务、多人协作、锁机制、操作日志 | 实时协作基础 |
| **Phase 2.3** | 1 周 | 错误定位/传播显示、调试模式、闭环算法 | 错误诊断功能 |
| **Phase 2.4** | 1 周 | 资源监控、健康检查、自动备份、备份恢复 | 运维保障功能 |
| **Phase 2.5** | 1 周 | 评论/标注/任务分配功能集成 | 协作增强功能 |

### 10.4 二期风险评估

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| CodeMirror6 与 HyperFormula 集成复杂度 | 中 | 预留 2 天预研时间 |
| Supabase Docker 部署复杂度 | 中 | 使用官方 docker-compose，参考 self-hosting 文档 |
| 循环依赖算法复杂度 | 高 | Floyd 算法验证 + Excel 迭代计算原理兜底 |
| 备份数据量增长 | 低 | 定期清理策略 + 增量备份后期实现 |
