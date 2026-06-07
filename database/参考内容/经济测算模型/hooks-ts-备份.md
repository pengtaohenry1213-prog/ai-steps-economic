import type { EditorTs } from '@vben/types';

import { reactive, ref, unref } from 'vue';

import { useCalculate } from './calculate';
import { getColumnsTemp } from './cons';
import { useLog } from './log';
import HotKey from './sortcut';
import UndoRedoManager from './undo-redo';
import { formatTimeColumn, isEmpty } from './utils';

interface DataTs {
  [props: string]: EditorTs.OriginIndicator;
}
interface IndicatorDataTs {
  [props: string]: EditorTs.IndicatorList;
}

// 全局配置管理
export const useGlobalConfig = () => {
  const config: any = reactive({
    calcMethod: true, // 客户端计算
    isImport: false,
    isExport: false,
    isUndo: false,
    isRedo: false,
    isLoad: false,
    startTime: '', // 起始时间
    endTime: '', // 结束时间
    timeType: '', // 统计时间类型（季度、月度、年度）
    periodMonths: 12, // 统计时间类型（3,1,12) 根据timeType确定
    periodNumber: 20, // 总期数根据 startTime-endTime 这里年减年、月减月 获得全部月数，在根据periodMonths计算periodNumber
    targetIndustry: '农粮', // 农粮、地产
    formulaPrefix: 'global-', // 公式中用到的外部变量
    calcRules: [
      {
        prefix: 'global-',
        description: '全局变量',
      },
      {
        prefix: 'total-',
        description: '范围变量,第二个参数是指标，第三个参数是all',
      },
    ],
  });

  const setGlobalConfig = (key: string, value: any) => {
    config[key] = value;
  };

  const getGlobalConfig = (key: string): any => {
    return config[key];
  };

  return {
    config,
    setGlobalConfig,
    getGlobalConfig,
  };
};

// 数据池
const useDataPool = () => {
  /*
    数据池的设计采用了分层结构：
      data 存储当前数据
      _data 存储原始数据（用于比较和撤销操作）
      通过 cloneData 函数在需要时进行数据克隆
      这种设计确保了数据的可追踪性和可恢复性，同时也支持了撤销/重做等操作。
  */
  const data = ref<DataTs>({}); // 当前数据
  const _data = ref<DataTs>({}); // 原始数据 初始状态数据

  const setAllData = (value: DataTs) => {
    for (const key in value) {
      if (value[key]) {
        data.value[key] = value[key];
      }
    }
  };

  const getAllData = () => {
    return data.value;
  };

  // 优点1: 数据隔离
  const setData = (key: string, value: any) => {
    data.value[key] = data.value[key]
      ? Object.assign(data.value[key], value)
      : value;
  };

  const getData = (key: string) => {
    return data.value[key];
  };

  // 数据克隆
  const cloneData = () => {
    // _data.value = JSON.parse(JSON.stringify(data.value));
    for (const key in data.value) {
      // eslint-disable-next-line unicorn/prefer-structured-clone
      _data.value[key] = JSON.parse(JSON.stringify(data.value[key]));
    }
  };

  // 数据比较: 是否与原始值相等
  const isEqualOriginData = (
    key: string,
    field: number | string,
    value: any,
  ) => {
    // 原始值空，新值不为空
    if (!_data.value[key]) {
      if (!isEmpty(value)) return false;
      return true;
    }
    // 原始值为空，新值为空
    if (isEmpty(_data.value[key][field]) && isEmpty(value)) return true;
    // 有原始值，
    return _data.value[key][field] === value;
  };
  // 是否与当前值相等
  const isEqualData = (key: string, field: number | string, value: any) => {
    // 原始值空，新值不为空
    if (!data.value[key]) {
      if (!isEmpty(value)) return false;
      return true;
    }
    // 原始值为空，新值为空
    if (isEmpty(data.value[key][field]) && isEmpty(value)) return true;
    // 有原始值，
    return data.value[key][field] === value;
  };

  return {
    _data: unref(_data),
    data: unref(data),
    setData,
    getData,
    setAllData,
    getAllData,
    cloneData,
    isEqualOriginData,
    isEqualData,
  };
};

// 关系池
const useRelationPool = () => {
  // 公式关系node
  // const node = {
  //   metricCode: '', // 指标标识
  //   formula: '', // 公式
  //   parent: [], // 父级指标
  //   child: [], // 子级指标
  // };
  const data = ref<{
    [props: string]: EditorTs.CustomFormula | EditorTs.Formula;
  }>({});

  const base = ref<{
    [props: string]: EditorTs.CustomFormula | EditorTs.Formula;
  }>({}); // 基础数据

  // 关系追踪
  const setData = (
    key: string,
    value: EditorTs.CustomFormula | EditorTs.Formula,
  ) => {
    data.value[key] = value;
  };

  const setBaseData = (
    key: string,
    value: EditorTs.CustomFormula | EditorTs.Formula,
  ) => {
    base.value[key] = value;
  };

  return {
    data: unref(data),
    base: unref(base),
    setData,
    setBaseData,
  };
};

