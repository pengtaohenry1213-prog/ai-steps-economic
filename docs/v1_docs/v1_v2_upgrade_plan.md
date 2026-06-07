# v1 → v2 升级方案文档

> **文档版本**: v1.0.0
> **创建日期**: 2026-05-09
> **基于**: v1_v2_analysis.md

---

## 一、升级策略

### 1.1 核心决策：直接构建 v2，v1 作业务参考

**不推荐的方案**: 先在 v1 重建后端再迁移

- v1 是单人马甲架构，无法平滑升级到 Yjs/Supabase
- 重复工作：在 v1 重建后端 = 浪费，最终仍需按 v2 spec 重写
- v1 源码复用率低（仅约 40% 可改造复用）

**推荐方案**: 直接构建 v2

- v1 的价值在于**业务逻辑参考**（表结构、公式格式、Mock数据）
- v2 spec 是全新设计，Supabase + Yjs + HyperFormula + RAG 是现代化架构
- Mock 数据替代真实数据库，支撑前期 80% 开发验证

### 1.2 v1 资产复用清单

| 资产类型 | 复用方式 | 预估工作量 |
|---------|---------|-----------|
| 数据库表结构 | 直接使用 SQL | 0.5 人天 |
| Mock 测试数据 | 导入 v2 Mock 层 | 0.5 人天 |
| API 接口定义 | 适配为 v2 API | 1 人天 |
| 权限控制矩阵 | 直接复用 | 0.5 人天 |
| 公式表达式格式 | 参考迁移 | 1 人天 |
| 数据格式化逻辑 | 直接复用 | 0.5 人天 |
| 财务函数 XIRR/NPV/XNPV/IRR | 混合方案 | 2 人天 |
| 原型设计页面 | 业务参考 | 0 人天 |
| **合计** | | **~6 人天** |

### 1.3 v2 技术选型

```
前端框架:     Vue 3 + TypeScript + Vite
表格组件:     vxe-table (与 v1 一致)
状态管理:     Zustand (或 Pinia)
公式引擎:     HyperFormula + v1 财务函数混合
协作:         Yjs CRDT (后续阶段)
后端:         Mock 数据层 (后续阶段 Supabase)
AI 能力:      RAG + LLM (后续阶段)
测试:         Vitest + Playwright
```

---

## 二、v1 → v2 迁移映射

### 2.1 数据库层

| v1 | v2 | 说明 |
|----|-----|------|
| MySQL 建表脚本 | PostgreSQL 建表脚本 | 语法微调 |
| localStorage Mock | v2 Mock Service | 接口不变 |

**迁移操作**: 复制 `v1_db/sql/01_tables.sql` 到 v2，略作 PostgreSQL 语法适配

### 2.2 API 层

| v1 | v2 | 说明 |
|----|-----|------|
| Nitro Mock | v2 Mock Service | 接口定义复用 |
| `/economodel/datamodel/page` | `/api/v1/datamodel/page` | 路径前缀调整 |

**迁移操作**: 复制 `v1_db/api/02_api_definition.json`，适配为 v2 接口

### 2.3 状态管理层

| v1 | v2 | 说明 |
|----|-----|------|
| Pinia Store (`useModelStore`) | Zustand Store | 状态结构复用 |
| `useData` hook | Yjs Y.Map | 适配 CRDT |
| `useFormula` hook | HyperFormula | 重写 |
| `useChangeData` hook | 审计日志 | 保留逻辑 |
| `usePageData` hook | Yjs Y.Array | 适配 CRDT |
| `useAnimationData` hook | 简化 | 可选 |

### 2.4 公式引擎层

| v1 | v2 | 说明 |
|----|-----|------|
| FunctionCore (自研) | HyperFormula | 核心替换 |
| XIRR (Newton-Raphson) | HyperFormula XIRR | 替换 |
| XNPV (自研) | v1 实现复用 | 补充 HF 缺失 |
| NPV (自研) | v1 实现复用 | 禁用 HF 版本 |
| IRR (自研) | v1 实现复用 | 禁用 HF 版本 |
| SUMIF/IF 等基础函数 | HyperFormula | 直接替换 |

