import { reactive } from 'vue';

import { checkCodes, italicCodes } from '../../constants/special';
import { getEditable } from '../../utils/util';
import { useAnimationData } from './useAnimationData';

const { hasAnimationData, highlight } = useAnimationData();

const cellClass = ({ row, column }: any) => {
  const { metricCode, metricCategory, isFixed, level } = row;
  const { field } = column;
  const classes = [];

  // 一级、二级标题 加粗
  if (field === 'metricName' && [0, 1].includes(level))
    classes.push('is--title');
  // 斜体字
  if (italicCodes.has(metricCode)) classes.push('is--italic');
  // 校验指标
  if (checkCodes.has(metricCode)) classes.push('is--check');
  // 动画
  if (hasAnimationData(`${metricCode}-${field}`)) classes.push('is--animate');
  // 负数
  if (Number(row[column.field]) < 0) classes.push('is--negative');
  // 编辑和不可编辑样式
  classes.push(
    getEditable({ metricCategory, isFixed, field })
      ? 'is--editable'
      : 'is--disabled',
  );
  // 高亮
  if (
    highlight.value.enabled &&
    (highlight.value.metricCode === metricCode ||
      highlight.value.field === field)
  ) {
    classes.push('is--highlight');
  }

  return classes.join(' ');
};

export function useGridOptions() {
  // 定义 gridOptions 的响应式对象
  const gridOptions = reactive({
    showOverflow: true, // 单元格超出显示省略号
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
    headerAlign: 'center', // 表头居中
    maxHeight: '100%',
    cellClassName: cellClass,
    editConfig: {
      trigger: 'click',
      mode: 'cell',
      showIcon: false,
      // autoClear: true, // 编辑完当前单元格后，自动清除其他单元格的编辑状态 需搭配 mode: 'cell'
      enabled: true,
      beforeEditMethod({ row, column }: any) {
        return getEditable({
          metricCategory: row.metricCategory,
          isFixed: row.isFixed,
          field: column.field,
        });
      },
      // events: {
      //   blur: ({ row }: any) => (row.isEditing = false),
      // },
    },
    menuConfig: {
      enabled: true,
      // 只在 metricName 列显示菜单
      visibleMethod({ column }: any) {
        return column.field === 'metricName';
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
      // children: 'children', // 使用children结构
      transform: true,
      expandAll: true, // 初始化时尝试展开所有
      reserve: true, // 刷新后保持展开/折叠状态
    },
  });

  return {
    gridOptions,
  };
}
