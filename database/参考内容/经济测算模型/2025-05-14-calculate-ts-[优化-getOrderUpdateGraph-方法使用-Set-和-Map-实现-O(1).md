import type { EditorTs } from '@vben/types';

import Decimal from 'decimal.js';
import * as fengariWeb from 'fengari-web'; // fengari-web 让你可以在 浏览器中运行 Lua 代码。

import { useModelStore } from '#/store/index';

import * as mathFunc from './math/index';
import { isNumber } from './utils';

class Node {
  calcMarks?: any;
  // eslint-disable-next-line no-use-before-define
  children?: Node[];
  childrenMap: any;
  curFormula?: any;
  field: string;
  formula: any;
  formulaDescription: any;
  formulaName: any;
  id: string;
  marks?: EditorTs.FormulaMarkList;
  metricCode: string;
  metricCodesMap: any;
  prevField: any;
  unit: any;
  constructor({
    field,
    metricCode,
    children,
    marks,
    calcMarks,
    prevField,
    curFormula,
    info = {},
    childrenMap,
    metricCodesMap,
  }: {
    calcMarks?: any;
    children?: Node[];
    childrenMap?: any;
    curFormula?: any;
    field: string;
    info?: any;
    marks?: EditorTs.FormulaMarkList;
    metricCode: string;
    metricCodesMap?: any;
    prevField?: string;
  }) {
    this.id = `${metricCode}-${field}`;
    this.field = field;
    this.prevField = prevField;
    this.metricCode = metricCode;
    this.marks = marks || [];
    this.children = children || [];
    this.formula = info.formula;
    this.curFormula = curFormula;
    this.calcMarks = calcMarks || [];
    this.unit = info.unit;
    this.formulaName = info.formulaName || '';
    this.formulaDescription = info.formulaDescription || '';
    this.childrenMap = childrenMap;
    this.metricCodesMap = metricCodesMap;
  }
}

class FunctionCore {
  constructor() {
    // 将数学函数集合添加到FunctionCore的原型中
    Object.assign(FunctionCore.prototype, mathFunc);
  }

  // 执行字符串形式的函数表达式
  executeFunction(str: string) {
    // 执行函数 使用Function构造器创建新函数，with语句确保在当前实例上下文中执行
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      `with(this) { return ${str}; }`, // 使用 `with` 来确保从当前实例中查找函数
    ).bind(this);

    return fn();
  }
}
// 创建FunctionCore的单例实例，确保全局只有一个计算核心
const functionCore = new FunctionCore();

// 判断是否为日期格式
// const isDate = (value: string): boolean => {
//   const datePattern = /^(?:\d{4}|\d{4}-\d{1,2})$/;
//   return datePattern.test(value);
// };

interface TimeConfig {
  timeType: 'month' | 'quarter' | 'year';
  startTime: string;
  endTime: string;
}

