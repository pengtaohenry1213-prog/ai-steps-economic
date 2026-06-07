// import log4js from 'log4js';

// // 配置
// log4js.configure({
//   appenders: {
//     console: { type: 'console' },
//     file: { type: 'file', filename: 'logs/app.log' }
//   },
//   categories: {
//     default: { appenders: ['console', 'file'], level: 'info' }
//   }
// });

// const logger = log4js.getLogger();

// // 使用
// logger.info('这是一条信息');
// logger.error('这是一条错误');

// import { SimpleLogger } from './logger';

// 季度处理
export function getQuarter(num: number): number {
  return Math.floor(num / 3);
}
const isEmpty = (value: any) => {
  if (value === undefined || value === null || value === '') {
    return true;
  }
  return false;
};
// 只检测非引用类型
const isEqual = (valueA: any, valueB: any) => {
  const isEmptyA = isEmpty(valueA);
  const isEmptyB = isEmpty(valueB);
  if (isEmptyA && isEmptyB) {
    return true;
  }
  if (isEmptyA || isEmptyB) {
    return false;
  }

  // eslint-disable-next-line eqeqeq
  return valueA == valueB;
};

type Callback<T> = (item: T) => T;
// 扁平化tree数据
export function getFlatTree<T>(
  data: T[],
  field: keyof T,
  isSaveNode: boolean,
  callback?: Callback<T>,
): T[] {
  const flatData: T[] = [];
  const traverseTree = (
    data: T[],
    field: keyof T,
    isSaveNode: boolean,
    callback?: Callback<T>,
  ) => {
    data.forEach((item: any) => {
      const node = callback ? callback(item) : item;
      if (isSaveNode) {
        flatData.push(node);
      }
      if (item[field]) {
        traverseTree(item[field], field, isSaveNode, callback);
      } else {
        flatData.push(node);
      }
    });
  };
  traverseTree(data, field, isSaveNode, callback);
  return flatData;
}

export const testPerformance = (fn: any) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  // @es-disabled
  console.warn(`执行时间为 ${end - start} ms`);
};

