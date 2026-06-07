/**
 * util.ts - v1 通用工具函数适配到 v2
 *
 * 来源: MVT/v1/pages/edit/utils/util.ts
 */

// 下载 Blob
export function download(buffer: Blob, fileName: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.replace(/\./g, '_')
  a.click()
  URL.revokeObjectURL(url)
}

// 尝试转换数字或字符串为数字
export function parseString(val: number | string = ''): number | string {
  val = val.toString().trim()
  if (typeof val === 'string') {
    const num = Number.parseFloat(val)
    return Number.isNaN(num) ? val : num
  }
  return val
}

// 处理单元格编辑属性
export function getEditable({ metricCategory, isFixed, field }: any): boolean {
  const reg = /^(?:\d{4}|\d{4}-[1-4]|isFixeds)$/ // YYYY,YYYY-Q,isFixeds
  let editable = false

  // 填报行
  if (metricCategory === 0) {
    // isFixed 0 仅单一值可编辑
    if (isFixed === 0 && field === 'isFixeds') {
      editable = true
    }
    // isFixed 1 单一值和数据列都可编辑
    if (isFixed === 1 && reg.test(field)) {
      editable = true
    }
    // 单位可编辑
    if (field === 'unit') {
      editable = true
    }
  }
  // 计算行：仅可编辑单位
  if (metricCategory === 1 && field === 'unit') {
    editable = true
  }

  return editable
}