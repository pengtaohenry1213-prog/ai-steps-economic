好的，我们来梳理一下 `await runFormula()` 和 `addRelationData(res)` 的流程以及后续公式依赖关系的使用。

1.  **`await runFormula()` 的执行:**
    *   在 `index.vue` 的 `onMounted` 钩子中，`await runFormula()` 被调用。
    *   `runFormula` 使用 `useRequest` 包装了 `getFormulaList` API 调用，目的是获取当前版本 (`query.versionCode`) 的所有指标计算公式。
    *   当 API 请求成功 (`onSuccess`) 后，它会执行 `addRelationData(res)`，这里的 `res` 就是从 API 获取到的公式列表数据。

2.  **`addRelationData(res)` 的作用:**
    *   这个函数定义在 `apps/web-ele/src/views/instance/edit/hooks.ts` 中的 `useCalcEngine` hook 内部。
    *   它接收从 `getFormulaList` API 返回的公式列表 `res`。
    *   **核心功能：解析公式，构建指标间的依赖关系图。**
        *   它遍历 `res` 中的每一条公式数据 (`item`)。
        *   使用 `getMetricCodes` 解析公式表达式 (`item.formulaExpression`)，提取出该公式依赖的其他指标代码 (`metricCodes`)。
        *   为每个指标 (`item.metricCode`) 在 `formulaMap`（由 `useRelationPool` 管理，可以理解为你提到的 `relationPool` 的实际载体）中创建一个节点。这个节点存储了原始公式 (`formula`)、依赖的指标列表 (`metricCodes`)、父节点列表 (`parent`) 和子节点列表 (`children`) 等信息。
        *   然后，它会再次遍历 `formulaMap`，根据 `metricCodes` 建立 **父节点** 关系：如果指标 A 的公式依赖指标 B，那么指标 B 会被添加到指标 A 的 `parent` 列表中。
        *   接着，它会将基础指标（`indicatorBaseMap`）合并到 `formulaMap` 中。
        *   最后，通过双重循环遍历 `formulaMap` 来建立 **子节点** 关系：如果指标 B 依赖指标 A，那么指标 B 的代码会被添加到指标 A 的 `children` 列表中。

3.  **公式依赖关系存储在哪里？**
    *   `addRelationData` 函数将处理后的公式和依赖关系信息主要存储在 `formulaMap` 这个响应式引用中。`formulaMap` 是通过 `useRelationPool` hook 创建和管理的。所以，是的，公式和它们构建的依赖关系图存储在 `useRelationPool` 管理的数据结构 (`formulaMap`) 中。

4.  **如何使用这些依赖关系？**
    *   **计算引擎 (`useCalculate`)**:
        *   `hooks.ts` 中引入了 `useCalculate`，它接收 `formulaMap` 作为参数。
        *   当需要进行计算时（例如在 `autoCalcData` 或 `calculateFormula` 函数中），计算引擎会利用 `formulaMap` 中的依赖关系：
            *   **确定计算顺序**: 通过 `parent` 和 `children` 列表，计算引擎可以知道计算一个指标前必须先计算哪些依赖项，保证计算的正确性。
            *   **追踪数据变化**: 当一个单元格的值被修改 (`patchUpdateData`) 时，计算引擎可以利用 `children` 列表快速找到所有依赖于这个已修改指标的其他指标，并触发它们的重新计算（如在 `autoCalcData` -> `execute` 流程中）。这实现了自动和增量的计算，提高了效率。
    *   **依赖显示 (`getDependencies`)**:
        *   `hooks.ts` 导出了 `getDependencies` 函数。
        *   在 `index.vue` 中，当鼠标悬停在计算结果单元格上时 (`@mouseenter="showDependencies(row, column.field)"`)，会调用 `getDependencies(row.metricCode)` 来获取当前指标所依赖的指标列表（通过读取 `formulaMap[metricCode].metricCodes`），并在控制台打印出来，用于调试或展示。
    *   **公式显示 (`cellClick` in `index.vue`)**:
        *   当点击指标名称单元格时，`handle.cellClick` 函数会尝试从 `formulaMap` 获取该指标的公式信息 (`getFormulaMap()[`${row.metricCode}-2025`]`)，并在侧边栏 (`slidePanel`) 中显示公式名称 (`formulaName`) 和描述 (`formulaDescription`)。

**总结:**

`await runFormula()` 获取公式数据，`addRelationData(res)` 解析这些数据并构建一个存储在 `formulaMap` 中的双向依赖关系图。这个 `formulaMap` 是后续进行自动计算、依赖追踪和公式信息展示的核心依据，由计算引擎 (`useCalculate`) 和界面交互逻辑（如 `getDependencies`, `cellClick`）使用。
