/**
 * column.ts - v1 列配置工具适配到 v2
 *
 * 来源: MVT/v1/pages/edit/utils/column/index.ts
 * 功能: 生成时间段列配置 (年度/季度/月度)
 */

// 固定列配置
export const fixedColumns = [
  {
    title: '指标编码',
    field: 'metricCode',
    width: 180,
    fixed: 'left',
    slots: { default: 'metricCode_default' },
  },
  {
    title: '指标名称',
    field: 'metricName',
    width: 200,
    fixed: 'left',
    treeNode: true,
    slots: { default: 'metricName_default' },
  },
  {
    title: '单位',
    field: 'unitCode',
    width: 80,
    slots: { default: 'unit_default', edit: 'unit_edit' },
  },
  {
    title: '是否合计',
    field: 'isTotal',
    width: 80,
    slots: { default: 'isTotal_default' },
  },
]

/**
 * 生成季度时间段（YYYY-Q1格式）
 */
function generateQuarterRange(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
): { quarters: string[]; quartersTree: { year: number; children: number[] }[] } {
  if (startYear > endYear || (startYear === endYear && startMonth > endMonth)) {
    throw new Error('结束日期不能早于开始日期')
  }

  const startQuarter = Math.ceil(startMonth / 3)
  const endQuarter = Math.ceil(endMonth / 3)

  const quarters: string[] = []
  const quartersTree: { year: number; children: number[] }[] = []

  for (let year = startYear; year <= endYear; year++) {
    const qStart = year === startYear ? startQuarter : 1
    const qEnd = year === endYear ? endQuarter : 4

    const children: number[] = []
    for (let quarter = qStart; quarter <= qEnd; quarter++) {
      quarters.push(`${year}-${quarter}`)
      children.push(quarter)
    }
    quartersTree.push({ year, children })
  }

  return { quarters, quartersTree }
}

/**
 * 初始化完整模型列
 */
export function initColumns({ forecastTimeRange, forecastTimeType }: any) {
  let yearColumns: any[] = []
  let dateFields: string[] = []
  let quarterColumns: any[] = []

  const range = forecastTimeRange.split(',')
  const [startYearStr, startMonthStr] = range[0]!.split('-')
  const [endYearStr, endMonthStr] = range[1]!.split('-')
  const startYear = Number(startYearStr)
  const startMonth = Number(startMonthStr)
  const endYear = Number(endYearStr)
  const endMonth = Number(endMonthStr)

  // 年度列
  const yearFields = Array.from(
    { length: endYear - startYear + 1 },
    (_, index) => (startYear + index).toString(),
  )

  const yearUnfixedColumns = yearFields.map((field) => ({
    title: field,
    field,
    editRender: { autofocus: '.el-input__inner', enabled: true },
    minWidth: 95,
    align: 'right' as const,
    slots: { default: 'default', edit: 'edit', header: 'header' },
  }))

  if (forecastTimeType === 'year') {
    dateFields = yearFields
    yearColumns = [...fixedColumns, ...yearUnfixedColumns]
  } else if (forecastTimeType === 'quarter') {
    const { quarters, quartersTree } = generateQuarterRange(
      startYear,
      startMonth,
      endYear,
      endMonth,
    )

    const quarterUnfixedColumns = quartersTree.map((item) => {
      const children = item.children.map((n) => ({
        title: `Q${n}`,
        field: `${item.year}-${n}`,
        editRender: { autofocus: '.el-input__inner', enabled: true },
        minWidth: 95,
        align: 'right' as const,
        slots: { default: 'default', edit: 'edit', header: 'header' },
      }))

      return {
        title: item.year,
        children,
      }
    })

    yearColumns = [...fixedColumns, ...yearUnfixedColumns]
    dateFields = quarters
    quarterColumns = [...fixedColumns, ...quarterUnfixedColumns]
  }

  // 预设值
  const presets: Record<string, string> = {}
  dateFields.forEach((item) => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    const currentQuarter = Math.ceil(currentMonth / 3)
    const [year, quarter] = item.split('-')
    if (quarter) {
      presets[item] =
        Number(year + quarter) >
        Number(currentYear.toString() + currentQuarter.toString())
          ? 'F'
          : 'A'
    } else {
      presets[item] = Number(item) > currentYear ? 'F' : 'A'
    }
  })

  return {
    yearColumns,
    dateFields,
    quarterColumns,
    presets,
  }
}