// 页面数据池
const usePagePool = () => {
  const data = ref<IndicatorDataTs>({});
  const _data = ref<IndicatorDataTs>({});

  // 优点1: 数据组织
  const setData = (code: string, value: EditorTs.IndicatorList) => {
    data.value[code] = value;
  };

  // 优点2: 状态克隆
  const cloneData = () => {
    // eslint-disable-next-line unicorn/prefer-structured-clone
    _data.value = JSON.parse(JSON.stringify(data.value));
  };

  return {
    data: unref(data),
    setData,
    cloneData,
  };
};

// 变化数据池
const useChangePool = () => {
  const data = ref<{ [props: string]: any }>({});
  const isChanged = ref(false);

  // 优点1: 变化追踪
  const setData = (key: string, field: number | string, value: any) => {
    if (!data.value[key]) {
      data.value[key] = {};
    }
    data.value[key][field] = value;
  };

  // 优点2: 状态管理
  const setState = () => {
    const keys = Object.keys(data.value);
    isChanged.value = keys.length > 0;
  };

  // 优点3: 重置功能
  const setReset = () => {
    for (const key in data.value) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete data.value[key];
    }
    isChanged.value = false;
  };

  return {
    data: unref(data),
    isChanged,
    setData,
    setState,
    setReset,
  };
};

// 数据历史池
const useHistoryPool = (params: any) => {
  const { data, originData, dataChange, patchUpdateData } = params;
  const undoRedoManager = new UndoRedoManager(); // 操作历史数据管理器

  // 撤销 储存的是数据变化的所有数据快照，恢复时，先查询前一个快照状态，如果未存在则恢复为初始数据
  const undo = () => {
    const currentClip: any = undoRedoManager.undo(); // 当前撤回的数据快照
    if (!currentClip) return;
    const size = undoRedoManager.getUndoStackSize();
    let prevClip: any;
    if (size) {
      prevClip = undoRedoManager.getUndoStack(size - 1); // 当前撤回数据的上一个
    }

    currentClip.forEach((row: EditorTs.Indicator) => {
      const code = row.metricCode || '';
      const origin = originData[code] || {};
      const prev = size
        ? prevClip.find(
            (item: EditorTs.Indicator) => item.metricCode === row.metricCode,
          ) || origin
        : origin;

      for (const key in row) {
        patchUpdateData(row.metricCode, key, prev[key]);
      }
    });
  };
  // 重做
  const redo = () => {
    const reset: any = undoRedoManager.redo();
    if (reset) {
      // 恢复数据
      reset.forEach((row: any) => {
        for (const key in row) {
          patchUpdateData(row.metricCode, key, row[key]);
        }
      });
    }
  };
  // 历史记录
  const executeHistory = () => {
    const undoList: any = [];
    const codeGroup = Object.keys(dataChange);
    codeGroup.forEach((code: string) => {
      // eslint-disable-next-line unicorn/prefer-structured-clone
      undoList.push(JSON.parse(JSON.stringify(data[code])));
    });
    undoRedoManager.execute(undoList);
  };

  return {
    undo,
    redo,
    executeHistory,
  };
};

/*
  instance 的主要作用是提供模型的基本配置信息，用于初始化表格的列结构和相关配置。
  这些配置会影响表格的显示方式、数据组织方式以及提交行为。

  这是一个典型的依赖注入模式，通过传入 instance 对象，使得 useColumnsModel 和 useCalcEngine 可以
  访问到模型的基本配置信息，从而进行相应的初始化工作。
*/

