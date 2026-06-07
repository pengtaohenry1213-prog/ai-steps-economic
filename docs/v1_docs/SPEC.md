# SPEC.md - 经济测算模型系统 (Economic Model System)

> **Feature ID:** feature-1778205922753-ji194elhj3p
> **Title:** 分析当前已有项目代码，给出spec coding + plan + 执行step
> **Date:** 2026-05-08
> **Status:** Draft

---

## 第一部分：项目分析 (Project Analysis)

### 1.1 项目概述

**项目名称:** vben-admin-pro (经济测算模型系统)

**项目类型:** Vue 3 Monorepo 前端应用 + Mock 后端服务

**技术栈:**

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 (^3.5.13) + Composition API + TypeScript (^5.6.3) |
| UI 组件库 | Element Plus (^4.2.5), Ant Design Vue (^4.2.5), Naive UI |
| 状态管理 | Pinia (2.2.2) + persisted state plugin |
| 路由 | Vue Router (^4.4.5) |
| 构建工具 | Vite (^5.4.8) |
| 后端 Mock | Nitro (^2.9.7) |
| 样式 | Tailwind CSS (^3.4.13), SCSS, PostCSS |
| 包管理 | pnpm (^9.12.1) |
| Monorepo | Turborepo (^2.1.3) |

**核心定位:** 一个面向企业财务/经济分析的在线表格协作系统，支持模型版本管理、指标计算、公式管理、Excel 导入导出、多人实时协作（规划中）和 AI 智能助手（规划中）。

---

### 1.2 目录结构分析

```
ai-economic/
├── apps/
│   ├── web-ele/                    # 主前端应用 (Element Plus)
│   │   └── src/
│   │       ├── api/               # API 客户端 (core/, data.ts, index.ts, request.ts)
│   │       ├── views/             # 页面视图
│   │       │   ├── dashboard/     # 工作台: analytics, create, edit, workspace
│   │       │   ├── instance/      # 实例管理: overview, edit (核心编辑页面 ~35KB)
│   │       │   ├── model/          # 模型管理: overview, create-form, editor(空)
│   │       │   └── table/          # 配置管理: subject, model_metric, model_formula, data_metric
│   │       ├── formula/           # 公式目录 (空占位)
│   │       ├── store/             # Pinia stores (auth, global, model, urlParams)
│   │       ├── router/            # Vue Router (guard, access, routes)
│   │       ├── components/        # 公共组件 (空占位)
│   │       ├── layouts/           # 布局组件
│   │       ├── bootstrap.ts       # 应用初始化
│   │       ├── main.ts            # 入口
│   │       └── preferences.ts     # 项目偏好配置
│   └── backend-mock/              # Nitro Mock 后端
│       ├── api/                   # API 路由 (auth, model, instance, table, gateway)
│       ├── middleware/            # 中间件
│       ├── utils/                 # 工具 (jwt, cookie, mock-data)
│       └── nitro.config.ts
├── packages/
│   ├── @core/                     # 核心共享包
│   │   ├── base/                  # 基础工具: utils, cache, color, icons, design
│   │   ├── composables/           # Vue Composables
│   │   ├── ui-kit/                # UI 组件库: layout-ui, popup-ui, shadcn-ui, form-ui, menu-ui, tabs-ui
│   │   └── preferences/           # 偏好设置管理
│   └── effects/                   # 业务功能包
│       ├── access/                # 权限控制 (前端/后端模式)
│       ├── hooks/                 # 业务级 Hooks
│       ├── layouts/               # 布局组件 (auth, basic, iframe)
│       ├── common-ui/             # 通用 UI 组件
│       ├── request/              # HTTP 请求封装
│       └── plugins/               # 插件集成 (echarts, vxe-table)
├── internal/                       # 内部配置包
│   ├── vite-config/
│   ├── tailwind-config/
│   ├── tsconfig/
│   └── lint-configs/
├── database/                       # 数据库参考文档
│   ├── 参考内容/                   # 模块设计文档 (API/Store/Worker/公式/状态管理等)
│   └── 参考内容/formula.json       # 公式 JSON
├── docs/
│   ├── v2/specs/                  # 10 份详细规格文档 (spec-01 ~ spec-10)
│   └── economic-model-system/     # 系统设计文档
└── plans/                         # 项目规划文档
```

