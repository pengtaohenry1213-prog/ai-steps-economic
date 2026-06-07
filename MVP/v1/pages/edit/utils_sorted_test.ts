/**
 * 验证排序数组中指定ID的排序正确性
 * @param sortedIds 排序好的ID数组
 * @param targetId 要验证的目标ID
 * @returns 验证结果对象
 */
export function validateIdSortingOrder(
  sortedIds: string[] = [],
  targetId: string = '',
  fm?: any,
): {
  // 函数返回值的类型声明
  isValid: boolean;
  message: string;
  targetIndex: number;
  violations: Array<{
    dependencyId: string;
    dependencyIndex: number;
    message: string;
  }>;
} {
  const formula = fm || {};
  const targetFormula = formula[targetId];

  // 如果目标ID在排序数组中不存在
  const targetIndex = sortedIds.indexOf(targetId);
  if (targetIndex === -1) {
    return {
      isValid: false,
      targetIndex: -1,
      violations: [],
      message: `目标ID "${targetId}" 在排序数组中不存在`,
    };
  }

  // 如果目标ID在formula中不存在或没有calcMarks
  if (!targetFormula || !Array.isArray(targetFormula.calcMarks)) {
    return {
      isValid: true,
      targetIndex,
      violations: [],
      message: `目标ID "${targetId}" 没有依赖项，排序正确`,
    };
  }

  const violations: Array<{
    dependencyId: string;
    dependencyIndex: number;
    message: string;
  }> = [];

  // 检查每个依赖项的排序位置
  targetFormula.calcMarks.forEach((dependencyId: string) => {
    const dependencyIndex = sortedIds.indexOf(dependencyId);
    let isValid = true;
    let message = '排序正确';
    if (dependencyIndex === -1) {
      message = `依赖项 "${dependencyId}" 在排序数组中不存在`;
      // 依赖项在排序数组中不存在
      violations.push({
        dependencyId,
        dependencyIndex: -1,
        message,
      });
      isValid = false;
    } else if (dependencyIndex >= targetIndex) {
      message = `依赖项 "${dependencyId}" 的位置(${dependencyIndex}) 大于等于目标ID "${targetId}" 的位置(${targetIndex})`;
      // 依赖项的位置大于等于目标ID的位置，排序错误
      violations.push({
        dependencyId,
        dependencyIndex,
        message,
      });

      isValid = false;
    }

    console.log('验证状态:', isValid ? `✅ ${message}` : `❌ ${message}`);
  });

  const isValid = violations.length === 0;

  return {
    isValid,
    targetIndex,
    violations,
    message: isValid
      ? `目标ID ${targetId} 的排序正确，所有依赖项都在其前面`
      : `目标ID ${targetId} 的排序有误，发现 ${violations.length} 个违规项`,
  };
}

/**
 * 批量验证排序数组中多个ID的排序正确性
 * @param sortedIds 排序好的ID数组
 * @param targetIds 要验证的目标ID数组, e.g. window.formula 中的所有id
 * @returns 批量验证结果
 */
