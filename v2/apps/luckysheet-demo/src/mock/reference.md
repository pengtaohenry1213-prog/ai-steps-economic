
## 经济模型系统 — 单元格 & 公式数据格式 & 数据库表结构分析

根据 `edit/index.vue` 及相关源码、mock 数据，我推断出以下数据库表结构与数据格式：

---

### 一、核心数据流总览

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        经济模型系统 数据架构总览                                │
├──────────────────────────────────────────────────────────────────────────────┤
│  ① model_metric (指标配置表)                                                  │
│     └── 指标定义: metricCode, metricName, unit, scale, level, metricCategory │
│                                                                             │
│  ② model_page (页面配置表)                                                   │
│     └── 页面定义: pageCode, pageName, modelType (0=输入/1=输出)            │
│                                                                             │
│  ③ model_formula (公式表)                                                   │
│     └── 公式定义: metricCode, formulaExpression, formulaName, formulaType    │
│                                                                             │
│  ④ datamodel_version (实例版本表)                                           │
│     └── 版本实例: versionCode, forecastTimeType/Range, modelType             │
│                                                                             │
│  ⑤ instance_metric (实例指标数据表)  ← 实际单元格值存储                        │
│     └── 每个单元格: metricCode + dateField → value                          │
│                                                                             │
│  ⑥ instance_metric_value (实例单元格值表)                                    │
│     └── 单元格值: id, metricCode, reportYear, value                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

### 二、表结构详细分析

#### 1. `model_metric` — 指标配置表

```sql
CREATE TABLE model_metric (
  id              VARCHAR(50)   PRIMARY KEY,    -- 雪花ID, e.g. "01jv496ykxfz1928k65fezrzy3"
  model_code      VARCHAR(50)  NOT NULL,       -- 模型编码
  page_code      VARCHAR(50)  NOT NULL,       -- 页面编码
  metric_code     VARCHAR(50)  NOT NULL,       -- 指标编码 (唯一), e.g. "C10000A0199_LP"
  metric_name     VARCHAR(200) NOT NULL,      -- 指标名称, e.g. "土地使用权预付账款期末金额"
  p_metric_code  VARCHAR(50),                -- 父级指标编码 (树形结构)
  level          INT DEFAULT 0,              -- 层级 (0=顶级, 1=二级, ...)
  metric_category INT DEFAULT 0,             -- 指标类别: 0=填报(输入) 1=计算(公式)
  unit           VARCHAR(50),                -- 单位, e.g. "元/吨", "年", "%"
  scale          VARCHAR(20) DEFAULT '1',     -- 刻度/比例, e.g. "10000" (万), "1"
  sort           INT,                        -- 排序
  del_flag       INT DEFAULT 0,              -- 删除标记: 0=正常, 1=删除
  op_user        VARCHAR(50),                -- 操作人
  op_time        DATETIME,                   -- 操作时间
  remarks        TEXT,                       -- 备注/描述
  version_code   VARCHAR(50),                -- 版本编码
  is_fixed       INT DEFAULT 1,              -- 是否固定值: 0=单一值 1=多期值
  CONSTRAINT uk_metric_code_version UNIQUE (metric_code, version_code)
);
```

**前端数据结构示例：**

```typescript
// 单行数据 (一个指标)
interface MetricRow {
  id: string;                    // "01jv496ykxfz1928k65fezrzy3"
  metricCode: string;            // "C10000A0199_LP"
  metricName: string;            // "土地使用权预付账款期末金额"
  pMetricCode: string;          // "C10000A0198"
  level: number;                 // 1
  metricCategory: number;        // 1 (计算指标)
  unit: string;                  // "元"
  scale: string;                 // "10000"
  sort: number;                 // 1
  isFixed: number;               // 0 或 1
  emmId: string;                // 实体行ID (用于树形关系)
  parentEmmId: string;          // 父级实体行ID
  remarks: string;
  
  // 动态日期列, 根据 forecastTimeRange 生成
  "2025": number | string;
  "2026": number | string;
  "2027": number | string;
  // ... 最多 20 列 (2025~2044)
  "2025-1": number;  // 季度格式
  "2025-2": number;
  "2025-3": number;
  "2025-4": number;
}
```

