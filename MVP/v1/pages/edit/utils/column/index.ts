import { fixedColumns } from './fixed';

/**
 * 生成季度时间段（YYYY-Q1格式）
 * @param {number} startYear - 开始年份
 * @param {number} startMonth - 开始月份 (1-12)
 * @param {number} endYear - 结束年份
 * @param {number} endMonth - 结束月份 (1-12)
 * @returns {string[]} 季度数组，如 ["2023-Q1", "2023-Q2"] => [{2023:[1,2]}...]
 */
const generateQuarterRange = (
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
): any => {
  // 验证输入
  if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
    throw new Error('结束日期不能早于开始日期');
  }

  // 计算开始季度和结束季度
  const startQuarter = Math.ceil(startMonth / 3);
  const endQuarter = Math.ceil(endMonth / 3);

  const quarters = []; // 扁平结构 ["2023-1", "2023-2"]
  const quartersTree = []; // 树形结构 [{2023:[1,2]}...]

  for (let year = startYear; year <= endYear; year++) {
    // 确定当前年份的季度范围
    const qStart = year === startYear ? startQuarter : 1;
    const qEnd = year === endYear ? endQuarter : 4;

    const children = [];
    for (let quarter = qStart; quarter <= qEnd; quarter++) {
      quarters.push(`${year}-${quarter}`);
      children.push(quarter);
    }
    quartersTree.push({ year, children });
  }

  return { quarters, quartersTree };
};

// 初始化完整模型列
export function initColumns({ forecastTimeRange, forecastTimeType }: any) {
  let yearColumns = <any>[]; // 年度列配置
  let dateFields = <string[]>[]; // 日期Fields
  let quarterColumns = <any>[]; // 季度列配置

  const range = forecastTimeRange.split(',');
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const [startYearStr, startMonthStr] = range[0]!.split('-');
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const [endYearStr, endMonthStr] = range[1]!.split('-');
  const startYear = Number(startYearStr);
  const startMonth = Number(startMonthStr);
  const endYear = Number(endYearStr);
  const endMonth = Number(endMonthStr);

  // 年度列（年类型和季度类型都会用到年度列配置）
  const yearFields = Array.from(
    { length: endYear - startYear + 1 },
    (_, index) => (startYear + index).toString(),
  );
  const yearUnfixedColumns = yearFields.map((field) => {
    return {
      title: field,
      field,
      editRender: { autofocus: '.el-input__inner', enabled: true },
      minWidth: 95,
      align: 'right',
      slots: { default: 'default', edit: 'edit', header: 'header' },
    };
  });
  if (forecastTimeType === 'year') {
    dateFields = yearFields; // 日期Fields
    yearColumns = [...fixedColumns, ...yearUnfixedColumns]; // 年度列配置
  } else if (forecastTimeType === 'quarter') {
    // 季
    const { quarters, quartersTree } = generateQuarterRange(
      startYear,
      startMonth,
      endYear,
      endMonth,
    );
    const quarterUnfixedColumns = quartersTree.map((item: any) => {
      const children = item.children.map((n: number) => {
        return {
          title: `Q${n}`,
          field: `${item.year}-${n}`,
          editRender: { autofocus: '.el-input__inner', enabled: true },
          minWidth: 95,
          align: 'right',
          slots: { default: 'default', edit: 'edit', header: 'header' },
        };
      });

      return {
        title: item.year,
        children,
      };
    });

    yearColumns = [...fixedColumns, ...yearUnfixedColumns]; // 年度列配置
    dateFields = quarters; // 日期Fields
    quarterColumns = [...fixedColumns, ...quarterUnfixedColumns]; // 季度列配置
  }

  // 预设值
  const presets = <any>{};
  dateFields.forEach((item) => {
    // console.log(item);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);
    // console.log(currentYear, currentMonth, currentQuarter);
    const [year, quarter] = item.split('-');
    if (quarter) {
      // console.log(
      //   Number(year + quarter),
      //   Number(currentYear.toString() + currentQuarter.toString()),
      // );
      presets[item] =
        Number(year + quarter) >
        Number(currentYear.toString() + currentQuarter.toString())
          ? 'F'
          : 'A';
    } else {
      presets[item] = Number(item) > currentYear ? 'F' : 'A';
    }
  });

  return {
    yearColumns, // 年度列配置
    dateFields, // 日期Fields
    quarterColumns, // 季度列配置
    presets,
  };
}

export * from './fixed';