---

### 1.3 核心功能模块分析

#### 1.3.1 实例管理 (Instance) — 核心模块

**功能描述:** 版本/实例是系统的核心实体，表示一个经济模型的特定版本，支持创建、编辑、提交、锁定。

**页面结构:**

- `instance/overview/index.vue` — 实例列表页，展示所有版本实例
- `instance/edit/index.vue` (~35KB) — **核心编辑页面**，包含:
  - `components/BaseInfo.vue` — 基础信息面板
  - `components/Operate.vue` — 操作按钮（保存/导入/导出/提交/高亮）
  - `components/SetProduct.vue`, `SetUnit.vue` — 产品/单位设置
  - `components/SlidePanel.vue` — 侧边滑出面板
  - `components/Scan/` — 扫描/图表子组件
  - `hooks/modules/useData.ts` — 数据池管理
  - `hooks/modules/useChangeData.ts` — 变更追踪
  - `hooks/modules/useFormula.ts` — 公式存取
  - `hooks/modules/useGridOptions.ts` — vxe-table 配置
  - `utils/calculate.ts` — 公式计算引擎
  - `utils/dependencies.ts` — 依赖图生成
  - `utils/cycle.ts` — 循环检测
  - `utils/format.ts` — 数据格式化
  - `math/` — 财务计算 (XIRR, XNPV, NPV, IRR)
  - `workers/excel.ts` — Excel 导入导出 Worker
  - `workers/sort/` — 拓扑排序 Worker
  - `constants/special.ts` — 特殊指标代码配置

**API 端点:**

| API | Method | 路径 | 说明 |
|-----|--------|------|------|
| getInstanceList | POST | `/economodel/datamodelversion/page` | 实例分页列表 |
| deleteInstance | POST | `/economodel/datamodelversion/removeAll` | 删除实例 |
| getInstance | POST | `/economodel/datamodelversion/list` | 获取实例详情 |
| getInstanceData | GET | `/economodel/dataentry/getModelTableData` | 获取表格数据 |
| saveInstanceData | PUT | `/economodel/dataentry/saveAll` | 保存表格数据 |
| saveInstanceConfig | PUT | `/economodel/datamodelversion/save` | 保存配置 |
| updateInstanceConfig | PUT | `/economodel/datamodelversion/saveOrUpdate` | 更新配置 |
| calcInstance | POST | `/economodel/modelformula/fetchMetricsImpactedByValue` | 计算影响指标 |
| checkEditLock | GET | `/economodel/data/{dataId}/lock-status` | 检查编辑锁 |
| setEditLock | POST | `/economodel/data/{dataId}/lock` | 设置编辑锁 |
| setUnLock | POST | `/economodel/data/{dataId}/unlock` | 释放锁 |

**公式系统:** 自研实现，包含依赖图构建、拓扑排序、循环引用检测，以及 XIRR/XNPV/NPV/IRR 等财务函数。

#### 1.3.2 模型管理 (Model)

**功能描述:** 管理模型模板和指标配置。

**页面:**

- `model/overview/index.vue` — 模型列表
- `model/overview/create-form.vue` (~18KB) — 创建模型表单

**API 端点:**

