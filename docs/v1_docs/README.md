# 经济模型系统前端项目说明文档

## 项目概述

该项目是基于 Vue 3 + TypeScript + Vite + Element Plus 构建的现代化前端项目，采用 monorepo 架构，是经济模型系统的前端部分。

## 技术栈

核心框架：Vue 3
开发语言：TypeScript
构建工具：Vite
UI 框架：Element Plus
状态管理：Pinia
路由管理：Vue Router
表格组件：VXE Table、Handsontable
工具库：VueUse、Dayjs、Decimal.js
国际化：内置多语言支持
样式处理：Tailwind CSS

## 1. 主要功能模块

### 1.1 模块总览图

```plain
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              web-ele 系统架构                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│  │   视图层 View   │    │   状态层 State   │    │   接口层 API    │              │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤              │
│  │ instance/edit   │    │ useData         │    │ core/instance  │              │
│  │ components/*    │◀──▶│ useFormula      │◀──▶│ core/model      │              │
│  │ dashboard/*     │    │ useChangeData   │    │ core/formula   │              │
│  │ table/*         │    │ usePageData     │    │ core/auth      │              │
│  │                 │    │ useAnimationData│    │ request        │              │
│  │                 │    │ useGridOptions  │    │                │              │
│  └────────┬────────┘    └────────┬────────┘    └─────────────────┘              │
│           │                      │                                              │
│           ▼                      ▼                                              │
│  ┌─────────────────────────────────────────────────────────┐                    │
│  │                     工具层 Utils                          │                    │
│  ├─────────────────────────────────────────────────────────┤                    │
│  │ calculate.ts      │ topological.ts   │ dependencies.ts  │                    │
│  │ format.ts        │ cycle.ts         │ column/*         │                    │
│  │ util.ts          │ workers/*        │ constants/*      │                    │
│  └─────────────────────────────────────────────────────────┘                    │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────┐                    │
│  │                   后端层 Backend Mock                    │                    │
│  ├─────────────────────────────────────────────────────────┤                    │
│  │ api/model/*    │ api/instance/*    │ api/auth/*      │                    │
│  │ utils/jwt      │ utils/response    │ middleware/*     │                    │
│  └─────────────────────────────────────────────────────────┘                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 核心功能

- 经济模型计算
- 数据可视化
- 公式编辑
- Excel 导入导出
- 多语言支持

### 1.3 技术特性

- 基于 Vite 的快速开发体验
- TypeScript 类型支持
- 模块化的状态管理
- 响应式布局
- 主题定制
- 权限控制

### 1.4 开发工具支持

- 支持热更新
- 代码规范检查
- 构建分析
- 类型检查

## 2. 业务概述

### 2.1 核心业务定位

| 维度 | 描述 |
|------|------|
| **产品类型** | 经济模型系统 - 企业级财务预测与分析平台 |
| **用户角色** | 集团用户、企业用户（通过 iframeParams 区分） |
| **核心场景** | 经济模型创建 → 版本实例化 → 数据录入 → 公式计算 → 分析输出 |

### 2.2 业务模型类型

```bash
完整模型（完整模型）
    ├── 假设输入（interfaceType: 0）
    ├── 模型测算（interfaceType: 1）
    ├── 指标输出（interfaceType: 3）
    └── 图形展示（interfaceType: 4）
    └── 经济扫描（interfaceType: 2）← 特殊模块

速算模型
    └── 假设输入（单页）
```

---

## 3. 业务流程分析

### 3.1 主流程：模型编辑完整链路

```bash
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  选择模型    │ ──▶ │  创建版本   │ ──▶ │  配置参数   │ ──▶ │  编辑数据   │
│  getModel   │     │  创建实例   │     │  时间/币种  │     │  单元格编辑 │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  导出报告   │ ◀── │  图形分析   │ ◀── │  公式计算   │ ◀── │  数据校验   │
│  Excel导出  │     │  图表展示   │     │  DAG计算    │     │  导入比对   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### 3.2 页面加载初始化流程

