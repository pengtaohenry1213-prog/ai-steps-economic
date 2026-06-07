// import { el } from 'element-plus/es/locales.mjs';

// import type { EditorTs } from '@vben/types';
// import { useRequest } from 'vue-hooks-plus';

// import { getNodeData } from '#/api/data';

// import { id } from 'element-plus/es/locales.mjs';

import {
  formula2graph,
  kahnTopologicalSort,
  singleSortedIdsTest,
  validateMultipleIdSortingOrder,
} from './utils_sorted_test';

const IS_DEBUG = true;

declare global {
  interface Console {
    save: (data: any, filename: string) => void;
    logs: string[];
  }
}

// type Row = {
//   [key: string]: any; // 添加字符串索引签名
//   delFlag: number;
//   id: string;
//   level: number;
//   metricCategory: number;
//   metricCode: string;
//   metricName: string;
//   modelCode: string;
//   opTime: string;
//   opUser: string;
//   pageCode: string;
//   pMetricCode: string;
//   scale: string;
//   sort: number;
//   unit: string;
//   versionCode: string;
// };

const getInvestmentType = (modelCode: string) => {
  let investmentType = '';
  if (modelCode) {
    switch (modelCode) {
      case '34a1b9ab-f5b4-40e4-b152-8e813685b800': {
        investmentType = '固定资产类-新增产能';
        break;
      }
      case '8351da6e-d161-849d-2605-e8c0887c767a': {
        investmentType = '固定资产类-新增产能'; // 对应数据库的 investmentType
        break;
      }
      case 'cd1a3f43-cff6-477c-8067-43fb4b3de9fe': {
        investmentType = '新增产能完整模型Ⅱ';
        break;
      }
    }
  }
  return investmentType;
};

/**
 * 获取拓扑排序过的id们
 * @returns 拓扑排序过的id们
 */
export async function getSortedGraph(
  isKahn: boolean = false,
  instance: any,
  formula: any,
) {
  const { modelCode, modelType, forecastTimeType, dateFields } = instance;
  // const investmentType = getInvestmentType(modelCode);

  const returnObject = {
    ids: [] as string[],
    ids_weights: [] as { node: string; weight: number }[],
  };

  // modelInfo的信息来源于: 接口返回的数据 gateway/economodel/economodel/datamodel/page
  // "modelType": "完整模型",
  // "modelCode": "cd1a3f43-cff6-477c-8067-43fb4b3de9fe"

  // "modelType": "速算模型",
  // "modelCode": "8351da6e-d161-849d-2605-e8c0887c767a", -> "b60e6ccf-d822-4516-bd04-e6625f3f10fc"

  // let returnValue: any[] = [];
  // if (modelType === '速算模型') {
  if (modelType && modelCode === 'b60e6ccf-d822-4516-bd04-e6625f3f10fc') {
    if (isKahn) {
      const VALUE = _getIdsByKahn(formula, dateFields); // 使用kahn排序后的id
      returnObject.ids = VALUE;
    } else {
      const { VALUE } = await import('./ids/topological_value_data');
      // console.log('加载完毕(速算):', VALUE);
      // returnValue = VALUE;
      returnObject.ids = VALUE;
    }
  }
  // else if (modelType === '完整模型') {
  else if (modelType && modelCode === 'cd1a3f43-cff6-477c-8067-43fb4b3de9fe') {
    switch (forecastTimeType) {
      case 'year': {
        // const { YEAR } = await import('./ids/topological_year_data');
        // const { YEAR_WEIGHT } = await import('./ids/topological_year_weight_data');
        // const YEAR = YEAR_WEIGHT.map((e) => e.node);
        // // const uniqueIds = [...new Set(YEAR)]; // YEAR 去重复的id
        // returnObject.ids = YEAR;
        // returnObject.ids_weights = YEAR_WEIGHT;

        if (isKahn) {
          // const { YEAR } = await import('./ids/test-ids');
          const YEAR = _getIdsByKahn(formula, dateFields); // 使用kahn排序后的id
          returnObject.ids = YEAR;

          console.log(`使用kahn排序后的id: ${YEAR.length}: ${YEAR}`);
        } else {
          const { YEAR_WEIGHT } = await import(
            './ids/topological_year_weight_data'
          );
          const YEAR = YEAR_WEIGHT.map((e) => e.node);
          returnObject.ids = YEAR;
          returnObject.ids_weights = YEAR_WEIGHT;
        }

        break;
      }

      case 'quarter': {
        if (isKahn) {
          const QUARTER = _getIdsByKahn(formula, dateFields); // 使用kahn排序后的id
          returnObject.ids = QUARTER;
          console.log(`使用kahn排序后的id: ${QUARTER.length}: ${QUARTER}`);

          returnObject.ids = QUARTER;
        } else {
          const { QUARTER_WEIGHT } = await import(
            './ids/topological_quarter_weight_data'
          );

          const QUARTER = QUARTER_WEIGHT.map((e) => e.node);
          returnObject.ids = QUARTER;
          returnObject.ids_weights = QUARTER_WEIGHT;
        }

        break;
      }
    }
  }
  return returnObject;
}

/**
 * 获取拓扑排序的表名
 * @returns 表名
 */
export function getGraphTableName(instance: any) {
  // modelCode: string) {
  const { modelCode, forecastTimeType } = instance;
  const investmentType = getInvestmentType(modelCode);

  let type = '';
  switch (forecastTimeType) {
    case 'month': {
      type = '';
      break;
    }
    case 'quarter': {
      type = 'Metric_quarter';
      break;
    }
    case 'year': {
      type = 'Metric';
      if (investmentType === '新增产能完整模型Ⅱ') {
        type = 'Metric_year';
      }

      break;
    }
    default: {
      type = 'Metric_value';
    }
  }
  return type;
}

// const SPECIAL = [
//   'arrayAllDate',
//   'arrayAllValue',
//   'arrayAllPeriod',
//   'everyPeriod',
//   'everyPeriods',
//   'global',
//   'periodAdd',
//   'periodMonths',
//   'periodNumber',
//   'prev',
//   'prevPeriodAdd',
//   'futurePeriodAdd',
//   'targetIndustry',
//   'investmentType',
//   'total',
//   'totalYear',
//   'totalPeriod',
//   'var',
// ]; // 15

// // const SPECIALSOURCE = new Set(SPECIAL);

// /**
//  * 判断是否为特殊数据
//  * @param id 指标id
//  * @returns 是否为特殊数据
//  */
// export function isSpecialData(id: string): boolean {
//   // 1. 以特殊前缀开头
//   if (SPECIAL.some((prefix) => id.startsWith(`${prefix}-`))) {
//     if (id.includes('prev-')) {
//       console.log('function isSepcialData: id =', id);
//     }
//     return true;
//   }
//   // 2. _LP结尾的主码（如 C10000A0199_LP-2025）
//   // const parts = id.split('-');
//   // if (parts.length > 1 && parts[0] && parts[0].endsWith('_LP')) return true;

