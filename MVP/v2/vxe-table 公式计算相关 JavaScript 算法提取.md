
# vxe-table 公式计算相关 JavaScript 算法提取

以下是 `edit/index.vue` 中涉及的完整算法体系，分为 **6 大模块**：

---

## 1. 核心计算引擎 — `calculate.ts`

**文件**：`views/instance/edit/utils/calculate.ts`

这是计算引擎的核心入口，负责根据拓扑排序后的顺序执行所有单元格的公式计算。

```typescript
// calculate.ts (核心伪代码)

async function calculate(instance, graph: string[]) {
  // 1. 预计算常量（基于时间类型和日期字段）
  const precomputed = {
    periodMonths: timeType === 'year' ? 12 : 3,
    periodNumber: dateFields.length,
    arrayAllPeriod: dateFields.map((_, i) => i + 1),
    arrayAllDate: dateFields,
  };

  // 2. 全局变量处理器（不产生依赖关系）
  const globalHandlers = {
    'global-arrayAllDate': precomputed.arrayAllDate,
    'global-arrayAllPeriod': precomputed.arrayAllPeriod,
    'global-periodNumber': precomputed.periodNumber,
    'global-periodMonths': precomputed.periodMonths,
    'var-everyPeriod': (date) => dateFields.indexOf(date) + 1,
  };

  // 3. 特殊表达式处理器
  const expressionHandlers = {
    lastPeriod: (code, date) => { /* 年/季度的最后期间值 */ },
    arrayAllValue: (code) => dateFields.map(f => getData(code, f)),       // 所有日期值数组
    prevPeriodAdd: (code, date) => { /* 往期累计（不含当前）*/ },
    periodAdd: (code, date) => { /* 周期累计（含当前）*/ },
    futurePeriodAdd: (code, date) => { /* 后期累计（不含当前）*/ },
    prev: (code, date) => { /* 上期数据 */ },
    total: (code) => dateFields.reduce((sum, f) => sum + getData(code, f), 0),
    totalYear: (code, date) => { /* 一年数据总和 */ },
  };

  // 4. 公式解析与执行
  graph.forEach((cellId) => {   // 按拓扑排序顺序遍历
    const [metricCode, date] = cellId.split('-', 2);
    const expression = getFormula(metricCode);   // 获取原始表达式
    
    // 替换变量为实际值
    const values = {};
    expression.match(/\$\{([^${}]+)\}/g).forEach(match => {
      const content = match.slice(2, -1);
      if (globalHandlers[content]) { /* 使用全局处理器 */ }
      else if (content.includes('-')) { /* 使用特殊表达式 */ }
      else { values[match] = getData(content, date); }
    });
    
    // 替换后执行
    const newExpr = expression.replaceAll(VARIABLE_REGEX, m => values[m]);
    const result = FunctionCore.executeFunction(newExpr);  // 动态执行数学表达式
    
    updateData(metricCode, date, result);   // 更新数据池
  });
}
```

---

## 2. 拓扑排序 — `topological.ts`（Kahn 算法）

**文件**：`views/instance/edit/utils/topological.ts`

```typescript
// Kahn 算法拓扑排序（保证 DAG 中所有节点的依赖都在其之前计算）
function topologicalSort(dag) {
  const inDegree = new Map();   // 入度 Map
  const graph = new Map();       // 邻接表

  // 初始化：所有节点的入度为 0
  for (const [node, deps] of Object.entries(dag)) {
    graph.set(node, deps);
    inDegree.set(node, inDegree.get(node) || 0);
    deps.forEach(dep => {
      if (!graph.has(dep)) graph.set(dep, []);
      inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
    });
  }

  // 初始队列：所有入度为 0 的节点
  const queue = [...allNodes].filter(n => inDegree.get(n) === 0);
  queue.sort((a, b) => a.localeCompare(b));   // 保证稳定性

  // 二分插入排序（替代全排，保持 O(n log n)）
  const insertSorted = (arr, item) => {
    let low = 0, high = arr.length;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (arr[mid].localeCompare(item) < 0) low = mid + 1;
      else high = mid;
    }
    arr.splice(low, 0, item);
  };

  // Kahn 主循环
  while (queue.length > 0) {
    const current = queue.shift();
    topoOrder.push(current);
    
    for (const neighbor of graph.get(current)) {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1);
      if (inDegree.get(neighbor) === 0) {
        insertSorted(queue, neighbor);   // 入度归零时二分插入
      }
    }
  }

  // 检测环
  if (topoOrder.length !== allNodes.size) {
    throw new Error(`图中存在环: ${[...remaining].join(',')}`);
  }

  return topoOrder;
}
```

---

## 3. 依赖图生成 — `dependencies.ts` + `relation.ts`

**文件**：`utils/dependencies.ts`（新）和 `workers/sort/relation.ts`（旧）

这两个文件负责从公式表达式解析出单元格依赖关系，生成 DAG：