#### 2. `model_formula` — 公式表

```sql
CREATE TABLE model_formula (
  id                  VARCHAR(50) PRIMARY KEY,  -- UUID
  version_code        VARCHAR(50) NOT NULL,     -- 版本编码
  metric_code        VARCHAR(50) NOT NULL,     -- 指标编码
  formula_name       VARCHAR(200),              -- 公式名称, e.g. "土地使用权预付账款期末金额"
  formula_description TEXT,                     -- 公式描述, e.g. "土地使用权预付账款期初金额+..."
  formula_expression TEXT NOT NULL,             -- 公式表达式 (核心!)
  formula_type       INT DEFAULT 0,           -- 公式类型: 0=普通 1=特殊(期初/期末)
  file_path          VARCHAR(500),             -- 文件路径
  sort               INT DEFAULT 0,
  del_flag           INT DEFAULT 0,
  op_user            VARCHAR(50),
  op_time            DATETIME,
  CONSTRAINT uk_formula_metric_version UNIQUE (metric_code, version_code)
);
```

**公式表达式语法 (`formula_expression`)：**

```typescript
// 基础引用
"${C10000A0199}"                           // 引用指标值 (自动带日期字段)

// 特殊前缀引用
"${prev-C10000A0199}"                      // 上期值 (previous period)
"${periodAdd-C10000A0199}"                // 周期累计 (含当前)
"${prevPeriodAdd-C10000A0199}"            // 往期累计 (不含当前)
"${futurePeriodAdd-C10000A0199}"          // 后期累计
"${total-C10000A0199}"                    // 所有日期总和
"${totalYear-C10000A0199}"                // 一年数据总和
"${arrayAllValue-C10000A0199}"            // 所有日期值数组
"${lastPeriod-C10000A0199}"                // 年/季度最后期间值

// 全局变量
"${global-arrayAllDate}"                  // 日期数组 ["2025","2026",...]
"${global-arrayAllPeriod}"                 // 期数数组 [1,2,3,...,20]
"${global-periodNumber}"                   // 总期数 20
"${global-periodMonths}"                   // 每期月数 (年:12, 季:3)
"${var-everyPeriod}"                      // 当前期数 (从1开始)

// 复杂表达式示例
"${prev-C10000A0199}"                     // 简单: 期初=上期
"${C10000A0287_LP}+${C10000A0285}+${C10000A0286}+${C10000A0304}"
  // 累加: 期初+预付+摊销+报废
"Math.max(${C10000A0401}-${C10000A0403}-${prevPeriodAdd-C10000A0404},0)"
  // 嵌套: MAX(值1-值2-往期累计, 0)
"XIRR(${arrayAllValue-C10000A0482},${global-arrayAllDate})"
  // 财务: 内部收益率
"NPV(${arrayAllValue-C10000A0482},0.08,${global-arrayAllDate})"
  // NPV: 净现值
```

#### 3. `datamodel_version` — 版本实例表

```sql
CREATE TABLE datamodel_version (
  id                    VARCHAR(50) PRIMARY KEY,  -- 雪花ID
  version_code         VARCHAR(50) UNIQUE NOT NULL,  -- 版本编码 (e.g. "4350E538D3254DE1B375EE04854C76EE")
  version_name         VARCHAR(200),              -- 版本名称, e.g. "完整20年"
  model_code           VARCHAR(50) NOT NULL,      -- 模型编码
  model_type           VARCHAR(20),              -- 模型类型: "完整模型" | "速算模型"
  currency_code        VARCHAR(10),               -- 币种: "CNY" | "USD"
  forecast_time_type   VARCHAR(10),                -- 时间类型: "year" | "quarter" | "month"
  forecast_time_range  VARCHAR(50),                -- 时间范围: "2025,2044" 或 "2025-1,2045-4"
  version_config      JSON,                       -- 版本配置 (presets等), e.g. {"presets":{"2025":"F","2026":"F"}}
  investment_subject   VARCHAR(50),               -- 投资主体编码
  investment_type     VARCHAR(50),               -- 投资类型: "固定资产类-新增产能"
  target_industry     VARCHAR(50),               -- 目标行业: "农粮" | "食品"
  project_code        VARCHAR(50),               -- 项目编码
  project_name        VARCHAR(200),              -- 项目名称
  status              INT DEFAULT 0,               -- 状态: 0=未提交 1=已提交
  is_locked           VARCHAR(50),               -- 锁定人账号
  del_flag            INT DEFAULT 0,
  op_user             VARCHAR(50),
  op_time             DATETIME,
  version_config      JSON                      -- 预设值配置, 结构: {"presets": {"2025": "F", "2026": "A"}}
);
```

