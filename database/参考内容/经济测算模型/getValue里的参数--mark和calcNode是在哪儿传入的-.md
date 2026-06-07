通过分析代码，`getValue` 函数的调用主要发生在以下几个地方：

1. 在 `calculateFormula` 函数中：
```typescript
marks.forEach((markInfo) => {
  const fieldValue = getValue(markInfo, node);
  // ...
});
```

2. 在 `getCalculatedFormula` 函数中：
```typescript
formulaNode.marks.forEach((markInfo: any) => {
  const fieldValue = getValue(markInfo, formulaNode);
  // ...
});
```

这些参数的来源是：

1. `mark` 参数：
   - 来自公式节点的 `marks` 数组
   - 包含了公式中的标记信息，如 `enCode`（用于标识指标类型和代码）
   - 例如：`global-`, `total-`, `var-`, `prev-` 等前缀的标记

2. `calcNode` 参数：
   - 来自 `formulaMap` 中的节点数据
   - 包含了计算节点的信息，如 `field`（字段）、`formula`（公式）等
   - 在 `calculateFormula` 中是通过 `const node = formulaMap[code]` 获取
   - 在 `getCalculatedFormula` 中是通过 `const formulaNode = formulaMap[nodeId]` 获取

具体数据流：

```plaintext
formulaMap
  └── node/formulaNode
       ├── marks[] ──────┐
       └── field        │
                        │
getValue(mark, calcNode)◄┘
```

例如一个实际的调用场景：
```typescript
// node 结构示例
const node = {
  field: "2025",
  formula: "...",
  marks: [
    { 
      enCode: "total-C10000A0282",
      from: 0,
      to: 10
    }
  ]
};

// 调用 getValue
const value = getValue(node.marks[0], node);
```

这个设计允许：
1. 通过 `mark.enCode` 识别指标类型（全局配置、总计值、变量值等）
2. 通过 `calcNode.field` 获取具体的时间字段
3. 结合这些信息来计算或获取正确的值

所以 `getValue` 函数的两个参数是在处理公式计算时，从公式节点的数据结构中提取的关键信息。
