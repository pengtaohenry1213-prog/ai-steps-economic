/* eslint-disable unicorn/no-anonymous-default-export */
/* eslint-disable no-fallthrough */

/**
 * 生成反向引用关系（谁依赖我）
 */
const generateReverseRelation = (graph: any) => {
  const reverseDeps: any = {};

  // 初始化所有节点的反向依赖集合
  Object.keys(graph).forEach((node) => {
    reverseDeps[node] = new Set(); // 使用 Set 自动去重
  });

  // 构建反向依赖关系
  Object.entries(graph).forEach(([node, dependencies]: any) => {
    dependencies.forEach((dep: string) => {
      // 如果依赖项不在图中，先初始化
      if (!reverseDeps[dep]) {
        reverseDeps[dep] = new Set();
      }
      // 添加到反向依赖集合（Set 会自动去重）
      reverseDeps[dep].add(node);
    });
  });

  // 将 Set 转换为数组返回
  const result: any = {};
  Object.keys(reverseDeps).forEach((node) => {
    result[node] = [...reverseDeps[node]];
  });

  // console.log('反向关系图', JSON.stringify(result));
  return result;
};

/**
 * 生成正向引用关系（我依赖谁）
 * @param instance 版本信息 {dateFields: 日期Fields, timeType: 年度/季度}
 * @param formula 公式集 {{code: expression}, ...}
 * @returns 关系图 {{code-date: [code-date, ...]}, ...}
 */
export default function (instance: any, formula: any) {
  console.time('生成关系图耗时');
  const { dateFields, timeType } = instance;
  const result: any = {};
  Object.keys(formula).forEach((code: string) => {
    const expression = formula[code];
    let isExclude = false;
    // console.warn('code =', code, ', expression =', expression);
    const excludeIds = ['C10001A0400']; // , 'C10001A0040'
    if (
      !isExclude &&
      expression.includes('SUMIF') &&
      excludeIds.includes(code)
    ) {
      // continue forEach loop
      isExclude = true;
    }

    dateFields.forEach((date: string, index: number) => {
      const match = expression?.match(/\$\{([^${}]+)\}/g) || []; // 取出所有${content}格式字符串，并确保content中没有$、{、 }
      const dollarCount = (expression.match(/\$/g) || []).length;
      const leftBraceCount = (expression.match(/\{/g) || []).length;
      const rightBraceCount = (expression.match(/\{/g) || []).length;
      const countSet = new Set([
        dollarCount,
        leftBraceCount,
        match.length,
        rightBraceCount,
      ]);
      if (match.length === 0 || countSet.size !== 1) {
        console.error('表达式格式错误', expression);
        return;
      }

      let set = new Set();
      match.forEach((item: string) => {
        const content = item.replaceAll(/[${}]/g, ''); // 取出${content}格式中的content
        let codeDateStr = '';
        if (content.includes('-')) {
          // 特殊表达式
          switch (content) {
            // String[] 日期数组（如年度的2025~2044即['2025','2026'...'2044']）
            case 'global-arrayAllDate':
            // Number[] 期数数组（如年度的2025~2044即[1,2...20]）
            case 'global-arrayAllPeriod':
            // String 投资类型（新建）
            case 'global-investmentType':
            // Number 每期月数（年:12, 季:3, 月:1）
            case 'global-periodMonths':
            // Number 所有期数（如年度的2025~2044即20期）
            case 'global-periodNumber':
            // String 目标行业（如农粮、食品）
            case 'global-targetIndustry':
            // Number 当前期数（第几期 从1开始，如2026是年度2025~2044的第2期）
            case 'var-everyPeriod': {
              break;
            }
            // prefix-code 格式
            default: {
              const [prefix, code] = content.split('-');
              if (!code) {
                console.error(`表达式${item}格式错误`);
                return;
              }
              switch (prefix) {
                // Number 年度的最后一期值（如季度中取当前年的最后一个季度的值）
                case 'lastPeriod': {
                  if (timeType === 'year') {
                    codeDateStr = `${code}-${date}`;
                  } else {
                    const lastField = dateFields.findLast(
                      (field: string) => field.slice(0, 4) === date.slice(0, 4),
                    );
                    codeDateStr = `${code}-${lastField}`;
                  }
                  break;
                }
                // Number[] 所有日期的值的数组
                case 'arrayAllValue': {
                  if (isExclude) {
                    codeDateStr = `${code}-${date}`;
                  } else {
                    dateFields.forEach((field: string) => {
                      codeDateStr += `${code}-${field},`;
                    });
                  }
                  break;
                }
                // Number 往期累计（当期之前的所有期间发生数的累计值，不包括当前周期）
                case 'prevPeriodAdd': {
                  for (const field of dateFields) {
                    if (field === date) break; // 停止遍历
                    codeDateStr += `${code}-${field},`;
                  }
                  break;
                }
                // Number 周期累计（当期之前的所有期间发生数的累计值，包括当前周期）
                case 'periodAdd': {
                  for (const field of dateFields) {
                    codeDateStr += `${code}-${field},`;
                    if (field === date) break; // 停止遍历
                  }
                  break;
                }
                // Number 后期累计（当期之后的所有期间发生数的累计值，不包括当前周期）
                case 'futurePeriodAdd': {
                  const reversedFields = [...dateFields].reverse();
                  for (const field of reversedFields) {
                    if (field === date) break; // 停止遍历
                    codeDateStr += `${code}-${field},`;
                  }
                  break;
                }
                // Number 上期数据（取对应_LP标记值，第一期没有对应的上一期）
                case 'prev': {
                  if (index > 0) {
                    const prevDate = dateFields[index - 1];
                    codeDateStr = `${code}-${prevDate}`;
                  }
                  break;
                }
                // Number 所有日期数据总和
                case 'total': {
                  dateFields.forEach((field: string) => {
                    codeDateStr += `${code}-${field},`;
                  });
                  break;
                }
                // 一年数据总和
                case 'totalYear': {
                  if (timeType === 'year') {
                    codeDateStr = `${code}-${date}`;
                  } else {
                    dateFields.forEach((field: string) => {
                      if (field.slice(0, 4) === date.slice(0, 4)) {
                        codeDateStr += `${code}-${field},`;
                      }
                    });
                  }
                  break;
                }
                default: {
                  console.error(`未匹配到特殊表达式${item}`);
                }
              }
            }
          }
        } else {
          // 普通指标
          codeDateStr = `${content}-${date}`;
        }

        if (codeDateStr !== '') {
          const codeDateArr = codeDateStr.replace(/,$/, '').split(',');
          set = new Set([...codeDateArr, ...set]);
        }
      });
      // 第一期没有对应的上一期;
      // if (code.endsWith('_LP') && index === 0) return;

      result[`${code}-${date}`] = [...set];
    });
  });

  console.log(
    'generateRelation(instance, formula) -> result.length =',
    Object.keys(result).length,
  );
  console.log('Object.keys(graph) =', Object.keys(result));

  // console.log('正向关系图', JSON.stringify(result));
  generateReverseRelation(result);

  // console.log('正向关系图', JSON.stringify(result));
  console.timeEnd('生成关系图耗时');
  return result;
}
