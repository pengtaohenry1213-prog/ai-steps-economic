# Spec-04: 公式引擎（HyperFormula）

> **版本**: v1.0  
> **状态**: Draft  
> **负责人**: [待填写]  
> **评审人**: [待填写]  
> **关联 Spec**: spec-01, spec-02

---

## 1. 目标与范围

### 1.1 目标
定义 HyperFormula 公式计算引擎的集成规范，确保公式解析、依赖追踪、增量重算、循环引用检测 100% 准确。

### 1.2 范围
- ✅ HyperFormula 初始化与配置
- ✅ 公式语法支持（Excel 兼容）
- ✅ 依赖图构建与增量重算
- ✅ 循环引用检测与处理
- ✅ 与 vxe-table 的数据同步
- ✅ 公式错误处理（#REF! / #VALUE! / #DIV/0! 等）

### 1.3 不在范围内
- ❌ VBA 宏支持
- ❌ 自定义函数（JavaScript 函数注入）—— 二期扩展

---

## 2. 术语定义

| 术语 | 定义 |
|------|------|
| HyperFormula | 开源公式计算引擎，支持 386+ Excel 函数 |
| Dependency Graph | 公式依赖图，记录单元格间的引用关系 |
| Volatile Function | 易变函数（如 RAND, NOW），每次重算都重新计算 |
| Array Formula | 数组公式，返回多值结果 |
| Named Expression | 命名表达式（如定义名称 "税率" = 0.13）|
| Circular Reference | 循环引用，A1 依赖 B1，B1 又依赖 A1 |

---

## 3. 设计原则

| 原则 | 说明 |
|------|------|
| **计算零误差** | 财务公式结果必须 100% 准确，浮点误差控制在 1e-10 以内 |
| **增量重算** | 仅重算受影响的单元格，不触发全表重算 |
| **循环检测** | 任何循环引用必须在输入时检测并阻止，不可导致死循环 |
| **错误可追踪** | 公式错误必须显示具体错误码和位置，便于排查 |
| **Excel 兼容** | 支持的函数语法与 Excel 一致，降低用户学习成本 |

---

## 4. 详细设计

### 4.1 HyperFormula 初始化配置

```typescript
import { HyperFormula } from 'hyperformula';

const formulaEngine = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',

  // 计算模式
  context: {
    // 货币与数字格式
    currencySymbol: ['¥', '$', '€'],
    decimalSeparator: '.',
    thousandSeparator: ',',

    // 日期格式
    dateFormats: ['YYYY/MM/DD', 'YYYY-MM-DD'],
    timeFormats: ['HH:mm', 'HH:mm:ss'],

    // 函数本地化
    functionArgSeparator: ',',

    // 精度控制
    precisionRounding: 10,  // 10 位小数精度

    // 数组公式支持
    arrayColumnSeparator: ',',
    arrayRowSeparator: ';',
  },

  // 性能优化
  maxRows: 100000,         // 最大行数
  maxColumns: 1000,        // 最大列数

  // 错误处理
  evaluateNullToZero: false,  // NULL 不参与计算
  nullYear: 30,               // 两位数年份基准
});
```

### 4.2 支持的函数分类

#### 4.2.1 P0 必须支持（财务高频）

| 分类 | 函数 | 说明 |
|------|------|------|
| 数学 | SUM, AVERAGE, MAX, MIN, COUNT, COUNTA | 基础聚合 |
| 数学 | ROUND, ROUNDUP, ROUNDDOWN, INT, ABS | 取整与绝对值 |
| 逻辑 | IF, AND, OR, NOT, IFERROR | 条件判断 |
| 查找 | VLOOKUP, HLOOKUP, INDEX, MATCH | 查找引用 |
| 财务 | SUMIF, COUNTIF, AVERAGEIF | 条件聚合 |
| 文本 | LEFT, RIGHT, MID, CONCATENATE, LEN | 文本处理 |
| 日期 | TODAY, NOW, YEAR, MONTH, DAY, DATEDIF | 日期计算 |