**混合方案配置**:

```typescript
const hf = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
  functions: {
    'NPV': { internal: false },
    'IRR': { internal: false },
  },
});

// 补充 v1 财务函数
hf.registerFunction('XNPV', v1_xnpv_impl);
hf.registerFunction('NPV', v1_npv_impl);
hf.registerFunction('IRR', v1_irr_impl);
```

### 2.5 表格组件层

| v1 | v2 | 说明 |
|----|-----|------|
| vxe-table | vxe-table | 直接使用 |
| `useGridOptions` | `VxeTableConfig` | 重写适配 spec-02 |
| click 触发编辑 | dblclick 触发编辑 | 按 spec-02 调整 |
| 树形配置 | 一致 | 保留 |

### 2.6 业务逻辑层

| v1 | v2 | 说明 |
|----|-----|------|
| 版本状态机 | 一致 | 直接复用 |
| 权限控制矩阵 | RBAC + RLS | 扩展 |
| 数据格式化 | 一致 | 直接复用 |
| 公式表达式格式 | 一致 | 参考 |

---

## 三、升级风险与应对

### 3.1 高风险项

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| HyperFormula 与 v1 公式语法不兼容 | 公式无法迁移 | 逐一验证，编写兼容层 |
| Yjs CRDT 状态管理复杂度 | 开发周期延长 | 使用 v2 spec-03 明确的设计 |
| 多人协作冲突处理 | 功能延期 | 第一阶段先做单人功能 |

### 3.2 中风险项

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| Mock 数据与真实业务差异 | 测试不充分 | 复用 v1 的 Excel 模板数据 |
| vxe-table 与 HyperFormula 绑定 | 集成复杂度 | 参考 spec-02 的实现方案 |
| 等保合规要求 | 额外工作量 | 预研 spec-09，架构设计预留 |

### 3.3 低风险项

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| v1 原型页面过时 | UI 参考价值降低 | 直接基于 v2 spec 设计 |
| 技术栈差异 | 学习成本 | 使用熟悉的 Vue 3 + vxe-table |

---

## 四、升级验收标准

### 4.1 功能验收

- [ ] v2 项目可正常运行（npm install + npm run dev）
- [ ] Mock 数据正确加载，显示 3 个模型 + 3 个版本
- [ ] vxe-table 表格渲染正确，支持树形展示
- [ ] 公式计算正确（SUM/XIRR/XNPV 等）
- [ ] 版本状态机流转正确（草稿→已提交→已锁定）

### 4.2 接口验收

- [ ] Mock API 接口可正常调用
- [ ] 数据保存/加载功能正常
- [ ] 导入导出功能正常

### 4.3 性能验收

- [ ] 表格加载 < 2s（1000 行数据）
- [ ] 公式计算 < 100ms（100 个公式）
- [ ] 虚拟滚动正常，滚动流畅

---

## 五、附录

### 5.1 相关文件索引

```bash
v1/
├── v1_db/
│   ├── sql/01_tables.sql           # 数据库表结构
│   ├── mock/01_core_data.json     # Mock 数据
│   ├── api/02_api_definition.json # API 定义
│   └── 03_business_logic.json     # 业务逻辑配置
├── v1_v2_analysis.md               # v1/v2 复用分析
├── 权限控制矩阵.md                  # 权限逻辑
├── 数据格式化模块.md               # 格式化规则
├── 版本状态机.md                   # 状态机
└── 参考/
    ├── 经济模型原型_v.1.0/          # 原型页面（业务参考）
    └── 经济模型-导入数据-excel/     # Excel 模板

v2/
├── specs/
│   ├── spec-01-architecture.md    # 系统架构
│   ├── spec-02-vxe-table.md      # 表格封装
│   ├── spec-03-yjs-collab.md     # 协作同步
│   ├── spec-04-formula.md        # 公式引擎
│   └── ...
└── v2_init_plan.md               # v2 初始化计划
```

### 5.2 决策记录 (ADR)

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