```typescript
// 参考: apps/web-ele/src/views/instance/edit/index.vue
onMounted(async () => {
  await fetchAllList();     // ① 单位、项目、币种、投资公司、公式列表
  await runInstance();      // ② 版本信息
  await runMenu();          // ③ 模型菜单
  initPageColumns();        // ④ 列配置（时间列）
  await runLoadData();      // ⑤ 所有页面数据
  activePageCode = ...;     // ⑥ 激活第一个sheet
  pageLoading = false;
  runFormula();             // ⑦ 公式加载 + 拓扑排序
});
```

---

## 4. 数据流程分析

### 核心状态管理模块

见 “核心状态管理模块-Hooks.md” 文档

### 4.1 前端状态管理层

```plain
┌─────────────────────────────────────────────────────────────────┐
│                    前端数据池架构                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Data Pool  │  │  Page Pool  │  │ Change Pool │              │
│  │  useData    │  │ usePageData │  │useChangeData│              │
│  │             │  │             │  │             │              │
│  │ {code: {   │  │ {pageCode:  │  │ {code: {    │              │
│  │   2025: 100│  │   [rows]    │  │   2025: 200│              │
│  │   2026: 200│  │  }          │  │  }         │              │
│  │ }}         │  │             │  │             │              │
│  └─────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│        │                 │                 │                     │
│        └────────┬────────┴────────┬───────┘                     │
│                 ▼                  ▼                              │
│          ┌─────────────┐  ┌─────────────┐                        │
│          │ Formula Pool│  │AnimationPool│                        │
│          │ useFormula  │  │useAnimation │                        │
│          │             │  │             │                        │
│          │ {code:      │  │ {key: oldVal│                        │
│          │  formulaStr │  │  }         │                        │
│          │ }           │  │             │                        │
│          └─────────────┘  └─────────────┘                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**关键状态管理文件**：
- `views/instance/edit/hooks/modules/useData.ts` - 核心数据池
- `views/instance/edit/hooks/modules/useFormula.ts` - 公式管理
- `views/instance/edit/hooks/modules/useChangeData.ts` - 变更追踪

### 4.2 后端 API 接口层

#### API 网关前缀

```bash
/gateway/economodel
```

#### 核心接口列表

| 接口路径 | 方法 | 功能 | 关键参数 |
| --- | --- | --- | --- |
| `/economodel/datamodel/page` | POST | 模型列表分页 | pageNo, pageSize |
| `/economodel/datamodelversion/page` | POST | 版本列表 | versionCode |
| `/economodel/datamodelversion/list` | POST | 单个版本详情 | versionCode |
| `/economodel/datamodelversion/saveOrUpdate` | PUT | 更新版本配置 | id, status, isLocked |
| `/economodel/modelpages/list` | POST | 模型页面菜单 | modelCode |
| `/economodel/modelmetric/list` | POST | 模型指标配置 | modelCode, pageCode |
| `/economodel/modelformula/list` | POST | 公式列表 | mm.versionCode |
| `/economodel/dataentry/getModelTableData` | GET | 页面数据 | versionCode, pageCode |
| `/economodel/dataentry/saveAll` | PUT | 保存数据 | modelMetrics[], dataEntries[] |
| `/economodel/currencydictionary/list` | POST | 币种列表 | - |
| `/economodel/unitcategory/unitAndCategorylist` | POST | 单位列表 | - |
| `/investsystem/projectbase/findAllByProfCompy` | GET | 投资公司列表 | - |
| `/investsystem/projectbase/findAllByProject` | GET | 项目列表 | - |

### 4.3 数据模型关系

```plain
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│    DataModel    │      │ DataModelVersion│      │  ModelMetric    │
│     (模型)       │──1:N─│    (版本实例)    │──1:N─│   (指标配置)    │
├─────────────────┤      ├─────────────────┤      ├─────────────────┤
│ modelCode (PK)  │      │ versionCode (PK)│      │ metricCode (FK)│
│ modelName       │      │ modelCode (FK)  │      │ versionCode (FK)│
│ modelType       │      │ versionName     │      │ pageCode (FK)   │
│ versionConfig   │      │ status (0/1)    │      │ metricName      │
│ forecastTimeType│      │ forecastTimeRange│     │ unitCode        │
│ ...             │      │ isLocked        │      │ isFixed         │
└─────────────────┘      └─────────────────┘      │ level           │
                                                 │ parentEmmId     │
                                                 └────────┬────────┘
                                                          │
                       ┌─────────────────────────────────┼─────────────────┐
                       │                                 │                 │
                       ▼                                 ▼                 ▼
              ┌─────────────────┐              ┌─────────────────┐ ┌─────────────────┐
              │    DataEntry    │              │  ModelFormula   │ │   ModelPage     │
              │   (单元格数据)    │              │    (公式定义)    │ │   (页面定义)    │
              ├─────────────────┤              ├─────────────────┤ ├─────────────────┤
              │ metricCode (FK) │              │ metricCode (FK) │ │ pageCode (PK)   │
              │ versionCode (FK)│              │ formulaExpression│ │ pageName        │
              │ reportYear      │              │ depends[]       │ │ interfaceType   │
              │ reportQuarter   │              │ luaScript       │ │ modelType       │
              │ value           │              │ ...             │ │ sort            │
              └─────────────────┘              └─────────────────┘ └─────────────────┘
