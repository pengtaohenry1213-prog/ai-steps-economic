让我用一个更具体的例子来说明**Kahn 算法（基于入度）**和**拓扑序列**的区别：

假设我们有一个财务计算模型，有以下单元格和它们的依赖关系：
```
A: 营业收入 = 1000
B: 营业成本 = A * 0.6
C: 毛利润 = A - B
D: 销售费用 = A * 0.1
E: 净利润 = C - D
```

依赖关系图：
```
A -> B -> C -> E
A -> D -> E
```

让我们看看两种排序方式：
1. **入度排序**：
- 计算每个节点的入度（被依赖的次数）：
  - A: 入度 = 0（没有被依赖）
  - B: 入度 = 1（被C依赖）
  - C: 入度 = 1（被E依赖）
  - D: 入度 = 1（被E依赖）
  - E: 入度 = 2（被B和D依赖）
- 按入度从小到大排序：`[A, B, C, D, E]` 或 `[A, D, B, C, E]`

2. **拓扑序列**
* 深度优先搜索（DFS）:  更贴近“公式展开”或“表达式求值”的递归依赖模型
* 广度优先搜索（BFS）: 队列



- 使用BFS算法：
  1. 从入度为0的节点A开始
  2. 处理A后，B和D的入度减1，变为0
  3. 处理B和D后，C的入度减1，变为0
  4. 最后处理E
- 得到序列：`[A, B, D, C, E]` 或 `[A, D, B, C, E]`

关键区别：
1. **计算顺序的正确性**：
   - 入度排序可能会得到 `[A, B, C, D, E]`
   - 这个顺序有问题，因为E依赖于C和D，但C在D之前计算，这可能导致E的计算结果错误
   - 拓扑序列确保在计算E之前，C和D都已经计算完成

2. **依赖关系的传递性**：
   - 入度排序只考虑直接依赖
   - 拓扑序列考虑了间接依赖，比如E不仅依赖于D，还依赖于C，而C又依赖于B和A

3. **实际计算过程**：
```
使用入度排序 [A, B, C, D, E]：
1. 计算A = 1000
2. 计算B = 1000 * 0.6 = 600
3. 计算C = 1000 - 600 = 400
4. 计算D = 1000 * 0.1 = 100
5. 计算E = 400 - 100 = 300

使用拓扑序列 [A, B, D, C, E]：
1. 计算A = 1000
2. 计算B = 1000 * 0.6 = 600
3. 计算D = 1000 * 0.1 = 100
4. 计算C = 1000 - 600 = 400
5. 计算E = 400 - 100 = 300
```

虽然在这个简单例子中，两种排序方式得到了相同的结果，但在更复杂的模型中：
1. 入度排序可能会违反依赖关系
2. 拓扑序列保证了所有依赖关系都被正确处理
3. 拓扑序列能够检测出循环依赖，而入度排序不能

这就是为什么在代码中强调必须使用拓扑序列而不是入度排序。拓扑序列通过考虑完整的依赖关系，确保了计算顺序的正确性。

