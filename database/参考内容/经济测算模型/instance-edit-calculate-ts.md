import type { EditorTs } from '@vben/types';

import Decimal from 'decimal.js';
import * as fengariWeb from 'fengari-web';

import { useModelStore } from '#/store/index';

import * as mathFunc from './math/index';
import { isNumber } from './utils';

class FunctionCore {
  constructor() {
    Object.assign(FunctionCore.prototype, mathFunc);
  }

  executeFunction(str: string) {
    // 执行函数
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      `with(this) { return ${str}; }`, // 使用 `with` 来确保从当前实例中查找函数
    ).bind(this);

    return fn();
  }
}
// 单例对象，保证全局只有一个实例
const functionCore = new FunctionCore();

// 判断是否为日期格式
const isDate = (value: string): boolean => {
  const datePattern = /^(?:\d{4}|\d{4}-\d{1,2})$/;
  return datePattern.test(value);
};

// 计算逻辑
const useCalculate = (options: any) => {
  const { formulaMap, globalConfig, patchUpdateData, getData } = options;

  const modelStore = useModelStore();
  const err = ['Infinity', '-Infinity', 'NaN'];

  const luaCalc = (luaScript: string, isLua: boolean) => {
    if (isLua) {
      const result = fengariWeb.load(
        `${modelStore.formula} return ${luaScript}`,
      );
      return result();
    } else {
      return functionCore.executeFunction(luaScript);
    }
  };

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

  const getValue = (mark: any, node: any, field: any) => {
    let data;
    let key;
    let value;
    const { startTime, timeType, periodNumber } = globalConfig;
    if (mark.enCode.includes('global-')) {
      key = mark.enCode.replace('global-', '');
      data = globalConfig;
      data.scale = getData(mark.enCode)?.scale || 1;
      value = data?.[key] || 0;
    } else if (mark.enCode.includes('total-')) {
      const code = mark.enCode.replace('total-', '');

      data = getData(code);
      let totalValue = 0;
      if (timeType === 'month' || timeType === 'quarter') {
        for (const attr in data) {
          if (isDate(attr)) {
            totalValue += Number(data[attr]) || 0;
          }
        }
      } else {
        for (const attr in data) {
          if (isDate(attr)) {
            totalValue += Number(data[attr]) || 0;
          }
        }
      }
      value = totalValue;
    } else if (mark.enCode.includes('var-')) {
      data = {
        scale: 1,
      };
      key = mark.enCode.split('-')[1];
      if (key === 'everyPeriod') {
        if (timeType === 'year') {
          value = (periodNumber - (Number(node.field) - startTime) * 12) / 12;
        }
        if (timeType === 'quarter') {
          const { year, quarter } = startTime.split('-');
          const [curYear, currQuarter] = node.field.split('-');
          value =
            (periodNumber -
              (Number(curYear) - year) * 12 +
              (Number(currQuarter) - quarter) * 3) /
            3;
        }
      }
    } else if (mark.enCode.includes('prev-')) {
      const c = mark.enCode.split('-')[1];

      data = getData(c);
      key = field;
      value = data[key] || 0;
    } else if (mark.enCode.includes('periodAdd-')) {
      data = getData(node.metricCode);
      key = node.field;
      let totalValue = 0;
      for (const attr in data) {
        if (isDate(attr)) {
          if (timeType === 'year') {
            if (key > attr) {
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
    } else {
      data = getData(mark.enCode);
      key = node.field;
      value = data?.[key] || 0;
    }

    if (isNumber(value)) {
      value = new Decimal(value).mul(Number(data.scale)).toNumber();
    } else if (value === undefined) {
      value = 0;
    } else {
      value = `'${value}'`;
    }

    return value;
  };

  // 前端用lua脚本计算，code为指标，attrs为计算的属性
  const calculateFormula = (code: string, attrs: string[]) => {
    // const { startTime, timeType, periodNumber } = globalConfig;
    let field: any, formulaId;
    let num = 1;
    let innerNum = 1;
    for (field of attrs) {
      formulaId = `${code}-${field}`;
      if (!formulaMap[formulaId]) {
        console.warn(
          `当前指标：${code}-${field}，当前属性：${field}，没有找到公式`,
        );
        return;
      }
      const current = formulaMap[formulaId];
      let currentNodes = current.children || []; // 依赖当前指标

      // 计算的指标
      while (currentNodes.length > 0) {
        num++;
        if (num > 500) {
          console.warn('死循环outer');
          return;
        }

        const nextLevelNodes: any = {}; // 下一级计算的指标行
        for (const node of currentNodes) {
          // log.push([node.id, formulaMap[node.id].children]);
          innerNum++;
          totalClacNum++;
          if (innerNum > 6000) {
            console.warn('死循环inner');
            return;
          }
          const calcNode: EditorTs.Formula = formulaMap[node.id];
          if (!calcNode) {
            console.warn(
              `当前指标：${code}，当前属性：${field}，没有找到公式${node.id}`,
            );
            return;
          }
          const { marks, formula, formulaName, metricCode } = calcNode;
          let updatedFormula = formula;
          let originalLength = updatedFormula.length;
          let currentOffset = 0;
          try {
            marks.forEach((markInfo) => {
              const fieldValue = getValue(markInfo, calcNode, field);

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
            const errInfo = {
              formulaName,
              metricCode,
              marks,
              err: error,
            };
            console.warn(errInfo);
          }
          let value;

          const errRegex = new RegExp(err.join('|'));
          if (errRegex.test(`${updatedFormula}`)) {
            value = 'NaN';
          } else {
            try {
              value = luaCalc(`${updatedFormula}`, false);
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
              console.warn(`
                当前指标：${formulaName}，
                指标Code：${metricCode},
                当前公式：${formula},
                当前计算公式：${updatedFormula} 
                error: ${error}
                `);
            }
          }
          const oldData = getData(node.metricCode) || {};
          const oldValue = oldData[field];

          if (value !== oldValue) {
            patchUpdateData(node.metricCode, calcNode.field, value);

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
              calculateFormula(calcNode.metricCode, [calcNode.field]);
            }
          }
        }

        const nextLevelNodesEntries = Object.entries(nextLevelNodes).sort(
          (a: any, b: any) => a[1].num - b[1].num,
        );

        currentNodes = nextLevelNodesEntries.map((item: any) => item[1].node);
        // otherNodes = otherNextNodes;
      }
    }
  };

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
          getUpdateRelations(
            calcNode.metricCode,
            [calcNode.field],
            relations,
            level + 1,
          );
        }
      }
      const nextLevelNodesEntries = Object.entries(nextLevelNodes).sort(
        (a: any, b: any) => a[1].num - b[1].num,
      );

      currentNodes = nextLevelNodesEntries.map((item: any) => item[1].node);
    }
  };

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
        console.warn(
          `当前指标：${code}-${field}，当前属性：${field}，没有找到公式`,
        );
        return;
      }
      const prefix = Array.from({ length: level }).fill('-').join('');

      relations.push(
        `-${prefix}-${code}-${formulaMap[formulaId].formulaName}----------------------`,
      );
      walkRelationNodes(code, field, relations, level);
    }
  };

  window.getUpdateRelations = getUpdateRelations;
  return {
    calculateFormula,
    getUpdateRelations,
  };
};

export { useCalculate };