const formulaRules = {
  /**
   * 内部方法：计算相邻周期（基础逻辑）
   */
  _calculateAdjacentPeriod(
    current: string,
    direction: 'next' | 'prev',
    timeType: 'month' | 'quarter' | 'year',
  ): null | string {
    const [yearStr, periodStr] = current.split('-');
    const year = Number.parseInt(yearStr, 10);
    const period = periodStr ? Number.parseInt(periodStr, 10) : 0;
    const increment = direction === 'next' ? 1 : -1;

    if (timeType === 'year') {
      return `${year + increment}`;
    }

    let newYear = year;
    let newPeriod = period + increment;

    if (timeType === 'quarter') {
      if (newPeriod < 1) {
        newYear--;
        newPeriod = 4;
      } else if (newPeriod > 4) {
        newYear++;
        newPeriod = 1;
      }
    } else {
      // month
      if (newPeriod < 1) {
        newYear--;
        newPeriod = 12;
      } else if (newPeriod > 12) {
        newYear++;
        newPeriod = 1;
      }
    }

    return `${newYear}-${newPeriod}`;
  },

  /**
   * 获取相邻周期（上期/下期）
   */
  getSiblingField(field: string, config: TimeConfig) {
    const { timeType, startTime, endTime } = config;

    const isInRange = (time: string) =>
      this.isTimeInRange(time, startTime, endTime, timeType);

    return {
      field,
      prevField: isInRange(
        this._calculateAdjacentPeriod(field, 'prev', timeType),
      )
        ? this._calculateAdjacentPeriod(field, 'prev', timeType)
        : null,
      nextField: isInRange(
        this._calculateAdjacentPeriod(field, 'next', timeType),
      )
        ? this._calculateAdjacentPeriod(field, 'next', timeType)
        : null,
    };
  },

  /**
   * 获取从startTime到currentTime的所有期数日期
   */
  getPeriodsBetween(config: TimeConfig, currentTime: string): string[] {
    const { timeType, startTime, endTime } = config;

    if (!this.isTimeInRange(currentTime, startTime, endTime, timeType)) {
      // throw new Error('currentTime必须在startTime和endTime之间');
      return [];
    }

    const periods: string[] = [];
    let current = startTime;

    while (current !== currentTime) {
      periods.push(current);
      const next = this._calculateAdjacentPeriod(current, 'next', timeType);
      if (!next || !this.isTimeInRange(next, startTime, endTime, timeType)) {
        break;
      }
      current = next;
    }

    periods.push(currentTime);
    return periods;
  },

  /**
   * 检查时间是否在范围内
   */
  isTimeInRange(time: string, start: string, end: string): boolean {
    const [yearStr, periodStr] = time.split('-');
    const [startYearStr, startPeriodStr] = start.split('-');
    const [endYearStr, endPeriodStr] = end.split('-');

    const year = Number.parseInt(yearStr, 10);
    const period = periodStr ? Number.parseInt(periodStr, 10) : 0;
    const startYear = Number.parseInt(startYearStr, 10);
    const startPeriod = startPeriodStr
      ? Number.parseInt(startPeriodStr, 10)
      : 0;
    const endYear = Number.parseInt(endYearStr, 10);
    const endPeriod = endPeriodStr ? Number.parseInt(endPeriodStr, 10) : 0;

    if (year < startYear || year > endYear) return false;
    if (year === startYear && period < startPeriod) return false;
    if (year === endYear && period > endPeriod) return false;
    return true;
  },
  /**
   * 计算当前日期是第几期（修复季度处理）
   * @param currentTime 当前日期（格式必须与timeType匹配）
   * @param config 时间配置
   * @returns 当前期数（从1开始）
   */
  getPeriodNumber(currentTime: string, config: TimeConfig): number {
    const { timeType, startTime } = config;

    // 解析时间（严格验证季度格式）
    const parseTime = (timeStr: string) => {
      const parts = timeStr.split('-');
      const year = Number.parseInt(parts[0], 10);

      if (timeType === 'quarter') {
        if (parts.length !== 2 || !/^[1-4]$/.test(parts[1])) {
          throw new Error(`季度格式应为YYYY-Q（Q为1-4），实际收到：${timeStr}`);
        }
        return { year, period: Number.parseInt(parts[1], 10) };
      }

      // 其他类型处理...
      return {
        year,
        period: parts[1] ? Number.parseInt(parts[1], 10) : 0,
      };
    };

    const start = parseTime(startTime);
    const current = parseTime(currentTime);

    // 计算期数（修正季度计算）
    switch (timeType) {
      case 'month': {
        return (
          (current.year - start.year) * 12 + (current.period - start.period) + 1
        );
      }

      case 'quarter': {
        // 季度差 = (年差 × 4) + (当前季度 - 起始季度)
        return (
          (current.year - start.year) * 4 + (current.period - start.period) + 1
        );
      }

      case 'year': {
        return current.year - start.year + 1;
      }

      default: {
        throw new Error(`不支持的时间类型: ${timeType}`);
      }
    }
  },

  /**
   * 获取当前日期所在年份的所有周期日期（带时间范围限制）
   * @param currentDate 当前日期（格式必须与timeType匹配）
   * @param config 统计类型（年/季/月）
   * @returns 当前年份内的所有周期日期（自动适配范围限制）
   */
  getYearlyDates(currentDate: string, config: TimeConfig): string[] {
    // 解析当前日期的年份
    const [currentYear] = currentDate.split('-');
    const yearNum = Number.parseInt(currentYear, 10);
    if (Number.isNaN(yearNum)) {
      throw new TypeError(`无效的日期格式: ${currentDate}`);
    }
    const { timeType, startTime, endTime } = config;

    // 生成当前年份的所有周期
    let yearlyDates: string[];
    switch (timeType) {
      case 'month': {
        yearlyDates = Array.from(
          { length: 12 },
          (_, i) => `${yearNum}-${(i + 1).toString().padStart(2, '0')}`,
        );
        break;
      }
      case 'quarter': {
        yearlyDates = Array.from(
          { length: 4 },
          (_, i) => `${yearNum}-${i + 1}`,
        );
        break;
      }
      case 'year': {
        yearlyDates = [`${yearNum}`];
        break;
      }
      default: {
        throw new Error(`不支持的时间类型: ${timeType}`);
      }
    }

    // 应用范围限制
    return yearlyDates.filter((date) => {
      // 比较日期是否在范围内（按字符串顺序比较）
      return date >= startTime && date <= endTime;
    });
  },
  /**
   * 获取往期所有日期（当前日期之前的所有有效日期）
   * @param currentTime 当前日期（格式必须与timeType匹配）
   * @param config 时间配置
   * @returns 当前日期之前的所有有效日期数组（按时间顺序排列）
   */
  getPreviousPeriods(currentTime: string, config: TimeConfig): string[] {
    const { timeType, startTime, endTime } = config;

    if (!this.isTimeInRange(currentTime, startTime, endTime, timeType)) {
      return [];
    }

    const periods: string[] = [];
    let current = startTime;

    while (current !== currentTime) {
      periods.push(current);
      const next = this._calculateAdjacentPeriod(current, 'next', timeType);
      if (!next || !this.isTimeInRange(next, startTime, endTime, timeType)) {
        break;
      }
      current = next;
    }

    return periods;
  },
  /**
   * 获取当期之后的所有期数（从当前日期的下一期到结束时间）
   * @param currentTime 当前日期（格式必须与timeType匹配）
   * @param config 时间配置
   * @returns 当前日期之后的所有有效日期数组（按时间顺序排列）
   */
  getFuturePeriods(currentTime: string, config: TimeConfig): string[] {
    const { timeType, startTime, endTime } = config;

    if (!this.isTimeInRange(currentTime, startTime, endTime, timeType)) {
      return [];
    }

    const periods: string[] = [];
    let current = this._calculateAdjacentPeriod(currentTime, 'next', timeType);

    while (
      current &&
      this.isTimeInRange(current, startTime, endTime, timeType)
    ) {
      periods.push(current);
      current = this._calculateAdjacentPeriod(current, 'next', timeType);
    }

    return periods;
  },
};

