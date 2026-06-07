/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import detectCycles from './cycle';

interface VersionInfo {
  dateFields: string[];
  forecastTimeType: 'month' | 'quarter' | 'year';
}
interface Formula {
  [code: string]: string;
}
interface DependencyGraph {
  [codeDate: string]: string[];
}

// 缓存正则表达式
const VARIABLE_REGEX = /\$\{([^${}]+)\}/g;
// 全局变量，不产生依赖关系
const unrelatedVariables = new Set([
  'global-arrayAllDate',
  'global-arrayAllPeriod',
  'global-investmentType',
  'global-periodMonths',
  'global-periodNumber',
  'global-targetIndustry',
  'var-everyPeriod',
]);

// 验证表达式格式
const isValidExpression = (expression: string, matches: string[]): boolean => {
  const counts = new Set([
    (expression.match(/\$/g) || []).length,
    (expression.match(/\{/g) || []).length,
    (expression.match(/\}/g) || []).length,
    matches.length,
  ]);
  return matches.length > 0 && counts.size === 1;
};

// 预定义的特殊表达式处理器
const expressionHandlers: { [key: string]: Function } = {
  // 年的最后一期（如季度中取当前年的最后一个季度）
  lastPeriod: (suffix: string, date: string, context: any) => {
    const { timeType, yearToDatesMap } = context;
    if (timeType === 'year') return [`${suffix}-${date}`];
    const lastDate = yearToDatesMap.get(date.slice(0, 4)).at(-1);
    return lastDate ? [`${suffix}-${lastDate}`] : [];
  },
  // 所有日期
  arrayAllValue: (suffix: string, _date: string, context: any) =>
    context.dateFields.map((field: string) => `${suffix}-${field}`),
  // 所有日期
  total: (suffix: string, _date: string, context: any) =>
    context.dateFields.map((field: string) => `${suffix}-${field}`),
  // 往期（不包含当前周期）
  prevPeriodAdd: (suffix: string, date: string, context: any) => {
    const { dateFields, dateIndexMap } = context;
    const index = dateIndexMap.get(date);
    return dateFields
      .slice(0, index)
      .map((field: string) => `${suffix}-${field}`);
  },
  // 周期（包含当前周期）
  periodAdd: (suffix: string, date: string, context: any) => {
    const { dateFields, dateIndexMap } = context;
    const index = dateIndexMap.get(date);
    return dateFields
      .slice(0, index + 1)
      .map((field: string) => `${suffix}-${field}`);
  },
  // 后期（不包含当前周期）
  futurePeriodAdd: (suffix: string, date: string, context: any) => {
    const { dateFields, dateIndexMap } = context;
    const index = dateIndexMap.get(date);
    return dateFields
      .slice(index + 1)
      .map((field: string) => `${suffix}-${field}`);
  },
  // 上期（第一期没有对应的上一期）
  prev: (suffix: string, date: string, context: any) => {
    const { dateFields, dateIndexMap } = context;
    const index = dateIndexMap.get(date);
    return index > 0 ? [`${suffix}-${dateFields[index - 1]}`] : [];
  },
  // 一年
  totalYear: (suffix: string, date: string, context: any) => {
    const { timeType, yearToDatesMap } = context;
    if (timeType === 'year') return [`${suffix}-${date}`];
    return (
      yearToDatesMap
        .get(date.slice(0, 4))
        .map((field: string) => `${suffix}-${field}`) || []
    );
  },
};

// 检测是否有指标错漏
const checkDependency = (
  formula: Formula,
  dependencies: DependencyGraph,
  dateFields: string[],
) => {
  // 校验关系图key
  const keys1 = new Set(Object.keys(formula));
  const keys2 = new Set(
    Object.keys(dependencies).map((item) => item.split('-')[0]),
  );
  const onlyInObj1 = [...keys1].filter((key) => !keys2.has(key));
  const onlyInObj2 = [...keys2].filter((key) => !keys1.has(key));
  console.log({ onlyInObj1, onlyInObj2 });
  // 校验关系图日期列
  const codeToDatesMap = new Map();
  Object.keys(dependencies).forEach((key) => {
    const code = key.split('-')[0];
    const date = key.split('-')[1];
    if (!codeToDatesMap.has(code)) {
      codeToDatesMap.set(code, []);
    }
    codeToDatesMap.get(code)!.push(date);
  });
  for (const [key, value] of codeToDatesMap) {
    if (JSON.stringify(value) === JSON.stringify(dateFields))
      codeToDatesMap.delete(key);
  }
  console.log(codeToDatesMap);
  console.log(
    onlyInObj1.length === 0 &&
      onlyInObj2.length === 0 &&
      codeToDatesMap.size === 0
      ? 'dependencies校验通过'
      : 'dependencies校验不通过',
  );
};