```typescript
// 特殊表达式处理器（生成依赖关系）
const expressionHandlers = {
  lastPeriod: (suffix, date, context) => {
    // 年度直接依赖当前日期，季度取当前年最后一个季度
    if (context.timeType === 'year') return [`${suffix}-${date}`];
    const lastDate = context.yearToDatesMap.get(date.slice(0,4)).at(-1);
    return lastDate ? [`${suffix}-${lastDate}`] : [];
  },
  arrayAllValue: (suffix, date, context) =>
    context.dateFields.map(f => `${suffix}-${f}`),
  prevPeriodAdd: (suffix, date, context) => {
    const index = context.dateIndexMap.get(date);
    return context.dateFields.slice(0, index).map(f => `${suffix}-${f}`);
  },
  periodAdd: (suffix, date, context) => {
    const index = context.dateIndexMap.get(date);
    return context.dateFields.slice(0, index + 1).map(f => `${suffix}-${f}`);
  },
  futurePeriodAdd: (suffix, date, context) => {
    const index = context.dateIndexMap.get(date);
    return context.dateFields.slice(index + 1).map(f => `${suffix}-${f}`);
  },
  prev: (suffix, date, context) => {
    const index = context.dateIndexMap.get(date);
    return index > 0 ? [`${suffix}-${context.dateFields[index - 1]}`] : [];
  },
  total: (suffix, date, context) =>
    context.dateFields.map(f => `${suffix}-${f}`),
  totalYear: (suffix, date, context) => {
    if (context.timeType === 'year') return [`${suffix}-${date}`];
    return context.yearToDatesMap.get(date.slice(0,4))
      .map(f => `${suffix}-${f}`);
  },
};

// 全局变量（不产生依赖）
const unrelatedVariables = new Set([
  'global-arrayAllDate', 'global-arrayAllPeriod',
  'global-investmentType', 'global-periodMonths',
  'global-periodNumber', 'global-targetIndustry', 'var-everyPeriod',
]);

// 生成依赖图
function generateDependencyGraph(instance, formula) {
  const result = {};   // { "code-date": [dep-code-date, ...], ... }
  
  for (const [code, expression] of Object.entries(formula)) {
    const variables = expression.match(/\$\{([^${}]+)\}/g) || [];
    for (const date of dateFields) {
      const dependencies = [];
      for (const variable of variables) {
        const content = variable.slice(2, -1);
        if (unrelatedVariables.has(content)) continue;
        if (content.includes('-')) {
          const [prefix, suffix] = content.split('-');
          const deps = expressionHandlers[prefix](suffix, date, context);
          dependencies.push(...deps);
        } else {
          dependencies.push(`${content}-${date}`);
        }
      }
      result[`${code}-${date}`] = [...new Set(dependencies)];
    }
  }
  
  // 检测环
  const cycles = detectCycles(dag);
  if (cycles.length > 0) {
    // 移除环节点，构建无环 DAG
    cleanDAG = removeCycleNodes(dag, cycles);
  }
  
  return cleanDAG;
}
```

---

## 4. 环检测 — `cycle.ts`

**文件**：`views/instance/edit/utils/cycle.ts`

```typescript
// DFS 检测 DAG 中的所有环
function detectCycles(dag) {
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function checkCycle(node, currentPath) {
    if (recursionStack.has(node)) {
      // 发现环，记录路径
      const cycleStartIndex = currentPath.indexOf(node);
      cycles.push([...currentPath.slice(cycleStartIndex), node]);
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    recursionStack.add(node);
    currentPath.push(node);

    for (const neighbor of dag[node] || []) {
      checkCycle(neighbor, currentPath);
    }

    recursionStack.delete(node);
    currentPath.pop();
  }

  for (const node of Object.keys(dag)) {
    if (!visited.has(node)) checkCycle(node, []);
  }

  return cycles;
}
```

---

## 5. 数学函数库 — `math/`

**文件**：`math/index.js`, `math/sumIfNpvIrr.js`, `math/xirr.js`, `math/xnpv.js`