//   try {
//     const _formula = (window as any).formula[id];
//     const _metricCode = id.split('-')[0];

//     if (
//       _metricCode &&
//       _formula?.metricCodesMap &&
//       _formula.metricCodesMap[_metricCode] &&
//       _formula.metricCodesMap[_metricCode]?.isSpecial !== ''
//     ) {
//       // console.log('_metricCode= ', _metricCode, ', type = ',_formula.metricCodesMap[_metricCode].type);
//       return true;
//     }
//   } catch (error) {
//     console.warn('isSpecialData error =', error);
//     return false;
//   }

//   return false;
// }

const SPECIAL_PREFIXES = new Set(
  [
    'arrayAllDate',
    'arrayAllValue',
    'arrayAllPeriod',
    'everyPeriod',
    'everyPeriods',
    'global',
    'periodAdd',
    'periodMonths',
    'periodNumber',
    'prev',
    'prevPeriodAdd',
    'futurePeriodAdd',
    'targetIndustry',
    'investmentType',
    'total',
    'totalYear',
    'totalPeriod',
    'var',
  ].map((p) => `${p}-`),
);

/**
 * 判断是否为特殊数据
 * @param id 指标id
 * @returns 是否为特殊数据
 */
export function isSpecialData(id: string): boolean {
  // 1. 特殊前缀匹配
  for (const prefix of SPECIAL_PREFIXES) {
    if (id.startsWith(prefix)) {
      if (id.includes('prev-')) {
        console.log('function isSpecialData: id =', id);
      }
      return true;
    }
  }

  // 2. _LP 结尾的主码（如 C10000A0199_LP-2025）
  // const [metricCode] = id.split('-');
  // if (metricCode?.endsWith('_LP')) return true;

  // 3. 从 window.formula 查找
  const metricCode = id.split('-')[0];
  const formula =
    typeof window === 'undefined' ? null : (window as any)?.formula?.[id];
  const metricConfig = metricCode
    ? formula?.metricCodesMap?.[metricCode]
    : undefined;

  return Boolean(metricConfig?.isSpecial);
}

// 季度处理
export function getQuarter(num: number): number {
  return Math.ceil(num / 3);
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
  IS_DEBUG && console.log(`执行时间为 ${end - start} ms`);
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
 * 获取所有单元格信息的方法
 * @param sheetColumn 表格列配置
 * @param sheetData 表格数据
 * @param menuCurrentPageCode 当前菜单页面code
 * @returns flatCells 所有单元格信息
 */
// export const getAllCellsInfo = (
//   sheetColumn: Record<string, any>,
//   sheetData: Record<string, any>,
//   menuCurrentPageCode: 'all' | string,
// ): Record<string, any> => {
//   const flatCells: Record<string, any> = {};
//   const exceptArray = ['isFixeds', 'metricName', 'metricCode', 'scale', 'unit'];
//   const exceptColumns = new Set(exceptArray);

//   // 如果 menuCurrentPageCode 是 'all'，则处理所有表格
//   const pageCodes =
//     menuCurrentPageCode === 'all'
//       ? Object.keys(sheetData)
//       : [menuCurrentPageCode];

//   const all = (window as any).all;
//   const formulaMap = (window as any).formula;

//   const _buffer: any[] = [];
//   const total = {
//     rows: 0,
//     columns: 0,
//     cells: 0,
//     titleCount: 0,
//     nonInputCells: 0,
//     invalidCells: 0,
//   };

//   const _memu = (window as any).menu;

//   pageCodes.forEach((pageCode) => {
//     const columns = sheetColumn[pageCode] || [];
//     const tableData = sheetData[pageCode] || [];

//     let rows_length = 0;
//     const columns_length = columns.length - exceptColumns.size;
//     let titleCount = 0;
//     let nonInputCells = 0;
//     let invalidCells = 0;

//     tableData.forEach((row: Row) => {
//       /*
//         row = {
//           "opUser": "",
//           "opTime": "2025-03-29 00:00:00",
//           "sort": 1,
//           "delFlag": 0,
//           "id": "01jv496ykxfz1928k65fezrzy3",
//           "metricName": "一、投资标的",
//           "level": 0,
//           "unit": "",
//           "modelCode": "34a1b9ab-f5b4-40e4-b152-8e813685b800",
//           "versionCode": "4350E538D3254DE1B375EE04854C76EE",
//           "metricCode": "title-01",
//           "pageCode": "257E3B8014A14980BD4129B4D67C1AD6",
//           "metricCategory": 1,
//           "scale": "1",
//           "pMetricCode": "0",
//         }
//         // Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'Row'.
//         // No index signature with a parameter of type 'string' was found on type 'Row'.ts(7053)
//       */
//       const metricCode = row.metricCode;
//       if (metricCode && !metricCode.includes('title-')) {
//         rows_length++;
//         columns.forEach((column: { field: string }) => {
//           const field = column.field;
//           if (field) {
//             if (exceptColumns.has(field)) {
//               nonInputCells++;
//             } else {
//               const id = `${metricCode}-${field}`;
//               if (all[metricCode]) {
//                 flatCells[id] = {
//                   value: row[field],
//                   metricCode,
//                   metricName: all[metricCode].metricName || row.metricName,
//                   unit: row.unit,
//                   scale: row.scale,
//                   level: row.level,
//                   sort: row.sort,
//                   metricCategory: row.metricCategory,
//                 };
//               } else {
//                 IS_DEBUG &&
//                   console.log(
//                     '[查不到的公式, 可能 ]是id =',
//                     id,
//                     ',',
//                     formulaMap[id],
//                     ', metricCode =',
//                     metricCode,
//                     ',',
//                     all[metricCode],
//                   );
//                 invalidCells++;
//               }
//             }
//           } else {
//             IS_DEBUG &&
//               console.log(
//                 `[查不到的field, 可能 ]是id = ${row.id}, ${
//                   formulaMap[row.id]
//                 }, metricCode = ${metricCode}, ${all[metricCode]}`,
//               );
//           }
//         });
//       } else {
//         titleCount++;
//       }
//     });

//     const len = tableData.length;
//     let name =
//       _memu.fillList.find((item: any) => item.pageCode === pageCode)
//         ?.pageName || '';
//     if (!name) {
//       name =
//         _memu.calcList.find((item: any) => item.pageCode === pageCode)
//           ?.pageName || '';
//     }

//     let str = `tableData: rows: ${rows_length}, columns: ${columns_length}, cells:${
//       rows_length * columns_length
//     }, pageCode: ${pageCode} - 名称: ${name} - 行数: ${len}`;
//     str += `, titleCount: ${titleCount}, nonInputCells: ${nonInputCells}, invalidCells: ${invalidCells}`;
//     _buffer.push(str);

//     total.rows += rows_length;
//     total.columns += columns_length;
//     total.cells += rows_length * columns_length;
//     total.titleCount += titleCount;
//     total.nonInputCells += nonInputCells;
//     total.invalidCells += invalidCells;
//   });

//   if (IS_DEBUG && _buffer && _buffer.length > 0) {
//     console.groupCollapsed(`tableData 加载的表格信息 (${_buffer.length}) :`);
//     _buffer.forEach((item: any) => {
//       console.log(item);
//     });

//     let str = `共计: ${_buffer.length} 个表格, 总行数: ${total.rows}, 总单元格数: ${
//       total.cells
//     }, 总标题数: ${total.titleCount}, 非输入单元格(${exceptArray.join(', ')}): ${
//       total.nonInputCells
//     }`;
//     str += `, 无效单元格: ${total.invalidCells}`;
//     str += `, 可计算单元格: [${
//       total.cells - total.titleCount - total.nonInputCells - total.invalidCells
//     }]`;
//     console.log(str);
//     console.groupEnd();
//   }

//   IS_DEBUG &&
//     console.log(
//       `[获取所有当前加载的单元格] flatCells (${Object.keys(flatCells).length}):`,
//       flatCells,
//     );

//   return flatCells;
// };

/**
 * 保存控制台日志到文件
 */
export function saveConsoleLogs() {
  // 创建一个保存控制台日志的方法
  console.save = function (data: any, filename = 'console-logs.txt') {
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

  // 保存日志
  console.save(logContent, `console-logs-${new Date().toISOString()}.txt`);
}

/**
 * 加载中
 * @param loadingRef 加载中ref
 * @param task 任务
 */
export async function withLoading(
  loadingRef: { value: boolean },
  task: () => Promise<void> | void,
) {
  // 开启 loading
  loadingRef.value = true;

  // 等待一帧让 UI 有机会渲染
  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      // 再下一轮事件循环执行任务
      setTimeout(resolve, 1000);
    });
  });

  try {
    // 执行你的任务（支持 async 或 sync）
    await task();
  } finally {
    // 无论成功或失败，都关闭 loading
    loadingRef.value = false;
  }
}