#### 4. `instance_metric` — 实例指标数据表 (主数据表)

```sql
CREATE TABLE instance_metric (
  id              VARCHAR(50) PRIMARY KEY,
  metric_code     VARCHAR(50) NOT NULL,       -- 指标编码
  unit_code       VARCHAR(50),                  -- 单位编码
  unit            VARCHAR(50),                  -- 单位名称
  scale          VARCHAR(20),                  -- 刻度
  version_code    VARCHAR(50) NOT NULL,        -- 版本编码
  model_code      VARCHAR(50),                  -- 模型编码
  report_year    VARCHAR(10),                  -- 报表年份: "2025"
  report_quarter VARCHAR(5),                  -- 报表季度: "1" (非季度模型为空)
  report_month   VARCHAR(5),                  -- 报表月份: "1" (仅月度模型)
  value          DECIMAL(20, 6),             -- 指标值 (已乘scale)
  value_type     VARCHAR(10),                  -- 值类型: "F"(预测) | "A"(实际)
  del_flag       INT DEFAULT 0,
  op_user        VARCHAR(50),
  op_time        DATETIME,
  CONSTRAINT uk_metric_date UNIQUE (metric_code, version_code, report_year, report_quarter, report_month)
);
```

**前端数据结构示例（保存时的聚合结构）：**

```typescript
// 保存请求 payload
interface SaveInstancePayload {
  modelMetrics: ModelMetric[];   // 单位/刻度配置
  dataEntries: DataEntry[];       // 单元格值
  crUser: string;               // 创建人
  companyCode: string;            -- 公司编码
}

// 每个 ModelMetric
interface ModelMetric {
  id: string;             // 行ID (emmId)
  metricCode: string;      // 指标编码
  unitCode: string;        // 单位编码
  unit: string;            // 单位名称
  scale: string;           -- 刻度
  modelCode: string;        -- 模型编码
  versionCode: string;      -- 版本编码
}

// 每个 DataEntry
interface DataEntry {
  id: string;             -- 单元格ID (数据库主键)
  metricCode: string;      -- 指标编码
  value: number;           -- 值
  reportYear: string;       -- "2025"
  reportQuarter?: string;   -- "1" (季度模型)
  modelCode: string;
  versionCode: string;
}
```

#### 5. `model_page` — 页面配置表

```sql
CREATE TABLE model_page (
  id          VARCHAR(50) PRIMARY KEY,
  model_code  VARCHAR(50) NOT NULL,      -- 模型编码
  page_code  VARCHAR(50) UNIQUE NOT NULL, -- 页面编码 (UUID)
  page_name  VARCHAR(100),               -- 页面名称, e.g. "假设输入-标的输入"
  model_type INT DEFAULT 0,               -- 页面类型: 0=参数输入 1=参数输出 2=经济扫描
  sort       INT,
  del_flag   INT DEFAULT 0,
  op_user    VARCHAR(50),
  op_time    DATETIME
);
```

---

### 三、公式解析后的内部数据结构

#### `formulaMap` — 公式关系图 (内存中)