| API | Method | 路径 | 说明 |
|-----|--------|------|------|
| getModelList | POST | `/economodel/datamodel/page` | 模型分页列表 |
| getModelTemplate | POST | `/economodel/modelmetric/list` | 获取模型模板/指标 |
| getModelMenu | POST | `/economodel/modelpages/list` | 获取模型页面 |
| createModel | POST | `/economodel/datamodel/create` | 创建模型 |
| updateModel | POST | `/economodel/datamodel/save` | 保存模型 |
| deleteModel | POST | `/economodel/datamodel/delete` | 删除模型 |
| getCurrencyList | POST | `/economodel/currencydictionary/list` | 币种列表 |
| getInvestList | GET | `/economodel/investsystem/projectbase/findAllByProfCompy` | 投资主体列表 |
| getProjectList | GET | `/economodel/investsystem/projectbase/findAllByProject` | 项目列表 |
| getScriptFormula | GET | `/economodel/modelformula/getAllLuaString` | 获取 Lua 脚本公式 |
| getUnitAndCategorylist | POST | `/economodel/unitcategory/unitAndCategorylist` | 单位和分类 |

#### 1.3.3 配置管理 (Table)

**功能描述:** 管理主题、指标、公式、数据指标等配置。

**子模块:**

| 模块 | 页面 | API |
|------|------|-----|
| 主题 (Subject) | index.vue, edit.vue | getSubjectPage, saveSubject, removeSubject |
| 模型指标 (Model Metric) | index.vue, edit.vue | getModelmetricPage, saveModelmetric, removeModelmetric |
| 模型公式 (Model Formula) | index.vue, edit.vue | getModelformulaPage, saveModelformula, removeModelformula |
| 数据指标 (Data Metric) | index.vue, edit.vue | getDatametricPage, saveDatametric, removeDatametric |

#### 1.3.4 工作台 (Dashboard)

**子模块:**

- `analytics/` — 分析仪表板，包含趋势图、访问数据、销售数据等
- `workspace/` — 工作台首页，含快捷导航、项目列表、待办列表
- `create/` — 模型创建（占位）
- `edit/` — 编辑页面（占位）

---

### 1.4 包架构分析

#### 1.4.1 packages/@core/

基于 **Vue Vben Admin ^5.4.0** 构建的核心包体系:

```
@core/base/           # 基础层: 工具函数、类型定义、图标、设计令牌
@core/composables/   # Composables: VueUse 封装 + 自定义 hooks
@core/ui-kit/        # UI 组件库
  ├── layout-ui/     # 布局组件
  ├── popup-ui/      # Modal/Drawer 组件
  ├── shadcn-ui/     # Shadcn UI 组件
  ├── form-ui/       # 表单系统 (setupVbenForm + Zod 验证)
  ├── menu-ui/       # 菜单组件
  └── tabs-ui/       # Tab 组件
@core/preferences/   # 偏好设置 (theme, color mode, layout)
```

#### 1.4.2 packages/effects/

业务级功能包:

```
@effects/access/     # 权限控制 (v-access 指令, useAccess hook)
@effects/hooks/      # 业务级 hooks
@effects/layouts/    # 布局组件 (auth, basic, iframe)
@effects/common-ui/  # 通用 UI (组合多个 ui-kit)
@effects/request/    # HTTP 请求封装 (axios)
@effects/plugins/    # 插件集成 (ECharts, vxe-table)
```

#### 1.4.3 包依赖关系

```
@core/base/          (无依赖)
    ↑
@core/composables/   (依赖 @core/base)
    ↑
@core/ui-kit/        (依赖 @core/base, @core/composables)
    ↑
@core/preferences/   (依赖 @core/base)
    ↑
@effects/hooks/      (依赖 @core/composables)
    ↑
@effects/access/     (依赖 @core/*, @vben/stores)
@effects/layouts/    (依赖 @core/ui-kit)
@effects/common-ui/  (依赖 @core/ui-kit, @effects/layouts)
@effects/request/     (依赖 @vben/request)
@effects/plugins/    (依赖 @core/*)
    ↑
apps/web-ele/        (依赖所有 @core/* 和 @effects/*)
apps/backend-mock/    (无框架依赖, Nitro)
```

---

### 1.5 已有设计文档分析

项目在 `docs/v2/specs/` 中包含 **10 份详细规格文档**（均为 Draft 状态），定义了未来版本的系统规划：