/**
 * 根据全量拓扑排序结果生成每个单元格的影响图
 * @param topoResult 全量拓扑排序结果
 * @returns 每个单元格的影响图映射
 */
// export function generateCellDependencyMaps(topoResult: any) {
//   const { order, graph } = topoResult;
//   const cellDependencyMaps: Record<string, string[]> = {};

//   // 构建反向依赖图（记录哪些单元格依赖当前单元格）
//   const reverseDeps: Record<string, Set<string>> = {};

//   if (!order) {
//     console.log('order 异常!', order);
//   }

//   // 构建所有单元格的反向依赖关系
//   Object.entries(graph).forEach(([id, dependencies]) => {
//     (dependencies as string[]).forEach((depId: string) => {
//       if (!reverseDeps[depId]) {
//         reverseDeps[depId] = new Set();
//       }
//       reverseDeps[depId].add(id);
//     });
//   });

//   const _graph = Object.keys(graph);
//   const _graphLen = _graph.length;
//   let count = 0;
//   // 为每个单元格生成影响图
//   _graph.forEach((cellId) => {
//     // 收集所有受影响的单元格（依赖于指定单元格的所有单元格）
//     const affectedCells = new Set<string>();

//     function collectDependents(id: string) {
//       if (id !== cellId) {
//         affectedCells.add(id);
//       } // 不将初始单元格添加到结果中

//       // 遍历所有依赖当前单元格的单元格
//       if (reverseDeps[id]) {
//         reverseDeps[id].forEach((dependentId) => {
//           if (!affectedCells.has(dependentId)) {
//             collectDependents(dependentId);
//           }
//         });
//       }
//     }

//     // 从初始单元格开始收集
//     if (reverseDeps[cellId]) {
//       reverseDeps[cellId].forEach((dependent) => collectDependents(dependent));
//     }

//     // 如果没有受影响的单元格，设置空数组并跳过
//     if (affectedCells.size === 0) {
//       (window as any).cellDependencyMaps[cellId] = {};
//       return;
//     }

//     // 构建受影响单元格子图的依赖关系
//     const subgraph: Record<string, string[]> = {};
//     affectedCells.forEach((id: string) => {
//       subgraph[id] = (graph[id] || []).filter(
//         (depId: string) => affectedCells.has(depId) || depId === cellId,
//       );
//     });

//     // 计算入度
//     const inDegree: Record<string, number> = {};
//     affectedCells.forEach((id) => {
//       inDegree[id] = 0;
//     });

//     // 计算单元格的入度
//     Object.entries(subgraph).forEach(([id, deps]: [string, string[]]) => {
//       if (id) {
//         deps.forEach((depId: string) => {
//           if (affectedCells.has(depId)) {
//             inDegree[depId] = (inDegree[depId] || 0) + 1;
//           }
//         });
//       }
//     });

//     // 执行拓扑排序
//     const result: string[] = [];
//     const queue: string[] = [];

//     // 添加入度为0的节点到队列
//     affectedCells.forEach((id) => {
//       if (inDegree[id] === 0) {
//         queue.push(id);
//       }
//     });

//     while (queue.length > 0) {
//       const current = queue.shift()!;
//       result.push(current);

//       // 使用已处理节点集合
//       const processed = new Set<string>();

//       // 更新相邻节点的入度
//       Object.entries(subgraph).forEach(([id, deps]: [string, string[]]) => {
//         // 确保不重复处理同一节点对同一依赖的关系
//         if (deps.includes(current) && !processed.has(id)) {
//           processed.add(id);
//           // 安全地减少入度
//           inDegree[id] = (inDegree[id] || 0) - 1;
//           // 只有当入度恰好为0时才加入队列
//           if (inDegree[id] === 0) {
//             queue.push(id);
//           }
//         }
//       });
//     }

//     // 存储拓扑排序结果
//     cellDependencyMaps[cellId] = result;
//     console.log(`cellDependencyMaps[${cellId}, ${count++}]/[${_graphLen}]`); // = ${cellDependencyMaps[cellId]}`);
//   });

//   return cellDependencyMaps;
// }

/**
 * 获取特定单元格变更时需要重新计算的单元格列表
 * @param cellId 变更的单元格ID
 * @param cellDependencyMaps 单元格依赖映射
 * @returns 需要重新计算的单元格列表（已按拓扑顺序排序）
 */
export function getAffectedCellsInOrder(
  cellId: string,
  cellDependencyMaps: any,
) {
  return cellDependencyMaps[cellId] || [];
}

/**
 * 导出单元格依赖数据
 * @param data 数据
 * @returns
 */
// export function exportCellDependencyData(data?: any) {
//   try {
//     // If no specific data is provided, use the cell dependency maps
//     const targetData = data || (window as any).cellDependencyMaps;

//     if (!targetData) {
//       console.error('No data to export');
//       return;
//     }

//     // Format all data as a TypeScript export array
//     let content = 'export const SORTED_GRAPH = [';

//     if (Array.isArray(targetData)) {
//       // If targetData is already an array (like topoResult.order)
//       content += targetData.map((item) => `  "${item}"`).join(',');
//     } else {
//       // If it's an object (like cellDependencyMaps), flatten the data structure
//       // This approach loses the relationship between cells, but preserves all node IDs
//       const allCellIds = new Set<string>();

