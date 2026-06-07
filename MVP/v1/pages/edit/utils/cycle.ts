type DAG = {
  [key: string]: string[];
};

/**
 * 检测 DAG 中的环并记录环路径
 * @param dag 有向图结构 { [node]: string[] }
 * @returns cycles
 */
export default function detectCycles(dag: DAG): string[][] {
  const visited = new Set<string>();
  const recursionStack = new Set<string>(); // 当前递归路径（使用 Set 提高查找速度）
  const cycles: string[][] = []; // 存储所有环

  const checkCycle = (node: string, currentPath: string[]) => {
    if (recursionStack.has(node)) {
      // 发现环，记录路径（从环起点到当前节点）
      const cycleStartIndex = currentPath.indexOf(node);
      const cyclePath = currentPath.slice(cycleStartIndex);
      cyclePath.push(node); // 闭合环
      cycles.push(cyclePath);
      return;
    }

    if (visited.has(node)) {
      return; // 已访问过且不在当前路径中，跳过
    }

    // 标记为已访问，并加入当前递归路径
    visited.add(node);
    recursionStack.add(node);
    currentPath.push(node);

    // 递归检查所有邻接节点
    const neighbors = dag[node] || [];
    for (const neighbor of neighbors) {
      checkCycle(neighbor, currentPath);
    }

    // 回溯：从递归路径中移除当前节点
    recursionStack.delete(node);
    currentPath.pop();
  };

  // 遍历所有节点，确保不遗漏独立子图
  for (const node of Object.keys(dag)) {
    if (!visited.has(node)) {
      checkCycle(node, []); // 传入空数组作为初始路径
    }
  }

  return cycles;
}
