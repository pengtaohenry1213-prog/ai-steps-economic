# v1 → v2 内容复用分析报告

## 一、v1 和 v2 关系概览

| 对比项 | v1 (现有项目) | v2 (设计方案) |
|--------|---------------|---------------|
| **状态** | 已实现，可运行 | 10 份 Draft 设计文档 |
| **核心功能** | 经济模型系统（实例/模型/公式/Excel导入导出） | 多人协作 + RAG 智能助手 |
| **公式引擎** | 自研（Kahn拓扑排序 + DFS环检测） | HyperFormula |
| **协作机制** | 单人编辑（无实时协作） | Yjs CRDT |
| **智能助手** | 无 | RAG + LLM |
| **后端** | Nitro Mock | Supabase 本地化 |

---

## 二、v1 可供 v2 复用的内容清单

### 2.1 数据库设计 ✅ 可直接复用

**v1 位置**: `v1/v1_db/sql/01_tables.sql`

| 表名 | 用途 | v2 Spec 关联 |
|------|------|-------------|
| `datamodel` | 数据模型主表 | spec-06 Supabase |
| `datamodelversion` | 模型版本表（含状态机） | spec-06, spec-07 |
| `modelmetric` | 指标定义（树形层级） | spec-02 vxe-table |
| `dataentry` | 单元格数据 | spec-02, spec-06 |
| `modelformula` | 公式定义 | spec-04 HyperFormula |
| `modelpage` | 页面配置 | spec-02 |
| `currencydictionary` | 币种字典 | — |
| `unitcategory` | 单位分类 | — |

**复用方式**: SQL 建表脚本可直接用于 Supabase PostgreSQL

---

### 2.2 Mock 测试数据 ✅ 可直接复用

**v1 位置**: `v1/v1_db/mock/01_core_data.json`

包含:
- 3 个模型（五年财务预测、季度经营分析、年度预算）
- 3 个版本（草稿/已提交/已锁定）
- 10+ 个指标（含父子层级）
- 4 个公式
- 9 条数据录入
- 5 种币种 + 7 种单位

**复用方式**: 作为 localStorage/Memory 数据库初始数据，或导入 Supabase

---

### 2.3 API 接口定义 ✅ 可适配复用

**v1 位置**: `v1/v1_db/api/02_api_definition.json`

| 模块 | 接口数 | v2 Spec 关联 |
|------|--------|-------------|
| auth | 2 | spec-06 Auth |
| datamodel | 8 | spec-06 CRUD |
| datamodelversion | 10 | spec-06, spec-07 |
| modelpage | 2 | spec-02 |
| modelmetric | 5 | spec-04 |
| dataentry | 5 | spec-02, spec-04 |
| modelformula | 7 | spec-04 |

**复用方式**: 适配为 Supabase REST API 或自建 API 服务

---

### 2.4 业务逻辑配置 ✅ 可复用

**v1 位置**: `v1/v1_db/03_business_logic.json`

| 内容 | 说明 | v2 用途 |
|------|------|---------|
| 版本状态机 | 草稿→已提交→已锁定 | spec-07 权限控制 |
| 公式表达式格式 | `${metricCode-year}` | spec-04 HyperFormula |
| 特殊表达式处理器 | lastPeriod/arrayAllValue/totalYear 等 | spec-04 迁移参考 |
| 单元格样式规则 | italicCodes/absCodes/checkCodes | spec-02 vxe-table 封装 |
| 计算顺序 | 预计算→全局变量→特殊表达式→公式→执行 | spec-04 |

---

### 2.5 核心状态管理 Hooks ⚠️ 需改造后复用

**v1 位置**: `v1/核心状态管理模块-Hooks.md`