| Spec | 标题 | 核心内容 | 状态 |
|------|------|---------|------|
| spec-01 | 系统架构设计 | 6 层架构: 前端渲染 → Yjs CRDT → API 网关 → 表格服务/RAG/公式 → Supabase → AI 服务 | Draft |
| spec-02 | vxe-table 封装规范 | vxe-table 配置、列定义、单元格渲染 | Draft |
| spec-03 | Yjs 协作同步规则 | CRDT 数据结构、y-websocket 协议、锁定机制、离线合并 | Draft |
| spec-04 | 公式引擎 (HyperFormula) | HyperFormula 集成、依赖图、增量重算、循环检测 | Draft |
| spec-05 | RAG 智能助手 | 意图识别、向量检索、脱敏、LLM 生成 | Draft |
| spec-06 | Supabase 本地化 | PostgreSQL + Auth + Realtime + Storage 部署 | Draft |
| spec-07 | 安全与审计 | 数据脱敏、RBAC、审计日志、水印、防攻击 | Draft |
| spec-08 | 测试策略 | 负载测试、冲突测试、RAG 准确率测试 | Draft |
| spec-09 | 等保合规 | 等保二级/三级要求 | Draft |
| spec-10 | RAG Agent | ReAct + CoT、任务拆解、工具调用、Human Gate | Draft |

**关键设计决策 (ADR):**

- 选择 **Yjs (CRDT)** 而非 OT — 离线优先、无需中心协调
- 选择 **Supabase 本地化** — 一键部署、内置 Auth/Realtime/Storage
- 选择 **HyperFormula** — Excel 兼容、386+ 函数支持

---

### 1.6 当前实现状态

| 功能模块 | 实现程度 | 说明 |
|---------|---------|------|
| Vue 3 + Monorepo 架构 | ✅ 完整 | pnpm workspaces + Turborepo |
| Element Plus UI | ✅ 完整 | 主应用使用 Element Plus |
| 路由与权限 | ✅ 完整 | Vue Router + 前端权限控制 |
| 实例管理 (列表/编辑) | ✅ 完整 | 核心功能已实现 |
| 模型管理 (列表/创建) | ✅ 完整 | CRUD 基本完成 |
| 配置管理 (主题/指标/公式) | ✅ 完整 | CRUD 基本完成 |
| 公式计算引擎 | ✅ 完整 | 自研实现，支持 XIRR/XNPV/NPV/IRR |
| Excel 导入导出 | ✅ 完整 | Web Worker + exceljs/xlsx |
| 公式公式管理 CRUD | ✅ 完整 | getFormulaList, saveFormula, deleteFormula |
| vxe-table 集成 | ✅ 完整 | 已配置 ECharts 和 ExcelJS 插件 |
| 多人实时协作 (Yjs) | ❌ 未实现 | 仅有设计规范 |
| RAG 智能助手 | ❌ 未实现 | 仅有设计规范 |
| HyperFormula 引擎 | ❌ 未实现 | 仍在使用自研公式引擎 |
| Supabase 后端 | ❌ 未实现 | 仅有设计规范 |
| 安全脱敏与审计 | ❌ 未实现 | 仅有设计规范 |
| RAG Agent (ReAct/CoT) | ❌ 未实现 | 仅有设计规范 |
| 等保合规 | ❌ 未实现 | 仅有设计规范 |
| 测试框架 | ⚠️ 部分 | vitest 配置存在，测试覆盖率低 |

---

## 第二部分：实现计划 (Implementation Plan)

### 2.1 当前阶段定位

基于 `docs/README.md` 中的开发路线图:

```
0-立项 (3 days) → 1-Vibe验证 (1-2 weeks) → 2-Spec编写 (1-2 weeks)
→ 3-核心开发 (3-4 weeks) → 4-集成测试 (1-2 weeks) → 5-上线部署 (1 week)
```

当前状态:

- ✅ 立项完成
- ✅ Vibe 验证完成
- ✅ Spec 编写完成（10 份 Draft 规格文档）
- 🔄 核心开发阶段（进行中 — 本分支任务）

---

### 2.2 推荐实施路线