export function validateMultipleIdSortingOrder(
  sortedIds: string[],
  targetIds: string[],
  fm?: any,
): {
  detailedErrors: {
    errorSummary: {
      missingDependencies: number;
      totalViolations: number;
      wrongOrderDependencies: number;
    };
    invalidIds: Array<{
      id: string;
      targetIndex: number;
      violations: Array<{
        dependencyId: string;
        dependencyIndex: number;
        message: string;
      }>;
    }>;
  };
  invalidCount: number;
  results: Array<{
    id: string;
    isValid: boolean;
    message: string;
    targetIndex: number;
    violations: Array<{
      dependencyId: string;
      dependencyIndex: number;
      message: string;
    }>;
  }>;
  summary: string;
  totalCount: number;
  validCount: number;
} {
  const results = targetIds.map((id) =>
    validateIdSortingOrder(sortedIds, id, fm),
  );

  const validCount = results.filter((r) => r.isValid).length;
  const invalidCount = results.length - validCount;

  // 收集所有无效的ID及其详细信息
  const invalidIds = results
    .map((result, index) => ({
      id: targetIds[index] || '',
      ...result,
    }))
    .filter((result) => !result.isValid && result.id);

  // 统计错误类型
  let missingDependencies = 0;
  let wrongOrderDependencies = 0;
  let totalViolations = 0;

  invalidIds.forEach((result) => {
    result.violations.forEach((violation) => {
      totalViolations++;
      if (violation.dependencyIndex === -1) {
        missingDependencies++;
      } else {
        wrongOrderDependencies++;
      }
    });
  });

  // 生成详细的错误摘要
  const detailedErrors = {
    invalidIds,
    errorSummary: {
      missingDependencies,
      wrongOrderDependencies,
      totalViolations,
    },
  };

  // 生成更详细的摘要信息
  let summary = `验证完成：总计 ${results.length} 个ID，${validCount} 个排序正确，${invalidCount} 个排序有误`;

  if (invalidCount > 0) {
    summary += `\n\n错误详情：`;
    summary += `\n- 缺失依赖项：${missingDependencies} 个`;
    summary += `\n- 排序错误依赖项：${wrongOrderDependencies} 个`;
    summary += `\n- 总违规数：${totalViolations} 个`;

    // 添加前5个错误示例
    if (invalidIds.length > 0) {
      summary += `\n\n错误示例（前${Math.min(5, invalidIds.length)}个）：`;
      invalidIds.slice(0, 5).forEach((result, index) => {
        summary += `\n${index + 1}. ID: ${result.id} (位置: ${result.targetIndex})`;
        result.violations.forEach((violation) => {
          summary += `\n   - ${violation.message}`;
        });
      });

      if (invalidIds.length > 5) {
        summary += `\n   ... 还有 ${invalidIds.length - 5} 个错误`;
      }
    }
  }

  return {
    totalCount: results.length,
    validCount,
    invalidCount,
    results: results.map((result, index) => ({
      id: targetIds[index] || '',
      ...result,
    })),
    summary,
    detailedErrors,
  };
}

/**
 * 将公式数据转换为关系数据
 * @param formulaMap 公式数据
 * @param includeSpecial 是否包含特殊节点
 * @param filterField 过滤字段
 * @returns 返回公式数据对应的关系数据(即每个id对应的依赖id数组)
 */