| Hook | 职责 | v2 改造方向 |
|------|------|------------|
| `useData` | 数据池（${metricCode} → {field: value}） | 适配 Yjs Y.Map |
| `useFormula` | 公式表达式管理 | 迁移到 HyperFormula |
| `useChangeData` | 变化追踪（增量保存） | 保留审计能力 |
| `usePageData` | 页面数据池 | 适配 Yjs Y.Array |
| `useAnimationData` | 动画数据追踪 | 可简化 |
| `useGridOptions` | vxe-table 配置 | spec-02 直接使用 |

**复用方式**: 参考设计思路，重写以适配 Yjs

---

### 2.6 公式计算模块 ⚠️ 需改造后复用

**v1 位置**: `v1/公式计算模块.md`

| 组件 | 功能 | v2 改造方向 |
|------|------|------------|
| `topological.ts` | Kahn 拓扑排序 | HyperFormula 内置 |
| `dependencies.ts` | 依赖图生成 + 特殊表达式 | HyperFormula 内置，需扩展 |
| `cycle.ts` | DFS 环检测 | HyperFormula 内置 |
| `calculate.ts` | 公式计算引擎 | 迁移到 HyperFormula |
| `math/index.js` | XIRR/XNPV/NPV/IRR | HyperFormula P1 支持 |

**复用方式**: 财务函数（XIRR 等）可移植，核心逻辑被 HyperFormula 替代

---

### 2.6.1 自定义函数与 HyperFormula 冲突分析 ⚠️ 重要

**v1 函数注册方式**: `FunctionCore` 使用 `new Function()` 动态执行公式

```javascript
// math/index.js - 函数注册核心代码
class FunctionCore {
  createSafeContext() {
    const mathFunctions = {
      ...Q10000A0044,
      ...Q10000A0045,
      ...sumIfNpvIrr,  // NPV, IRR, SUMIF 等
      ...xirr,         // XIRR (Newton-Raphson + Bisection)
      ...xnpv,        // XNPV (日期加权净现值)
    };
    Object.assign(context, mathFunctions);
    return context;
  }
}
```

**v1 自定义函数清单**:

| 文件 | 导出函数 |
|------|---------|
| `sumIfNpvIrr.js` | `NPV`, `IRR`, `SUMIF`, `IF`, `IFERROR`, `SUM`, `MAX`, `MIN`, `AND`, `OR`, `AVERAGE`, `ROUNDUP`, `COUNTA`, `SELECT`, `MOD` |
| `xirr.js` | `XIRR` (Newton-Raphson + Bisection 二分法) |
| `xnpv.js` | `XNPV` (日期加权净现值) |

**v1 vs HyperFormula 函数冲突矩阵**:

| v1 函数 | HyperFormula 内置 | 冲突风险 | 推荐处理 |
|---------|------------------|---------|---------|
| `NPV` | ✅ 有 | ⚠️ 中 | **禁用 HF**，用 v1 实现（支持日期数组） |
| `IRR` | ✅ 有 | ⚠️ 中 | **禁用 HF**，用 v1 实现（算法不同） |
| `XIRR` | ✅ 有 | ⚠️ 中 | **用 HF**，v1 算法相似（都是 Newton-Raphson） |
| `XNPV` | ❌ 无 | ✅ 无 | **保留 v1**，HF 没有此函数 |
| `SUMIF` | ✅ 有 | ⚠️ 低 | **用 HF**，行为基本一致 |
| `IFERROR` | ✅ 有 | ⚠️ 低 | **用 HF**，HF 实现更标准 |
| `SUM/MAX/MIN/AND/OR` | ✅ 有 | ⚠️ 低 | **用 HF** |
| `AVERAGE/ROUNDUP` | ✅ 有 | ⚠️ 低 | **用 HF** |

**推荐方案：混合使用**

```
HyperFormula 原生函数: XIRR, SUM, MAX, MIN, IF, AVERAGE 等基础函数
+ v1 自定义补充: XNPV (HF没有), NPV (HF的不支持日期数组), IRR (算法不同)
```

**具体操作**:

```typescript
// HyperFormula 配置
const hf = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
  functions: {
    // 禁用与 v1 冲突的函数
    'NPV': { internal: false },
    'IRR': { internal: false },
    // XIRR 用 HF 的
    // SUMIF/IFERROR 等用 HF 的
  },
});

// 补充 v1 的自定义函数
hf.registerFunction('XNPV', v1_xnpv_impl);
hf.registerFunction('NPV', v1_npv_impl);  // 带日期支持的版本
hf.registerFunction('IRR', v1_irr_impl);
```

**v1 财务函数源码位置**:
```
apps/web-ele/src/views/instance/edit/math/
├── index.js          # FunctionCore 主类
├── xirr.js          # XIRR 实现（Newton-Raphson + Bisection）
├── xnpv.js          # XNPV 实现（日期加权净现值）
├── sumIfNpvIrr.js   # NPV, IRR, SUMIF 等
└── Q10000A0044-IRR.js  # 专用 IRR 变体
```

---

### 2.7 关键业务流程时序图 ✅ 参考复用

**v1 位置**: `v1/关键业务流程时序图.md`

| 流程 | 说明 | v2 用途 |
|------|------|---------|
| 页面初始化 | fetchAllList → runInstance → initColumns → runFormula → Worker | spec-03 Yjs 同步流程参考 |
| 单元格编辑 | updateData → calculate(fullOrder) → checkAnimationData → UI更新 | spec-02 编辑流程参考 |

---

### 2.8 Excel 导入导出 ⚠️ 部分可用

**v1 实现**: `apps/web-ele/src/views/instance/edit/workers/excel.ts`

- Web Worker 异步处理
- exceljs/xlsx 库
- 支持模板导入、数据校验

**v2 复用**: 技术实现可参考，但需适配 Yjs 协作场景

---

### 2.9 vxe-table 配置 ⚠️ 需适配

**v1 位置**: `v1/表格列配置模块.md` + `v1/单元格组件模块.md`

**实际使用的表格组件**: vxe-table（不是 handsontable）

> ⚠️ 注意：v1 源码 `package.json` 中同时安装了 `handsontable` 和 `vxe-table`，但 handsontable 仅在 `dashboard/create/model.js`（占位页面）中引用，核心编辑功能使用的是 **vxe-table**。

| 配置项 | v1 实现 | v2 spec-02 要求 |
|--------|---------|----------------|
| scrollY | 有虚拟滚动 | spec-02 明确虚拟滚动规范 |
| editConfig | click 触发 cell 模式 | spec-02: dblclick 触发 |
| treeConfig | 行ID/父子ID 配置 | spec-02 一致 |
| 单元格样式 | 加粗/斜体/红色/动画 | spec-02 定义 6 种视觉状态 |
| 右键菜单 | 展开/折叠 | spec-02 无此功能 |

**复用方式**: spec-02 已有明确规范，v1 配置作为实现参考

**v1 vxe-table 源码位置**:
```
apps/web-ele/src/views/instance/edit/
├── index.vue          # 核心编辑页 (~35KB)
├── hooks/modules/
│   └── useGridOptions.ts  # vxe-table 配置
└── components/        # 表格相关组件
```

**v1 依赖的表格相关包**:
```json
"vxe-table": "catalog:",
"vxe-pc-ui": "catalog:",
"vxe-table-plugin-export-xlsx": "^4.0.7",
"handsontable": "^14.6.0",      // ❌ 未在核心功能中使用
"@handsontable/vue3": "^14.6.0"  // ❌ 未在核心功能中使用
```

---

## 三、v1 中不建议直接复用的内容

| 内容 | 原因 | 建议 |
|------|------|------|
| 前端 UI 组件 | 使用 Element Plus | v2 使用 Vue3 + 自封装 vxe-table |
| Store 状态管理 | Pinia | v2 使用 Zustand (或适配 Pinia) |
| API 请求封装 | 基于 Nitro | v2 基于 Supabase |
| 权限控制 | 前端模式 | v2 使用 Supabase RLS |
| 公式引擎 | 自研 | v2 使用 HyperFormula |