//       Object.values(targetData).forEach((cellData) => {
//         if (Array.isArray(cellData)) {
//           cellData.forEach((id) => allCellIds.add(id));
//         }
//       });

//       Object.keys(targetData).forEach((cellId) => {
//         allCellIds.add(cellId);
//       });

//       content += [...allCellIds].map((id) => `  "${id}"`).join(',');
//     }

//     content += '\n];';

//     // Create and download the .ts file
//     const blob = new Blob([content], { type: 'application/typescript' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'topological_data.ts';
//     a.click();
//     URL.revokeObjectURL(url);

//     console.log(
//       "将数据导出为TypeScript文件。检查您的下载文件夹: 'topological_data.ts'",
//     );
//   } catch (error) {
//     console.error('导出数据时出错:', error);
//     // alert("无法导出数据。请尝试导出单个单元格.");
//   }
// }

/**
 * 根据指标编码查找其所在的表格名称
 * @param metricCode 指标编码
 * @returns 表格名称和页面编码的对象，如果未找到则返回null
 */
export function findTableNameByMetricCode(
  metricCode: string,
): { metricName: string; pageCode: string; pageName: string } | null {
  // 首先从window.all中查找指标信息
  const all = typeof window === 'undefined' ? {} : (window as any).all;
  const metricInfo = all[metricCode];

  // 从window对象获取菜单数据
  const menu = typeof window === 'undefined' ? {} : (window as any).menu;
  if (!menu) {
    console.warn('菜单数据不可用');
    return null;
  }

  // 尝试从指标信息中获取pageCode
  if (metricInfo && metricInfo.pageCode) {
    // 直接使用指标信息中的pageCode查找表格名称
    const pageCode = metricInfo.pageCode;
    const item = menu.find((item: any) => item.pageCode === pageCode);
    if (item) {
      return {
        pageName: item.pageName || `表格(${pageCode})`,
        pageCode,
        metricName: all[metricCode].metricName,
      };
    }
  }

  // 未找到匹配项
  console.warn(
    `[findTableNameByMetricCode] 未找到指标编码 ${metricCode} 所在的表格`,
  );

  return {
    pageName: '',
    pageCode: '',
    metricName: '',
  };
}

/**
 * 根据当前公式的calcMarks 或 指定range, 查找公式中计算标记的索引
 * @param id 指标ID
 * @returns 计算标记的索引
 */
// export function findFormulaCalcMarksIndex(
//   id: string,
//   range: any,
//   sorted_graph: string[],
// ) {
//   const _formula = (window as any).formula;
//   // 分解ID获取指标代码和年份
//   const [metricCode, field] = id.split('-') || [];
//   // 公式ID: C10000A0191-2044 校验未通过❌
//   let _range = [];
//   let _currentIndex = -1;
//   if (range) {
//     _range = range;
//   } else {
//     // 从window.formula中找到对应的公式对象
//     const formula = _formula[id];
//     if (!formula) {
//       console.warn(`未找到ID为 ${id} 的公式`);
//       return {
//         metricCode,
//         field,
//         calcMarks: [],
//       };
//     }

//     // 获取计算标记数组
//     _range = formula.calcMarks || [];
//   }

//   _currentIndex = (sorted_graph || []).indexOf(id);

//   // 创建结果对象
//   const result: {
//     _formula: any;
//     calcMarks: { id: string; index: number }[];
//     field: string | undefined;
//     formula: any;
//     index: number;
//     // info: any | undefined;
//     isOK: boolean;
//     metricCode: string | undefined;
//   } = {
//     isOK: false,
//     metricCode,
//     field,
//     index: _currentIndex,
//     calcMarks: [],
//     formula: _formula.formula,
//     // info,
//     _formula: (window as any).formula[id],
//   };

//   if (_range.length > 0) {
//     // 遍历计算标记，查找它们在ALLSORTEDGRAPH中的索引

//     for (let r = 0, rLen = _range.length; r < rLen; r++) {
//       const markId = _range[r];
//       const index = (sorted_graph || []).indexOf(markId);
//       result.calcMarks.push({
//         id: markId,
//         index: index === -1 ? -1 : index,
//       });
//     }

//     // calcMarks 中每个元素的 index 都必须小于 result.index
//     result.isOK =
//       result.index !== -1 &&
//       result.calcMarks.every((mark) => mark.index < result.index);
//   } else {
//     // 没有计算标记，直接通过
//     result.isOK = true;
//   }

//   return result;
// }

/**
 * 对新的 cellRelationData 进行拓扑排序，返回可计算的顺序
 * 适用于格式为 { id: [dependencyIds] } 的依赖图
 * @param cellRelationData 格式为 { id: [dependencyIds] } 的图数据
 * @returns 拓扑排序结果
 */
// export function topologicalSortSimplifiedGraph(
//   cellRelationData: Record<string, string[]>,
// ) {
//   // 1. 构建反向依赖图（谁依赖谁）
//   const reverseGraph: Record<string, string[]> = {};

//   // 初始化反向图
//   Object.keys(cellRelationData).forEach((id) => {
//     reverseGraph[id] = [];
//   });

//   // 构建反向依赖关系
//   Object.entries(cellRelationData).forEach(([id, deps]) => {
//     if (Array.isArray(deps)) {
//       deps.forEach((depId) => {
//         // 确保依赖节点在图中存在
//         if (!reverseGraph[depId]) {
//           reverseGraph[depId] = [];
//         }
//         reverseGraph[depId].push(id);
//       });
//     }
//   });

//   // 2. 计算入度（被依赖次数）
//   const inDegree: Record<string, number> = {};
//   console.log('Object.keys(cellRelationData) =', Object.keys(cellRelationData));
//   // 初始化所有节点入度为0
//   Object.keys(cellRelationData).forEach((id) => {
//     // 排除特殊节点
//     if (id && !isSpecialData(id)) {
//       inDegree[id] = 0;
//     }
//   });

//   console.log('[初始化入度] inDegree 长度为:', Object.keys(inDegree).length);

//   // 统计每个节点被依赖的次数
//   Object.entries(cellRelationData).forEach(([id, deps]) => {
//     // 排除特殊节点 [key]
//     if (!isSpecialData(id) && Array.isArray(deps)) {
//       deps.forEach((depId) => {
//         // 排除特殊节点 [value], 如: ['C10000A0098-2044', 'C10000A0098-2045']
//         if (!isSpecialData(depId)) {
//           // 确保依赖节点在入度表中存在
//           if (inDegree[depId] === undefined) {
//             inDegree[depId] = 0;
//           }
//           inDegree[depId]++;
//         }
//       });
//     }
//   });

//   console.log('[统计入度] inDegree:', inDegree);

//   // 3. 拓扑排序 - Kahn算法(BFS)
//   const queue: string[] = [];
//   const result: string[] = [];