#### 4.2.2 P1 扩展支持

| 分类 | 函数 | 说明 |
|------|------|------|
| 财务 | PV, FV, PMT, NPV, IRR | 财务计算 |
| 统计 | STDEV, VAR, CORREL | 统计分析 |
| 查找 | XLOOKUP, FILTER | 现代查找函数 |
| 数组 | SUMPRODUCT, MMULT | 数组运算 |

### 4.3 依赖图与增量重算

```typescript
// 依赖图可视化（调试用）
interface DependencyGraph {
  nodes: Map<string, CellNode>;     // key: "Sheet0!A1"
  edges: Map<string, Set<string>>;  // A1 -> [B1, B2, C1]
}

// 增量重算流程
function incrementalRecalc(changedCell: string, newValue: any) {
  // 1. 更新单元格值
  formulaEngine.setCellContents(changedCell, newValue);

  // 2. HyperFormula 自动构建依赖图
  // 3. 识别受影响的单元格
  const affectedCells = formulaEngine.getAffectedCells(changedCell);

  // 4. 按拓扑排序重算
  const sortedCells = topologicalSort(affectedCells);

  // 5. 逐个重算
  for (const cell of sortedCells) {
    const result = formulaEngine.getCellValue(cell);
    // 6. 同步到 vxe-table
    syncToVxeTable(cell, result);
  }
}
```

### 4.4 循环引用检测

```typescript
// 循环引用检测算法
function detectCircularReference(formula: string, cellAddress: string): boolean {
  // 1. 解析公式，提取所有引用的单元格
  const referencedCells = parseFormulaReferences(formula);

  // 2. 深度优先搜索依赖链
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(current: string): boolean {
    visited.add(current);
    recursionStack.add(current);

    const deps = formulaEngine.getCellDependencies(current);
    for (const dep of deps) {
      if (!visited.has(dep)) {
        if (dfs(dep)) return true;
      } else if (recursionStack.has(dep)) {
        return true;  // 发现循环
      }
    }

    recursionStack.delete(current);
    return false;
  }

  return dfs(cellAddress);
}

// 用户输入公式时的处理
function onFormulaInput(cellAddress: string, formula: string) {
  if (detectCircularReference(formula, cellAddress)) {
    // 阻止输入，显示错误
    showError(cellAddress, '#CIRC!');
    return false;
  }
  return true;
}
```

### 4.5 与 vxe-table 的数据同步

```typescript
// 数据同步器
class FormulaVxeSync {
  constructor(
    private formulaEngine: HyperFormula,
    private vxeTable: VxeTableInstance
  ) {}

  // vxe-table → HyperFormula（用户编辑）
  onCellEdit(rowIndex: number, colIndex: number, value: any) {
    const address = this.toCellAddress(rowIndex, colIndex);

    if (typeof value === 'string' && value.startsWith('=')) {
      // 公式输入
      this.formulaEngine.setCellContents(address, value);
    } else {
      // 普通值输入
      this.formulaEngine.setCellContents(address, value);
    }

    // 触发增量重算
    this.recalcAndSync(address);
  }

  // HyperFormula → vxe-table（计算结果更新）
  private recalcAndSync(changedCell: string) {
    const affected = this.formulaEngine.getAffectedCells(changedCell);

    for (const cell of affected) {
      const { row, col } = this.fromCellAddress(cell);
      const value = this.formulaEngine.getCellValue(cell);
      const displayValue = this.formatValue(value, cell);

      // 更新 vxe-table 对应单元格
      this.vxeTable.setCellValue(row, col, {
        value,
        displayValue,
        formula: this.formulaEngine.getCellFormula(cell),
      });
    }
  }

  // 单元格地址转换
  private toCellAddress(row: number, col: number): string {
    const colLetter = this.numberToColumn(col);  // 0 -> A, 1 -> B
    return `${colLetter}${row + 1}`;             // A1, B2
  }

  private fromCellAddress(address: string): { row: number; col: number } {
    const match = address.match(/([A-Z]+)(\d+)/);
    return {
      col: this.columnToNumber(match[1]),
      row: parseInt(match[2]) - 1,
    };
  }
}
```