/**
 * 生成正向引用关系（我依赖谁）
 */
export default function generateDependencyGraph(
  instance: VersionInfo,
  formula: Formula,
): DependencyGraph {
  console.group('生成关系图');
  console.time('生成关系图耗时');

  const { dateFields, forecastTimeType: timeType } = instance;
  const result: DependencyGraph = {}; // 储存单元格依赖关系，当前集合是 key 依赖 value[]（ value[] -> key）

  // 一次性预处理所有缓存数据
  const dateIndexMap = new Map(dateFields.map((date, i) => [date, i]));
  const yearToDatesMap = new Map<string, string[]>();
  dateFields.forEach((date) => {
    const year = date.slice(0, 4);
    if (!yearToDatesMap.has(year)) {
      yearToDatesMap.set(year, []);
    }
    yearToDatesMap.get(year)!.push(date);
  });
  const context = { timeType, dateFields, dateIndexMap, yearToDatesMap };

  // 遍历表达式
  for (const [code, expression] of Object.entries(formula)) {
    // 一次性提取所有变量并验证
    const matches = expression.match(VARIABLE_REGEX) || [];
    if (!isValidExpression(expression, matches)) {
      throw new Error(`指标 ${code} 的表达式为空或无效`);
      continue;
    }
    // 预解析所有变量
    const variables = matches.map((match) => match.slice(2, -1));
    const uniqueVariables = [...new Set(variables)];
    // 遍历日期
    for (const [_, date] of dateFields.entries()) {
      const dependencies: string[] = [];
      // 批量处理变量
      for (const variable of uniqueVariables) {
        // 全局变量，不产生依赖关系
        if (unrelatedVariables.has(variable)) continue;

        if (variable.includes('-')) {
          const [prefix, suffix] = variable.split('-');
          // 使用预定义处理器
          const handler = expressionHandlers[prefix!];
          if (handler) {
            const deps = handler(suffix, date, context);
            dependencies.push(...deps);
          } else {
            throw new Error(`未匹配到特殊表达式: ${prefix}`);
          }
        } else {
          // 普通指标
          dependencies.push(`${variable}-${date}`);
        }
      }
      result[`${code}-${date}`] = [...new Set(dependencies)];
    }
  }
  console.log('value[] -> key', result);

  // 检测是否有指标错漏
  checkDependency(formula, result, dateFields);

  // 生成dag（value依赖key: key -> value[]）
  const dag: { [codeDate: string]: string[] } = {};
  Object.entries(result).forEach(([node, deps]) => {
    if (!dag[node]) dag[node] = [];
    deps.forEach((dep) => {
      if (!dag[dep]) dag[dep] = [];
      if (!dag[dep].includes(node)) {
        dag[dep].push(node);
      }
    });
  });
  console.log('key -> value[]', dag);

  // 检测环
  const cycles = detectCycles(dag);
  console.log('第一次检测环', cycles);
  let cleanDAG: Record<string, string[]> = {}; // 无环 DAG
  if (cycles.length > 0) {
    // 取出环节点和环指标
    const cycleNodes = new Set<string>();
    const cycleCodes = new Set<string>();
    cycles.flat().forEach((node) => {
      cycleNodes.add(node);
      cycleCodes.add(node.split('-')[0]!);
    });
    console.log('cycleNodes', cycleNodes);
    console.log('cycleCodes', cycleCodes);

    // 移除环节点，构建无环 DAG
    Object.entries(dag).forEach(([node, deps]) => {
      if (!cycleNodes.has(node)) {
        cleanDAG[node] = deps.filter((dep) => !cycleNodes.has(dep));
      }
    });
    console.log('cleanDAG', cleanDAG);
    // 再次检测环
    console.log('第二次检测环', detectCycles(cleanDAG));
  } else {
    cleanDAG = dag;
  }

  console.timeEnd('生成关系图耗时');
  console.groupEnd();
  return cleanDAG;
}