// 计算模块的主要hook函数，处理公式计算和数据更新
const useCalculate = (options: any) => {
  const { globalConfig, patchUpdateData, getData } = options;
  const modelStore = useModelStore();
  // 定义计算结果中需要特殊处理的错误值
  const err = ['Infinity', '-Infinity', 'NaN'];
  // 在字符串指定位置插入新值
  const spliceString = (
    str: string,
    start: number,
    end: number,
    value = '',
  ) => {
    const before = str.slice(0, start);
    const after = str.slice(end);
    return before + value + after;
  };

  // 根据标记获取对应的值
  // mark: 标记信息
  // calcNode: 当前计算节点
  // field: 字段名
  const getValue = (mark: any, calcNode: any, curFormula: any) => {
    let data: any;
    let value: any = 0;
    let scale = 1;
    const { startTime, timeType, endTime } = globalConfig;
    const { metricCodesMap } = calcNode;
    switch (metricCodesMap[curFormula[0]].type) {
      case 'global': {
        const [code] = curFormula;
        data = globalConfig;
        scale = data.scale || 1;
        value = data?.[code] || 0;
        break;
      }
      case 'prev': {
        const [code, fields] = curFormula;
        data = getData(code);
        scale = data.scale || 1;

        fields.forEach((field: string) => {
          const curValue = data[field] || 0;
          value += curValue * scale;
        });
        break;
      }
      case 'var': {
        data = globalConfig;
        const [code, fields] = curFormula;
        if (code === 'everyPeriod') {
          value = formulaRules.getPeriodNumber(fields[0], {
            timeType,
            startTime,
            endTime,
          });
        }

        break;
      }
      case 'periodAdd':
      case 'total':
      case 'prevPeriodAdd':
      case 'totalYear': {
        // 处理期间累计值
        const [code, fields] = curFormula;
        data = getData(code);
        scale = data.scale || 1;

        fields.forEach((field: string) => {
          const curValue = data[field] || 0;
          value += curValue * scale;
        });
        break;
      }
      case 'arrayAllValue': {
        const [code] = curFormula;
        data = getData(code);

        const valueGroup: any = [];
        globalConfig.arrayAllDate.forEach((field: string) => {
          valueGroup.push(data[field] || 0);
        });
        value = valueGroup;
        break;
      }
      default: {
        const [code, fields] = curFormula;
        data = getData(code);
        scale = data.scale || 1;
        fields.forEach((field: string) => {
          const curValue = data[field] || 0;
          value += curValue * scale;
        });
      }
    }

    // 处理数值类型和比例
    if (Array.isArray(value)) {
      value = JSON.stringify(value);
    } else if (value === undefined) {
      value = 0;
    } else if (isNumber(`${value}`)) {
      value = new Decimal(value).mul(Number(scale || 1)).toNumber();
    } else {
      value = `'${value}'`;
    }
    return value;
  };

  const calculate = {
    calcFormulaCache: {}, // 缓存已构建的计算关系
    DFTLevel: 0,
    DFTGroup: [],
    isDeadCycle: false, // 是否存在死循环
    relationAllGraph: {}, // 所有关系图
    relationBaseGraph: {}, // 输入关系图
    eval(exeString: string, isLua: boolean) {
      if (isLua) {
        const result = fengariWeb.load(
          `${modelStore.formula} return ${exeString}`,
        );
        return result();
      } else {
        return functionCore.executeFunction(exeString);
      }
    },
    calcExe() {},
    checkDeadCycle(isInit: boolean, key: any, level: number = 2000) {
      if (isInit) {
        this.DFTLevel = 0;
        this.DFTGroup = [];
      }
      this.DFTLevel += 1;
      this.DFTGroup.push(key);
      if (this.DFTLevel >= level) {
        this.isDeadCycle = true;
        console.warn('构建关系存在死循环，请检查', this.DFTGroup);
      }
    },
    /* 
      获取计算公式组, 目的: 构建一个有序的计算公式组, ，确保公式按照正确的依赖顺序进行计算。这对于带有公式的表格计算系统至关重要，因为许多公式依赖于其他公式的计算结果。
      ### 核心功能
        1. **依赖排序**：该方法通过递归分析每个公式的依赖关系，确保依赖项在被依赖项之前计算。
        2. **避免循环依赖**：通过检查公式是否已在计算组中，防止循环依赖导致的无限递归。
        3. **优化插入位置**：使用 `findMaxIndex` 函数找到最优的插入位置，确保依赖项都已处理。
    */

    // 获取计算公式组(根据公式构建)
    getOrderUpdateGraph(curFormula: string[]) {
      const calcFormulaGroup: any[] = [];
      // const baseGroup: any[] = [];
      // eslint-disable-next-line unicorn/no-this-assignment, @typescript-eslint/no-this-alias
      const self = this;
      const formulaMap: any = this.relationAllGraph;
      const relationBaseGraph = this.relationBaseGraph;

      // 使用 Set 替代 Array.includes() 检查，提供 O(1) 查找
      const formulasInGroup = new Set<string>();

      // 使用 Map 存储每个公式在 calcFormulaGroup 中的位置，避免重复调用 indexOf
      const positionMap = new Map<string, number>();

      function findMaxIndex(arr: any[]) {
        let maxIndex = -1;
        for (const code of arr) {
          if (!relationBaseGraph[code]) {
            // 排除marks为空的情况code, 即排除非公式指标
            // const index = calcFormulaGroup.indexOf(code);
            // 使用 Map 直接获取位置，O(1) 操作
            const index = positionMap.get(code) ?? -1;
            if (index > maxIndex) {
              maxIndex = index;
            }
          }
        }
        return maxIndex;
      }
      // key 键是指标ID（如 "C10000A0199_LP-value"）
      function insertFormula(key: string) {
        if (self.isDeadCycle) {
          return;
        }

        // if (calcFormulaGroup.includes(key)) {
        // 使用 Set 检查是否已处理，O(1) 操作
        if (formulasInGroup.has(key)) {
          return; // 如果公式已在计算组中，则跳过，直接返回成功
        }

        const node = formulaMap[key];

        if (!node) {
          return;
        }

        if (node.formula) {
          // 如果公式有 formula 属性，则先处理其依赖项（calcMarks）
          self.checkDeadCycle(false, key, 4000);
          node.calcMarks.forEach((item: any) => {
            if (!item.includes(node.metricCode)) {
              if (node.metricCode === 'C10000A0475') {
                // 这个是死循环
              } else {
                insertFormula(item);
              }
            }
          });
          const insertIndex = findMaxIndex(node.calcMarks); // 根据依赖项在calcFormulaGroup中的位置，确定当前公式的插入位置
          if (insertIndex > -1) {
            calcFormulaGroup.splice(insertIndex + 1, 0, key); // 如果存在，则插入到依赖项的后面

            // 更新受影响的位置映射
            for (let i = insertIndex + 1; i < calcFormulaGroup.length; i++) {
              positionMap.set(calcFormulaGroup[i], i);
            }
          } else {
            calcFormulaGroup.push(key); // 如果不存在，则插入到计算组末尾

            // 如果不存在依赖项，则插入到计算组末尾
            const newPosition = calcFormulaGroup.length;
            positionMap.set(key, newPosition);
          }

          // 标记该公式已处理
          formulasInGroup.add(key)
        }
      }

      let key;
      for (key of curFormula) {
        this.checkDeadCycle(true, key, 4000);
        insertFormula(key);
      }

      this.isDeadCycle = false;

      return calcFormulaGroup;
    },

    // 获得更新关系网
    getUpdateGraph(startCode: string, fields: string[]) {
      const formulaMap: any = this.relationAllGraph;
      const graph: string[] = [];

      function walkNodes(code: string, fields: string[]) {
        let field, formulaId;
        for (field of fields) {
          formulaId = `${code}-${field}`;
          if (!formulaMap[formulaId]) {
            console.warn(
              `当前指标：${code}-${field}，当前属性：${field}，没有找到公式`,
            );
            return;
          }
          if (graph.includes(formulaId)) {
            continue;
          }
          let node: any;
          const current = formulaMap[formulaId];
          let currentNodes = current.children || []; // 依赖当前指标
          while (currentNodes.length > 0) {
            const nextLevelNodes: any = {};
            for (node of currentNodes) {
              if (graph.includes(node.id)) {
                continue;
              }
              // graph.push(node.id);
              const calcNode: EditorTs.Formula = formulaMap[node.id];
              if (!calcNode) {
                console.warn(
                  `当前指标：${code}-${field}，当前属性：${node.id}，没有找到公式`,
                  node,
                  currentNodes,
                );

                continue;
              }
              if (field === calcNode.field) {
                for (const child of formulaMap[node.id].children) {
                  if (nextLevelNodes[child.id]) {
                    nextLevelNodes[child.id].num += 1;
                  } else {
                    nextLevelNodes[child.id] = {
                      node: child,
                      num: 1,
                    };
                  }
                }
                graph.push(node.id);
              } else {
                walkNodes(calcNode.metricCode, [calcNode.field]);
              }
            }
            const nextLevelNodesEntries = Object.entries(nextLevelNodes).sort(
              (a: any, b: any) => a[1].num - b[1].num,
            );

            currentNodes = nextLevelNodesEntries.map(
              (item: any) => item[1].node,
            );
          }
          graph.push(formulaId);
        }
      }

      walkNodes(startCode, fields);

      return graph;
    },
    // 生成每个单元格公式及其依赖关系
    addRelationData(data: EditorTs.FormulaList, dateFields: any) {
      

      return 'okey'
    },
  };

  /* 
    计算公式并更新相关指标的值
    code: 指标代码
    attrs: 需要计算的属性数组
  */

  const calculateFormula = (code: string, attrs: string[]) => {
    // const startTime = performance.now();

    // 添加缓存机制
    const valueCache = new Map<string, any>() // 缓存计算结果, 缓存已计算的公式值，避免重复计算相同的公式
    const formulaCache = new Map<string, string>() // 缓存处理后的公式, 缓存已处理的公式字符串，避免重复进行字符串替换操作

    // 优化3: 批量处理更新
    const updateBatch = new Map<string, { field: string; value: any }>();
    // 优化4: 创建正则表达式一次，避免重复创建, 这个优化将正则表达式的创建移到了循环外部, 虽然这是一个小优化，但在处理大量公式时可以减少不必要的开销。
    const errRegex = new RegExp(err.join("|"));

    const formulaMap: any = calculate.relationAllGraph;
    const graph = calculate.getUpdateGraph(code, attrs);

    // console.log('计算公式:', graph);
    const orderGraph = calculate.getOrderUpdateGraph(graph);
    // console.log('公式排序:', orderGraph);

    orderGraph.forEach((code) => {
      const node = formulaMap[code];
      if (!node) {
        // console.warn(`当前指标：${code}，没有找到公式`);
        return;
      }

      const { marks, formula, field, formulaName, metricCode } = node;

    // 使用缓存检查是否已经处理过这个公式
    const cacheKey = `${metricCode}-${field}`;

      let updatedFormula = formula;

    if (formulaCache.has(cacheKey)) {
      updatedFormula = formulaCache.get(cacheKey)
    } else {
      updatedFormula = formula

      // let originalLength = updatedFormula.length;
      // let currentOffset = 0;

      try {
        // 优化2: 改进公式替换过程
        // 收集所有需要替换的部分
        const replacements: { start: number; end: number; value: string }[] = []

        if (metricCode.includes('C10000A0491')) {
          // debugger;
        }
        
        marks.forEach((markInfo, index) => {
          const fieldValue = getValue(markInfo, node, node.curFormula[index]);

          // updatedFormula = spliceString(
          //   updatedFormula,
          //   markInfo.from + currentOffset,
          //   markInfo.to + currentOffset,
          //   `(${fieldValue})`,
          // );
          // currentOffset += updatedFormula.length - originalLength;
          // originalLength = updatedFormula.length;

          replacements.push({
            start: markInfo.from,
            end: markInfo.to,
            value: `(${fieldValue})`,
          })
        });

        // 从后向前替换，避免位置偏移问题
        replacements.sort((a, b) => b.start - a.start);
        for (const { start, end, value } of replacements) {
          updatedFormula = spliceString(updatedFormula, start, end, value);
        }

        formulaCache.set(cacheKey, updatedFormula);

      } catch (error) {
        const errInfo = {
          formulaName,
          metricCode,
          marks,
          err: error,
        };
        console.warn(errInfo);
        // throw new Error(error.message);
      }
    }

      let value;
      // const errRegex = new RegExp(err.join('|'));

      // 使用预先创建的正则表达式
      if (errRegex.test(`${updatedFormula}`)) {
        value = 'NaN';
      } else {
        // try {
        //   value = calculate.eval(`${updatedFormula}`, false);

        //   if (errRegex.test(`${value}`)) {
        //     value = 0;
        //   } else {
        //     const data = getData(node.metricCode);
        //     if (isNumber(value)) {
        //       value = new Decimal(value).div(Number(data.scale)).toNumber();
        //     }
        //   }
        // } catch (error) {
        //   // throw new Error(error.message);
        //   console.warn(`
        //     当前指标：${formulaName}，
        //     指标Code：${metricCode},
        //     当前公式：${formula},
        //     当前计算公式：${updatedFormula}
        //     error: ${error}
        //     `);
        // }
        try {
          // 检查是否已经计算过这个公式
          if (valueCache.has(updatedFormula)) {
            value = valueCache.get(updatedFormula)
          } else {
            value = calculate.eval(`${updatedFormula}`, false)
            // 缓存计算结果
            valueCache.set(updatedFormula, value)
          }
  
          // 使用预先创建的正则表达式
          if (errRegex.test(`${value}`)) {
            value = 0
          } else {
            const data = getData(node.metricCode)
            if (isNumber(value)) {
              value = new Decimal(value).div(Number(data.scale)).toNumber()
            }
          }
        } catch (error) {
          console.warn(`
            当前指标：${formulaName}，
            指标Code：${metricCode},
            当前公式：${formula},
            当前计算公式：${updatedFormula}
            error: ${error}
          `)
        }
      }
      const oldData = getData(node.metricCode) || {};
      const oldValue = oldData[field];

      if (value !== oldValue) {
        // patchUpdateData(node.metricCode, field, value);
        updateBatch.set(`${metricCode}-${field}`, { field, value });
      }
    });

    // 批量应用所有更新
    for (const [key, { field, value }] of updateBatch.entries()) {
      const metricCode = key.substring(0, key.lastIndexOf("-"))
      patchUpdateData(metricCode, field, value)
    }

    // const endTime = performance.now();
    // const executionTime = endTime - startTime;
    // console.log(`getOrderUpdateGraph execution time: ${executionTime / 1000} 秒`);
  };

  // 计算后的公式
  const getCalculatedFormula = (nodeId: string) => {
    if (!nodeId) return '';
    const formulaMap: any = calculate.relationAllGraph;
    const formulaNode = formulaMap[nodeId];
    if (!formulaNode) return '';

    let updatedFormula = formulaNode.formula;
    let originalLength = updatedFormula.length;
    let currentOffset = 0;

    try {
      formulaNode.marks.forEach((markInfo: any) => {
        const fieldValue = getValue(markInfo, formulaNode);

        updatedFormula = spliceString(
          updatedFormula,
          markInfo.from + currentOffset,
          markInfo.to + currentOffset,
          `(${fieldValue})`,
        );
        currentOffset += updatedFormula.length - originalLength;
        originalLength = updatedFormula.length;
      });
    } catch (error) {
      console.warn('计算公式出错:', error);
      // throw new Error(error.message);
    }

    return updatedFormula;
  };

  // 获取相关指标列表
  const getRelatedMetrics = (
    formula: string,
    marks: Array<{ deCode: string; enCode: string }>,
  ) => {
    if (!formula || !marks) return [];
    const formulaMap: any = calculate.relationAllGraph;
    // 直接从 marks 中获取指标代码，过滤掉特殊前缀
    const metricCodes = [
      ...new Set(
        marks
          .map((mark) => mark.enCode)
          .filter(
            (code) =>
              !code.startsWith('global-') &&
              !code.startsWith('prev-') &&
              !code.startsWith('var-'),
          ),
      ),
    ];

    const r = metricCodes
      .map((code) => {
        const metricData = getData(code);
        // 尝试从 formulaMap 中获取指标名称
        const metricInfo =
          Object.values(formulaMap).find((f: any) => f.metricCode === code) ||
          {};

        const name =
          window?.all && metricInfo?.metricCode
            ? window.all[metricInfo.metricCode]?.metricName
            : code;

        return {
          code,
          name,
          value: metricData ? metricData['2025'] : '未找到', // 使用默认年份2025
        };
      })
      .filter(Boolean);

    return r;
  };

  // 获取当前指标值
  const getCurrentValue = (metricCode: string, nodeId: string) => {
    if (!metricCode) return undefined;
    const formulaMap: any = calculate.relationAllGraph;

    const metricData = getData(metricCode);

    if (!metricData) return undefined;

    const formulaNode = formulaMap[nodeId];
    if (!formulaNode) return undefined;

    return metricData[formulaNode.field];
  };

  // 在 useCalculate 函数中添加新的方法
  const getFormulaRelationNodes = (formulaId: string) => {
    const visited = new Set<string>();
    const result: Array<{
      children?: any[];
      code: string;
      formula?: string;
      level: number;
      name: string;
      value?: any;
    }> = [];

    function dfs(currentId: string, level: number = 0) {
      if (visited.has(currentId)) {
        return;
      }

      visited.add(currentId);
      const node = formulaMap[currentId];
      if (!node) {
        // debugger
        return;
      }

      const nodeInfo = {
        level,
        code: node.metricCode,
        name: node.formulaName,
        formula: node.formula,
        value: getCurrentValue(node.metricCode, currentId),
      };
      // console.log('nodeInfo = ', nodeInfo)
      result.push(nodeInfo);

      // 处理依赖的指标
      if (node.calcMarks) {
        // if(node.formulaName=='餐饮渠道销量'){
        //   debugger
        // }
        node.calcMarks.forEach((mark: string) => {
          const depId = mark; // `${mark}-${currentId.split('-')[1]}`; // 使用相同的年份
          dfs(depId, level + 1);
        });
      }
    }

    dfs(formulaId);

    return result;
  };

  // 返回计算模块的公共方法
  return {
    calculateFormula,

    getCalculatedFormula,
    getRelatedMetrics,
    getCurrentValue,
    getValue, // 额外暴露 getValue 函数
    spliceString, // 额外暴露 spliceString 函数
    calculate, // 额外暴露 getValue 函数
    getFormulaRelationNodes, // 额外暴露 getValue 函数
  };
};

// 导出计算模块
export { useCalculate };
