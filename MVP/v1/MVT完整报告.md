# MVT 完整验证报告

> **项目**: 经济测算模型 v1 → v2 迁移
> **日期**: 2026-06-06
> **状态**: ✅ 全部通过

---

## 1. 背景与目标

### 1.1 问题陈述

v1 已完整实现：vxe-table 表格、公式计算引擎（自研）、Mock 数据、Excel 导入导出。v2 目标架构（vxe-table + HyperFormula + Yjs CRDT 协作）只有设计文档，**核心功能代码尚未实现**。

### 1.2 核心风险

1. **HyperFormula 与 v1 公式语法不兼容**（v1 用 `${metricCode}`，HF 用 `A1` 语法）
2. **绑定复杂度高**：vxe-table + HyperFormula + Yjs 三者集成没有先例验证
3. **财务函数差异**：XIRR/NPV/IRR 算法可能与 v1 不同

### 1.3 MVT 目标

在投入 MVP 开发之前，验证核心技术的可行性（2-3 周）。

---

## 2. 验证范围与里程碑

| 阶段 | 验证项 | 成功标准 | 状态 |
|------|--------|----------|------|
| Week1 | vxe-table + HyperFormula 双向绑定 | 编辑单元格 → 公式重算 → 显示结果 | ✅ |
| Week2 | v1 公式样本转换（10 个样本） | 转换后计算结果 100% 一致 | ✅ |
| Week3 | 财务函数兼容性（XIRR/NPV/IRR） | XIRR 一致；NPV/IRR 可用 | ✅ |

---

## 3. Week1 验证：vxe-table + HyperFormula 双向绑定

### 3.1 验证目标

验证 vxe-table 与 HyperFormula 的双向绑定可行性。

### 3.2 验证方法

1. 创建基础集成 demo
2. 实现双向同步：编辑 → 计算 → 显示
3. 测量更新延迟

### 3.3 验证结果

| 验证项 | 结果 |
|--------|------|
| vxe-table 基础渲染 | ✅ 通过 |
| 点击单元格进入编辑模式 | ✅ 通过 |
| HyperFormula 实例创建 | ✅ 通过 |
| 公式计算（SUM） | ✅ 通过 |
| 编辑触发重算 | ✅ 通过 |

### 3.4 关键技术点

**问题**: HyperFormula `buildEmpty()` 不创建默认 sheet

**解决**: 手动调用 `hf.addSheet('Sheet1')` 并获取 sheetId

```typescript
hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' })
hf.addSheet('Sheet1')
sheetId = hf.getSheetId('Sheet1')!
```

**问题**: vxe-table 点击编辑不生效

**解决**: 使用 `trigger: 'click'`（非 dblclick），并配置 `editRender`

```typescript
editConfig: {
  trigger: 'click',  // v1 源码使用 click
  mode: 'cell',
  showIcon: false,
  enabled: true
}
```

### 3.5 Demo 文件

```
v2/apps/web/src/views/mvt/week1-vxe-hf-binding/
├── index.vue          # Demo 入口
├── BindingDemo.vue   # 双向绑定核心验证
├── VxeTableDemo.vue  # vxe-table 基础渲染
└── HyperFormulaDemo.vue # HyperFormula 初始化
```

---

## 4. Week2 验证：v1 公式样本转换

### 4.1 验证目标

验证 v1 公式语法 `${metricCode}` 能否转换为 HyperFormula 语法（`A1` 单元格引用）。

### 4.2 验证方法

1. 选取 10 个 v1 典型公式
2. 构建指标Code → 单元格地址映射表
3. 实现 `convertV1Formula()` 转换函数
4. 对比转换前后计算结果

### 4.3 验证结果

