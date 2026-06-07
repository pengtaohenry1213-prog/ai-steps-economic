// 导入类型定义
import type { EditorTs } from '@vben/types';

// 编辑渲染配置
export const editRender = {
  autofocus: '.el-input__inner', // 自动聚焦到输入框
  enabled: true, // 启用编辑功能
};

// 不同模型类型对应的列字段配置
const columnSwitch: { [props: string]: string[] } = {
  完整模型: ['metricName', 'metricCode', 'unit', 'scale', 'value', 'isFixeds'], // 完整模型包含的列
  速算模型: ['metricName', 'metricCode', 'unit', 'scale', 'value'], // 速算模型包含的列
};

// 表格列模板配置
export const columnsTemplate: EditorTs.ColumnList = [
  {
    title: '科目名称', // 列标题
    field: 'metricName', // 字段名
    editType: '', // 编辑类型
    width: 280, // 列宽
    treeNode: true, // 是否显示为树节点
    align: 'left', // 对齐方式
    fixed: 'left', // 固定位置
  },
  {
    title: '编码（导入需携带）',
    field: 'metricCode',
    editType: '',
    width: 320,
    fixed: 'left',
    visible: false, // 默认隐藏
  },
  {
    title: '单位',
    field: 'unit',
    editRender, // Object 使用编辑渲染配置
    slots: {
      edit: 'unitEdit', // 编辑时的插槽
      default: 'unitDefault', // 默认显示的插槽
    },
    width: 90,
    align: 'center',
    fixed: 'left',
    // isEnabled: ['SIM'],
  },
  {
    title: '刻度',
    // field: 'unitValue',
    field: 'scale',
    // editRender,
    // slots: {
    //   edit: 'unitEdit',
    //   default: 'unitDefault',
    // },
    width: 90,
    align: 'center',
    fixed: 'left',
    isSubmit: true, // 标记为需要提交的字段
  },
  {
    title: '填充',
    field: 'isFixeds',
    editType: 'input', // 输入框类型
    fixed: 'left',
    editRender,
    align: 'right',
    slots: {
      // default: 'autofillDefault',
      edit: 'edit', // 编辑时的插槽
    },
    width: 80,
  },
  {
    title: '固定数值',
    field: 'value',
    editType: 'input',
    fixed: 'left',
    editRender,
    align: 'right',
    slots: {
      default: 'calcDefault', // 默认显示计算结果的插槽
      edit: 'edit',
    },
    columnType: 'calc', // 该列数据是否需要计算 标记为计算列
    isSubmit: true, // 标记为需要提交的字段
    width: 150,
  },
];

// 创建 列字段 到 列配置 的 映射
const columnMap: { [prop: string]: EditorTs.Column } = {};
columnsTemplate.forEach((column) => {
  columnMap[column.field] = column;
});

// 根据模型类型获取列配置
export const getColumnsTemp = (type: string = ''): EditorTs.ColumnList => {
  const columns: any = [];
  // 如果存在该类型的列配置
  if (columnSwitch[type]) {
    // 遍历该类型需要的列字段
    columnSwitch[type].forEach((field) => {
      // 如果列配置中存在该字段，则添加到结果中
      if (columnMap[field]) {
        columns.push(columnMap[field]);
      }
    });
  }
  return columns;

  // return structuredClone(columnsTemplate).filter((item) => {
  //   if (item.isEnabled) {
  //     return item.isEnabled[type];
  //   }
  //   return true;
  // });
};