```

---

## 5. 操作流程分析

### 5.1 单元格编辑流程

```plain
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ 用户编辑 │────▶│ 更新数据池 │────▶│ 更新变化池 │────▶│ 触发计算 │
│ 单元格   │     │ setData  │     │setChangeData│    │ calculate│
└──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                          │
                                                          ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ UI刷新   │◀────│ 更新页面池 │◀────│ DAG遍历  │◀────│ 拓扑排序 │
│ 重新渲染  │     │updatePage│     │ 按序计算 │     │ fullOrder│
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### 5.2 保存数据流程

```typescript
// 参考: apps/web-ele/src/views/instance/edit/index.vue
async function saveData() {
  // 1. 收集变化数据
  const { unitCode, unit, scale, ...dates } = changeData.value;
  
  // 2. 组装 modelMetrics（行级：单位、刻度）
  const modelMetrics = [];
  Object.keys(idMap).forEach(rowId => {
    modelMetrics.push({ id: rowId, metricCode, unitCode, unit, scale });
  });
  
  // 3. 组装 dataEntries（单元格级：每个时间点的值）
  const dataEntries = [];
  Object.keys(dates).forEach(date => {
    dataEntries.push({ id: idMap[rowId][date], metricCode, value, reportYear, reportQuarter });
  });
  
  // 4. 调用保存接口
  await saveInstanceData({ modelMetrics, dataEntries, crUser, companyCode });
  
  // 5. 更新操作用户
  await updateInstanceConfig({ id, opUser });
}
```

### 5.3 导入 Excel 流程

```plain
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 选择Excel文件 │────▶│ 解析Workbook │────▶│ 校验指标代码 │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                          ┌───────────────────────┤
                          ▼                       ▼
                   ┌──────────────┐       ┌──────────────┐
                   │ 校验通过      │       │ 校验失败      │
                   └──────┬───────┘       └──────┬───────┘
                          │                       │
                          ▼                       ▼
                   ┌──────────────┐       ┌──────────────┐
                   │ 清空可视行    │       │ 提示错误信息  │
                   │ 解析数据     │       │ 中止导入     │
                   └──────┬───────┘       └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ 更新数据池    │
                   │ 全量公式计算  │
                   │ 刷新UI       │
                   └──────────────┘
```

---

## 6. 技术要点提炼

### 6.1 核心技术栈

| 层级 | 技术选型 | 用途 |
| :---: | :---: | :---: |
| **前端框架** | Vue 3 + TypeScript | 组合式 API 开发 |
| **状态管理** | 自定义 Hooks (useData等) | 轻量级状态管理 |
| **表格组件** | vxe-table | 高性能树形表格 |
| **UI 组件** | Element Plus | 弹窗、抽屉、表单 |
| **HTTP** | vue-hooks-plus | 请求封装与缓存 |
| **数学计算** | Decimal.js | 精确财务计算 |
| **Excel** | xlsx (SheetJS) | 导入导出 |
| **Web Workers** | 原生 Worker | 计算与导出分离线程 |
| **Monorepo** | pnpm + turbo | 项目管理 |

### 6.2 公式计算引擎

见 “公式计算模块.md” 文档

### 6.3 单位换算系统

```typescript
// 参考: apps/web-ele/src/views/instance/edit/components/Input.vue
// 刻度（scale）控制显示单位与基础单位的转换
// 例如：千元(scale=1000)、万元(scale=10000)

// 计算基础单位值
const getBaseValue = (value: number, scale: number) => {
  return new Decimal(value).mul(scale).toNumber();
};
```