function isScientificNotation(str: string) {
  // 检测是否为科学计数法
  // eslint-disable-next-line regexp/no-unused-capturing-group
  return /^[-+]?(\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/i.test(str);
}

const isNumber = (value: string) => {
  // eslint-disable-next-line regexp/no-unused-capturing-group
  const regex = /^-?\d+(\.\d+)?$/;

  return regex.test(value) || isScientificNotation(value);
};

// 判断是否为日期格式
const isDate = (value: string): boolean => {
  const datePattern = /^(?:\d{4}|\d{4}-\d{1,2})$/;
  return datePattern.test(value);
};

export { isDate, isEmpty, isEqual, isNumber, isScientificNotation };

/**
 * 根据 table_data 过滤 data
 * @param formula_data 原始公式数据
 * @param table_data 原始表格数据
 * @returns filterData 返回table_data相关的公式
 */
export const filterFormulaData: any | Record<string, any> = (
  formula_data: Record<string, any>,
  table_data: Record<string, any>,
) => {
  const filterData = Object.entries(formula_data).filter(([id, node]) => {
    // console.log( id, ', ',node);
    const has = id in table_data;
    if (has) {
      return node;
    }
    return [];
  });

  return filterData ? Object.fromEntries(filterData) : {};
};

/**
 * 删除 formula_data 中个别属性的数据
 * @param formula_data 原始公式数据
 * @returns r 返回删除属性看的formula_data数据
 */
export const clearFormulaDataAttrs: Record<string, any> = (
  formula_data: Record<string, any>,
) => {
  const r = Object.entries(formula_data).filter((item) => {
    const _item: any = item[1];
    _item.children = [];
    _item.childrenMap = [];
    _item.curFormula = [];
    _item.metricCodesMap = [];
    _item.marks = [];
    return item;
  });

  return r ? Object.fromEntries(r) : {};
};

// 数据校验结果接口, 使用 TypeScript 接口定义校验结果的结构
interface ValidationResult {
  isValid: boolean; // 是否通过校验
  missingCells: string[]; // 缺失的单元格
  invalidDependencies: string[]; // 无效的依赖关系
  isolatedCells: string[]; // 孤立的单元格
  // dataMismatches: {          // 数据不匹配的单元格
  //   cellId: string;
  //   field: string;
  //   originalValue: any;
  //   relationValue: any;
  // }[];
  statistics: {
    dependencyCount: number; // 图中所有“箭头”的总数, 应该表示在 relationData 中，所有单元格的总依赖数量，即所有 dependencies 数组中元素的总和。简单来说，就是所有“指向”其他单元格的箭头的总数。
    dependentCount: number; // 应该表示在 relationData 中，所有单元格的总被依赖数量，即所有 dependents 数组中元素的总和。简单来说，就是所有“被指向”的箭头的总数。
    // 统计数据
    originalCellCount: number; // 最终构建出来的 relationData 对象中包含的单元格（节点）的总数量. 表示在 getCellRelationData 方法中，从原始表格数据 (sheetData) 和列配置 (sheetColumn) 中提取出的有效单元格的总数。
    relationCellCount: number; // 表示最终构建出的 relationData 对象中包含的单元格（节点）总数。
  };

  // 新增字段
  circularDependencies: string[]; // 存储循环依赖的路径
  invalidNodes: string[]; // 存储无效的节点引用
  redundantDependencies: string[]; // 存储冗余的依赖关系
  dependencyChains: { // 存储依赖链信息
    cellId: string;
    chain: string[];
    depth: number;
  }[];
  groupViolations: { // 存储分组一致性违规
    cellId: string;
    invalidDependency: string;
    group: string;
  }[];
}

/**
 * 校验单元格关系数据的完整性
 * @param cellsInfo 原始表格数据
 * @param relationData 关系数据
 * @returns ValidationResult 校验结果
 * 实现了多个层次的校验：
 *  数据完整性校验  ✅ 已实现
 *  数据内容校验 ❌ 未完全实现
 *  依赖关系校验 ✅ 已实现
 *  特殊场景校验 ❌ 未完全实现
 *  日志记录(printValidationResult ✅ 已实现)
 */
export function validateCellRelationData(
  cellsInfo: Record<string, any>,
  relationData: Record<string, any>,
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    missingCells: [],
    invalidDependencies: [],
    isolatedCells: [],
    // dataMismatches: [],
    statistics: {
      originalCellCount: Object.keys(cellsInfo).length,
      relationCellCount: Object.keys(relationData).length,
      dependencyCount: 0,
      dependentCount: 0,
    },
    circularDependencies: [],
    invalidNodes: [],
    redundantDependencies: [],
    dependencyChains: [],
    groupViolations: []
  };

  /*
    1. 数据完整性校验：
    - 遍历原始表格数据 TABLE_DATA，检查每个单元格是否都存在于 relationData 中
    - 可以通过比较两个数据集的 key 集合是否完全一致
    - 如果发现缺失的 key，记录并输出具体是哪些单元格数据缺失
  */
  const originalKeys = new Set(Object.keys(cellsInfo));
  const relationKeys = new Set(Object.keys(relationData));

  // 检查缺失的单元格
  originalKeys.forEach((key) => {
    if (!relationKeys.has(key)) {
      result.missingCells.push(key);
      result.isValid = false;
    }
  });

  /*
    2. 数据内容校验
    - 对于每个存在的单元格，比较原始数据和 relationData 中的基础属性是否一致
    - 检查关键字段如 metricCode、metricName、unit、scale 等是否匹配
    - 特别关注 formula 相关的属性是否正确
  */
  // relationKeys.forEach(key => {
  //   if (cellsInfo[key]) {
  //     const original = cellsInfo[key];
  //     const relation = relationData[key];

  //     // 检查关键字段
  //     const keyFields = ['metricCode', 'metricName', 'unit', 'scale', 'level', 'sort', 'metricCategory'];
  //     keyFields.forEach(field => {
  //       if (!isEqual(original[field], relation[field])) {
  //         result.dataMismatches.push({
  //           cellId: key,
  //           field,
  //           originalValue: original[field],
  //           relationValue: relation[field]
  //         });
  //         result.isValid = false;
  //       }
  //     });
  //   }
  // });

  // 3. 依赖关系校验
  relationKeys.forEach((key) => {
    const cell = relationData[key];
    const dependencies = cell.dependencies; // 直接获取属性 // || [];
    const dependents = cell.dependents || [];

    // 更新统计信息
    // 增加类型检查，确保 dependencies 是数组
    if (Array.isArray(dependencies)) {
      result.statistics.dependencyCount += dependencies.length; // 累加 dependencies 的长度
    } else {
      // 如果 dependencies 不是数组，记录警告或错误
      console.warn(`单元格 ${key} 的 dependencies 不是数组:`, dependencies);
      result.isValid = false; // 标记校验失败
    }
    result.statistics.dependentCount += dependents.length; // 累加 dependents 的长度

    // 检查无效的依赖关系
    if (Array.isArray(dependencies)) {
      // 确保只遍历数组类型的 dependencies
      dependencies.forEach((depId: string) => {
        if (!relationKeys.has(depId)) {
          result.invalidDependencies.push(`${key} -> ${depId}`);
          result.isValid = false;
        }
      });
    }

    // 检查孤立单元格
    // if (dependencies.length === 0 && dependents.length === 0) {
    if (
      Array.isArray(dependencies) &&
      dependencies.length === 0 &&
      Array.isArray(dependents) &&
      dependents.length === 0
    ) {
      result.isolatedCells.push(key);
    }
  });

  /*
    4. 特殊场景校验：
    - 检查是否有特殊的公式单元格被正确处理
    - 验证带有特殊标记的单元格（如固定值、计算值等）是否被正确识别
    - 检查时间序列相关的单元格是否都被正确处理
  */
  // relationKeys.forEach(key => {
  //   const cell = relationData[key];

  //   // 检查公式相关属性
  //   if (cell.formula) {
  //     if (!cell.formula.formula || !cell.formula.calcMarks) {
  //       result.dataMismatches.push({
  //         cellId: key,
  //         field: 'formula',
  //         originalValue: 'expected formula properties',
  //         relationValue: cell.formula
  //       });
  //       result.isValid = false;
  //     }
  //   }

  //   // 检查时间序列相关属性
  //   if (isDate(key.split('-')[1])) {
  //     if (!cell.value && cell.value !== 0) {
  //       result.dataMismatches.push({
  //         cellId: key,
  //         field: 'value',
  //         originalValue: 'expected value',
  //         relationValue: cell.value
  //       });
  //       result.isValid = false;
  //     }
  //   }
  // });

  // 2. 执行循环依赖检测
  result.circularDependencies = detectCircularDependencies(relationData);
  if (result.circularDependencies.length > 0) {
    result.isValid = false;
  }

  // 3. 执行依赖链分析
  result.dependencyChains = analyzeDependencyChains(relationData);
  
  // 4. 检查无效节点引用
  Object.entries(relationData).forEach(([cellId, cell]) => {
    const dependencies = cell.dependencies || [];
    dependencies.forEach((depId: string) => {
      if (!relationData[depId]) {
        result.invalidNodes.push(`${cellId} -> ${depId}`);
      }
    });
  });

  // 5. 检查冗余依赖
  Object.entries(relationData).forEach(([cellId, cell]) => {
    const dependencies = new Set(cell.dependencies || []);
    if (dependencies.size !== (cell.dependencies || []).length) {
      result.redundantDependencies.push(cellId);
    }
  });

  return result;
}

