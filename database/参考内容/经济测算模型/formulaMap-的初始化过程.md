让我帮你分析一下 `formulaMap` 的初始化过程。从代码中可以看到，`formulaMap` 主要是在 `addRelationData` 函数中被初始化和构建的。让我详细解释这个过程：

1. 首先，`formulaMap` 是在 `useRelationPool` 中定义的：

```typescript
const useRelationPool = () => {
  const data = ref<{
    [props: string]: EditorTs.CustomFormula | EditorTs.Formula;
  }>({});

  const base = ref<{
    [props: string]: EditorTs.CustomFormula | EditorTs.Formula;
  }>({}); 

  const setData = (key: string, value: EditorTs.CustomFormula | EditorTs.Formula) => {
    data.value[key] = value;
  };

  const setBaseData = (key: string, value: EditorTs.CustomFormula | EditorTs.Formula) => {
    base.value[key] = value;
  };

  return {
    data: unref(data),
    base: unref(base),
    setData,
    setBaseData,
  };
};
```

2. 数据初始化主要发生在 `addRelationData` 函数中，这个函数接收一个公式列表作为参数：

```typescript
const addRelationData = (data: EditorTs.FormulaList) => {
  const formulaCollection: { [propName: string]: EditorTs.FormulaList } = {};
  const baseFormulaCollection: { [propName: string]: EditorTs.FormulaList } = {};
```

3. 初始化过程主要包含以下步骤：

a. 首先处理每个公式项，解析公式表达式中的变量：
```typescript
for (const item of data) {
  const { metricCodes, marks } = getMetricCodes(item.formulaExpression);
  if (!formulaCollection[item.metricCode]) {
    item.formula = item.formulaExpression;
    item.metricCodes = metricCodes;
    item.marks = marks;
    item.parent = [];
    item.children = [];
    formulaCollection[item.metricCode] = item;
  }
}
```

b. 然后建立指标之间的关系：
```typescript
for (key in formulaCollection) {
  const formulaInfo: any = formulaCollection[key];
  formulaInfo.metricCodes.forEach((code: string) => {
    // 处理各种类型的变量：global-, prev-, var-, total- 等
    // 建立父子关系
  });
}
```

c. 最后，为每个时间字段创建节点并存入 formulaMap：
```typescript
columnFileds.forEach((field: string) => {
  const node = new Node({
    field,
    metricCode: metricOut.metricCode,
    marks: metricOut.marks,
    calcMarks: formatMarks(metricOut.marks, field),
    children,
    info: metricOut,
  });
  setRelationData(node.id, node);
  
  if (children.length === 0) {
    setRelationBaseData(node.id, node);
  }
});
```

4. formulaMap 的数据结构：
- key: `${metricCode}-${field}` (例如: "B0006-2026")
- value: 包含以下信息的节点对象：
  - field: 时间字段
  - metricCode: 指标代码
  - marks: 公式中的变量标记
  - calcMarks: 计算用的标记
  - children: 依赖该节点的其他节点
  - formula: 计算公式
  - 其他相关信息

5. 使用场景：
formulaMap 主要用在计算引擎中，用于：
- 追踪指标之间的依赖关系
- 按正确的顺序执行计算
- 存储计算公式和相关信息

这个数据结构的设计允许系统：
1. 快速查找特定指标在特定时间点的计算公式
2. 追踪指标之间的依赖关系
3. 确保计算按照正确的顺序执行
4. 支持各种类型的变量引用（如全局变量、上期数据等）