### 6.4 编辑权限控制

```typescript
// 参考: index.vue - canEdit computed
const canEdit = computed(() => {
  if (isDev) return true;                    // 开发环境
  if (iframeParams?.isGroup) return true;   // 集团用户
  if (status === 1) return false;           // 已提交
  if (query.isLocked) {
    return query.isLocked === iframeParams.account; // 锁定者本人
  }
  // 未锁定时加锁
  runSaveConfig({ id, isLocked: account });
  return true;
});
```

### 6.5 树形表格处理

```typescript
// 参考: index.vue - loadPage
// 构建 parentField、rowField 关系
if (level > 0) {
  for (let i = index - 1; i >= 0; i--) {
    if (res[i].level === level - 1) {
      item.parentEmmId = res[i].emmId;
      break;
    }
  }
}
```

### 6.6 动画数据追踪

```typescript
// 参考: hooks/modules/useAnimationData.ts
// 记录单元格变化前的旧值，用于翻转动画
const addAnimationData = (key: string, oldValue: any) => {
  // 当单元格值变化时，先记录旧值到动画池
};
```

### 6.7 表格列配置模块

见 “表格列配置模块.md” 文档

### 6.8 单元格组件模块

见 “单元格组件模块.md” 文档

### 6.9 Store 模块

见 “Store 模块.md” 文档

### 6.10 API 模块

见 “API 模块.md” 文档

### 6.11 Web Worker 模块

见 “Web Worker 模块.md” 文档

### 6.12 后端 Mock 模块

见 “后端 Mock 模块.md” 文档

### 6.13 关键业务流程时序图

见 “关键业务流程时序图.md” 文档

### 6.14 数据表结构

见 “数据表结构.md” 文档

---

## 7. 关键文件清单

### 7.1 前端核心文件

| 文件路径 | 功能描述 |
| --- | --- |
| `views/instance/edit/index.vue` | 主编辑器页面（约1250行） |
| `views/instance/edit/hooks/modules/*.ts` | 5个核心状态管理hooks |
| `views/instance/edit/utils/calculate.ts` | 公式计算引擎 |
| `views/instance/edit/utils/topological.ts` | Kahn拓扑排序 |
| `views/instance/edit/utils/format.ts` | 格式化工具 |
| `views/instance/edit/components/Input.vue` | 单元格输入组件 |
| `views/instance/edit/components/Operate.vue` | 操作按钮区 |
| `api/core/instance.ts` | 版本相关API |
| `api/core/model.ts` | 模型相关API |
| `api/core/formula.ts` | 公式相关API |
| `store/index.ts` | Pinia store |

### 7.2 后端 Mock 文件

| 文件路径 | 功能描述 |
| --- | --- |
| `api/model/list.ts` | 模型列表 |
| `api/instance/info.ts` | 实例详情 |
| `api/auth/login.post.ts` | 登录认证 |
| `utils/jwt-utils.ts` | JWT工具 |

---

## 8. 非功能需求要点

| 维度 | 现状/建议 |
| --- | --- |
| **性能** | 使用 Web Worker 进行计算和Excel导出，避免阻塞主线程 |
| **精确度** | 使用 Decimal.js 处理财务数据，避免浮点误差 |
| **权限** | 单元格级锁定机制，支持版本状态控制 |
| **可观测性** | console.time 计时代码执行耗时 |
| **可维护性** | Hooks 模块化状态管理，职责单一 |

---

## 9. 升级项目建议关注点

### 9.1 可能需要升级的方向

1. **实时协作** - 当前为单用户编辑，可考虑 Yjs CRDT 协作
2. **公式引擎** - 可考虑 HyperFormula 替换自研计算
3. **持久化** - Supabase Realtime 替代当前轮询/手动保存
4. **权限细化** - 单元格级权限控制升级
5. **审计日志** - 完善的操作变更追踪

### 9.2 API 层建议

- 考虑 GraphQL 替代 REST，便于复杂数据查询
- 引入 tRPC 实现前后端类型安全
- API 版本化管理

---

## 10 版本状态机

见 “版本状态机.md” 文档

## 11 权限控制矩阵

见 “权限控制矩阵.md” 文档
