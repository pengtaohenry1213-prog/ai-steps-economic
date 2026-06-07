/**
 * useGridOptions hook - v1 表格配置适配到 v2
 *
 * 来源: MVT/v1/pages/edit/hooks/modules/useGridOptions.ts
 * 功能: vxe-grid 表格配置
 */

import { reactive } from 'vue'
import { useAnimationData } from './useData'

const { hasAnimationData, highlight } = useAnimationData()

// 常量 (来自 v1 constants/special.ts)
const checkCodes = new Set<string>()
const italicCodes = new Set<string>()

function getEditable({ metricCategory, isFixed, field }: any): boolean {
  // 根据 metricCategory 和 isFixed 判断是否可编辑
  if (isFixed) return false
  if (field === 'metricName') return false
  if (metricCategory === 'title') return false
  return true
}

const cellClass = ({ row, column }: any) => {
  const { metricCode, metricCategory, isFixed, level } = row
  const { field } = column
  const classes: string[] = []

  // 一级、二级标题 加粗
  if (field === 'metricName' && [0, 1].includes(level)) {
    classes.push('is--title')
  }
  // 斜体字
  if (italicCodes.has(metricCode)) classes.push('is--italic')
  // 校验指标
  if (checkCodes.has(metricCode)) classes.push('is--check')
  // 动画
  if (hasAnimationData(`${metricCode}-${field}`)) classes.push('is--animate')
  // 负数
  if (Number(row[column.field]) < 0) classes.push('is--negative')
  // 编辑和不可编辑样式
  classes.push(
    getEditable({ metricCategory, isFixed, field })
      ? 'is--editable'
      : 'is--disabled',
  )
  // 高亮
  if (
    highlight.value.enabled &&
    (highlight.value.metricCode === metricCode ||
      highlight.value.field === field)
  ) {
    classes.push('is--highlight')
  }

  return classes.join(' ')
}

export function useGridOptions() {
  const gridOptions = reactive({
    showOverflow: true,
    rowConfig: {
      isHover: true,
      isCurrent: true,
      height: 34,
      useKey: true,
    },
    columnConfig: {
      resizable: true,
    },
    border: true,
    headerAlign: 'center' as const,
    maxHeight: '100%',
    cellClassName: cellClass,
    editConfig: {
      trigger: 'click',
      mode: 'cell',
      showIcon: false,
      enabled: true,
      beforeEditMethod({ row, column }: any) {
        return getEditable({
          metricCategory: row.metricCategory,
          isFixed: row.isFixed,
          field: column.field,
        })
      },
    },
    menuConfig: {
      enabled: true,
      visibleMethod({ column }: any) {
        return column.field === 'metricName'
      },
      body: {
        disabled: false,
        options: [
          [
            { code: 'expand', name: '同级全部展开' },
            { code: 'collapse', name: '同级全部折叠' },
            { code: 'expandNext', name: '下级全部展开' },
            { code: 'collapseNext', name: '下级全部折叠' },
          ],
        ],
      },
    },
    scrollX: { enabled: true, gt: 30 },
    scrollY: { enabled: true, gt: 100 },
    treeConfig: {
      rowField: 'emmId',
      parentField: 'parentEmmId',
      transform: true,
      expandAll: true,
      reserve: true,
    },
  })

  return {
    gridOptions,
  }
}