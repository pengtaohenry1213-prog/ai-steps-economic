/**
 * format.ts - v1 格式化工具适配到 v2
 *
 * 来源: MVT/v1/pages/edit/utils/format.ts
 */

// 常量 (来自 v1 constants/special.ts)
const absCodes = new Set<string>()

const reg = /^\d{4}(?:-[1-4])?$/
const empty = new Set([' ', '0', 'NaN', 'null', 'undefined', '空'])

function isEmpty(value: any): boolean {
  if (!value) return true // false, 0, "", null, undefined, NaN
  return empty.has(value)
}

// 千分位 + 四舍五入保留一位小数(整数补0)
function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

// 尝试转换为数字，如果不能转换为数字 返回原字符串
function parseValue(value: number | string): number | string {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const num = Number(value)
    if (!Number.isNaN(num)) return num
  }
  return value
}

// 格式化计算标签
export default function format(row: any, field: string, oldValue?: number | string): string {
  const { isFixed, metricCode, unitCode, scale } = row
  const scaleNum = Number(row.scale)

  // 单一值行只显示单一值，对应数据单元格显示为空
  if (isFixed === 0 && reg.test(field)) return ''

  // 待处理值（如果传入了动画池旧值，处理旧值）
  let val = oldValue || row[field]

  // 空值不显示
  if (isEmpty(val)) return ''

  // 尝试转换为数字，如果不能转换为数字 返回原字符串
  val = parseValue(val)

  // 字符串直接返回
  if (typeof val === 'string') return val

  // 显示为绝对值的指标
  if (absCodes.has(metricCode)) val = Math.abs(val)

  // 百分比
  if (unitCode === 'PERCENT') return `${formatNumber(val * 100)}%`

  // 格式化刻度
  if (!Number.isNaN(scaleNum) && scaleNum !== 0) {
    return formatNumber(val / scale)
  }

  // 剩余情况
  return formatNumber(val)
}