---

## 四、v1 → v2 迁移映射表

```
v1 内容                          →  v2 spec/组件
─────────────────────────────────────────────────────
datamodel 表结构                 →  spec-06 Supabase 表设计
datamodelversion 状态机           →  spec-07 安全/权限
modelmetric 树形层级             →  spec-02 vxe-table 列配置
dataentry 单元格数据              →  spec-02 vxe-table 数据绑定
modelformula 公式定义             →  spec-04 HyperFormula
modelpage 页面配置                →  spec-02 页面布局
useData/useFormula 状态管理       →  spec-03 Yjs Y.Map
useGridOptions 表格配置          →  spec-02 VxeTableConfig
公式计算引擎 (calculate.ts)      →  spec-04 HyperFormula
XIRR/XNPV/NPV/IRR 财务函数       →  spec-04 P1 函数
Excel Worker                      →  spec-02 导入导出（简化）
API 接口定义                      →  spec-06 REST API
Mock 数据                         →  spec-06 初始数据
业务逻辑配置 (状态机/表达式格式)   →  spec-07 安全规则
```

---

## 五、结论与建议

**可直接复用 (约 40%)**:
- 数据库表结构 + Mock 数据
- API 接口定义
- 业务逻辑配置（状态机、公式表达式格式）

**需改造后复用 (约 40%)**:
- 状态管理 Hooks → 适配 Yjs
- 公式计算引擎 → 迁移到 HyperFormula
- vxe-table 配置 → 按 spec-02 重写
- Excel 导入导出 → 简化适配

**不建议复用 (约 20%)**:
- Element Plus UI 组件
- Nitro 后端
- 自研公式引擎核心逻辑

---

## 六、新发现的 v1 重要内容

### 6.1 权限控制矩阵 ✅ 可直接复用

**v1 位置**: `v1/权限控制矩阵.md`

v1 已实现了完整的权限控制逻辑：

| 操作 | 集团用户 | 锁定者 | 其他用户 | 已提交版本 |
|------|----------|--------|---------|------------|
| 查看 | ✓ | ✓ | ✓ | ✓ |
| 编辑 | ✓ | ✓ (本人锁定) | ✗ | ✗ |
| 保存 | ✓ | ✓ | ✗ | ✗ |
| 提交 | ✓ | ✓ | ✗ | ✗ |
| 解锁 | ✓ | ✗ | ✗ | ✓ (管理员) |

**v2 复用**: 该权限矩阵可直接映射到 spec-07 的 RBAC 权限系统和 spec-06 Supabase RLS 策略

---

### 6.2 数据格式化模块 ✅ 可直接复用

**v1 位置**: `v1/数据格式化模块.md`

**格式化规则** (`views/instance/edit/utils/format.ts`):

| 规则 | 处理逻辑 | 示例 |
|------|---------|------|
| 单一值行 | 日期单元格显示为空 | `isFixed === 0` 时隐藏日期列 |
| 空值处理 | 空值返回空字符串 | `isEmpty(val) → ''` |
| 绝对值 | `absCodes` 集合中的指标取绝对值 | Math.abs(val) |
| 百分比 | 单位为 PERCENT 时转换 | `val * 100 + '%'` |
| 刻度处理 | 根据 scale 缩放 | `val / scale` |
| 默认 | 千分位格式化 | `toLocaleString('zh-CN')` |

**v2 复用**: 格式化逻辑可直接用于 spec-02 vxe-table 单元格渲染

---

### 6.3 全局状态管理 Store ✅ 部分可用

**v1 位置**: `v1/Store 模块.md` + `store/model.ts`

**状态结构**:

```typescript
interface ModelState {
  unitDict: {};           // 单位字典: { unitCode: { unit, scale, options } }
  unitTree: [];           // 单位分类树
  modelType: string;      // 模型类型
  forecastTimeType: string; // 时间段类型: year/quarter/month
  isInit: boolean;
  currencyList: [];       // 币种列表
  projectList: [];         // 项目列表
  investList: [];         // 投资公司列表
  modelList: [];          // 模型列表
  targetIndustryList: []; // 目标行业列表
}
```