export function formula2graph(
  fm?: any,
  filterField?: string[], // 新增参数, 过滤字段
): Record<string, string[]> {
  // const fm: Record<string, any> = formulaMap || (window as any)?.formula || {};
  const formula = fm || {};
  const graph: Record<string, string[]> = {};
  const canFilterField = filterField && filterField.length > 0;
  const getPeriod = (id: string) =>
    typeof id === 'string' && id.includes('-') ? id.split('-')[1] : '';

  Object.entries(formula).forEach(([id, info]) => {
    const field1 = getPeriod(id) || '';
    if (canFilterField && !filterField.includes(field1)) {
      return false;
    }

    let marks: any[] = [];
    if (Array.isArray(info)) {
      marks = info;
    } else {
      marks = Array.isArray((info as any)?.calcMarks)
        ? (info as any).calcMarks
        : [];
    }

    const deps: string[] = [
      ...new Set(
        marks.filter((m: any) => {
          if (
            typeof m === 'string' &&
            m.trim() !== '' &&
            !m.includes('null') &&
            !m.includes('undefined')
          ) {
            const field = getPeriod(m) || '';
            return !(canFilterField && !filterField.includes(field));
          } else {
            return false;
          }
        }),
      ),
    ];
    graph[id] = deps;
  });
  console.log('Object.keys(graph) =', Object.keys(graph).length); // length:
  return graph;
}

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

  // 1. 初始化所有节点 入度 inDegree 为 0 (把graph里所有的id做为key, 初始化到 inDegree 中, 值为 0, 即: inDegree[id] = 0 )
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
  Object.entries(graph).forEach(([id, marks]) => {
    const calcMarksList = Array.isArray(marks) ? [...new Set(marks)] : []; // 对 calcMarksList 去重

    calcMarksList.forEach((mark) => {
      // 如果未初始化adj(反向邻接表), 则初始化obj
      if (!adj[mark]) adj[mark] = [];

      // 将 mark -> key 加入 adj
      adj[mark].push(id);

      inDegree[id] = (inDegree[id] ?? 0) + 1; // node 的入度 +1
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

/**
 * 测试某个单元格id(target_id)对应的其相关联的ids(test_ids)的正确性
 * 测试原则:
 *  1. 遍历接口返回的ids(并且按weight排序过的ids), 判断每个ids对应的 window.formula[id].calcMarks 中是否包含 target_id, 如果包含则说明正确, 如果没找到, 则需要深层次再遍历calcMarks中每个id(即再次遍历calcMarks);
 *  // 2. 有时可通过当前遍历的id是否已经在test_ids中出现过, 也能代表其正确性; (这一判断条件需要进一步确定!)
 * @param target_id 目标单元格id
 * @param test_ids 测试id数组(从接口返回的排序好的ids)
 * @returns 返回测试结果
 */
export function singleSortedIdsTest(
  target_id: string,
  test_ids: string[],
  fm?: any,
): {
  errorInfo: string[];
  isValid: boolean;
} {
  const r = {
    isValid: true,
    errorInfo: new Array<string>(),
  };
  const formula = fm || {};

  // 递归检查依赖链中是否包含目标ID的内部函数
  // visited: 独立访问记录：每个ID的检查都有独立的访问记录，避免相互干扰
  // maxDepth: 深度限制：currentDepth >= maxDepth 限制最大递归深度
  const checkDependencies = (
    currentId: string,
    visited: Set<string>,
    maxDepth: number = 500 * 3,
    currentDepth: number = 0,
  ): boolean => {
    // 防止循环依赖和过深递归, 循环依赖检测：visited.has(currentId) 检查当前ID是否已被访问
    if (visited.has(currentId) || currentDepth >= maxDepth) {
      return false;
    }

    // 标记当前ID为已访问
    visited.add(currentId);

    const _formula = formula[currentId];
    if (!_formula?.calcMarks || _formula.calcMarks.length === 0) {
      return false;
    }

    const dependencies = _formula.calcMarks;

    // 使用 Set 去重 calcMarks 中的 depId, 避免重复检查, 然后再转回数组
    const uniqueCalcMarks: any[] = [...new Set(dependencies)];

    // 直接检查依赖中是否包含目标ID
    if (uniqueCalcMarks.includes(target_id)) {
      return true;
    }

    // 检查依赖中是否有在testIds中的ID
    // for (const depId of uniqueCalcMarks) {
    //   if (test_ids.includes(depId)) {
    //     return true;
    //   }
    // }

    // 递归检查每个依赖的依赖
    for (const depId of uniqueCalcMarks) {
      if (checkDependencies(depId, visited, maxDepth, currentDepth + 1)) {
        return true;
      }
    }

    return false;
  };

  test_ids.forEach((id: string) => {
    const f = formula[id];
    // if(id=='C10001A0428-2026') {
    //   debugger
    // }
    if (f && f?.calcMarks && f.calcMarks.length > 0) {
      const dependencies = f.calcMarks;

      // 使用 Set 去重 calcMarks 中的 depId
      const uniqueCalcMarks = [...new Set(dependencies)];

      // 直接检查依赖中是否包含目标ID
      if (uniqueCalcMarks.includes(target_id)) {
        return; // 找到直接依赖，跳过
      }

      // 为每个ID创建独立的访问记录，防止循环依赖, 独立的访问记录：为每个ID创建独立的 visited Set，而不是共享一个全局的 visited。
      const visited = new Set<string>();

      // 使用内部递归函数检查多层依赖. 传递访问记录：将 visited 作为参数传递给 checkDependencies 函数，确保在递归过程中正确维护访问状态。
      const found = checkDependencies(id, visited);

      if (!found) {
        const message = `❌ [多层依赖检查] 目的ID: ${id} 在 ${uniqueCalcMarks.join(', ')} 及其多层依赖中不存在 ${target_id}`;
        r.isValid = false;
        r.errorInfo.push(message);
      }
    }
  });

  return r;
}
