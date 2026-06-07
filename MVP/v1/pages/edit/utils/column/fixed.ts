/**
 * 完整模型的固定列
 */
export const fixedColumns = [
  {
    title: '编码（导入需携带）',
    field: 'metricCode',
    fixed: 'left',
    visible: false,
  },
  {
    title: '类别（导入需携带）',
    field: 'metricCategory',
    fixed: 'left',
    visible: false,
  },
  {
    title: '是否单一值',
    field: 'isFixed',
    fixed: 'left',
    visible: false,
  },
  {
    title: '单位编码',
    field: 'unitCode',
    fixed: 'left',
    visible: false,
  },
  {
    title: '刻度',
    field: 'scale',
    fixed: 'left',
    visible: false,
  },
  {
    title: '序号',
    field: 'sort',
    width: 50,
    fixed: 'left',
    align: 'center',
    className: 'mini-cell',
  },
  {
    title: '科目名称',
    field: 'metricName',
    width: 280,
    treeNode: true,
    align: 'left',
    fixed: 'left',
  },
  {
    title: '单位',
    field: 'unit',
    editRender: { autofocus: '.el-input__inner', enabled: true },
    slots: {
      edit: 'unitEdit',
    },
    width: 70,
    align: 'center',
    fixed: 'left',
    className: 'mini-cell',
  },
  {
    title: '单一值',
    field: 'isFixeds',
    editType: 'input',
    fixed: 'left',
    editRender: { autofocus: '.el-input__inner', enabled: true },
    align: 'right',
    slots: {
      default: 'default',
      edit: 'edit',
    },
    width: 80,
  },
];

// 速算模型列
export const quickColumns = [
  ...fixedColumns.slice(0, -1),
  {
    title: '固定数值',
    field: '',
    editRender: { autofocus: '.el-input__inner', enabled: true },
    width: 150,
    align: 'left',
    slots: { default: 'default', edit: 'edit' },
  },
];

// 查询列索引，用于导入和比对方法
export const getColumnIndex = (field: string) => {
  return fixedColumns.findIndex((item) => item.field === field);
};

/**
 * [
  '编码（导入需携带）: 1 | A',
  '类别（导入需携带）: 2 | B',
  '是否单一值: 3 | C',
  '单位编码: 4 | D',
  '刻度: 5 | E',
  '序号: 6 | F',
  '科目名称: 7 | G',
  '单位: 8 | H',
  '单一值: 9 | I'
]
 */