/*
  环检测（循环依赖）功能
*/
function detectCircularDependencies(
  relationData: Record<string, any>
): string[] {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const circularPaths: string[] = [];

  function dfs(cellId: string, path: string[]) {
    if (recursionStack.has(cellId)) {
      // 找到循环依赖
      const cycleStart = path.indexOf(cellId);
      const cycle = path.slice(cycleStart).concat(cellId);
      circularPaths.push(cycle.join(' -> '));
      return;
    }

    if (visited.has(cellId)) return;

    visited.add(cellId);
    recursionStack.add(cellId);
    path.push(cellId);

    const dependencies = relationData[cellId]?.dependencies || [];
    for (const depId of dependencies) {
      if (relationData[depId]) {
        dfs(depId, [...path]);
      }
    }

    recursionStack.delete(cellId);
  }

  Object.keys(relationData).forEach(cellId => {
    if (!visited.has(cellId)) {
      dfs(cellId, []);
    }
  });

  return circularPaths;
}

/*
  依赖链分析功能
*/
function analyzeDependencyChains(
  relationData: Record<string, any>
): { cellId: string; chain: string[]; depth: number }[] {
  const chains: { cellId: string; chain: string[]; depth: number }[] = [];

  function getDependencyChain(
    cellId: string,
    visited: Set<string> = new Set(),
    currentChain: string[] = []
  ): { chain: string[]; depth: number } {
    if (visited.has(cellId)) {
      return { chain: currentChain, depth: currentChain.length };
    }

    visited.add(cellId);
    currentChain.push(cellId);

    const dependencies = relationData[cellId]?.dependencies || [];
    let maxDepth = currentChain.length;

    for (const depId of dependencies) {
      if (relationData[depId]) {
        const { depth } = getDependencyChain(depId, new Set(visited), [...currentChain]);
        maxDepth = Math.max(maxDepth, depth);
      }
    }

    return { chain: currentChain, depth: maxDepth };
  }

  Object.keys(relationData).forEach(cellId => {
    const { chain, depth } = getDependencyChain(cellId);
    chains.push({ cellId, chain, depth });
  });

  return chains;
}

