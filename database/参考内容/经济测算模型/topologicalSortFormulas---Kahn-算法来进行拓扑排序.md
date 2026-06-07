根据截图显示的测试用例6的执行结果，我来分析一下 `topologicalSortFormulas` 方法的问题：

1. 输入节点：`['A-2025', 'B-2025', 'C-2025', 'D-2025', 'E-2025', 'F-2025']`

2. 公式依赖关系：
```
A 依赖于: ['B-2025']
B 依赖于: ['C-2025']
C 依赖于: []
D 依赖于: ['E-2025']
E 依赖于: ['F-2025']
F 依赖于: []
```

3. 排序结果：`['C-2025', 'F-2025', 'B-2025', 'E-2025', 'A-2025', 'D-2025']`

让我检查一下 `calculate.ts` 中的 `topologicalSortFormulas` 方法实现：

Search files...
分析 `topologicalSortFormulas` 方法的实现，它使用了 Kahn 算法来进行拓扑排序。让我们详细分析其工作原理：

1. **方法签名**：
```typescript
topologicalSortFormulas(nodes: string[], formulaMap: any) {
    // ...
}
```

2. **数据结构初始化**：
```typescript
// 创建邻接表表示依赖关系
const graph: Map<string, Set<string>> = new Map();
// 记录每个节点的入度
const inDegree: Map<string, number> = new Map();
// 初始化所有节点的入度为0
nodes.forEach(node => inDegree.set(node, 0));
```

3. **构建图和计算入度**：
```typescript
nodes.forEach(node => {
    const formula = formulaMap[node];
    if (!formula) return;
    
    if (!graph.has(node)) {
        graph.set(node, new Set());
    }
    
    // 处理当前节点的依赖关系
    if (formula.calcMarks) {
        formula.calcMarks.forEach((dep: string) => {
            if (!graph.has(dep)) {
                graph.set(dep, new Set());
            }
            // dep 依赖于 node
            graph.get(dep)?.add(node);
            // 增加 node 的入度
            inDegree.set(node, (inDegree.get(node) || 0) + 1);
        });
    }
});
```

4. **Kahn 算法实现**：
```typescript
const result: string[] = [];
const queue: string[] = [];

// 将所有入度为0的节点加入队列
inDegree.forEach((degree, node) => {
    if (degree === 0) queue.push(node);
});

// 处理队列中的节点
while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);

    // 更新相邻节点的入度
    if (graph.has(node)) {
        graph.get(node)!.forEach(neighbor => {
            inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
            if (inDegree.get(neighbor) === 0) {
                queue.push(neighbor);
            }
        });
    }
}
```

5. **循环依赖检测**：
```typescript
// 检查是否存在环
if (result.length !== nodes.length) {
    console.warn('检测到循环依赖！', nodes);
    return nodes; // 如果存在环，返回原始数组
}
```

对于测试用例6的执行结果：

1. **输入节点**：`['A-2025', 'B-2025', 'C-2025', 'D-2025', 'E-2025', 'F-2025']`

2. **依赖关系**：
```
A 依赖于: ['B-2025']
B 依赖于: ['C-2025']
C 依赖于: []
D 依赖于: ['E-2025']
E 依赖于: ['F-2025']
F 依赖于: []
```

3. **排序结果**：`['C-2025', 'F-2025', 'B-2025', 'E-2025', 'A-2025', 'D-2025']`

这个排序结果是正确的，因为：
1. `C-2025` 和 `F-2025` 没有依赖，可以最先计算
2. `B-2025` 依赖于 `C-2025`，所以在 `C-2025` 之后
3. `E-2025` 依赖于 `F-2025`，所以在 `F-2025` 之后
4. `A-2025` 依赖于 `B-2025`，所以在 `B-2025` 之后
5. `D-2025` 依赖于 `E-2025`，所以在 `E-2025` 之后

这个排序确保了每个节点的依赖项都在它之前被计算，从而保证了计算的正确性。

该实现的优点：
1. 能正确处理无环依赖的情况
2. 能检测并处理循环依赖
3. 使用 Map 和 Set 数据结构提高了性能
4. 实现了标准的 Kahn 拓扑排序算法

建议：
1. 可以添加更详细的错误信息，在检测到循环依赖时指出具体的循环路径
2. 可以考虑添加参数验证，确保输入的 nodes 和 formulaMap 是有效的
3. 可以考虑优化内存使用，对于大规模的依赖图可能需要考虑内存效率



![](https://upload-images.jianshu.io/upload_images/16618905-84a31b71083cebc7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