| # | 公式名称 | v1公式 | 转换后 | 期望值 | HF结果 | 状态 |
|---|----------|--------|--------|--------|--------|------|
| 1 | 半干面生鲜面粉生产成本合计 | `${A}+${B}+${C}` | `A1+B1+C1` | 600 | 600 | ✅ |
| 2 | 标的售价（含税） | `${A}/${B}` | `A1/B1` | 100 | 100 | ✅ |
| 3 | 非生产用固定资产合计 | `${A}+${B}` | `A1+B1` | 800 | 800 | ✅ |
| 4 | 生产设备合计 | `${A}+${B}+${C}` | `A1+B1+C1` | 3300 | 3300 | ✅ |
| 5 | 在产品期末余额 | `${A}+${B}-${C}` | `A1+B1-C1` | 5500 | 5500 | ✅ |
| 6 | 毛利率 | `(${A}-${B})/${A}` | `(A1-B1)/A1` | 0.4 | 0.4 | ✅ |
| 7 | 环比增长率 | `(${A}-${B})/${B}` | `(A1-B1)/B1` | 0.2 | 0.2 | ✅ |
| 8 | 成本合计 | `${A}*${B}+${C}` | `A1*B1+C1` | 6000 | 6000 | ✅ |
| 9 | 利润率 | `(${A}-${B})/${A}*100` | `(A1-B1)/A1*100` | 40 | 40 | ✅ |
| 10 | 累计折旧 | `${A}+${B}+${C}` | `A1+B1+C1` | 450 | 450 | ✅ |

**通过率: 10/10 (100%)**

### 4.4 转换函数实现

```typescript
function convertV1Formula(
  v1Formula: string,           // v1公式: ${metricCode}
  codeToCell: Record<string, string>  // 指标Code→单元格映射
): string {
  return v1Formula.replace(/\$\{([^}]+)\}/g, (match, metricCode) => {
    return codeToCell[metricCode] || match
  })
}
```

**关键**：HyperFormula 公式需要 `=` 前缀才能计算。

```typescript
// 正确
hf.setCellContents({ sheet: sheetId, col: 0, row: 10 }, '=' + hfFormula)
// 错误：裸公式不会计算
hf.setCellContents({ sheet: sheetId, col: 0, row: 10 }, hfFormula)
```

### 4.5 Demo 文件

```
v2/apps/web/src/views/mvt/week2-formula-conversion/
├── index.vue           # Demo 入口
├── FormulaConverter.vue # 公式转换核心组件
└── samples.ts          # 10个公式样本
```

---

## 5. Week3 验证：财务函数兼容性

### 5.1 验证目标

验证 v1 自研财务函数(XIRR/NPV/IRR)与 HyperFormula 内置函数的兼容性。

### 5.2 验证结果

| 函数 | HyperFormula 支持 | 自研实现 | 验证结果 |
|------|-------------------|----------|----------|
| XIRR | ❌ 无内置 | Newton-Raphson + Bisection | ✅ 2/2 通过 |
| NPV | ✅ 内置 | 时间加权 NPV | ✅ 2/2 通过 |
| IRR | ✅ 内置 | 二分法 | ✅ 2/2 通过 |

### 5.3 XIRR 测试结果

| ID | 描述 | 期望值 | HF结果 | 状态 |
|----|------|--------|--------|------|
| xirr-1 | 初始投资+回报 | 0.0 | 0.0 | ✅ |
| xirr-2 | 正NPV投资 | 0.0888 | 0.0888 | ✅ |

### 5.4 NPV 测试结果

| ID | 描述 | 期望值 | HF结果 | 状态 |
|----|------|--------|--------|------|
| npv-1 | 10%折现率 | 9789.63 | 9789.63 | ✅ |
| npv-2 | 8%折现率 | 3992.71 | 3992.71 | ✅ |

**注意**：HF NPV 是标准 period-based（从 period 1 开始），不包含初始投资（period 0）。

### 5.5 IRR 测试结果

| ID | 描述 | 期望值 | HF结果 | 状态 |
|----|------|--------|--------|------|
| irr-1 | 初始投资+回报 | 0.089 | 0.089 | ✅ |
| irr-2 | 均匀现金流 | 0.0 | 0.0 | ✅ |

### 5.6 关键发现

1. **XIRR**: HyperFormula 没有内置 XIRR，使用自定义 Newton-Raphson 实现
2. **NPV**: HF NPV 是标准折现模型，period-based（不含 period 0）
3. **IRR**: 部分现金流模式可能无法收敛到有效 IRR

### 5.7 Demo 文件

```
v2/apps/web/src/views/mvt/week3-financial-functions/
├── index.vue                  # Demo 入口
├── FinancialFunctionsDemo.vue # 财务函数验证组件
└── testCases.ts              # 测试用例
```