#### 路线 A: 分阶段实施（推荐）

**Phase 1: 基础设施完善** (1-2 周)

1. 建立完整的类型定义系统 (`apps/web-ele/src/types/`)
2. 完善单元测试框架，提高测试覆盖率
3. 规范化 API 响应类型和错误处理
4. 完善前端权限控制，实现后端权限模式

**Phase 2: 核心功能增强** (2-3 周)

1. 将自研公式引擎逐步迁移到 HyperFormula（spec-04）
2. 完善 vxe-table 封装（spec-02）
3. 实现公式 Web Worker 隔离计算
4. 优化 Excel 导入导出性能和用户体验

**Phase 3: 协作与智能化** (3-4 周)

1. 实现 Yjs 多人协作（spec-03）
2. 实现 Supabase 后端集成（spec-06）
3. 实现 RAG 智能助手（spec-05）
4. 实现 RAG Agent（spec-10）

**Phase 4: 安全合规** (2 周)

1. 实现数据脱敏引擎（spec-07）
2. 实现审计日志系统（spec-07）
3. 实现导出水印（spec-07）
4. 安全测试与渗透测试（spec-08, spec-09）

#### 路线 B: 按 Spec 逐个实现

按 spec-02 → spec-04 → spec-03 → spec-06 → spec-05 → spec-07 → spec-10 的依赖顺序逐个实现。

---

### 2.3 实施优先级矩阵

| 优先级 | 功能 | Spec 引用 | 工作量估计 | 价值 |
|--------|------|----------|-----------|------|
| P0 | vxe-table 封装规范 | spec-02 | 中 | 提升核心编辑体验 |
| P0 | HyperFormula 集成 | spec-04 | 高 | 公式计算标准化 |
| P1 | Yjs 协作同步 | spec-03 | 高 | 核心差异化能力 |
| P1 | Supabase 后端 | spec-06 | 中 | 基础设施升级 |
| P2 | RAG 智能助手 | spec-05 | 高 | 智能化能力 |
| P2 | 数据脱敏与审计 | spec-07 | 中 | 安全合规要求 |
| P3 | RAG Agent | spec-10 | 高 | 高级 AI 能力 |
| P3 | 等保合规 | spec-09 | 中 | 合规要求 |

---

## 第三部分：执行步骤 (Execution Steps)

### Phase 1: 项目初始化与环境验证

#### Step 1.1: 环境验证

```bash
# 检查 Node.js 版本
node --version  # >= 20.10.0

# 检查 pnpm 版本
pnpm --version  # >= 9.12.1

# 安装依赖
cd /Users/taopeng/workspace/ai-economic
pnpm install

# 启动开发服务器
pnpm dev

# 运行类型检查
pnpm check:type

# 运行构建
pnpm build
```

#### Step 1.2: 依赖关系梳理

1. 确认 `apps/web-ele/package.json` 中对 `@core/*` 和 `@effects/*` 的 `workspace:*` 引用
2. 确认 `internal/*` 配置包的正确链接
3. 验证 Turborepo pipeline 配置正确 (`turbo.json`)

### Phase 2: 基础设施完善

#### Step 2.1: 类型系统建立

```
目标: 填充 apps/web-ele/src/types/ 目录
```

1. 创建 `types/instance.ts` — 实例相关类型 (Instance, InstanceParams, InstanceListResult)
2. 创建 `types/model.ts` — 模型相关类型 (Model, ModelParams, ModelListResult)
3. 创建 `types/formula.ts` — 公式相关类型 (Formula, FormulaParams)
4. 创建 `types/common.ts` — 通用类型 (ApiResponse, PageParams, PageResult)
5. 创建 `types/editor.ts` — 编辑器相关类型 (CellData, GridOptions, ColumnConfig)
6. 从 `apps/web-ele/src/store/model.ts` 中提取 `ModelTs` 和 `EditorTs` 命名空间到类型文件

#### Step 2.2: 测试框架完善

```
目标: 提高核心模块测试覆盖率
```