```typescript
// key: `${metricCode}-${field}`, value: FormulaNode
// e.g. "C10000A0199-2025" -> FormulaNode

interface FormulaNode {
  id: string;              // "C10000A0199-2025" = metricCode-field
  metricCode: string;       // "C10000A0199"
  field: string;            // "2025" = 时间字段
  formula: string;          // 原始表达式, e.g. "${prev-C10000A0198}"
  formulaName: string;      // "土地使用权预付账款期末金额"
  marks: Array<{            // 解析后的变量标记
    deCode: string;        // 原始表达式中的变量字符串
    enCode: string;        // 解析后的编码, e.g. "prev-C10000A0198"
    from: number;          // 在表达式中的起始位置
    to: number;            // 在表达式中的结束位置
  }>;
  calcMarks: string[];      // 计算依赖的ID数组, e.g. ["C10000A0198-2025"]
  children: Array<{ id: string; field: string }>;  // 依赖当前节点的子节点
  parent: string[];         // 依赖当前节点的父节点
}

// 示例
{
  "C10000A0199-2025": {
    id: "C10000A0199-2025",
    metricCode: "C10000A0199",
    field: "2025",
    formula: "${prev-C10000A0198}",
    formulaName: "土地使用权预付账款期末金额",
    marks: [{ deCode: "${prev-C10000A0198}", enCode: "prev-C10000A0198", from: 0, to: 20 }],
    calcMarks: ["C10000A0198-2024"],   // 依赖上一年
    children: [],
    parent: ["C10000A0198-2025"]       // 被谁依赖
  }
}
```

#### `dataPool` — 数据池 (内存中)

```typescript
// 数据池结构: { metricCode: { field: value, ... }, ... }
interface DataPool {
  [metricCode: string]: {
    [field: string]: number | string;
    // 也包含非日期字段
    unitCode?: string;
    unit?: string;
    scale?: string;
    isFixed?: number;
    level?: number;
    metricCategory?: number;
  }
}

// 示例
{
  "C10000A0199": {
    "2025": 15000000,
    "2026": 16500000,
    "2027": 18000000,
    unitCode: "U001",
    unit: "元",
    scale: "10000",
    isFixed: 1,
    level: 1,
    metricCategory: 0
  }
}
```

---

### 四、计算引擎核心数据结构

```typescript
// 全局配置
interface GlobalConfig {
  startTime: string;          // 起始时间: "2025"
  periodNumber: number;       // 期数: 20
  periodMonths: number;       // 每期月数: 12 (年) | 3 (季度) | 1 (月)
  timeType: string;           // "year" | "quarter" | "month"
  targetIndustry: string;     // "农粮"
  investmentType: string;      // "新建"
  calcMethod: number;         // 0=后端计算 1=前端计算
  isLoad: boolean;             // 是否加载完成
}

// 依赖图 (DAG)
interface DependencyGraph {
  [cellId: string]: string[];  // cellId -> 依赖它的所有 cellId
  // e.g. "C10000A0199-2025" -> ["C10000A0198-2025", "C10000A0198-2026"]
}

// 拓扑排序后的计算顺序
type CalculationOrder = string[];
// e.g. ["C10000A0198-2025", "C10000A0199-2025", "C10000A0200-2025", ...]
```

---

### 五、Mock 数据示例（可直接用于 MVP）

```typescript
// 1. 指标数据 (简化的速算模型)
export const mockMetrics = [
  {
    metricCode: "Q10000A0001",
    metricName: "投资总额",
    metricCategory: 0,  // 填报
    level: 0,
    isFixed: 0,
    unit: "万元",
    scale: "1",
    "2025": 8000,
    "2026": 8000,
    "2027": 0,
  },
  {
    metricCode: "Q10000A0002",
    metricName: "营业收入",
    metricCategory: 0,
    level: 0,
    isFixed: 1,
    unit: "万元",
    scale: "1",
    "2025": 5000,
    "2026": 6000,
    "2027": 7000,
  },
  {
    metricCode: "Q10000A0044",
    metricName: "项目IRR",
    metricCategory: 1,  // 计算
    level: 0,
    isFixed: 1,
    unit: "%",
    scale: "0.01",
  },
];

// 2. 公式数据
export const mockFormulas = [
  {
    metricCode: "Q10000A0044",
    formulaExpression: "IRR(${arrayAllValue-Q10000A0002})",
    formulaName: "项目IRR",
    formulaDescription: "XIRR(营业收入现金流)",
  },
  {
    metricCode: "Q10000A0045",
    formulaExpression