**初始化逻辑**:
```typescript
async fetchAllList() {
  if (!this.isInit) {
    this.setIsInit(true);
    return Promise.all([
      this.fetchModelList(),
      this.fetchProjectList(),
      this.fetchCurrencyList(),
      this.fetchInvestList(),
      this.fetchUnit(),
    ]);
  }
}
```

**v2 复用**: 状态结构可映射到 Zustand store，初始化模式可参考

---

### 6.4 Web Worker 排序模块 ⚠️ 技术参考

**v1 位置**: `v1/Web Worker 模块.md` + `views/instance/edit/workers/sort/index.ts`

**职责**: 在独立线程中执行拓扑排序

```typescript
globalThis.addEventListener('message', async (e) => {
  const { formula, instance } = JSON.parse(e.data);

  try {
    // 1. 生成依赖关系图
    const relation = generateRelation(instance, formula);

    // 2. 执行拓扑排序
    const order = await getAllIds(true, instance, relation);

    globalThis.postMessage({ success: true, order });
  } catch (error) {
    globalThis.postMessage({ success: false, error: error.message });
  }
});
```

**v2 说明**: HyperFormula 内置依赖图管理，Worker 模式可简化

---

### 6.5 原型设计参考 📋 业务参考

**v1 位置**: `v1/参考/经济模型原型_v.1.0/`

包含 29 个 HTML 原型页面，覆盖完整业务流程：

| 分类 | 原型页面 |
|------|---------|
| **填报模型** | 假设输入标的收入/支出/资产/敏感性分析/投资参数 |
| **指标输出** | 回收期分析/敏感性分析/损益指标/现金流量指标/盈亏平衡点/资产负债指标 |
| **配置管理** | 科目指标/维度管理/指标关系管理/数据校验 |
| **系统管理** | 版本管理/模型管理/币种/产品/项目/项目类型/行业/渠道结构/组织架构/权限配置/物料 |

**v2 复用**: 可作为 v2 页面设计的业务参考，但 UI 需重新实现

---

### 6.6 Excel 导入模板 📊 数据参考

**v1 位置**: `v1/参考/经济模型-导入数据-excel/`

| 文件 | 说明 | 大小 |
|------|------|------|
| `20251126_COFCO_IEM_v.9.3.xlsm` | 中粮 COFCO 经济模型模板 | 5.5 MB |
| `糖业经济模型演示-完整模型.xlsx` | 糖业经济模型演示 | 162 KB |

**v2 复用**: 可作为 v2 导入导出功能的测试数据和数据格式参考

---

### 6.7 后端 Mock API 结构 📝 API 参考

**v1 位置**: `v1/后端 Mock 模块.md`

```
api/
├── auth/
│   ├── login.post.ts      # 登录
│   ├── logout.post.ts     # 登出
│   ├── refresh.post.ts     # Token 刷新
│   └── codes.ts           # 验证码
├── model/
│   ├── list.ts            # 模型列表
│   ├── info.ts            # 模型详情
│   ├── config.ts          # 模型配置
│   ├── units.ts          # 单位列表
│   └── metric/list.ts     # 指标列表
├── instance/
│   ├── list.ts           # 版本列表
│   └── info.ts           # 版本详情
├── economodel/
│   └── currencydictionary/list.ts  # 币种列表
├── investsystem/
│   └── projectbase/
│       ├── findAllByProfCompy.ts  # 投资公司列表
│       └── findAllByProject.ts     # 项目列表
└── table/
    └── list.ts           # 表格数据
```

**v2 说明**: v2 将使用 Supabase REST API 或自建 API 服务，路由结构可参考

---

## 七、v1 项目技术栈全景

