/* eslint-disable @typescript-eslint/no-non-null-assertion */

type DAG = {
  [key: string]: string[];
};

/**
 * 对给定的有向无环图（DAG）执行拓扑排序
 * 使用Kahn算法实现，保证排序结果的稳定性
 * @param dag - 要排序的有向无环图（value[] 依赖于 key）
 * @returns 拓扑排序后的节点数组
 * @throws 如果输入不是对象或图中存在环则抛出错误
 */
export default function topologicalSort(dag: DAG): string[] {
  console.group('拓扑排序');
  console.time('拓扑排序耗时');

  // 输入验证
  if (!dag || typeof dag !== 'object') {
    throw new Error('Invalid dag: must be an object');
  } 

  const graph = new Map<string, string[]>(); // 使用Map存储图的邻接表表示
  const inDegree = new Map<string, number>(); // 使用Map存储每个节点的入度
  const allNodes = new Set<string>(); // 使用Set存储图中所有节点（包括没有依赖的节点）

  // 初始化图和入度
  for (const [node, deps] of Object.entries(dag)) {
    graph.set(node, deps || []); // 设置当前节点的邻接表，空数组作为默认值
    inDegree.set(node, inDegree.get(node) || 0); // 初始化当前节点的入度（如果没有则设为0）
    allNodes.add(node); // 将当前节点添加到所有节点集合中

    // 处理当前节点的所有依赖
    for (const dep of deps) {
      if (!graph.has(dep)) graph.set(dep, []); // 如果依赖节点尚未在图中，则初始化其邻接表为空数组
      inDegree.set(dep, (inDegree.get(dep) || 0) + 1); // 增加依赖节点的入度
      allNodes.add(dep); // 将依赖节点添加到所有节点集合中
    }
  }

  // 预排序所有节点的邻居列表（保证稳定性）
  for (const neighbors of graph.values()) {
    neighbors.sort((a: string, b: string) => a.localeCompare(b)); // 使用localeCompare保证字符串排序的一致性
  }

  // 初始化队列：包含所有入度为0的节点（已排序）
  const queue = [...allNodes].filter(
    (node) => inDegree.get(node) === 0,
  ) as string[];
  // 对初始队列进行排序以保证稳定性
  queue.sort((a, b) => a.localeCompare(b));

  // 存储拓扑排序结果
  const topoOrder: string[] = [];

  // 使用二分查找将节点插入到已排序数组的正确位置，替代全排
  const insertSorted = (arr: string[], item: string) => {
    let high = arr.length;
    let low = 0;
    while (low < high) {
      // 二进制右移（等价于 Math.floor((low + high) / 2)），比除法运算更快，且避免负数问题。
      const mid = (low + high) >>> 1;
      // A.localeCompare(B)返回值为 -1、0、1，分别表示 A应排在 B前、相同、后。
      if (arr[mid]!.localeCompare(item) < 0) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    arr.splice(low, 0, item);
  };

  // Kahn算法主循环
  while (queue.length > 0) {
    const current = queue.shift(); // 取出队列中的第一个节点（入度为0）
    topoOrder.push(current!); // 将该节点加入拓扑排序结果

    // 处理当前节点的所有邻居
    for (const neighbor of graph.get(current!)!) {
      // 减少邻居节点的入度
      inDegree.set(neighbor, inDegree.get(neighbor!)! - 1);
      // 如果邻居节点的入度变为0，则加入队列
      if (inDegree.get(neighbor) === 0) {
        insertSorted(queue, neighbor);
      }
    }
  }

  // 检查图中是否存在环
  if (topoOrder.length !== allNodes.size) {
    const remaining = new Set(allNodes);
    topoOrder.forEach((node) => remaining.delete(node!));
    throw new Error(`图中存在环，涉及节点: ${[...remaining].join(',')}`);
  }

  console.log('排序结果', topoOrder);
  console.timeEnd('拓扑排序耗时');
  console.groupEnd();
  // 返回拓扑排序结果
  return topoOrder;
}