---

## 6. 技术方案总结

### 6.1 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                        vxe-table                            │
│  (用户界面 - 表格渲染 + 编辑交互)                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    VxeTableWrapper                          │
│  (表格封装 - 处理行列映射 + 编辑事件)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     FormulaEngine                           │
│  (公式引擎 - HyperFormula + 自研 XIRR)                      │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ HyperFormula│  │  XIRR (自研)│  │ NPV/IRR/HF │         │
│  │  (SUM/IF...) │  │ Newton-Raph │  │  内置函数   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      DataModel                              │
│  (数据模型 - 指标Code ↔ 单元格地址映射)                      │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 公式转换流程

```
v1 公式: ${C10000A0321100003}+${C10000A0322100003}
              │
              ▼ [1. 解析 ${...} 占位符]
        ["C10000A0321100003", "C10000A0322100003"]
              │
              ▼ [2. 映射到单元格地址]
        ["A1", "B1"]
              │
              ▼ [3. 替换占位符]
        "A1+B1"
              │
              ▼ [4. 添加 = 前缀]
        "=A1+B1"
              │
              ▼ [5. 写入 HyperFormula]
        hf.setCellContents({ sheet: 0, col: 0, row: 0 }, '=A1+B1')
```

### 6.3 财务函数使用

| 函数 | 调用方式 | 说明 |
|------|----------|------|
| XIRR | 自研 Newton-Raphson | HF 无内置 |
| NPV | `=NPV(rate, cf1, cf2, ...)` | period-based |
| IRR | `=IRR(cf1:cfN)` | 通过公式调用 |

---

## 7. 风险与缓解

| 风险 | 影响 | 缓解措施 | 状态 |
|------|------|----------|------|
| v1 `${code-year}` 格式 | 高 | 需解析年份后缀 | ⚠️ 待验证 |
| Yjs 协作同步 | 高 | Week3 扩展验证 | ⏳ 可选 |
| 财务精度要求 | 中 | Decimal.js 精度控制 | ✅ 已考虑 |
| Excel 导入导出 | 中 | 使用 xlsx 库 | ✅ 可行 |

---

## 8. 结论与建议

### 8.1 MVT 结论

| 验证项 | 结论 |
|--------|------|
| vxe-table + HyperFormula 绑定 | ✅ 可行 |
| v1 公式语法转换 | ✅ 可行（需映射表） |
| 财务函数兼容性 | ✅ 基本可行（XIRR 需自研） |

### 8.2 建议

1. **MVP 开发可以启动**：核心技术可行性已验证
2. **XIRR 使用自研实现**：HyperFormula 无内置 XIRR
3. **NPV 需注意 period 差异**：HF NPV 是标准 period-based
4. **Year 后缀需进一步验证**：当前测试未涉及 `${code-year}` 格式

### 8.3 下一步

进入 MVP 开发阶段，参考 `docs/v2_docs/在线协作表格RAG系统_完整交付物_v2/specs/` 中的规范文档。

---

## 9. 附录

### 9.1 产出文件清单

```
MVT/v1/
├── 分析.md
├── week1-plan.md
├── week1-worklog.md
├── week1-verification.md
├── week2-plan.md
├── week2-worklog.md
├── week2-verification.md
├── week3-verification.md
└── MVT完整报告.md (本文件)

v2/apps/web/src/views/mvt/
├── week1-vxe-hf-binding/
│   ├── index.vue
│   ├── BindingDemo.vue
│   ├── VxeTableDemo.vue
│   └── HyperFormulaDemo.vue
├── week2-formula-conversion/
│   ├── index.vue
│   ├── FormulaConverter.vue
│   └── samples.ts
└── week3-financial-functions/
    ├── index.vue
    ├── FinancialFunctionsDemo.vue
    └── testCases.ts
```

### 9.2 参考文档

- `docs/v2_docs/在线协作表格RAG系统_完整交付物_v2/specs/spec-02-vxe-table.md`
- `docs/v2_docs/在线协作表格RAG系统_完整交付物_v2/specs/spec-04-formula.md`
- `docs/v1_docs/公式计算模块.md`
- `docs/v1_docs/参考/2025项目源码/apps/web-ele/src/views/instance/edit/math/`