/**
 * 打印校验结果, 提供了辅助函数用于打印校验结果，方便调试和问题定位
 * @param result 校验结果
 * 提供了详细的校验结果，包括：缺失的单元格、无效的依赖关系、孤立的单元格、数据不匹配的详细信息、统计数据
 */
export function printValidationResult(result: ValidationResult): void {
  // 初始化日志收集器
  // SimpleLogger.init();

  console.group('单元格关系数据校验结果');

  console.log('校验状态:', result.isValid ? ' ✅ 通过' : ' ❌ 未通过');
  // console.log('统计数据:', result.statistics);
  console.log('统计数据:', {
    '原始单元格总数 (originalCellCount)': result.statistics.originalCellCount,
    '关系数据单元格总数 (relationCellCount)': result.statistics.relationCellCount,
    '总依赖数量 (dependencyCount)': result.statistics.dependencyCount,
    '总被依赖数量 (dependentCount)': result.statistics.dependentCount,
    '注:': '一个图中的边（依赖）的数量通常情况下不会等于点的数量。',
  });

  if (result.missingCells.length > 0) {
    console.groupCollapsed(` ❌ 缺失的单元格 (共计:${result.missingCells.length})`);
    result.missingCells.forEach((cell) => console.log(cell));
    console.groupEnd();
  }
  else {
    console.log(' ✅ 缺失的单元格 (共计: 0)');
  }

  if (result.invalidDependencies.length > 0) {
    console.groupCollapsed(` ❌ 无效的依赖关系 (共计:${result.invalidDependencies.length})`);
    result.invalidDependencies.forEach((dep) => console.log(dep));
    console.groupEnd();
  }
  else {
    console.log(' ✅ 无效的依赖关系 (共计: 0)');
  }

  if (result.isolatedCells.length > 0) {
    console.groupCollapsed(` ❌ 孤立的单元格 (共计:${result.isolatedCells.length}):`);
    result.isolatedCells.forEach((cell) => console.log(cell));
    console.groupEnd();
  }
  else {
    console.log(' ✅ 孤立的单元格: (共计: 0)');
  }

  // if (result.dataMismatches.length > 0) {
  //   console.groupCollapsed('数据不匹配:');
  //   result.dataMismatches.forEach(mismatch => {
  //     console.log(`单元格 ${mismatch.cellId}:`);
  //     console.log(`  字段: ${mismatch.field}`);
  //     console.log(`  原始值: ${mismatch.originalValue}`);
  //     console.log(`  关系值: ${mismatch.relationValue}`);
  //   });
  //   console.groupEnd();
  // }

  // 打印循环依赖
  if (result.circularDependencies.length > 0) {
    console.groupCollapsed(` ❌ 发现循环依赖 (共计:${result.circularDependencies.length}):`);
    result.circularDependencies.forEach(path => console.log(path));
    console.groupEnd();
  }
  else {
    console.log(' ✅ 发现循环依赖 (共计: 0)');
  }

  // 打印依赖链分析
  console.groupCollapsed('依赖链分析:');
  result.dependencyChains
    .sort((a, b) => b.depth - a.depth)
    .forEach(({ cellId, chain, depth }) => {
      console.log(`单元格 ${cellId} 的依赖链 (深度: ${depth}):`);
      console.log(chain.join(' -> '));
    });
  console.groupEnd();

  // 打印无效节点
  if (result.invalidNodes.length > 0) {
    console.groupCollapsed('无效节点引用:');
    result.invalidNodes.forEach(node => console.log(node));
    console.groupEnd();
  }
  else {
    console.log(' ✅ 无效节点引用 (共计: 0)');
  }

  // 打印冗余依赖
  if (result.redundantDependencies.length > 0) {
    console.groupCollapsed('冗余依赖:');
    result.redundantDependencies.forEach(cellId => console.log(cellId));
    console.groupEnd();
  }
  else {
    console.log(' ✅ 冗余依赖 (共计: 0)');
  }

  console.groupEnd();

  // 保存日志
  // SimpleLogger.save();
}

