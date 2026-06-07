/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable unicorn/no-array-reduce */

import { useAnimationData, useData, useFormula } from '../hooks';
import FunctionCore from '../math/index';

const isDev = import.meta.env.DEV;

interface Instance {
  dateFields: string[];
  forecastTimeType: 'month' | 'quarter' | 'year';
  targetIndustry: string;
  investmentType?: string;
}

const { getFormula } = useFormula();
const { getData, updateData } = useData();
const { checkAnimationData } = useAnimationData();
const core = new FunctionCore();
const VARIABLE_REGEX = /\$\{([^${}]+)\}/g;

export default async function calculate(
  instance: Instance,
  graph: string[],
): Promise<void> {
  const {
    dateFields,
    forecastTimeType: timeType,
    targetIndustry,
    investmentType = '新建',
  } = instance;

  // 预计算常量
  const precomputed = {
    periodMonths: timeType === 'year' ? 12 : 3,
    periodNumber: dateFields.length,
    arrayAllPeriod: JSON.stringify(dateFields.map((_, i) => i + 1)),
    arrayAllDate: JSON.stringify(dateFields),
    targetIndustry: `'${targetIndustry}'`,
    investmentType: `'${investmentType}'`,
  };
  // 全局变量处理器
  const globalHandlers: Record<string, any> = {
    'global-arrayAllDate': precomputed.arrayAllDate,
    'global-arrayAllPeriod': precomputed.arrayAllPeriod,
    'global-periodNumber': precomputed.periodNumber,
    'global-periodMonths': precomputed.periodMonths,
    'global-targetIndustry': precomputed.targetIndustry,
    'global-investmentType': precomputed.investmentType,
    'var-everyPeriod': (date: string) => dateFields.indexOf(date) + 1,
  };

  // 特殊表达式处理器
  const expressionHandlers: Record<
    string,
    (code: string, date: string) => any
  > = {
    // 年的最后一期的值
    lastPeriod: (code, date) =>
      timeType === 'year'
        ? getData(code, date) || 0
        : getData(
            code,
            dateFields.findLast((f) => f.startsWith(date.slice(0, 4))) || 0,
          ) || 0,
    // 所有日期的值
    arrayAllValue: (code) =>
      JSON.stringify(dateFields.map((f) => +(getData(code, f) || 0))),
    // 往期累计（不包含当前周期）
    prevPeriodAdd: (code, date) => {
      let sum = 0;
      for (const f of dateFields) {
        if (f === date) break;
        sum += +(getData(code, f) || 0);
      }
      return sum;
    },
    // 周期累计（包含当前周期）
    periodAdd: (code, date) => {
      let sum = 0;
      for (const f of dateFields) {
        sum += +(getData(code, f) || 0);
        if (f === date) break;
      }
      return sum;
    },
    // 后期累计（不包含当前周期）
    futurePeriodAdd: (code, date) => {
      let sum = 0;
      for (let i = dateFields.length - 1; i >= 0; i--) {
        const f = dateFields[i];
        if (f === date) break;
        sum += +(getData(code, f!) || 0);
      }
      return sum;
    },
    // 上期数据
    prev: (code, date) => {
      const idx = dateFields.indexOf(date);
      return idx > 0 ? +(getData(code, dateFields[idx - 1]!) || 0) : 0;
    },
    // 所有周期数据的和
    total: (code) =>
      dateFields.reduce((sum, f) => sum + +(getData(code, f) || 0), 0),
    // 一年数据的和
    totalYear: (code, date) =>
      timeType === 'year'
        ? +(getData(code, date) || 0)
        : dateFields.reduce(
            (sum, f) =>
              f.startsWith(date.slice(0, 4))
                ? sum + +(getData(code, f) || 0)
                : sum,
            0,
          ),
  };

  // 日志
  const log = {
    notInFormula: new Set<string>(),
    calcData: <any>[],
    illegalData: <any>[],
  };

  let isDebug = false;

  // 解析公式
  const assignExpression = (str: string) => {
    const [metricCode, date] = str.split('-', 2) as [string, string];
    if (!metricCode) return;

    if (metricCode === 'C10001A0433' && date === '2027') {
      // "(${C10001A0433200000}+${C10001A0433200001}+${C10001A0433200002}+${C10001A0433200003}+${C10001A0433200004}+${C10001A0433200005}+${C10001A0433200006}+${C10001A0433200007}+${C10001A0433200008}+${C10001A0433200009}+${C10001A0433200010}+${C10001A0433200011}+${C10001A0433200012}+${C10001A0433200013}+${C10001A0433200014}+${C10001A0433200015}+${C10001A0433200016}+${C10001A0433200017}+${C10001A0433200018}+${C10001A0433200019})-MAX(${C10001A0391}-${C10001A0389},0)"
      isDebug = true;
    }

    const expression = getFormula(metricCode);
    if (!expression) return log.notInFormula.add(metricCode);

    const matches = expression.match(VARIABLE_REGEX); // 生成单元格依赖时已确保 matches 一定存在
    const values: Record<string, any> = {};
    for (const match of matches!) {
      const content = match.slice(2, -1);
      if (content in globalHandlers) {
        values[match] =
          typeof globalHandlers[content] === 'function'
            ? globalHandlers[content](date)
            : globalHandlers[content];
      } else if (content.includes('-')) {
        const [prefix, code] = content.split('-') as [string, string];
        values[match] = expressionHandlers[prefix]?.(code, date);
      } else {
        values[match] = getData(content, date) || 0;
      }
    }

    // 替换指标编码为对应值，并处理连续负号
    const newExpr = expression
      .replaceAll(VARIABLE_REGEX, (m) => values[m] ?? m)
      .replaceAll('--', '+');

    if (isDebug) {
      console.warn(
        '[debug] metricCode',
        metricCode,
        'date',
        date,
        'newExpr',
        newExpr,
      );
    }

    // 处理计算结果
    let result = core.executeFunction(newExpr, isDebug);
    if (isDebug) {
      console.warn('[debug] result', result);
    }
    const resultType = typeof result;
    switch (resultType) {
      case 'boolean': {
        // 布尔值返回 'TRUE'、'FALSE'
        result = result ? 'TRUE' : 'FALSE';
        break;
      }
      case 'number': {
        // 非有限值（Infinity、-Infinity或 NaN）返回 'NaN'
        result = Number.isFinite(result) ? result : 'NaN';
        break;
      }
      case 'string': {
        // 字符串直接返回
        if (result === '#ERROR') {
          log.illegalData.push({ cell: str, expression, newExpr, result });
        }
        break;
      }
      default: {
        log.illegalData.push({ cell: str, expression, newExpr, result });
      }
    }
    // 更新数据池
    updateData(metricCode, date, result);
    log.calcData.push({ cell: str, expression, newExpr, result });
  };

  // 执行计算
  console.time('计算耗时');
  graph.forEach((item) => assignExpression(item));
  checkAnimationData(); // 计算完成后批量检查动画库
  console.timeEnd('计算耗时');

  console.log('计算日志', log);

  if (isDev) {
    (window as any).myLog = log;
    (window as any).formula = (id: any) => {
      const calc_data = window.myLog?.calcData || [];
      return calc_data.find((item) => item.cell === id);
    };
  }
}