### 4.6 公式错误处理

| 错误码 | 含义 | 触发场景 | 用户提示 |
|--------|------|---------|---------|
| #REF! | 引用错误 | 引用了不存在的单元格 | "引用了无效单元格，请检查公式" |
| #VALUE! | 值错误 | 公式参数类型不匹配 | "公式参数类型错误" |
| #DIV/0! | 除零错误 | 除数为 0 | "除数不能为零" |
| #NAME? | 名称错误 | 使用了不存在的函数名 | "无法识别的函数名" |
| #N/A | 不可用 | VLOOKUP 未找到匹配值 | "未找到匹配数据" |
| #NUM! | 数字错误 | 数字超出范围 | "数值超出计算范围" |
| #CIRC! | 循环引用 | 公式存在循环依赖 | "公式存在循环引用，请修改" |
| #NULL! | 空交集 | 区域交集为空 | "区域交集为空" |

---

## 5. 接口契约

### 5.1 公式验证接口

```typescript
// 验证公式语法
POST /api/formula/validate
Body: {
  formula: string;        // 如 "=SUM(A1:A10)"
  sheetId: string;
  cellAddress: string;    // 如 "A1"
}

Response: {
  valid: boolean;
  error: string | null;   // 错误码或 null
  dependencies: string[]; // 引用的单元格列表
  isCircular: boolean;    // 是否循环引用
}
```

### 5.2 批量计算接口

```typescript
// 批量计算（用于 RAG 查询）
POST /api/formula/batch-calc
Body: {
  sheetId: string;
  formulas: [
    { cell: "A1", formula: "=SUM(B1:B10)" },
    { cell: "A2", formula: "=AVERAGE(C1:C10)" }
  ];
}

Response: {
  results: [
    { cell: "A1", value: 1000, error: null },
    { cell: "A2", value: 100, error: null }
  ];
}
```

---

## 6. 测试策略

### 6.1 单元测试（必须 100% 覆盖）

| 测试场景 | 输入 | 期望输出 |
|---------|------|---------|
| SUM 基础 | `=SUM(1,2,3)` | `6` |
| SUM 区域 | `=SUM(A1:A3)` (A1=1,A2=2,A3=3) | `6` |
| 嵌套公式 | `=SUM(A1:A3)*2` | `12` |
| VLOOKUP | `=VLOOKUP("张三",A1:B10,2,FALSE)` | 匹配行的第 2 列值 |
| IF 条件 | `=IF(A1>100,"高","低")` (A1=150) | `"高"` |
| 循环引用 | A1=`=B1`, B1=`=A1` | 阻止输入，返回 `#CIRC!` |
| 除零 | `=1/0` | `#DIV/0!` |
| 浮点精度 | `=0.1+0.2` | `0.3`（不是 `0.30000000000000004`）|

### 6.2 性能测试

| 测试场景 | 指标 | 目标 |
|---------|------|------|
| 1000 个 SUM 公式重算 | 耗时 | < 50ms |
| 10000 行 VLOOKUP | 耗时 | < 200ms |
| 循环引用检测（1000 个节点） | 耗时 | < 10ms |
| 依赖图构建（10000 个公式） | 内存占用 | < 100MB |

---

## 7. 验收标准

- [ ] 支持 P0 函数列表全部通过单元测试
- [ ] 公式计算准确率 100%（10000 条随机公式验证）
- [ ] 循环引用检测延迟 < 10ms
- [ ] 增量重算 1000 个受影响单元格 < 50ms
- [ ] 浮点误差控制在 1e-10 以内
- [ ] 错误提示支持中文，且包含具体位置信息

---

## 8. 关联 Spec

| Spec 编号 | 关系 | 说明 |
|-----------|------|------|
| spec-01 | 依赖 | 架构设计定义公式引擎位置 |
| spec-02 | 被依赖 | vxe-table 封装实现公式单元格渲染 |