//   // 将所有入度为0的节点加入队列
//   Object.keys(inDegree)
//     .filter((id) => inDegree[id] === 0)
//     .sort() // 保持排序稳定性
//     .forEach((id) => queue.push(id));

//   console.log('[统计入度] queue:', queue);

//   // BFS拓扑排序
//   const visited = new Set<string>();
//   const MAX_ITERATIONS = Object.keys(cellRelationData).length * 2;
//   let iterations = 0;

//   while (queue.length > 0 && iterations < MAX_ITERATIONS) {
//     iterations++;
//     const id = queue.shift()!;

//     // 确保不重复处理节点
//     if (visited.has(id)) continue;

//     visited.add(id);
//     result.push(id);

//     // 更新依赖当前节点的节点的入度
//     (reverseGraph[id] || []).forEach((nextId) => {
//       // 安全地减少入度
//       inDegree[nextId] = (inDegree[nextId] || 0) - 1;

//       // 当入度为0且未处理过时才加入队列
//       if (inDegree[nextId] === 0 && !visited.has(nextId)) {
//         queue.push(nextId);
//       }
//     });
//   }

//   // 检查是否达到最大迭代次数
//   if (iterations >= MAX_ITERATIONS) {
//     console.error('拓扑排序可能存在死循环，已强制退出');
//   }

//   // 检查未处理的节点（可能存在环）
//   const unprocessedNodes = Object.keys(cellRelationData).filter(
//     (id) => !result.includes(id),
//   );

//   if (unprocessedNodes.length > 0) {
//     console.warn(`以下节点未被处理，可能存在环：`, unprocessedNodes);
//   }

//   // 验证排序结果
//   const isValidOrder = result.every((id, index) => {
//     const deps = cellRelationData[id] || [];
//     return deps.every((depId) => result.indexOf(depId) < index);
//   });

//   if (!isValidOrder) {
//     console.error('拓扑排序结果无效：存在依赖关系违反');
//     result.forEach((id, index) => {
//       const deps = cellRelationData[id] || [];
//       deps.forEach((depId) => {
//         if (result.indexOf(depId) >= index) {
//           console.error(
//             `依赖关系违反: ${id} 依赖 ${depId}，但 ${depId} 在 ${id} 之后`,
//           );
//         }
//       });
//     });
//   }

//   return {
//     success: isValidOrder,
//     order: result,
//     message: isValidOrder ? '拓扑排序成功' : '拓扑排序结果无效',
//     graph: cellRelationData,
//   };
// }

/**
 * 批量自动化测试
 * 测试方式: testFormulaCalcMarksIndexBatch(['C10000A0149-2026', 'C10000A0189-2025'], -1);
 * @param ids 需要测试的公式id数组
 * @param displayMode 1 只显示通过，2 只显示未通过，-1 全部显示（默认-1）
 * @returns 测试结果数组
 */
// export function testFormulaCalcMarksIndexBatch(
//   sorted_graph: string[],
//   displayMode: -1 | 1 | 2 = -1,
//   testNodeId: null | string = null,
// ) {
//   if (!Array.isArray(sorted_graph)) {
//     throw new TypeError('参数必须为字符串数组');
//   }

//   console.groupCollapsed('测试所有排序节点(全量排序id)');
//   const _repeatIds: string[] = [];
//   const results: any[] = [];
//   for (const id of sorted_graph) {
//     if (!id) {
//       continue;
//     }

//     const metricCode = id.split('-')[0];

//     if (_repeatIds.includes(metricCode || '')) {
//       continue;
//     }

//     _repeatIds.push(metricCode || '');

//     const res = findFormulaCalcMarksIndex(id, null, sorted_graph);

//     let pass = 'isOK' in res && !!res.isOK;

//     pass = !(res as any)?.formula;

//     if (res && res?.calcMarks && res.calcMarks.length === 0) {
//       pass = true;
//     }

//     // 根据 displayMode 控制输出
//     if (
//       (displayMode === 1 && pass) ||
//       (displayMode === 2 && !pass) ||
//       displayMode === -1
//     ) {
//       // if(!pass) {
//       //   console.log('res =', res, ', id = ', id);
//       // }
//       console.log(`公式ID: ${id} 校验${pass ? '通过✅' : '未通过❌'}`, res);
//       console.log('--------------------------------');

//       results.push({
//         id,
//         ...res,
//         pass,
//       });
//     } else {
//       console.log(`公式ID: ${id} 校验${pass ? '通过✅' : '未通过❌'}`, res);
//     }

//     results.push({
//       id,
//       ...res,
//       pass,
//     });
//   }
//   // 汇总统计
//   const passed = results.filter((r) => r.pass).length;
//   const failed = results.length - passed;
//   // 计算未找到公式的数量 - 当_formula为undefined时表示未找到公式
//   const notFoundFormula = results.filter((r) => !(r as any)._formula).length;
//   console.groupEnd();
//   console.log(
//     `\n批量校验完成： nodeId = ${testNodeId} 共${results.length}项，通过${passed}项，未通过${failed}项, 未找到公式${notFoundFormula}项。`,
//   );

//   return results;
// }

/**
 * 从接口(getModelformulaPage)获取公式信息在不在
 * @param metricCode 指标代码
 * @returns 是否存在
 */
async function _getModelformulaPage(metricCode: string): Promise<boolean> {
  // ModelTs.TableData
  // const params = {
  //   pageSize: 100,
  //   pageNo: 1,
  //   formulaName$lk: '',
  //   formulaExpression$lk: '',
  //   metricCode$lk: metricCode,
  // };

  // // 从接口(getModelformulaPage)获取公式信息在不在
  // const res = await getModelformulaPage(JSON.stringify(params));

  // if (res && res?.records && res?.records?.length > 0) {
  //   return true;
  // }

  // return false;
  return !metricCode;
}

/**
 * 验证排序图中的ID是否都存在于formula数据中.
 * 注: 因排序图中的ID是按指定时间维度生成的, 固会有formula数据中不存在的, 这算正常现象.
 * @param sortedGraph 排序后的图数据数组（如ALLSORTEDGRAPH）
 * @returns 验证结果对象，包含不匹配的ID列表和统计信息
 */