### 7.1 前端技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Vue 3 + Composition API | ^3.5.13 |
| UI 组件库 | Element Plus, Ant Design Vue, Naive UI | ^4.2.5 |
| 表格组件 | vxe-table, handsontable (未用) | catalog |
| 状态管理 | Pinia + persisted state | 2.2.2 |
| 路由 | Vue Router | ^4.4.5 |
| 构建工具 | Vite | ^5.4.8 |
| 样式 | Tailwind CSS, SCSS, PostCSS | ^3.4.13 |
| Excel 处理 | exceljs, xlsx, file-saver | ^4.4.0 |
| 公式执行 | lua-in-js, fengari (Lua VM in JS) | ^2.2.5 |
| 工具库 | lodash.clonedeep, decimal.js, dayjs | — |
| 测试 | Vitest, @testing-library/vue | ^3.1.1 |

### 7.2 后端技术栈

| 层级 | 技术 |
|------|------|
| Mock Server | Nitro |
| 认证 | JWT |

### 7.3 Monorepo 结构

```
├── apps/
│   ├── web-ele/           # 主前端应用
│   └── backend-mock/       # Nitro Mock 后端
├── packages/
│   ├── @core/             # 核心共享包
│   │   ├── base/          # 基础工具
│   │   ├── composables/   # Composables
│   │   ├── ui-kit/        # UI 组件库
│   │   └── preferences/    # 偏好设置
│   └── effects/            # 业务功能包
│       ├── access/         # 权限控制
│       ├── hooks/          # 业务 Hooks
│       ├── layouts/       # 布局组件
│       ├── common-ui/      # 通用 UI
│       ├── request/        # HTTP 请求
│       └── plugins/        # 插件集成
├── internal/               # 内部配置包
│   ├── vite-config/
│   ├── tailwind-config/
│   └── tsconfig/
└── database/              # 数据库参考
```

---

## 八、v2 vs v1 技术选型对比

| 维度 | v1 | v2 (spec) |
|------|-----|-----------|
| **前端框架** | Vue 3 | Vue 3 / React |
| **表格组件** | vxe-table | vxe-table (spec-02) |
| **状态管理** | Pinia | Zustand (或适配 Pinia) |
| **公式引擎** | 自研 (FunctionCore) | HyperFormula (spec-04) |
| **协作** | 无 | Yjs CRDT (spec-03) |
| **后端** | Nitro Mock | Supabase (spec-06) |
| **AI 能力** | 无 | RAG + LLM (spec-05, spec-10) |
| **安全** | 前端权限 | RBAC + RLS + 审计 (spec-07) |
| **合规** | 无 | 等保二级/三级 (spec-09) |
| **测试** | 低覆盖率 | ≥90% (spec-08) |

---

## 九、v1 → v2 完整迁移检查清单

### 直接复用 ✅
- [x] 数据库表结构 (v1_db/sql/01_tables.sql)
- [x] Mock 测试数据 (v1_db/mock/01_core_data.json)
- [x] API 接口定义 (v1_db/api/02_api_definition.json)
- [x] 业务逻辑配置 (v1_db/03_business_logic.json)
- [x] 权限控制矩阵
- [x] 版本状态机
- [x] 公式表达式格式

### 改造后复用 ⚠️
- [ ] 状态管理 Hooks → 适配 Yjs
- [ ] 公式计算引擎 → 迁移到 HyperFormula
- [ ] vxe-table 配置 → 按 spec-02 重写
- [ ] Excel 导入导出 → 简化适配
- [ ] 数据格式化逻辑 → 保留
- [ ] Web Worker 拓扑排序 → HyperFormula 内置

### 仅作参考 📋
- [ ] 原型设计页面 (业务逻辑参考)
- [ ] Excel 模板文件 (数据格式参考)
- [ ] 后端 Mock 路由结构 (API 设计参考)

### 不建议复用 ❌
- [ ] Element Plus UI 组件
- [ ] Nitro 后端
- [ ] 自研公式引擎核心逻辑
- [ ] Pinia Store (改为 Zustand)