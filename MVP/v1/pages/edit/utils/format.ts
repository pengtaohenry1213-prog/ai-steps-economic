/* eslint-disable unicorn/no-anonymous-default-export */
import { absCodes } from '../constants/special';

const reg = /^\d{4}(?:-[1-4])?$/;
const empty = new Set([' ', '0', 'NaN', 'null', 'undefined', '空']); // 可能的空值集合
const isEmpty = (value: any) => {
  if (!value) return true; // false, 0, "", null, undefined, NaN
  return empty.has(value);
};
// 千分位 + 四舍五入保留一位小数(整数补0)
const formatNumber = (n: number) =>
  n.toLocaleString('zh-CN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
// 尝试转换为数字，如果不能转换为数字 返回原字符串
const parseValue = (value: number | string) => {
  // 如果已经是数字，直接返回
  if (typeof value === 'number') return value;
  // 如果是字符串，尝试转换为数字
  if (typeof value === 'string') {
    const num = Number(value);
    // 检查转换后是否为有效数字
    if (!Number.isNaN(num)) return num;
  }
  // 如果不是数字或可转换的字符串，返回value
  return value;
};

// 格式化计算标签
export default function (row: any, field: string, oldValue?: number | string) {
  const { isFixed, metricCode, unitCode, scale } = row;
  const scaleNum = Number(row.scale);

  // 单一值行只显示单一值，对应数据单元格显示为空
  if (isFixed === 0 && reg.test(field)) return '';

  // 待处理值（如果传入了动画池旧值，处理旧值）
  let val = oldValue || row[field];

  // 空值不显示
  if (isEmpty(val)) return '';

  // 尝试转换为数字，如果不能转换为数字 返回原字符串
  val = parseValue(val);

  // 字符串直接返回，确保后续处理的值是有效的数字
  if (typeof val === 'string') return val;

  // 显示为绝对值的指标
  if (absCodes.has(metricCode)) val = Math.abs(val);

  // 百分比
  if (unitCode === 'PERCENT') return `${formatNumber(val * 100)}%`;

  // 格式化刻度
  if (!Number.isNaN(scaleNum) && scaleNum !== 0)
    return formatNumber(val / scale);

  // 剩余情况
  return formatNumber(val);
}