// 初始化列配置
// 参数: instance, 在 useColumnsModel 中，instance 主要用于初始化列配置：
export const useColumnsModel = (instance: any) => {
  const isInit = ref(false);
  const analysisColumns: any = ref();
  const commonColumns: any = ref();
  const commonPresets: any = ref({});
  const submitColumns = new Set<number | string>();
  const dateFields = ref<string[]>(['value']);

  const formatColumn = (
    columns: EditorTs.ColumnList,
    fn: <T>(column: T) => T, // 在这里使用 fn 处理每一列
  ): EditorTs.ColumnList => {
    return columns.map((column: any, index: number) => {
      if (column.children) {
        column.children = formatColumn(column.children, fn);
      }
      // 为所有列添加双行表头结构
      const processedColumn = fn(column);

      // 如果没有 field，添加一个唯一的标识符
      if (!processedColumn.field) {
        processedColumn.field = `column_${index}`;
      }
      return processedColumn;
    });
  };

  /* 
    目的: 时间列能够正确显示和处理时间相关的数据; 每一列都有唯一的标识符; 列配置的格式统一且完整.
    处理: 处理时间列 和 非时间列
    使用: 在 formatColumn 函数中被调用, 用于处理表格的每一列配置, 确保时间列有正确的年份和季度信息, 确保非时间列有唯一的标识符.
  */
  const fn = (column: any) => {
    // 1. 处理时间相关的列（年份、季度等） 只处理年份相关的列
    if (
      typeof column.field === 'number' ||
      (typeof column.field === 'string' && column.field.includes('-'))
    ) {
      // 解析时间字段，如 "2025-4" -> year=2025, quarter=4
      const [year, quarter] = column.field.toString().split('-').map(Number);

      // 返回增强后的列配置，添加了 year 和 quarter 属性
      return Object.assign(column, {
        field: column.field, // 保持原字段名
        year, // 添加年份
        quarter, // 添加季度
      });
    }

    // 2. 处理非时间列 对于非时间列，使用 field 作为 field
    return Object.assign(column, {
      prop: column.fiexdField || `column_${column.name}`,
    });
  };

  const collectSubmitColumns = (columns: any) => {
    columns.forEach((item: any) => {
      if (item.isSubmit) {
        submitColumns.add(item.field);
      }
      if (item.children) {
        collectSubmitColumns(item.children);
      }
    });
  };

  /* 
    初始化表格的列配置
    这个函数的主要目的是：
      根据模型类型（完整模型/速算模型）初始化不同的列配置
      处理时间相关的列配置
      设置列的显示格式和属性
      准备数据提交所需的列配置

    在代码中的使用场景：
      在组件初始化时调用，确保表格有正确的列配置
      在获取列配置时，如果没有初始化过，会调用此函数
      在切换模型类型或时间范围时可能需要重新初始化列配置
      这个函数是整个表格编辑功能的基础，它确保了表格能够正确显示和处理不同类型的数据。
  */
  const initColumns = () => {
    // 只有当 isInit 为 false 时才执行初始化
    if (!isInit.value) {
      // 获取基础配置：从实例中获取预测时间范围、预测时间类型和模型类型。
      const { forecastTimeRange, forecastTimeType, modelType } = instance.value;

      // 初始化基础列配置, 它们会分别添加不同的时间列配置, 所以需要两个独立的引用，而不是共享同一个引用. getColumnsTemp 根据模型类型获取列配置
      const baseColumns = getColumnsTemp(modelType);
      analysisColumns.value = structuredClone(baseColumns);
      commonColumns.value = structuredClone(baseColumns);

      // 处理时间列：如果是完整模型，会根据时间范围和时间类型生成时间列. 生成树形结构的列配置、预设值和日期字段;
      const timePeriod = forecastTimeRange.split(',') || [];
      // 完整模型
      if (modelType === '完整模型') {
        // formatTimeColumn 时间列配置生成 e.g. timePeriod:['2025','2044'], forecastTimeType: 'year'
        const {
          tree: stuffColumns, // 时间列配置: 返回生成的时间列数据
          presets, // 预设前缀, 如: 'F'、'A',
          dateFields: columnDateFields,
        } = formatTimeColumn(timePeriod, forecastTimeType);

        dateFields.value = columnDateFields; // 日期段: ['2025','2026',...,'2044']

        // formatColumn 数据展示和分析, 格式化列配置生成：将基础列配置 和 时间列配置 合并，并进行格式化。
        // analysisColumns 主要用于 数据分析视图, 可能包含更多的分析相关列, 用于展示和查看数据;
        analysisColumns.value = formatColumn(
          [...analysisColumns.value, ...structuredClone(stuffColumns)], // structuredClone: javascript new deep clone function
          fn, // 在这里使用 fn 处理每一列
        );

        // commonColumns 数据编辑视图, 主要用于 数据编辑视图, 包含需要提交的列配置, 用于数据输入和修改;
        // 注: 通过 collectSubmitColumns 收集需要提交的列
        // 注: 两者在 完整模型 下都会添加时间列配置，但在 速算模型 下保持基础配置
        commonColumns.value = formatColumn(
          [...commonColumns.value, ...structuredClone(stuffColumns)], // structuredClone: javascript new deep clone function
          fn, // 在这里使用 fn 处理每一列
        );

        // 设置预设值, 常用预设
        commonPresets.value = presets;
      } else {
        // 速算模型
        analysisColumns.value = [...analysisColumns.value];
        commonColumns.value = [...commonColumns.value];
      }

      // 收集提交列, 收集需要提交的列配置。收集提交列时只使用 commonColumns
      collectSubmitColumns(commonColumns.value);

      // 标记初始化完成
      isInit.value = true;
    }
  };

  return {
    submitColumns,
    analysisColumns,
    commonColumns,
    commonPresets,
    initColumns,
    dateFields,
  };
};

