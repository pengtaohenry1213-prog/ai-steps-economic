import type { EditorTs } from '@vben/types';

import Decimal from 'decimal.js';
import * as fengariWeb from 'fengari-web'; // fengari-web 让你可以在 浏览器中运行 Lua 代码。

import { useModelStore } from '#/store/index';

import * as mathFunc from './math/index';
import { isNumber } from './utils';

// FunctionCore类用于执行数学函数和公式计算
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
const isDate = (value: string): boolean => {
  const datePattern = /^(?:\d{4}|\d{4}-\d{1,2})$/;
  return datePattern.test(value);
};
// let calcFormulaGroup;

// 计算模块的主要hook函数，处理公式计算和数据更新
const useCalculate = (options: any) => {
  const { formulaMap, globalConfig, patchUpdateData, getData } = options;
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
  const getValue = (mark: any, calcNode: any) => {
    let data;
    let key;
    let value;
    const { startTime, timeType, periodNumber } = globalConfig;

    // 处理全局配置值
    if (mark.enCode.includes('global-')) {
      key = mark.enCode.replace('global-', '');
      data = globalConfig;
      data.scale = getData(mark.enCode)?.scale || 1;
      value = data?.[key] || 0;
    }
    // 处理总计值
    else if (mark.enCode.includes('total-')) {
      const code = mark.enCode.replace('total-', '');
      data = getData(code); // 获取指标数据(一行数据)
      let totalValue = 0;
      // 按月或季度累计
      if (timeType === 'month' || timeType === 'quarter') {
        for (const attr in data) {
          if (isDate(attr)) {
            totalValue += Number(data[attr]) || 0;
          }
        }
      } else {
        // 按年累计
        for (const attr in data) {
          if (isDate(attr)) {
            totalValue += Number(data[attr]) || 0;
          }
        }
      }
      value = totalValue;
    }
    // 处理变量值
    else if (mark.enCode.includes('var-')) {
      data = { scale: 1 };
      key = mark.enCode.split('-')[1];
      // 处理每期值
      if (key === 'everyPeriod') {
        if (timeType === 'year') {
          value =
            (periodNumber - (Number(calcNode.field) - startTime) * 12) / 12;
        }
        if (timeType === 'quarter') {
          const { year, quarter } = startTime.split('-');
          const [curYear, currQuarter] = calcNode.field.split('-');
          value =
            (periodNumber -
              (Number(curYear) - year) * 12 +
              (Number(currQuarter) - quarter) * 3) /
            3;
        }
      }
    }
    // 处理上期值
    else if (mark.enCode.includes('prev-')) {
      const c = mark.enCode.split('-')[1];
      if (timeType === 'year') {
        // e.g. [2025, 2026, 2027] startTime:2025, calcNode.field:2027, 2027-1 > 2025 => key: 2027-1=2026, 即: 2027的上一年
        key =
          Number(calcNode.field) - 1 >= startTime
            ? Number(calcNode.field) - 1
            : '';
      } else {
        // 错误代码
        key = calcNode.field;
      }
      data = getData(c);
      value = data[key] || 0;
    }
    // 处理期间累计值
    else if (mark.enCode.includes('periodAdd-')) {
      const c = mark.enCode.split('-')[1];
      data = getData(c);
      key = calcNode.field;
      let totalValue = 0;
      for (const attr in data) {
        if (isDate(attr)) {
          if (timeType === 'year') {
            if (key >= attr) {
              totalValue += Number(data[attr]) || 0;
            }
          } else {
            const [curYear, currQuarter] = key.split('-') as [string, string];
            const [year, quarter] = attr.split('-') as [string, string];
            if (
              curYear > year ||
              (curYear === year && currQuarter >= quarter)
            ) {
              totalValue += Number(data[attr]) || 0;
            }
          }
        }
      }
      value = totalValue;
    } 
    else if (mark.enCode.includes('totalYear-')) {
      // 一年的数据总和 **totalYear-code** 年度统计的话值就是当年的值，季度统计是4个季度值总和，月度统计是12个月之和
      const code = mark.enCode.replace('totalYear-', '');
      data = getData(code); // 获取指标数据(一行数据) {2025:xx, 2026:xx, 2027:xx,...,2044:xxx,level:1,...}
      // console.log('code = ', code, ', getData(code) = ', data)
      let totalValue = 0;
      const targetYear = calcNode.field; // 使用当前计算节点的字段作为目标年份
      // console.log('targetYear:', targetYear, ', calcNode = ', calcNode);

      let isStart = false;
      let isReturn = false;
      for (const attr in data) {
        if (isDate(attr)) {
          const [year] = attr.split('-');

          if (year === targetYear) {
            // 使用目标年份进行匹配
            isReturn = true;
            // console.log('处理数据 - attr:', attr, 'year:', year, 'value:', data[attr]);

            if (!isStart) {
              // console.log('===== totalYear- 开始计算 =====');
              // console.log('mark.enCode:', mark.enCode);
              // console.log('code:', code);
              // console.log('calcNode.field:', calcNode.field);
              // console.log('timeType:', timeType);
              // console.log('data:', data);
              isStart = true;
            }

            switch (timeType) {
              case 'year': {
                // 年度统计：累加当年的所有值
                totalValue += Number(data[attr]) || 0;
                // console.log('年度统计 - 累加年度值，当前totalValue:', totalValue);

                break;
              }
              case 'quarter': {
                // 累加当前年份的4个季度的值
                // 季度统计：累加4个季度的值
                totalValue += Number(data[attr]) || 0;
                // console.log('季度统计 - 累加季度值，当前totalValue:', totalValue);

                break;
              }
              case 'month': {
                // 累加当前年份的12个月的值
                // 月度统计：累加12个月的值
                totalValue += Number(data[attr]) || 0;
                // console.log('月度统计 - 累加月度值，当前totalValue:', totalValue);

                break;
              }
              // No default
            }
          }
        }
      }

      if (isReturn) {
        value = totalValue;
        // console.log('===== totalYear- 计算完成 =====');
        // console.log('最终结果 value:', value);
      }
    }
    // 处理普通指标值
    else {
      data = getData(mark.enCode);
      key = calcNode.field;
      value = data?.[key] || 0;
    }

    // 处理数值类型和比例
    if (isNumber(value)) {
      value = new Decimal(value).mul(Number(data.scale)).toNumber();
    } else if (value === undefined) {
      value = 0;
    } else {
      value = `'${value}'`;
    }

    return value;
  };

  const calculate = {
    calcFormulaGroup: [],
    DFTLevel: 0,
    DFTGroup: [],
    isDeadCycle: false,
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
        // console.warn('构建关系存在死循环，请检查', this.DFTGroup);
      }
    },
    /* 
      获取计算公式组, 目的: 构建一个有序的计算公式组, ，确保公式按照正确的依赖顺序进行计算。这对于带有公式的表格计算系统至关重要，因为许多公式依赖于其他公式的计算结果。
      ### 核心功能
        1. **依赖排序**：该方法通过递归分析每个公式的依赖关系，确保依赖项在被依赖项之前计算。
        2. **避免循环依赖**：通过检查公式是否已在计算组中，防止循环依赖导致的无限递归。
        3. **优化插入位置**：使用 `findMaxIndex` 函数找到最优的插入位置，确保依赖项都已处理。
    */
    initCalcFormulaGroup(formulaMap: any) {
      // console.log('formulaMap = ', formulaMap);
      return false;

      const calcFormulaGroup: any[] = []; // 最终的计算顺序
      const baseGroup: any[] = []; // 基础指标组
      // const processing = new Set(); // 用于检测循环依赖

      // const self = this;
      let key;

      function findMaxIndex(arr: any[]) {
        let maxIndex = -1;
        for (const code of arr) {
          if (!baseGroup.includes(code)) {
            // 排除marks为空的情况code, 即排除非公式指标
            const index = calcFormulaGroup.indexOf(code);
            if (index > maxIndex) {
              maxIndex = index;
            }
          }
        }
        return maxIndex;
      }

      // key 键是指标ID（如 "C10000A0199_LP-value"）
      function insertFormula(key: string) {
        // 对于不存在的公式，函数仍然返回 true，这可能导致调用方认为处理成功而继续执行。

        // 检测循环依赖
        // if (processing.has(key)) {
        //   console.warn(`检测到循环依赖: ${key}`);
        //   return false;
        // }

        // if (self.isDeadCycle) { return false; }
        if (calcFormulaGroup.includes(key)) {
          return;
        } // 如果公式已在计算组中，则跳过，直接返回成功
        const node = formulaMap[key];
        if (!node) {
          // console.warn(`公式 "${key}" 不存在`)
          return true; // 不存在的公式视为处理成功
        }

        // processing.add(key); // 标记正在处理

        try {
          if (node.formula) {
            // 如果公式有 formula 属性，则先处理其依赖项（calcMarks）
            // 处理所有依赖项
            // const allDepsProcessed = node.calcMarks.every((item: any) =>
            //   insertFormula(item)
            // );

            // self.checkDeadCycle(false, key, 2000);

            // console.log(node.calcMarks);
            node.calcMarks.forEach((item: any) => {
              // 遍历 公式依赖项calcMarks
              insertFormula(item);
            });

            // 只有当所有依赖项都处理成功时，才添加当前公式
            // if (allDepsProcessed) {
            // 根据依赖项在calcFormulaGroup中的位置，确定当前公式的插入位置
            const insertIndex = findMaxIndex(node.calcMarks); // 根据依赖项在计算组中的位置，确定当前公式的插入位置
            if (insertIndex > -1) {
              calcFormulaGroup.splice(insertIndex + 1, 0, key); // 如果存在，则插入到依赖项的后面
            } else {
              calcFormulaGroup.push(key); // 如果不存在，则插入到计算组末尾
            }
            // return true;
            // }

            // return false;
          } else {
            // 如果没有 formula 属性，则可能是基础指标
            // baseGroup.includes(key) ? baseGroup.push(key) : '';

            // 修正基础指标的处理逻辑
            if (!baseGroup.includes(key)) {
              baseGroup.push(key);
            }
            // calcFormulaGroup.push(key); // 基础指标也需要加入计算序列
            return true;
          }
        } finally {
          // processing.delete(key); // 处理完成后移除标记debugger
        }
      }

      for (key in formulaMap) {
        insertFormula(key);
      }

      // 输出统计信息
      // console.info(`处理完成:
      //   - 总节点数: ${Object.keys(formulaMap).length}
      //   - 有效节点数: ${calcFormulaGroup.length}
      //   - 基础指标数: ${baseGroup.length}
      // `);

      this.calcFormulaGroup = calcFormulaGroup;
      // window.calcFormulaGroup = calcFormulaGroup;
      return calcFormulaGroup; // 最终返回排序后的 `calcFormulaGroup` 数组
    },

    initCalcFormulaGroup1(formulaMap: any) {
      const calcFormulaGroup: any[] = []; // 最终的计算顺序
      const baseGroup: any[] = []; // 基础指标组
      const visited = new Set(); // 用于记录已访问的节点
      const cycleDetected = new Set(); // 用于记录已检测到循环依赖的节点

      function findMaxIndex(arr: any[]) {
        let maxIndex = -1;
        for (const code of arr) {
          if (!baseGroup.includes(code)) {
            const index = calcFormulaGroup.indexOf(code);
            if (index > maxIndex) {
              maxIndex = index;
            }
          }
        }
        return maxIndex;
      }

      // 使用非递归DFS处理公式依赖
      function processFormulaDFS(startKey: string) {
        const stack: string[] = [startKey];
        const stackSet = new Set(); // 使用Set来优化查找性能

        while (stack.length > 0) {
          const currentKey = stack[stack.length - 1]; // 查看栈顶元素但不移除

          // 如果节点已经被标记为循环依赖,直接跳过
          if (cycleDetected.has(currentKey)) {
            stack.pop();
            continue;
          }

          // 检测循环依赖 - 检查当前节点是否已经在栈中(除栈顶外)
          // const stackWithoutTop = stack.slice(0, -1);
          // if (stackWithoutTop.includes(currentKey)) {
          //   console.warn(`检测到循环依赖: ${currentKey}, 依赖路径: ${stack.join(' -> ')}`);
          //   return false;
          // }

          if (stackSet.has(currentKey)) {
            // 记录循环依赖路径中的所有节点
            const cycleStart = stack.indexOf(currentKey);
            const cyclePath = stack.slice(cycleStart);
            // console.warn(`检测到循环依赖, 依赖路径: ${cyclePath.join(' -> ')}`);

            // 将循环中的所有节点标记为循环依赖
            cyclePath.forEach((key) => cycleDetected.add(key));

            stack.pop();
            stackSet.delete(currentKey);
            continue;
          }

          // 检测到循环依赖: C10000A0015-2036,
          // 依赖路径: C10000A0558-2036 -> C10000A0483-2036 -> C10000A0557-2036 -> C10000A0022-2036 -> C10000A0023-2036 -> C10000A0015-2036 -> C10000A0018-2036 -> C10000A0015-2036

          const node = formulaMap[currentKey];
          if (!node) {
            stack.pop(); // 移除无效节点
            stackSet.delete(currentKey);
            continue;
          }

          // 如果节点已经访问过，直接弹出
          if (visited.has(currentKey)) {
            stack.pop();
            stackSet.delete(currentKey);
            continue;
          }

          stackSet.add(currentKey);

          if (!node.formula) {
            // 处理基础指标
            if (!baseGroup.includes(currentKey)) {
              baseGroup.push(currentKey);
            }
            visited.add(currentKey);
            stack.pop();
            stackSet.delete(currentKey);
            continue;
          }

          // 检查是否所有依赖都已处理
          const unprocessedDeps = node.calcMarks.filter(
            (dep) => !visited.has(dep) && !cycleDetected.has(dep),
          );

          if (unprocessedDeps.length === 0) {
            // 所有依赖都已处理，可以处理当前节点
            if (!visited.has(currentKey) && !cycleDetected.has(currentKey)) {
              const insertIndex = findMaxIndex(node.calcMarks);
              if (insertIndex > -1) {
                calcFormulaGroup.splice(insertIndex + 1, 0, currentKey);
              } else {
                calcFormulaGroup.push(currentKey);
              }
              visited.add(currentKey);
            }
            stack.pop();
            stackSet.delete(currentKey);
          } else {
            // 将未处理的依赖添加到栈中
            stack.push(...unprocessedDeps);
          }
        }
        return true;
      }

      // 处理所有公式
      for (const key in formulaMap) {
        if (!visited.has(key)) {
          processFormulaDFS(key);
        }
      }

      // 输出统计信息
      // console.info(`处理完成:
      //   - 总节点数: ${Object.keys(formulaMap).length}
      //   - 有效节点数: ${calcFormulaGroup.length}
      //   - 基础指标数: ${baseGroup.length}
      //   - 循环依赖节点数: ${cycleDetected.size}
      // `);

      this.calcFormulaGroup = calcFormulaGroup;
      // window.calcFormulaGroup = calcFormulaGroup;
      return calcFormulaGroup;
    },
  };

  /* 
    计算公式并更新相关指标的值
    code: 指标代码
    attrs: 需要计算的属性数组
  */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const calculateFormula = (code: string, attrs: string[]) => {
    // const { startTime, timeType, periodNumber } = globalConfig;

    calculate.calcFormulaGroup.forEach((code) => {
      const node = formulaMap[code];

      if (!node) {
        // console.warn(`当前指标：${code}，没有找到公式`);
        return;
      }

      const { marks, formula, field } = node; // , formulaName, metricCode
      let updatedFormula = formula;
      let originalLength = updatedFormula.length;
      let currentOffset = 0;

      try {
        marks.forEach((markInfo) => {
          const fieldValue = getValue(markInfo, node);

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
        // const errInfo = {
        //   formulaName,
        //   metricCode,
        //   marks,
        //   err: error,
        // };
        // console.warn(errInfo);
        throw new Error(error.message);
      }
      let value;

      const errRegex = new RegExp(err.join('|'));
      if (errRegex.test(`${updatedFormula}`)) {
        value = 'NaN';
      } else {
        try {
          value = calculate.eval(`${updatedFormula}`, false);
          // if (code.includes('C10000A0365')) {
          //   console.warn(
          //     '%c [ updatedFormula ]-223',
          //     'font-size:13px; background:pink; color:#bf2c9f;',
          //     updatedFormula,
          //     '值',
          //     value,
          //   );
          // }
          // value = 1;

          if (errRegex.test(`${value}`)) {
            value = 0;
          } else {
            const data = getData(node.metricCode);
            if (isNumber(value)) {
              value = new Decimal(value).div(Number(data.scale)).toNumber();
            }
          }
        } catch (error) {
          throw new Error(error.message);
          // console.warn(`
          //   当前指标：${formulaName}，
          //   指标Code：${metricCode},
          //   当前公式：${formula},
          //   当前计算公式：${updatedFormula}
          //   error: ${error}
          //   `);
        }
      }
      const oldData = getData(node.metricCode) || {};

      const oldValue = oldData[field];
      // eslint-disable-next-line eqeqeq
      if (value != oldValue) {
        patchUpdateData(node.metricCode, node.field, value);
      }
    });
  };

  // 遍历关系节点，构建依赖关系图
  const walkRelationNodes = (
    code: string,
    field: any,
    relations: any,
    level: number,
  ) => {
    const formulaId = `${code}-${field}`;
    let node: any;
    const current = formulaMap[formulaId];
    let currentNodes = current.children || []; // 依赖当前指标
    while (currentNodes.length > 0) {
      relations.push(
        currentNodes.map((item: any) => {
          return `${formulaMap[item.id].formulaName}-${item.field}-${item.metricCode}`;
        }),
      );
      const nextLevelNodes: any = {};
      for (node of currentNodes) {
        const calcNode: EditorTs.Formula = formulaMap[node.id];
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
        } else {
          // eslint-disable-next-line no-use-before-define
          // getUpdateRelations(
          //   calcNode.metricCode,
          //   [calcNode.field],
          //   relations,
          //   level + 1,
          // );
        }
      }
      const nextLevelNodesEntries = Object.entries(nextLevelNodes).sort(
        (a: any, b: any) => a[1].num - b[1].num,
      );

      currentNodes = nextLevelNodesEntries.map((item: any) => item[1].node);
    }
  };

  // 获取指标的更新关系
  // code: 指标代码
  // attrs: 属性数组
  // relations: 关系数组
  // level: 当前层级
  const getUpdateRelations = (
    code: string,
    attrs: string[],
    relations: any,
    level: number = 0,
  ) => {
    let field: any;
    let formulaId: string;
    for (field of attrs) {
      formulaId = `${code}-${field}`;
      if (!formulaMap[formulaId]) {
        // console.warn(
        //   `当前指标：${code}-${field}，当前属性：${field}，没有找到公式`,
        // );
        return;
      }
      const prefix = Array.from({ length: level }).fill('-').join('');

      relations.push(
        `-${prefix}-${code}-${formulaMap[formulaId].formulaName}----------------------`,
      );
      walkRelationNodes(code, field, relations, level);
    }
  };

  // 计算后的公式
  const getCalculatedFormula = (nodeId: string) => {
    if (!nodeId) return '';

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
      // console.warn('计算公式出错:', error);
      throw new Error(error.message);
    }

    return updatedFormula;
  };

  // 获取相关指标列表
  const getRelatedMetrics = (
    formula: string,
    marks: Array<{ deCode: string; enCode: string }>,
  ) => {
    if (!formula || !marks) return [];

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

    const metricData = getData(metricCode);

    if (!metricData) return undefined;

    const formulaNode = formulaMap[nodeId];
    if (!formulaNode) return undefined;

    return metricData[formulaNode.field];
  };

  // 将getUpdateRelations方法暴露到window对象上，方便调试
  window.getUpdateRelations = getUpdateRelations;
  window.calculateFormula = calculateFormula;

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

    // 按层级和名称排序
    // return result.sort((a, b) => {
    //   if (a.level !== b.level) {
    //     return a.level - b.level;
    //   }
    //   return a.name.localeCompare(b.name);
    // });
  };

  // 返回计算模块的公共方法
  return {
    calculateFormula,
    getUpdateRelations,
    getCalculatedFormula,
    getRelatedMetrics,
    getCurrentValue,
    getValue, // 额外暴露 getValue 函数
    spliceString, // 额外暴露 spliceString 函数
    calculate,
    getFormulaRelationNodes,
  };
};

// 导出计算模块
export { useCalculate };