```javascript
// math/index.js — 函数执行器
class FunctionCore {
  createSafeContext() {
    return {
      ...Q10000A0044,  // IRR 年化计算
      ...Q10000A0045,  // 现金流分摊计算
      ...sumIfNpvIrr,  // SUMIF, NPV, IRR, IFERROR, AVERAGE, MAX, MIN 等
      ...xirr,         // XIRR（Newton-Raphson + 二分法）
      ...xnpv,        // XNPV（日期加权净现值）
    };
  }
  executeFunction(str) {
    const fn = new Function(...Object.keys(context), `return ${str};`);
    return fn(...Object.values(context));
  }
}

// sumIfNpvIrr.js 关键函数
function NPV(cashFlows, discountRate, dates) {
  if (dates) {
    // 时间加权 NPV
    const firstDate = new Date(dates[0]);
    for (const [i, cf] of cashFlows.entries()) {
      const years = (new Date(dates[i]) - firstDate) / (1000*60*60*24*365);
      total += cf / (1 + discountRate) ** years;
    }
  } else {
    // 期数加权 NPV
    for (const [i, cf] of cashFlows.entries()) {
      npv += cf / (1 + discountRate) ** i;
    }
  }
}

function IRR(cashFlows, tolerance = 1e-6) {
  // 二分法求内部收益率
  let lower = -1, upper = 1, mid = 0;
  while (upper - lower > tolerance) {
    mid = (upper + lower) / 2;
    if (NPV(cashFlows, mid) > 0) lower = mid;
    else upper = mid;
  }
  return mid;
}

function IFERROR(value, errorValue) { /* 处理 NaN/Infinity/null */ }
function SUMIF(values, condition, sumRange) { /* 条件求和 */ }
function SUM(...values) { return values.reduce((sum, v) => sum + v, 0); }
function AVERAGE(...numbers) { return SUM(...numbers) / numbers.length; }
function MAX(...args) { return Math.max(...args); }
function MIN(...args) { return Math.min(...args); }
function MOD(...args) { /* 取模 */ }
function AND(...args) { return args.every(Boolean); }
function OR(...args) { return args.some(Boolean); }

// xirr.js — Newton-Raphson + 二分法
function XIRR(cashflows, dates, initialGuess, maxIterations, tolerance) {
  let rate = initialGuess || 0.1;
  const eps = 1e-8;
  
  do {
    const npvVal = npvWithDates(dates, cashflows, rate, startDate);
    // 中心差分求导
    const npvPrime = (npvPlus - npvMinus) / (2 * eps);
    
    if (Math.abs(npvPrime) < tol) {
      return xirrWithBisection(...);  // 切换到二分法
    }
    const newRate = rate - npvVal / npvPrime;
    if (Math.abs(newRate - rate) < tol) return newRate;
    rate = newRate;
  } while (iterations++ < maxIter);
}

// xnpv.js
function XNPV(rate, values, dates) {
  const firstDate = new Date(dates[0]);
  for (const [i, value] of values.entries()) {
    const daysDiff = (new Date(dates[i]) - firstDate) / (1000*60*60*24);
    xnpv += value / (1 + rate) ** (daysDiff / 365);
  }
  return xnpv;
}
```

---

## 6. 数据管理层 — `hooks/modules/`

```bash
┌─────────────────────────────────────────────────────────┐
│                    数据池架构                            │
├─────────────────────────────────────────────────────────┤
│  data (数据池)                                          │
│    { metricCode: { dateField: value, ... }, ... }      │
│  _data (原始数据池) — 用于变化检测比较                  │
│  changeData (变化池) — 仅记录用户修改的 {code: {field: val}} │
│  pageData (页面池) — 按 pageCode 分组的表格行数据       │
│  animationData (动画池) — 修改前的旧值 + 时间戳          │
│  formula (公式池) — { metricCode: expression, ... }     │
│  formulaDetail (公式详情) — { metricCode: {remark, ...}}│
└─────────────────────────────────────────────────────────┘
```

---

## 7. Mock 数据示例

**文件**：`ids/topological_value_data.ts`

```typescript
// 速算模型的拓扑排序 ID 列表（部分）
export const VALUE = [
  'Q10000A0001-value',   // 输入指标
  'Q10000A0002-value',
  'Q10000A0006-value',
  'Q10000A0007-value',
  // ... 51 个指标
  'Q10000A0044-value',  // IRR 计算指标
  'Q10000A0045-value',  // 现金流分摊
];

// 完整模型年度拓扑排序结构（示例）
export const YEAR_WEIGHT = [
  { node: 'C10001A0433-2025', weight: 1 },
  { node: 'C10001A0433-2026', weight: 1 },
  // ... 按依赖顺序排列
];
```

---

## MVP 算法能力总结

| 功能模块 | 算法 | 关键文件 |
| --- | --- | --- |
| **拓扑排序** | Kahn 算法 + 二分插入保证稳定性 | `utils/topological.ts` |
| **依赖图生成** | 解析 `${变量}` 语法，识别全局/特殊/普通变量 | `dependencies.ts` / `relation.ts` |
| **环检测** | DFS 递归栈检测 | `utils/cycle.ts` |
| **公式执行** | `new Function()` 动态构建 + 自定义数学函数 | `math/index.js` |
| **时间加权财务函数** | NPV / IRR / XIRR / XNPV | `math/sumIfNpvIrr.js`, `math/xirr.js` |
| **跨期累计** | prevPeriodAdd / periodAdd / futurePeriodAdd / total / totalYear | `calculate.ts` |
| **精度处理** | Decimal.js 乘法、scale 缩放、千分位格式化 | `format.ts` |
| **Worker 异步** | Web Worker 执行排序和 Excel 导出 | `workers/sort/index.ts`, `workers/excel.ts` |

这套算法体系的核心价值是：**通过依赖图 + 拓扑排序保证任意单元格变更后，所有受影响的下游单元格按正确顺序重新计算**，而无需全量遍历。对于 vxe-table 做 MVP，可以直接复用这套计算引擎结构。