/**
 * 获取所有单元格信息的方法
 * @param sheetColumn 表格列配置
 * @param sheetData 表格数据
 * @param menuCurrentPageCode 当前菜单页面code
 * @returns flatCells 所有单元格信息
 */
export const getAllCellsInfo = (
  sheetColumn: Record<string, any>,
  sheetData: Record<string, any>,
  menuCurrentPageCode: string,
): Record<string, any> => {
  const columns = sheetColumn[menuCurrentPageCode] || [];
  const tableData = sheetData[menuCurrentPageCode] || [];
  const flatCells: Record<string, any> = {};
  const exceptColumns = new Set(['isFixeds', 'metricName', 'scale', 'unit']);

  tableData.forEach((row: object | []) => {
    columns.forEach((column: { field: string }) => {
      const field = column.field;

      if (!exceptColumns.has(field)) {
        const metricCode = row.metricCode;
        if (metricCode && field && field !== 'metricCode') {
          const id = `${metricCode}-${field}`;
          if (
            (window as any).all?.[metricCode] && // Use optional chaining
            (window as any).formula?.[id] // Use optional chaining
          ) {
            flatCells[id] = {
              value: row[field],
              metricCode,
              metricName: row.metricName,
              unit: row.unit,
              scale: row.scale,
              level: row.level,
              sort: row.sort,
              metricCategory: row.metricCategory,
            };
          }
        }
      }
    });
  });

  return flatCells;
};

/**
 * 根据 getAllCellsInfo 获取的当前表格所有单元格数据的构建关系 及 获取单元格的关系网
 * @param sheetColumn 表格列配置
 * @param sheetData 表格数据
 * @param menuCurrentPageCode 当前菜单页面code
 * @param formulaMap 公式映射数据
 * @returns relationData 单元格关系数据
 */