1. 为 `apps/web-ele/src/views/instance/edit/utils/` 下的工具函数编写单元测试:
   - `utils/dependencies.ts` — 依赖图测试
   - `utils/cycle.ts` — 循环检测测试
   - `utils/format.ts` — 格式化测试
   - `math/index.js` — 财务函数测试 (XIRR, XNPV, NPV, IRR)
2. 为 API 客户端编写集成测试
3. 配置 Vitest 覆盖率达到 > 60%

#### Step 2.3: API 层规范化

```
目标: 统一 API 响应格式和错误处理
```

1. 定义标准 `ApiResponse<T>` 接口:

   ```typescript
   interface ApiResponse<T> {
     code: string;
     message: string;
     data: T;
     requestId?: string;
   }
   ```

2. 在 `apps/web-ele/src/api/request.ts` 中统一错误处理
3. 修复 request timeout bug (当前 `10_000_000_000` 应为 `10_000`)
4. 为每个 API 模块添加完整的类型注解

### Phase 3: vxe-table 封装规范化 (spec-02)

#### Step 3.1: 配置抽象

1. 创建 `packages/effects/plugins/vxe-table/` 下的封装配置
2. 抽取 `apps/web-ele/src/views/instance/edit/hooks/modules/useGridOptions.ts` 中的配置为可复用配置
3. 定义标准 `ColumnConfig` 接口
4. 实现列配置工厂函数 (固定列、计算列、填报列)

#### Step 3.2: 单元格组件注册

1. 完善 `packages/effects/plugins/vxe-table/extends.ts` 中的单元格渲染器
2. 实现特殊单元格类型 (斜体、绝对值、折叠、校验提示)
3. 基于 `constants/special.ts` 中的 `italicCodes`, `absCodes`, `collapseCodes` 实现样式映射

### Phase 4: 公式引擎增强 (spec-04)

#### Step 4.1: 依赖分析与重算优化

1. 审查现有 `utils/dependencies.ts` 的依赖图实现
2. 对比 spec-04 中 HyperFormula 的 `getAffectedCells` API
3. 实现增量重算优化 — 当前可能为全表重算，应改为受影响单元格重算
4. 完善循环引用检测的用户提示

#### Step 4.2: 财务函数验证

1. 编写 XIRR/XNPV/NPV/IRR 的对照测试（与 Excel 计算结果对比）
2. 确保浮点误差 < 1e-10
3. 补充 spec-04 中 P0 函数列表中缺失的函数实现

#### Step 4.3: HyperFormula 评估

```
评估项:
- 是否需要迁移到 HyperFormula?
- 当前自研引擎与 HyperFormula 的功能对比
- 迁移成本 vs 收益
```

建议: 当前自研引擎已满足 P0 函数需求，HyperFormula 迁移作为 Phase 3 的可选任务。

### Phase 5: Excel 导入导出优化

#### Step 5.1: Worker 优化

1. 审查 `workers/excel.ts` 的实现
2. 实现大文件分片导入
3. 添加导入进度条
4. 完善错误处理和回滚机制

#### Step 5.2: 导出功能增强

1. 支持按选择区域导出
2. 支持多 Sheet 导出
3. 实现脱敏导出（spec-07）

### Phase 6: 多人协作规划 (spec-03)

#### Step 6.1: 需求评估

1. 与利益相关者确认 Yjs 协作的具体需求范围
2. 确定是全量协作还是仅锁定协作
3. 评估离线功能优先级

#### Step 6.2: 技术方案细化

1. 设计 Y.Doc Schema（参考 spec-03 section 4.1）
2. 规划 WebSocket 服务部署
3. 设计锁定机制与 Supabase Realtime 的集成

### Phase 7: RAG 智能助手规划 (spec-05, spec-10)

#### Step 7.1: 向量化策略设计

1. 设计表格数据 Chunk 策略（参考 spec-05 section 4.3）
2. 规划 Qdrant Collection 配置
3. 设计 Embedding 模型选择（BGE-M3）