/* 
  计算引擎 [全局配置、数据池、dataId、页面数据池、变化数据池、关系数据池、初始化列配置、初始化全局数据、更新行数据、同步多表单数据、更新指标数据、计算逻辑、逐一解析sheet模版、加载sheet数据、获取指标code、根据公式构建关系图, 存在prev-code、依赖管理]
  参数: instance, 主要作用是提供模型的基本配置信息，用于初始化表格的列结构和相关配置。这些配置会影响表格的显示方式、数据组织方式以及提交行为
*/
export const useCalcEngine = (instance: any) => {
  // 全局配置
  const {
    config: globalConfig,
    setGlobalConfig,
    getGlobalConfig,
  } = useGlobalConfig();

  const { addLog, getLog } = useLog();

  // 数据池
  const {
    data: dataMap,
    _data: _dataMap,
    setData,
    getData,
    getAllData,
    cloneData,
    isEqualOriginData,
    isEqualData,
  } = useDataPool();

  const dataId = ref<DataTs>({});

  const setDataId = (id: string, value: any) => {
    dataId.value[id] = value; // dataId[emmId] = value
  };
  const getDataId = (id: string, field: number | string) => {
    if (dataId.value[id]) {
      return dataId.value[id][field];
    }
  };
  const resetDataId = () => {
    dataId.value = {};
  };

  // 页面数据池
  const {
    data: sheetData,
    setData: setSheetData,
    cloneData: cloneSheetData,
  } = usePagePool();

  // 变化数据池
  const {
    isChanged,
    data: dataChangedMap,
    setData: setChangeData,
    setReset: setChangeReset,
    setState: setChangeState,
  } = useChangePool();

  // 关系数据池
  const {
    data: formulaMap,
    base: indicatorBaseMap,
    setData: setRelationData,
    setBaseData: setRelationBaseData,
  } = useRelationPool();

  // 初始化列配置
  const {
    submitColumns,
    analysisColumns,
    commonColumns,
    commonPresets,
    initColumns,
    dateFields,
  } = useColumnsModel(instance);

  const hotkeyManager = new HotKey(); // 快捷键管理器

  // 初始化全局数据. 主要更新了时间类型、期间数等
  // 参数: instance, 主要作用是提供模型的基本配置信息，用于初始化表格的列结构和相关配置。这些配置会影响表格的显示方式、数据组织方式以及提交行为
  const initGlobalConfig = (instance: any) => {
    /*
      instance: [
        {
          "opTime": "2025-04-08 17:07:23",
          "id": "01jraaezmkz575qkcp21nzqyae",
          "versionName": "test-henry-01",
          "versionCode": "CB6E91693BD5471AA29B019AE57D2327",
          "currencyCode": "USD",
          "forecastTimeType": "year", // 预测时间类型
          "forecastTimeRange": "2025,2044", // 预报时间范围
          "modelCode": "d91b20ee-a234-11ef-b8c2-005056aaf90d",
          "investmentSubject": "01",
          "projectCode": "DB0120250001",
          "projectName": "2026中粮集团有限公司改建打包项目",
          "modelType": "完整模型",
          "investmentType": "固定资产类-新增产能",
          "investmentName": "中粮集团有限公司",
          "versionConfig": {}
        }
      ]
    */
    const { forecastTimeType, forecastTimeRange, targetIndustry } = instance;

    setGlobalConfig('timeType', forecastTimeType);

    // 根据 forecastTimeType 配置 periodMonths - 期间月份
    switch (forecastTimeType) {
      case 'year': {
        setGlobalConfig('periodMonths', 12);
        break;
      }
      case 'quarter': {
        setGlobalConfig('periodMonths', 3);
        break;
      }
      default: {
        setGlobalConfig('periodMonths', 1);
      }
    }

    const timePeriod = forecastTimeRange.split(',') || [];

    if (Array.isArray(timePeriod) && timePeriod.length === 2) {
      const [startTime, endTime] = timePeriod;
      setGlobalConfig('startTime', startTime);
      setGlobalConfig('endTime', endTime);

      const [startYear, startMonth] = startTime.split('-') || []; // '2025-4' -> ['2025','4'], startYear='2025', startMonth='4'
      const [endYear, endMonth] = endTime.split('-') || []; // '2044-7' -> ['2044','7'], endYear='2044', endMonth='7'

      let allMonth = (endYear - startYear) * 12; // 根据年范围 计算出 月长度

      // 月度
      if (forecastTimeType === 'month') {
        if (allMonth) {
          allMonth -= Number(startMonth) - 1;
          allMonth += Number(endMonth);
        } else {
          allMonth += endMonth - startMonth;
        }
      }

      // 季度
      if (forecastTimeType === 'quarter') {
        if (allMonth) {
          allMonth -= Number(startMonth) - 1;
          allMonth += Number(endMonth) + 2;
        } else {
          allMonth += endMonth - startMonth + 2; // 加2 是因为季度选择器结束时间为季度的第一个月
        }
      }

      // 年度
      if (forecastTimeType === 'year') {
        allMonth += 12;
      }

      const period = Math.ceil(allMonth / getGlobalConfig('periodMonths')); // period(期间数) = 月长度 / 期间月份
      setGlobalConfig('periodNumber', period);
    }

    if (targetIndustry) {
      setGlobalConfig('targetIndustry', targetIndustry);
    }
  };

  // 更新行数据
  const patchUpdateSheetRowData = (code: string, updateRow: any) => {
    // sheetData 是 页面模板数据(usePagePool -> data: sheetData)
    for (const pageCode in sheetData) {
      const data = sheetData[pageCode];
      data?.forEach((row) => {
        if (code === row.metricCode) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, level, sort, ...rest } = updateRow;
          for (const key in rest) {
            row[key] = rest[key];
          }
        }
      });
    }
  };

  // 同步多表单数据
  const patchUpdateSheetData = (
    code: string,
    field: number | string,
    value: any,
  ) => {
    for (const pageCode in sheetData) {
      const data = sheetData[pageCode];
      data?.forEach((row: any) => {
        if (code === row.metricCode) {
          row[field] = value;
        }
      });
    }
  };

  // (当某个指标值发生变化时) 更新指标数据， 存在单位更新问题
  const patchUpdateData = (
    code: string,
    field: number | string,
    value: any,
  ) => {
    const mapItem = getData(code);
    if (mapItem) {
      // 与数据源比对,如果不一样,则更新
      if (!isEqualData(code, field, value)) {
        // 1. 更新指标值
        mapItem[field] = value;

        // 2. 更新表格显示
        patchUpdateSheetData(code, field, value);
      }

      // 更新变化数据池,空数据不会被收集
      if (isEqualOriginData(code, field, value)) {
        delete dataChangedMap[code]?.[field];
        if (dataChangedMap[code]) {
          const keys = Object.keys(dataChangedMap[code] as EditorTs.Indicator);

          if (keys.length === 0) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete dataChangedMap[code];
          }
        }
      } else {
        setChangeData(code, field, value);
      }
      setChangeState();
    }
  };

  const { undo, redo, executeHistory } = useHistoryPool({
    data: dataMap,
    originData: _dataMap,
    dataChange: dataChangedMap,
    patchUpdateData,
  });

  // 计算逻辑
  const { calculateFormula } = useCalculate({
    addLog,
    formulaMap,
    globalConfig,
    getData,
    patchUpdateData,
    dateFields,
  });

  /*
    
    逐一解析sheet模版
    作用: 将页面模板数据转换为树形结构，并存储到数据池中，以便后续渲染和编辑表格时使用。
    存储模板：addSheetTemp 函数的作用: 
      将获取到的页面模板数据存储起来（很可能是存储在 useCalcEngine hook 管理的状态中），
      并与对应的 pageCode 关联。这样，当用户切换到不同的页面标签时，系统可以根据 pageCode 
      找到并使用正确的模板来渲染表格 (Editor 组件)。
  */
  const addSheetTemp = (code: string, data: EditorTs.IndicatorList) => {
    // 1. 数据存储检查：首先检查 sheetData[code] 是否已存在，如果存在则直接返回，避免重复处理。
    if (sheetData[code]) {
      return;
    } else {
      // 第一次调用 setSheetData 初始化的步骤，确保数据池中有基础数据
      setSheetData(code, data);
    }

    // 2. 数据排序: 对传入的 data 数组按照 sort 字段进行排序，确保数据按预期顺序排列
    data.sort((a, b) => {
      return a.sort - b.sort;
    });

    // 构建树逻辑： 通过level构建（指标与title都可能存在子元素）
    // 创建三个数组：tree存储最终的树形结构、treeFlat临时存储所有节点，用于后续构建父子关系、stack用于维护当前标题的层级关系
    const tree: EditorTs.IndicatorList = [];
    const treeFlat: EditorTs.IndicatorList = []; // 临时group的map
    const stack: EditorTs.IndicatorList = []; // 用于维护当前的标题层级

    // 3. 构建树形结构：将页面模板数据 转换为 树形结构 并存储到 数据池 中
    // {"opUser":"","opTime":"2025-04-09 16:05:19","sort":1,"delFlag":0,"id":"01jrcsa13f34t0qtnntw88269m","metricName":"一、固定资产","unit":"","modelCode":"d91b20ee-a234-11ef-b8c2-005056aaf90d","versionCode":"8618D8DE4680400EBAF0789403D78EC9","metricCode":"","pageCode":"101018602857037827","metricCategory":1,"scale":"1","pmetricCode":""}

    // 遍历 data 数组，为每个节点添加 id、pid 和 children 属性，并根据 level 构建父子关系。
    data.forEach((item, index) => {
      // 创建一个新的节点
      const childrenName = `${code}-children`;
      const idName = `${code}-id`;
      const pidName = `${code}-pid`;
      const node = {
        ...item,
        [idName]: item.id,
        [childrenName]: [], // 初始化子节点数组
      };

      // 4. 指标数据收集: 在遍历过程中，如果节点包含 metricCode 且不是标题节点，则将其添加到 dataMap 中，用于后续计算和更新。
      if (
        node.metricCode &&
        !node.metricCode.includes('title-') &&
        !dataMap[node.metricCode]
      ) {
        // {
        //  "opUser":"","opTime":"2025-04-09 16:05:19","sort":2,"delFlag":0,"id":"01jrcsa136ekyfwe1tzc5qyx7w",
        //  "metricName":"投资总额和结构","level":1,"unit":"","modelCode":"d91b20ee-a234-11ef-b8c2-005056aaf90d",
        //  "versionCode":"8618D8DE4680400EBAF0789403D78EC9","metricCode":"F100001999999999999","pageCode":"101018602857037824",
        //  "metricCategory":1,"scale":"1","pmetricCode":"0",
        //  "101018602857037824-id":"01jrcsa136ekyfwe1tzc5qyx7w","101018602857037824-children":[]
        // }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, level, sort, ...rest } = node;

        // useDataPool -> setData 给表格数据池
        // eslint-disable-next-line unicorn/prefer-structured-clone
        setData(node.metricCode, JSON.parse(JSON.stringify(rest)));

        if (node.pageCode === '101018602857037824') {
          console.error(
            'pageCode =',
            node.pageCode,
            ', pmetricCode =',
            node.pmetricCode,
          );
          // console.error(node.metricCode, ',', node.metricName, ',', JSON.parse(JSON.stringify(rest)))
        }
      }

      // 如果节点是标题（level === 0），则将其添加到 tree 和 stack 中。
      if (item.level === 0) {
        // level 0 为一级标题
        tree.push(node); // 存储最终的树形结构
        stack.push(node); // 用于维护当前的标题层级
      } else {
        // 如果节点是子节点，则查找最近的父节点（level 比当前节点小 1），并将当前节点添加到父节点的 children 数组中。
        if (node.metricCode.includes('title-')) {
          stack.push(node); // 用于维护当前的标题层级
        }

        /*
          treeFlat 是经过处理的数据，包含了：
            * 添加了 id、pid 和 children 属性
            * 构建了父子关系
            * 包含了完整的树形结构信息
        */

        // 查找离它最近的 level 为 0 的标题
        let parent = null;
        for (let i = index - 1; i >= 0; i--) {
          if (treeFlat[i]?.level === node.level - 1) {
            parent = treeFlat[i];
            break;
          }
        }
        if (parent) {
          node[pidName] = parent.id;
          parent[childrenName].push(node);
        }
      }
      treeFlat.push(node);
    });

    // 4. 数据克隆与存储
    cloneData(); // 克隆当前数据池中的数据，用于后续比较。

    // 第二次 setSheetData 调用：是将处理后的树形结构数据（treeFlat 是经过处理的数据）存储到 sheetData 中
    setSheetData(code, treeFlat); // 将构建好的树形结构存储到 sheetData (pagePool) 中。

    cloneSheetData(); // 克隆 sheetData，用于后续比较
  };

  // 加载sheet数据, 作用是将 新的表格数据 加载到 数据池 中，并确保 表格显示 与 数据池中的数据 保持一致。
  const loadSheetData = (data: any) => {
    // console.warn('1. loadSheetData ( data = ', data, ')');

    data.forEach((item: any) => {
      // 对于每个数据项，检查其 metricCode 是否存在于数据池中。(addSheetTemp->setData)
      const cur = getData(item.metricCode);

      if (cur) {
        // console.log('cur.metricCode= ', cur?.metricCode, ', item.metricCode = ', item?.metricCode)

        // 如果存在，则将新的数据合并到现有数据中，确保数据的一致性(使用 Object.assign 将新的数据合并到现有数据中)。
        Object.assign(cur, item);

        if (cur.pageCode === '101018602857037824') {
          console.warn('2. Object.assign(cur, item):', cur, item);
        }
        // 调用 patchUpdateSheetRowData 更新表格显示，确保用户界面反映最新的数据状态。???
        patchUpdateSheetRowData(item.metricCode, item);
      }
    });
    cloneData();
  };

  // 获取指标code
  const getMetricCodes = (str: string) => {
    const regex = /\$\{([^}]+)\}/g;
    const metricCodes: string[] = [];
    const marks: EditorTs.FormulaMarkList = [];
    let match;

    // eslint-disable-next-line no-cond-assign
    while ((match = regex.exec(str))) {
      metricCodes.push(match[1] as string);
      marks.push({
        from: match.index,
        to: match.index + match[0].length,
        enCode: match[1] as string,
        deCode: match[0] as string,
      });
    }
    return { metricCodes, marks };
  };

  /* 
    addRelationData 函数是一个关键的依赖关系构建函数，用于根据公式表达式构建指标间的依赖关系图。
    这个函数接收公式列表作为输入，并建立起完整的依赖关系网络。
    
    根据公式构建关系图, 存在prev-code
    1. 依赖关系构建:  
      通过解析公式表达式，提取出每个指标依赖的其他指标
      建立指标之间的父子关系，形成依赖图
      处理特殊前缀的指标，如全局变量、上期指标等

    2. 数据结构维护: 
    3. 特殊处理
    4. 双向关系建立

    此函数是整个计算引擎的基础，它建立的依赖关系图用于:
      1. 确定计算顺序：保证在计算某个指标前，其依赖的所有指标都已经计算完成
      2. 追踪影响范围：当一个指标的值发生变化时，可以快速找出所有受影响的指标
      3. 支持自动计算：基于依赖图可以实现智能的增量计算，只重新计算受影响的指标
      4. 优化性能：避免不必要的重复计算，提高系统响应速度
    通过建立完整的依赖关系图，系统能够智能地处理数据更新和计算，确保计算结果的准确性和一致性，这对于复杂的财务模型和预测系统尤为重要。
    
    例如，如果指标 A 的计算公式中引用了指标 B，那么:
      B 会成为 A 的父节点
      A 会成为 B 的子节点
      当 B 的值发生变化时，系统知道需要重新计算 A
    这种依赖关系的建立使得系统能够智能地处理数据更新和计算，确保计算结果的准确性和一致性。
  */
  const addRelationData = (data: EditorTs.FormulaList) => {
    /* 
      A. 依赖关系解析与初始化
        这部分代码遍历输入的公式列表(data)，对每个公式表达式：
          - 调用 getMetricCodes 函数解析公式表达式，提取依赖的 指标代码 和 标记信息
          - 为每个指标创建一个节点对象，包含公式、依赖列表、父节点列表和子节点列表
          - 将节点添加到关系数据池中
    */
    for (const item of data) {
      // 依赖关系构建:  提取依赖的 指标代码-metricCodes 和 标记信息-marks, 格式化表达式
      const { metricCodes, marks } = getMetricCodes(item.formulaExpression);

      // 数据结构维护 (关系数据池: useRelationPool -> data: formulaMap)
      if (!formulaMap[item.metricCode]) {
        // 为每个指标创建一个节点对象, 包含: 公式-formula、依赖列表-metricCodes、父节点列表-parent和子节点列表-children
        item.formula = item.formulaExpression; // 计算公式
        item.metricCodes = metricCodes; // 依赖的指标列表
        item.marks = marks; // 公式标记
        item.parent = []; // 父节点列表
        item.children = []; // 子节点列表

        setRelationData(item.metricCode, item); // 将指标节点添加到 关系数据池 中 (useRelationPool -> setRelationData(即: setData))
      }
    }

    /*
      2. 父节点关系建立
      这部分代码遍历关系数据池(formulaMap)中的所有节点，对每个节点：
        - 处理各种特殊前缀，如 global-、prev-、total- 等
        - 防止自引用，即指标引用自身的情况
        - 将依赖的指标添加为当前节点的父节点
        - 如果依赖的指标不存在于关系数据池中，则创建一个新节点
    */
    for (const key in formulaMap) {
      const node: any = formulaMap[key];
      const filterRepeat: any = [];
      node.metricCodes.forEach((code: any) => {
        /* 
          防止自引用，即指标引用自身的情况: 
            在处理特殊前缀时, 这些代码确保在构建依赖关系图时，不会形成指标引用自身的循环依赖。
            这些代码逻辑的目的是: 
              - 识别特殊情况下对自身的引用（如上期值、累计值、聚合值）
              - 在这些情况下跳过建立依赖关系
              - 防止在依赖图中形成循环，避免计算引擎陷入无限循环
        */

        // 特殊处理: 处理 global- 前缀的全局变量
        if (code.includes('global-')) {
          return; // 这里防止自引用
        }
        // 特殊处理: 上期指标数据 处理 prev- 前缀的上期指标
        if (code.includes('prev-')) {
          const name = code.split('-')[1];
          if (node.metricCode === name) {
            return; // 这里防止自引用
          }
        }
        // 特殊处理: 处理 var- 前缀的特殊计算
        if (code.includes('var-')) {
          const name = code.split('-')[1];
          if (name === 'everyPeriod') {
            return; // 这里防止自引用
          }
        }

        // 特殊处理: 处理 total- 和 periodAdd- 前缀的特殊计算
        let realCode = code;
        if (code.includes('total-')) {
          realCode = code.split('-')[1];
          if (node.metricCode === realCode) {
            return; // 这里防止自引用
          }
        }

        // 当指标使用 periodAdd- 前缀引用自己的累计值时，也会检测并避免建立自引用依赖。
        if (code.includes('periodAdd-')) {
          realCode = code.split('-')[1];
          if (node.metricCode === realCode) {
            return; // 这里防止自引用
          }
        }

        let child = formulaMap[realCode];
        if (!child) {
          // 如果依赖的指标不存在于关系数据池中，则创建一个新节点
          child = {
            metricCode: realCode,
            metricCodes: [],
            marks: [],
            children: [],
          };

          setRelationBaseData(realCode, child); // 将指标节点添加到 关系数据池 中 (useRelationPool -> setBaseData(即: setBaseData))
        }

        /* 
          将依赖的指标添加为当前节点的父节点
            - filterRepeat 数组好像是用作临时的去重辅助数组, 以防止重复依赖, 简化查找
        */
        // 如果 filterRepeat 中不包含realCode, 则将 realCode 添加到 filterRepeat 中, 并将其作为当前节点的父节点
        if (!filterRepeat.includes(realCode)) {
          filterRepeat.push(realCode);
          node.parent.push(child);
        }

        // if (!sortChild.includes(code)) {
        //   sortChild.push(code);
        //   formulaInfo.parent.push(child);
        // }
      });
    }

    /* 
      3. 合并基础指标: 将 基础指标地图 合并到 公式关系地图 中，确保所有需要的指标都包含在依赖图中。
      
      关系数据池: useRelationPool 
        -> data: formulaMap;
        -> base: indicatorBaseMap;
    */
    Object.assign(formulaMap, indicatorBaseMap);

    /* 
      4. 构建子节点关系 (双重遍历构建子节点关系)
        这部分代码构建双向依赖关系：
          - 遍历所有指标节点，找出依赖当前节点的其他节点
          - 将这些节点的指标代码添加到当前节点的 children 数组中
          - 这样形成了完整的双向依赖图，既可以找出一个指标依赖哪些指标，也可以找出哪些指标依赖于当前指标
    */
    // 双重遍历构建子节点关系, 下面收集依赖该节点的节点
    const metrics: any = Object.values(formulaMap);

    // 在metrics数组中 包含了系统中 所有已知的 指标 及其 依赖关系 信息。
    // metricOut：外层循环中 当前处理的指标节点，被视为潜在的"被依赖者"
    // metricIn： 内层循环中 当前处理的指标节点，被视为潜在的"依赖者"
    metrics.forEach((metricOut: any) => {
      metrics.forEach((metricIn: any) => {
        /*
          在之前的代码中，我们已经为每个指标建立了父节点关系（哪些指标是当前指标的依赖）。这段代码则建立了子节点关系（哪些指标依赖于当前指标），从而完成了完整的双向依赖图构建。
          这种双向依赖关系的建立，是复杂计算系统（如财务模型）中确保计算准确性和高效性的关键机制。
          
          遍历所有指标节点，找出依赖当前节点的其他节点 (检查依赖关系 并建立 子节点关联)
          检查metricIn节点的公式中（通过metricCodes数组）是否引用了metricOut节点
            如果存在依赖，则将 metricIn 的指标代码 添加到 metricOut 的 children数组 中

          具体示例
            假设有三个指标：
              * 指标A：没有任何依赖，是基础指标
              * 指标B：公式中引用了指标A，即B依赖于A
              * 指标C：公式中同时引用了指标A和指标B，即C依赖于A和B

            执行这段双重循环代码后：
            1. 检查A节点的子节点关系：
              * B的metricCodes包含A，所以A的children会包含B
              * C的metricCodes包含A，所以A的children会包含C
              * 结果：A.children = [B, C]
            2. 检查B节点的子节点关系：
              * C的metricCodes包含B，所以B的children会包含C
              * 结果：B.children = [C]
            3. 检查C节点的子节点关系：
              * 没有任何指标依赖C
              * 结果：C.children = []

          我的理解: 没有公式的节点为根节点, 父子关系是反推的.
          优点:
            1. 支持自动计算：当某个指标的值改变时，系统可以立即知道哪些指标需要重新计算，避免了不必要的全量计算
            2. 优化性能：只重新计算受影响的指标，提高系统响应速度和性能
            3. 确保数据一致性：通过正确的计算顺序，确保所有计算结果是一致且可靠的
            4. 支持依赖追踪：可以追踪任何指标变化的影响范围，方便调试和理解系统行为

        */
        if (metricIn.metricCodes.includes(metricOut.metricCode)) {
          // 将这些节点的指标代码添加到当前节点的 children 数组中
          metricOut.children.push(metricIn.metricCode);
        }
      });
    });
  };

  // 优点2: 依赖管理
  const getDependencies = (metricCode: string) => {
    const formula = formulaMap[metricCode];
    if (!formula) return [];

    return formula.metricCodes.map((code) => {
      // 处理特殊前缀的指标
      if (
        code.includes('global-') ||
        code.includes('total-') ||
        code.includes('periodAdd-')
      ) {
        return code.split('-')[1];
      }
      if (code.includes('prev-')) {
        return code.split('-')[1];
      }
      return code;
    });
  };

  window.all = getAllData();
  window.formula = formulaMap;
  window.getLog = getLog;

  return {
    globalConfig,
    dataMap,
    sheetData,
    isChanged,
    dataChangedMap,
    // currentChange,
    hotkeyManager,
    getFormulaMap: () => {
      return formulaMap;
    },
    initGlobalConfig,
    getDataMap: getData,
    getAllData,
    addSheetTemp,
    loadSheetData,
    addRelationData,
    autoCalcData: calculateFormula,
    patchUpdateData,
    redo,
    undo,
    execute: executeHistory,
    reset: setChangeReset,
    getDataId,
    setDataId,
    resetDataId,
    submitColumns,
    analysisColumns,
    commonColumns,
    commonPresets,
    initColumns,
    dateFields,
    getDependencies,
  };
};