export async function validateSortedGraphWithFormula(
  sortedGraph?: string[],
  fm?: any,
) {
  const graph = Array.isArray(sortedGraph) ? sortedGraph : [];
  const formula = fm || {};
  const formulaIds = new Set(Object.keys(formula));

  const notInFormula: string[] = [];
  let _repeatIds: string[] = [];
  // 检查排序图中的每个ID是否存在于formula中
  // graph.forEach((id) => {
  const all = (window as any).all;

  for (const id of graph) {
    const metricCode = id.split('-')[0];

    if (id && !formulaIds.has(id)) {
      if (_repeatIds.includes(metricCode || '')) {
        continue;
      }

      if (metricCode && all && all[metricCode]) {
        const { metricCategory } = all[metricCode];
        // 输入指标不参与验证
        if (metricCategory === 0 || metricCategory === '0') {
          continue;
        }
      }

      notInFormula.push(id);
      _repeatIds.push(metricCode || '');
    }

    // if(id) {

    // }
  }
  _repeatIds = [];

  // 检查formula中的ID是否都在排序图中
  const notInGraph: string[] = [];
  formulaIds.forEach((id) => {
    if (!graph.includes(id)) {
      notInGraph.push(id);
    }
  });

  // 返回验证结果
  const result = {
    isValid: notInFormula.length === 0 && notInGraph.length === 0,
    notInFormula,
    notInGraph,
    statistics: {
      formulaCount: formulaIds.size,
      graphCount: graph.length,
      missingInFormulaCount: notInFormula.length,
      missingInGraphCount: notInGraph.length,
    },
  };

  let isExist = false;

  // 输出验证结果
  if (IS_DEBUG) {
    console.group('排序图与公式数据匹配验证结果');
    console.log('验证状态:', result.isValid ? '✅ 完全匹配' : '❌ 存在不匹配');
    console.log('统计信息:', result.statistics);

    if (notInFormula.length > 0) {
      console.groupCollapsed(
        `❌ 排序图中存在但公式中不存在的ID (${notInFormula.length}个)`,
      );
      for (const id of notInFormula) {
        if (!id) continue;

        const [metricCode, period] = id.split('-');

        // 如果metricCode为纯数字也不参与, 直接continue
        if (metricCode && !Number.isNaN(Number(metricCode))) {
          continue;
        }

        console.log('metricCode =', metricCode);
        isExist = await _getModelformulaPage(metricCode || '');

        console.log(`ID: ${id}`);
        console.log(`  - 指标代码: ${metricCode}`);
        console.log(`  - 期间: ${period || '未指定'}`);
        console.log(
          `  - 公式信息: ${isExist ? '✅ 接口查询存在' : '❌ 接口查询不存在'}`,
        );

        // 检查window.all中的信息
        const allData = metricCode
          ? (window as any).all?.[metricCode]
          : undefined;
        const isCalc = allData && allData.metricCategory === 1;

        if (allData && isCalc) {
          console.log('  - 单元格信息:');
          console.log(`    * 指标名称: ${allData.metricName || '未命名'}`);
          console.log(`    * 单位: ${allData.unit || '无单位'}`);
          console.log(`    * 比例: ${allData.scale || '无比例'}`);
          console.log(
            `    * 层级: ${allData.level === undefined ? '未知' : allData.level}`,
          );
          console.log(
            `    * 排序: ${allData.sort === undefined ? '未知' : allData.sort}`,
          );
          console.log(
            `    * 指标类别: ${
              allData.metricCategory === undefined
                ? '未知'
                : allData.metricCategory
            }`,
          ); // metricCategory 指标类别 0：填报 1：计算
          console.log(`    * info: ${JSON.stringify(allData) || '---'}`);

          if (metricCode) {
            const tableInfo = findTableNameByMetricCode(metricCode);
            if (tableInfo) {
              console.log(
                `  - 所属表格: ${tableInfo.pageName || '未知'} (${
                  tableInfo.metricName || '未知'
                }) (${tableInfo.pageCode || '未知'})`,
              );
            }
          }

          if (allData.pMetricCode) {
            console.log(`    * 父级指标: ${allData.pMetricCode}`);
            // 尝试获取父级指标名称
            const parentName = (window as any).all?.[allData.pMetricCode]
              ?.metricName;
            if (parentName) {
              console.log(`    * 父级名称: ${parentName}`);
            }
          }

          console.log(
            '  - 可能原因1: 公式数据中不存在此ID，可能是排序图未更新或公式被删除',
          );
          console.log('  - 可能原因2: 公式数据中没有添加此ID');
          console.log('-----------------------------------');
        } else {
          console.log('  - 单元格信息: 在window.all中未找到该指标信息');
        }
      }

      console.groupEnd();
    } else {
      console.log('✅ 排序图中的所有ID在公式数据中都存在');
    }

    if (notInGraph.length > 0) {
      console.groupCollapsed(
        `❌ 公式中存在但排序图中不存在的ID (${notInGraph.length}个)`,
      );
      const _repeatIds: string[] = [];
      for (const id of notInGraph) {
        if (!id) {
          continue;
        }
        const [metricCode, period] = id.split('-') || [];
        const formulaData = formula[id];

        if (_repeatIds.includes(metricCode || '')) {
          continue;
        }
        _repeatIds.push(metricCode || '');

        console.log(`ID.: ${id}`);
        console.log(`  - 指标代码: ${metricCode}`);
        console.log(`  - 期间: ${period || '未指定'}`);

        // 检查window.all中的信息
        const allObj = (window as any).all;
        const allData =
          allObj && typeof allObj === 'object'
            ? allObj[metricCode as keyof typeof allObj]
            : undefined;
        if (allData) {
          console.log('  - 单元格信息:');
          console.log(`    * 指标名称: ${allData.metricName || '未命名'}`);
          console.log(`    * 单位: ${allData.unit || '无单位'}`);
          console.log(`    * 比例: ${allData.scale || '无比例'}`);
          console.log(
            `    * 层级: ${allData.level === undefined ? '未知' : allData.level}`,
          );
          console.log(
            `    * 排序: ${allData.sort === undefined ? '未知' : allData.sort}`,
          );
          console.log(
            `    * 指标类别: ${
              allData.metricCategory === undefined
                ? '未知'
                : allData.metricCategory
            }`,
          );
          console.log(`    * info: ${JSON.stringify(allData) || '---'}`);

          if (metricCode) {
            const tableInfo = findTableNameByMetricCode(metricCode);
            if (tableInfo) {
              console.log(
                `  - 所属表格: ${tableInfo.pageName || '未知'} (${tableInfo.pageCode || '未知'})`,
              );
            }
          }

          if (allData.pMetricCode) {
            console.log(`    * 父级指标: ${allData.pMetricCode}`);
            // 尝试获取父级指标名称
            const parentName = (window as any).all?.[allData.pMetricCode]
              ?.metricName;
            if (parentName) {
              console.log(`    * 父级名称: ${parentName}`);
            }
          }

          // 显示页面和模型信息
          if (allData.pageCode) {
            console.log(`    * 页面代码: ${allData.pageCode}`);
          }
          if (allData.modelCode) {
            console.log(`    * 模型代码: ${allData.modelCode}`);
          }
          if (allData.versionCode) {
            console.log(`    * 版本代码: ${allData.versionCode}`);
          }
        } else {
          console.log('  - 单元格信息: 在window.all中未找到该指标信息.');
        }

        if (formulaData) {
          isExist = await _getModelformulaPage(metricCode || '');
          if (!isExist) {
            console.log('  - 公式信息: 在接口中未找到该公式信息.');
          }

          console.log(
            ` - 公式信息: ${isExist ? '✅ 接口查询存在' : '❌ 接口查询不存在'}`,
          );
          if (isExist) {
            console.log(`  - 公式名称: ${formulaData.formulaName || '未命名'}`);
            console.log(
              `  - 公式描述: ${formulaData.formulaDescription || '无描述'}`,
            );
            console.log(`  - 公式内容: ${formulaData.formula || '无公式内容'}`);
          } else {
            // 有可能此 id 在接口中不存在，但是在 window.formula 的 calcMarks 中存在, 遍历window.formula, 查找calcMarks中是否存在此 metricCode
            // const formula = (window as any).formula;
            for (const element of formula) {
              if (element.calcMarks.includes(id)) {
                console.log(` --- id: ${id} 在 公式中出现过.`);
                console.log(`  - 公式内容: ${element.formula || '无公式内容'}`);
                break;
              }
            }
          }
          // 显示依赖信息
          const dependencies = formulaData.calcMarks || [];
          if (dependencies.length > 0) {
            console.log(`  - 依赖项数量: ${dependencies.length}`);
            const missingDeps = dependencies.filter(
              (dep: any) => !graph.includes(dep),
            );
            if (missingDeps.length > 0) {
              console.log(`  - 依赖项中不在图中的项: ${missingDeps.length}个`);
              missingDeps.slice(0, 3).forEach((dep: any) => {
                console.log(`    * ${dep}`);
              });
              if (missingDeps.length > 3) {
                console.log(`    * ... 等${missingDeps.length - 3}个`);
              }
            }
          }
        }

        if (metricCode) {
          // 查找表格信息
          const tableInfo = findTableNameByMetricCode(metricCode);
          if (tableInfo) {
            console.log(
              `  - 所属表格: ${tableInfo.pageName || '未知'} (${tableInfo.pageCode || '未知'})`,
            );
          }
        }

        // console.log('  - 可能原因: 该公式未纳入排序图，需要更新拓扑排序数据');
        // console.log('  - 建议操作: 执行拓扑排序并更新ALLSORTEDGRAPH数据');
        console.log('-----------------------------------');
      }
      console.groupEnd();
    } else {
      console.log(
        `✅ 公式数据中的所有ID在排序图中都存在. (${notInGraph.length}个)`,
      );
    }

    console.groupEnd(); // end console.group
  }

  return result;
}