```

/**
 * Kahn 算法拓扑排序
 * @param graph 每个 key 是节点，value 是该节点依赖的节点数组（即 node -> [deps]，表示 node 依赖 deps, dep 都是指向 node 的一条边）
 * @returns
 *  order：拓扑排序得到的可计算顺序（数组）。
 *  hasCycle：布尔，若存在环则为 true。
 *  inDegree：函数结束时的入度映射（注意：这是算法运行后的入度值，不是最初保存的入度快照）。
 *  initialInDegree: 保存初始入度值的快照。
 *  remaining：当存在环时，列出未被排进 order 的节点（即处于循环中的节点）。
 *  cycles：检测到的环的详细信息，包括环的路径。
 */
export function kahnTopologicalSort(graph: Record<string, string[]>): {
  cycles: Array<{
    description: string;
    path: string[];
  }>;
  hasCycle: boolean;
  inDegree: Record<string, number>;
  initialIn: Record<string, number>;
  order: string[];
  remaining: string[];
} {
  // 记录每个节点当前的入度（指向该节点的边数量）
  const inDegree: Record<string, number> = {};

  // 反向邻接表，把依赖关系反过来存成 dep -> [nodes that depend on dep]，方便当我们处理一个节点时找到需要更新（入度减 1）的节点集合。
  const adj: Record<string, string[]> = {};

  /*
  graph: {
    "C10001A0319200019-2025": [ <- keys
        "C10001A0322200019-2025", <- values
        "C10001A0045200019-2025"  <- values
    ], ...
  }
  */

  // 1. 初始化所有节点 入度 inDegree 为 0 (把graph里所有的id做为key, 初始化到 inDegree 中, 值为 0)
  // 初始化所有节点 入度 inDegree 为 0
  Object.keys(graph).forEach((key) => {
    if (!(key in inDegree)) inDegree[key] = 0;
  });
  // 同时把依赖节点也纳入 inDegree 的节点集合中, 以免有遗漏. 注: deps == calcMarks
  Object.values(graph).forEach((deps) => {
    (deps || []).forEach((dep) => {
      if (!(dep in inDegree)) inDegree[dep] = 0;
    });
  });

  /*
    构建反向邻接表：dep -> key，并累计入度到 key.
    对 graph 每一项：
      - 将 dep -> key 加入 adj（当 dep 被处理时，能快速找到依赖它的 key）。
      - 同时把 key 的入度 +1（因为每个 dep 都是指向 key 的一条边）。
    注意：这里假设 deps 数组中每个元素代表一条独立边；若 deps 有重复元素，会被重复计数（可能需要去重，视场景而定）。
  */
  Object.entries(graph).forEach(([key, deps]) => {
    const calcMarksList = Array.isArray(deps) ? [...new Set(deps)] : []; // 对 calcMarksList 去重

    calcMarksList.forEach((mark) => {
      // 如果未初始化adj(反向邻接表), 则初始化obj
      if (!adj[mark]) adj[mark] = [];

      // 将 mark -> key 加入 adj
      adj[mark].push(key);

      inDegree[key] = (inDegree[key] ?? 0) + 1; // node 的入度 +1
    });
  });

  // 3. 保存初始入度值的快照
  const initialIn = { ...inDegree };

  // 4. 执行 Kahn 算法（这里会修改 inDegree 的值）
  // 入度为 0 的节点入队，作为可立即计算的起点；queue 用数组实现，后面使用 shift() 出队。
  const queue = Object.keys(inDegree).filter((n) => inDegree[n] === 0);
  const order: string[] = []; // order 用来收集拓扑排序结果

  /*
    标准 Kahn 主循环：
      1. 从 queue 取出一个 node，把它 push 到 order（表示现在可以计算它）。
      2. 通过 adj[node] 找到所有依赖 node 的节点 nbr，把它们的入度减 1。
      3. 当某个 nbr 的入度降为 0 时，把它加入队列（表示它所有的前置依赖都已处理，可计算）。
  */
  // 优化：使用索引指针模拟队列，避免 shift() 的 O(n) 操作
  let queueIndex = 0;
  while (queueIndex < queue.length) {
    const node = queue[queueIndex++]; // 使用索引指针，O(1) 操作
    order.push(node || '');

    const neighbors = adj[node || ''] || []; // adj[node] || [] 保证了即便 node 没有任何被依赖者（没有出边），也不会报错。

    // 遍历与node相关的依赖节点(nbr), 把其入度inDegree[nbr]减1, 如果减1后入度为0, 则把nbr加入队列
    for (const nbr of neighbors) {
      inDegree[nbr] = (inDegree[nbr] ?? 0) - 1;
      if (inDegree[nbr] === 0) queue.push(nbr);
    }
  }

  const totalNodes = Object.keys(inDegree).length;
  const hasCycle = order.length !== totalNodes;
  const remaining = hasCycle
    ? Object.keys(inDegree).filter((n) => !order.includes(n))
    : [];

  // 5. 检测环的详细信息
  const cycles: Array<{ description: string; path: string[] }> = [];

  if (hasCycle) {
    // 使用 DFS 检测环
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const currentPath: string[] = [];

    function detectCycleDFS(node: string): boolean {
      if (recursionStack.has(node)) {
        // 找到环，从当前路径中提取环
        const cycleStartIndex = currentPath.indexOf(node);
        if (cycleStartIndex !== -1) {
          // const cyclePath = currentPath.slice(cycleStartIndex).concat(node);
          const cyclePath = [...currentPath.slice(cycleStartIndex), node];
          cycles.push({
            path: cyclePath,
            description: `环路径: ${cyclePath.join(' -> ')}`,
          });
        }
        return true;
      }

      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      recursionStack.add(node);
      currentPath.push(node);

      // 检查当前节点的依赖
      const dependencies = graph[node] || [];
      for (const dep of dependencies) {
        if (detectCycleDFS(dep)) {
          return true;
        }
      }

      recursionStack.delete(node);
      currentPath.pop();
      return false;
    }

    // 从未处理的节点开始检测环
    for (const node of remaining) {
      if (!visited.has(node)) {
        detectCycleDFS(node);
      }
    }

    // 去重环（相同的环路径只保留一个）
    const uniqueCycles = cycles.filter(
      (cycle, index, self) =>
        index ===
        self.findIndex(
          (c) =>
            c.path.length === cycle.path.length &&
            c.path.every((id, i) => id === cycle.path[i]),
        ),
    );

    // 输出环的详细信息

    console.group(' 拓扑排序环检测结果');

    console.groupCollapsed(`检测到 ${uniqueCycles.length} 个环:`);

    uniqueCycles.forEach((cycle, index) => {
      console.group(`环 ${index + 1}:`);
      console.log(`路径: ${cycle.description}`);
      console.log(`节点数量: ${cycle.path.length - 1}`); // 减1因为首尾重复
      // console.log('详细路径:');
      // cycle.path.forEach((nodeId, nodeIndex) => {
      //   if (nodeIndex < cycle.path.length - 1) {
      //     console.log(`  ${nodeIndex + 1}. ${nodeId}`);
      //   }
      // });
      console.groupEnd();
    });
    console.groupEnd();

    console.log(`未处理的节点 (${remaining.length}):`, remaining);
    console.groupEnd();
  }

  return {
    order,
    hasCycle,
    inDegree,
    initialIn, // 这是初始的入度值
    remaining, // 存在环的节点
    cycles, // 检测到的环的详细信息
  };
}
```