export const getCellRelationData = (
  sheetColumn: Record<string, any>,
  sheetData: Record<string, any>,
  menuCurrentPageCode: string,
  formulaMap: Record<string, any>, // Pass formulaMap as a parameter
) => {
  const cellsInfo = getAllCellsInfo(
    sheetColumn,
    sheetData,
    menuCurrentPageCode,
  );
  // const formulaMap = (window as any).formula || {}; // Now passed as parameter

  // 先收集所有依赖关系
  const dependentsMap: Record<string, string[]> = {};

  console.log('所有单元格数据:', cellsInfo);

  let filteredFormula: Record<string, any> = {}; // Initialize with empty object
  if (formulaMap && Object.entries(formulaMap).length > 0) {
    const _formula = JSON.parse(JSON.stringify(formulaMap)); // 使用 JSON 序列化方式克隆
    filteredFormula = filterFormulaData(_formula, cellsInfo);
    console.log(
      'filteredFormula =',
      filteredFormula,
      'formulaMap =',
      formulaMap,
    );
  }

  // 统计每个单元格被哪些单元格依赖（遍历所有公式）
  Object.entries(filteredFormula).forEach(([formulaId]) => {
    const _formula = filteredFormula[formulaId];

    // 处理 calcMarks 为空数组、null 或 undefined 的情况
    if (
      !_formula ||
      !Array.isArray(_formula.calcMarks) ||
      _formula.calcMarks.length === 0
    ) {
      // 这是一个独立节点，没有依赖关系
      if (cellsInfo[formulaId] && !dependentsMap[formulaId]) {
        dependentsMap[formulaId] = [];
      }
      return; // 跳过后续处理
    }

    // 使用 Set 去重 calcMarks 中的 depId
    const uniqueCalcMarks = new Set(_formula.calcMarks);

    // 遍历去重后的依赖ID
    uniqueCalcMarks.forEach((id) => {
      // id = C10000A0290-null 是无效depId && 依赖关系收集时，只处理 cellsInfo 中存在的单元格

      // 检查 depId 是否有效且存在于 cellsInfo 中
      if (
        id &&
        typeof id === 'string' &&
        !id.includes('null') &&
        cellsInfo[id]
      ) {
        if (!dependentsMap[id]) {
          dependentsMap[id] = [];
        }
        // 避免重复添加相同的依赖关系
        if (!dependentsMap[id].includes(formulaId)) {
          dependentsMap[id].push(formulaId);
        }
      }
    });
  });

  /*
    ## 依赖关系的方向
      dependencies：当前单元格依赖的"前置"单元格（你要先算 dependencies，才能算当前单元格）。
      dependents：依赖当前单元格的"后置"单元格（你改了当前单元格，dependents 也要重新算）。
      ### 依赖关系的方向
        A 的 calcMarks 里有 B，说明A 依赖 B，也就是A 的公式用到了 B 的值。
        换句话说，B 是 A 的 dependencies，A 是 B 的 dependents。

    ## 公式链式计算的常见做法
      当你修改了某个单元格，应该：
        1. 先计算当前单元格的新值。
        2. 然后递归/队列式地，对所有 dependents 也做重新计算，直到没有后续依赖。
      5. 代码层面
        * 你可以用 dependents 字段，递归/队列式地触发所有受影响单元格的重新计算。
  */
  // 2. 组装最终结构（遍历所有公式节点，而不是只遍历 cellsInfo）, 使用 filteredFormula 代替 formulaMap(即: window.formula)
  const relationData: Record<string, any> = {};
  Object.keys(filteredFormula).forEach((cellId) => {
    const _formula = filteredFormula[cellId];
    const uniqueCalcMarks = new Set(_formula.calcMarks);
    if (cellsInfo[cellId]) {
      relationData[cellId] = {
        ...cellsInfo[cellId], // 有表格数据就合并，没有就只用公式
        formula: _formula, // Use _formula here as the formula detail
        dependencies: [...uniqueCalcMarks], // 是"我依赖谁"
        dependents: dependentsMap[cellId] || [], // 是"谁依赖我"
        isIndependent:
          !_formula ||
          !Array.isArray(_formula.calcMarks) ||
          _formula.calcMarks.length === 0, // Added isIndependent flag
      };
    }
  });

  console.log('relationData =', relationData);

  const validationResult = validateCellRelationData(cellsInfo, relationData);
  printValidationResult(validationResult);

  if (!validationResult.isValid) {
    console.warn('数据校验未通过，请检查上述问题');
  }

  return relationData;
};

export function saveConsoleLogs() {
  // 创建一个保存控制台日志的方法
  console.save = function(data: any, filename: string) {
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 获取控制台日志
  const logs = console.logs || [];
  const logContent = logs.join('\n');
  debugger
  // 保存日志
  console.save(logContent, `console-logs-${new Date().toISOString()}.txt`);
}