/**
 * 测试kahn排序后的id数组在window.formula中的公式计算排序是否正确
 * @param sortedIdsArray kahn排序后的id数组
 * @param fm 公式数据
 * @returns 验证结果
 */
function _testSortedIdsInFormula(sortedIdsArray: string[], fm: any) {
  const sortedIds = Array.isArray(sortedIdsArray) ? sortedIdsArray : [];
  const formula = fm || (window as any).formula || {};
  const formulaIds = new Set(Object.keys(formula));
  const formulaIdsArray = [...formulaIds];
  const targetIds = Array.isArray(formulaIdsArray) ? formulaIdsArray : [];

  console.groupCollapsed(
    '========================= 开始验证每个有公式的单元格, 确认公式中的id排序是否正确 =========================',
  );
  const result = validateMultipleIdSortingOrder(sortedIds, targetIds, fm);

  // 输出基本统计信息
  console.log('📊 验证统计:', {
    总数: result.totalCount,
    正确: result.validCount,
    错误: result.invalidCount,
    正确率: `${((result.validCount / result.totalCount) * 100).toFixed(2)}%`,
  });

  // 输出详细摘要
  console.log('📋 详细摘要:');
  console.log(result.summary);

  // 如果有错误，输出详细错误信息
  if (result.detailedErrors.invalidIds.length > 0) {
    console.group('❌ 详细错误信息:');

    // 输出错误统计
    console.log('🔍 错误统计:', result.detailedErrors.errorSummary);

    // 输出前10个错误的详细信息
    const maxErrorsToShow = 10;
    const errorsToShow = result.detailedErrors.invalidIds.slice(
      0,
      maxErrorsToShow,
    );

    console.log(
      `📝 错误详情 (显示前${Math.min(maxErrorsToShow, errorsToShow.length)}个):`,
    );
    errorsToShow.forEach((error, index) => {
      console.group(
        `❌ 错误 ${index + 1}: ${error.id} (位置: ${error.targetIndex})`,
      );
      error.violations.forEach((violation, vIndex) => {
        console.log(`   ${vIndex + 1}. ${violation.message}`);
        if (violation.dependencyIndex !== -1) {
          console.log(`      依赖项位置: ${violation.dependencyIndex}`);
        }
      });
      console.groupEnd();
    });

    if (result.detailedErrors.invalidIds.length > maxErrorsToShow) {
      console.log(
        `... 还有 ${result.detailedErrors.invalidIds.length - maxErrorsToShow} 个错误未显示`,
      );
    }

    console.groupEnd();
  } else {
    console.log('✅ 所有公式单元格的排序都正确！');
  }

  console.log('========================= 验证结束 =========================');
  console.groupEnd();

  return result;
}

/**
 * 生成多级表头
 * @param columns 列配置
 * @returns 多级表头和合并信息
 */
export function generateMultiLevelHeaders(columns: any[]) {
  const isNested = columns.some(
    (col) => Array.isArray(col.children) && col.children.length > 0,
  );

  const flattenedColumns: any[] = [];
  const yearMap: any = {};

  if (isNested) {
    // 先处理固定列
    columns.forEach((col) => {
      if (!col.children || col.children.length === 0) {
        flattenedColumns.push(col);
      }
    });
    // 再处理嵌套列，按columns顺序依次push每个child
    columns.forEach((col) => {
      if (col.children && col.children.length > 0) {
        const year = col.title;
        yearMap[year] = col.children.length;
        col.children.forEach((childCol: any) => {
          flattenedColumns.push({
            ...childCol,
            parentYear: year,
            year,
            quarter: childCol.title,
          });
        });
      }
    });

    // header1: 年份
    let header1 = flattenedColumns.map((col) => col.parentYear || '');
    // header2: 季度/月份
    let header2 = flattenedColumns.map((col) =>
      col.parentYear ? col.quarter : col.title || col.field,
    );

    // 合并信息
    const merges: any[] = [];
    flattenedColumns.forEach((col, idx) => {
      if (!col.parentYear) {
        merges.push({ s: { r: 0, c: idx }, e: { r: 1, c: idx } });
      }
    });
    const processedYears = new Set();
    flattenedColumns.forEach((col, idx) => {
      if (col.parentYear && !processedYears.has(col.parentYear)) {
        const span = yearMap[col.parentYear];
        if (span > 1) {
          merges.push({ s: { r: 0, c: idx }, e: { r: 0, c: idx + span - 1 } });
        }
        processedYears.add(col.parentYear);
      }
    });

    // 先生成原始 header1/header2
    const origHeader1 = flattenedColumns.map(
      (col) => col.parentYear || col.title || col.field,
    );
    const origHeader2 = flattenedColumns.map((col) =>
      col.parentYear ? col.quarter : '',
    );

    // header1/header2 拼接
    header1 = [...origHeader1];
    header2 = [...origHeader2];

    console.log('header1 =', header1, ', header2 =', header2);
    return {
      headers: [header1, header2],
      merges,
      flattenedColumns,
    };
  } else {
    // 扁平结构
    columns.forEach((col) => {
      flattenedColumns.push(col);
    });
    // header1: 直接用title
    const header1 = flattenedColumns.map((col) => col.title || col.field);
    // header2: 空
    const header2: string[] = [];

    // 纵向合并
    const merges: any[] = [];
    flattenedColumns.forEach((col, idx) => {
      if (col) {
        merges.push({ s: { r: 0, c: idx }, e: { r: 1, c: idx } });
      }
    });

    console.log('header1 =', header1, ', header2 =', header2);

    return {
      headers: [header1, header2],
      merges,
      flattenedColumns,
    };
  }
}