#### Step 7.2: Agent 工具集设计

1. 基于 spec-10 section 4.4 的工具集设计
2. 实现 CoT 思维链引擎
3. 实现 ReAct 执行循环
4. 实现 Human Gate 确认机制

---

## 第四部分：关键文件清单

### 核心业务文件

| 文件路径 | 说明 | 优先级 |
|---------|------|--------|
| `apps/web-ele/src/views/instance/edit/index.vue` | 核心编辑页面 (~35KB) | P0 |
| `apps/web-ele/src/views/instance/edit/utils/calculate.ts` | 公式计算引擎 | P0 |
| `apps/web-ele/src/views/instance/edit/utils/dependencies.ts` | 依赖图构建 | P0 |
| `apps/web-ele/src/views/instance/edit/hooks/modules/useData.ts` | 数据池管理 | P0 |
| `apps/web-ele/src/views/instance/edit/hooks/modules/useGridOptions.ts` | 表格配置 | P0 |
| `apps/web-ele/src/api/core/instance.ts` | 实例 API | P0 |
| `apps/web-ele/src/api/core/model.ts` | 模型 API | P0 |
| `apps/web-ele/src/store/model.ts` | 模型状态管理 | P0 |
| `apps/web-ele/src/views/instance/edit/math/index.js` | 财务函数 | P1 |
| `apps/web-ele/src/views/instance/edit/workers/excel.ts` | Excel Worker | P1 |
| `apps/web-ele/src/views/instance/edit/constants/special.ts` | 特殊指标配置 | P1 |
| `packages/effects/plugins/vxe-table/` | vxe-table 封装 | P1 |

### 文档文件

| 文件路径 | 说明 |
|---------|------|
| `docs/v2/specs/spec-01-architecture.md` | 系统架构设计 |
| `docs/v2/specs/spec-02-vxe-table.md` | vxe-table 封装规范 |
| `docs/v2/specs/spec-03-yjs-collab.md` | Yjs 协作同步 |
| `docs/v2/specs/spec-04-formula.md` | 公式引擎 |
| `docs/v2/specs/spec-05-rag.md` | RAG 智能助手 |
| `docs/v2/specs/spec-06-supabase.md` | Supabase 后端 |
| `docs/v2/specs/spec-07-security.md` | 安全与审计 |
| `docs/v2/specs/spec-08-test.md` | 测试策略 |
| `docs/v2/specs/spec-09-compliance.md` | 等保合规 |
| `docs/v2/specs/spec-10-agent.md` | RAG Agent |
| `database/参考内容/版本状态机.md` | 版本状态机 |
| `database/参考内容/公式计算模块.md` | 公式计算模块设计 |
| `database/参考内容/数据表结构.md` | 数据库表结构 |

---

## 附录 A: 当前代码质量问题

1. **`apps/web-ele/src/api/request.ts:10`** — timeout 值 `10_000_000_000` 明显是 bug，应为 `10_000` (10秒)
2. **`apps/web-ele/src/types/`** — 目录为空，类型分散在 store 和各处
3. **测试覆盖率低** — 核心公式计算和工具函数缺少单元测试
4. **`apps/web-ele/src/formula/`** — 目录为空占位，实际公式逻辑在 view 层
5. **`apps/web-ele/src/components/`** — 仅有一个空的 VueFormulaEditor 目录
6. **`apps/web-ele/src/views/model/editor/`** — 目录为空占位
7. **API 错误处理不统一** — 各 API 模块独立处理错误，缺少统一标准

---

## 附录 B: 快速启动命令

```bash
# 进入项目目录
cd /Users/taopeng/workspace/ai-economic

# 安装依赖
pnpm install

# 启动前端开发服务器
pnpm --filter web-ele dev

# 启动 Mock 后端
pnpm --filter backend-mock dev

# 类型检查
pnpm check:type

# 构建所有包
pnpm build

# 运行单元测试
pnpm test:unit

# Lint 检查
pnpm lint

# 格式化代码
pnpm format
```