/**
 * 过滤公式数据(window.formula), 删除formula中个别属性的数据
 * @param fm 克隆后的公式数据
 * @returns r 返回删除属性看的fm数据
 */
export function filterFM(
  fm: any | Record<string, any>,
  filterYears?: string[],
  isFilterSpecial?: boolean,
) {
  const _f = Object.entries(fm);
  const _f2 = _f.map(([key, value]) => {
    const { calcMarks, field, formula, id, metricCode, metricCodesMap } =
      value as any;

    const _calcMarks = isFilterSpecial
      ? calcMarks.filter((m: any) => !isSpecialData(m))
      : calcMarks;

    const new_value = {
      calcMarks: _calcMarks,
      field,
      formula,
      id,
      metricCode,
      metricCodesMap,
    };

    if (filterYears && filterYears.length > 0) {
      if (filterYears.includes(field)) {
        return [key, new_value];
      }
    } else {
      return [key, new_value];
    }

    return [];

    // return field === '2025' || field === '2026'
    //   ? [
    //       key,
    //       {
    //         calcMarks,
    //         field,
    //         formula,
    //         id,
    //         metricCode,
    //         metricCodesMap,
    //       },
    //     ]
    //   : [];
  });

  return _f2 ? Object.fromEntries(_f2) : {};
}

/**
 * 根据 table_data 过滤 data
 * @param formula_data 原始公式数据
 * @param table_data 原始表格数据
 * @returns filterData 返回table_data相关的公式
 */
export const filterFmByTableData: any | Record<string, any> = (
  fm: Record<string, any>,
  table_data: Record<string, any>,
) => {
  // const _temp = [];
  const filterData = Object.entries(fm).filter(([id]) => {
    return id in table_data;
  });

  const r = filterData ? Object.fromEntries(filterData) : {};
  // console.log(' r.length =', Object.keys(r).length);

  return r;
};

/**
 * 根据fm数据构建graph -> 使用kahn算法进行拓扑排序 -> 使用 _testSortedIdsInFormula 方法排除错误 -> 返回kahn拓扑排序后的ids
 * @param metricCodes 指标代码数组
 * @returns 返回拓扑排序后的id数组
 */
export function sortedIdsTest(fm: any): string[] {
  // const fm = clonedeep((window as any).formula) || {};
  // const fm = JSON.parse(JSON.stringify( (window as any).formula )) || {}; // To prevent formula's data tampering, use clone variable data(in case of tampering).
  // const filterYears = ['2025', '2026', '2027'];
  // const filterYears = ['value'];
  const filterYears: string[] = [];

  // let graph: Record<string, string[]> = {
  //   'A': [],
  //   'B': ['A'],
  //   'C': ['A', 'B'],
  //   'D': ['A'],
  //   'E': ['D', 'C'],
  // };

  const graph = formula2graph(fm, filterYears); // true: 已去除特殊节点, filterYears: 已过滤年份
  console.log('graph =', graph);

  const kahn = kahnTopologicalSort(graph);
  console.log('kahn =', kahn);

  // 检查排序后的ids 与 window.formula 中的ids 是否有不一致的id
  validateSortedGraphWithFormula(kahn.order, fm);

  _testSortedIdsInFormula(kahn.order, fm); // 使用此方法排除错误

  return kahn?.order || [];
}

/**
 * 根据fm数据构建graph -> 使用kahn算法进行拓扑排序 -> 返回kahn拓扑排序后的ids
 * @returns 返回kahn拓扑排序后的ids
 */
function _getIdsByKahn(formula: any, dateFields: string[]) {
  // const _fm = clonedeep((window as any).formula) || {};
  // const fm = filterFM(_fm);
  // const fm = {};
  const fm = formula;

  // function _extractFormulaIds(formula: any) {
  //   const regex = /\$\{\s*(\w+)\s*\}/g;
  //   const ids = [];
  //   let match;
  //   const str = String(formula || '');
  //   while ((match = regex.exec(str)) !== null) {
  //     ids.push(match[1]);
  //   }
  //   return ids || [];
  // }

  // Object.entries(formula).forEach(([key, value]) => {
  //   (fm as Record<string, any>)[key as string] = _extractFormulaIds(value);
  // });

  const graph = formula2graph(fm, dateFields); // true: 已去除特殊节点, filterYears: 已过滤年份
  console.log('graph =', graph);

  const kahn = kahnTopologicalSort(graph);
  console.log('kahn =', kahn);
  return kahn?.order || [];
  // return []
}

/**
 * 测试指定单元格id(targetId)的排序是否正确
 * @param targetId 修改单元格id(target_id)
 * @param test_ids 测试id数组(从接口返回的排序好的ids)
 * @returns 返回测试结果信息
 */
export function sortedIdTest(target_id: string, test_ids: string[], fm?: any) {
  const test_info = singleSortedIdsTest(target_id, test_ids, fm);
  if (test_info) {
    return test_info?.isValid
      ? `✅ id: ${target_id} 排序正确`
      : `❌ 发现问题: ${test_info?.errorInfo}`;
  }
  return `❌ 发现问题: ${test_info}`;
}

/**
 * 获取全量id和权重
 * @param isKahn 是否使用js版本的Kahn拓扑排序计算后的ids
 * @returns 返回全量id和权重
 */
export async function getAllIds(
  isKahn: boolean = false,
  instance: any,
  formula: any,
) {
  // const { modelCode, modelType, forecastTimeType } = instance;
  // const _ids = (window as any).sorted_graph || [];
  // const _ids_weights = (window as any).sorted_graph_weights || [];

  // if (_ids && _ids.length > 0 && !isKahn) {
  //   return { ids: _ids, ids_weights: _ids_weights };
  // }

  // 从全局状态获取 modelCode
  if (instance && instance?.modelCode) {
    const { ids, ids_weights } = await getSortedGraph(
      isKahn,
      instance,
      formula,
    );
    console.log('[getAllIds 获取全量id和权重] ids =', ids);

    console.log('[getAllIds 获取全量id和权重] ids_weights =', ids_weights);
    // if (ids_weights) {
    //   (window as any).sorted_graph_weights = ids_weights;
    // }

    // (window as any).sorted_graph = ids;
    // (window as any).sorted_graph_weights = ids_weights;

    return { ids, ids_weights };
  } else {
    return { ids: [], ids_weights: [] };
  }
}
