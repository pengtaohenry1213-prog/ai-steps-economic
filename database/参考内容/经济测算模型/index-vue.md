<script lang="ts" setup>
import type { EditorTs, ModelTs, VersionTs } from '@vben/types';

import type { VxeTableInstance } from '#/adapter/vxe-table';

// 导入Vue相关依赖
import { computed, h, onMounted, ref, toRaw } from 'vue';
import { useRequest, useToggle } from 'vue-hooks-plus';
import { useRoute } from 'vue-router';

// 导入第三方库
import Decimal from 'decimal.js';
import { ElNotification } from 'element-plus';
import TreeTransfer from 'tree-transfer-vue3';
import * as XLSX from 'xlsx';

import {
  calcInstance,
  getFormulaList, // 获得版本所有指标计算公式
  getInstance, // 获得单个实例信息（模型的）
  getInstanceData, // 获得单个版本实例数据
  getInstanceDataId, // 获取指标信息、
  getMetricInfo,
  getModelMenu, // 获得模型表单的列表modeCode
  getModelTemplate, // 获得表里模型指标配置
  saveInstanceData,
  updateInstanceConfig,
} from '#/api/index';

// 导入组件
import ZlSelect from '#/component/select/index.vue';
import FormulaTestPanel from '#/components/FormulaTestPanel.vue';
import { useModelStore } from '#/store/index';

import { useCalculate } from './calculate';
import { columnsTemplate } from './cons'; // 用于 导入数据
import Editor from './editor.vue'; // 表格核心文件
import { useCalcEngine } from './hooks'; // 数据引擎核心文件 hooks.ts 里的大部分功能都被开启
import { formulaData, mockData, templateData } from './mock/index';
import { getUnitSelectConfig } from './unit';
import {
  // getAllCellsInfo,
  getCellRelationData,
  getQuarter,
  isNumber,
} from './utils';

// 表格编辑器引用
const editorRef = ref<VxeTableInstance>();

interface Query {
  timePeriod: [string, string];
  investmentType: string;
  projectName: string;
  modelType: string;
  company: string;
  versionCode: string;
  operate: 'CREATE' | 'EDIT';
}

// 使用模型存储
const modelStore = useModelStore(); // 注: 在 onMounted(async () => { 中 有对  await modelStore.fetchAllList(); // 获取所有列表 加载
const { sheetColumn } = modelStore; // sheetColumn 表格列数据

// 版本实例数据
const instance = ref<VersionTs.Instance>({
  id: '', // 实例ID
  forecastTimeRange: '', // 预测时间范围，用于生成时间列
  forecastTimeType: 'month', // 预测时间类型（年、季度、月），影响时间列的格式
  investmentSubject: '', // 投资主体
  modelCode: '', // 模型代码
  projectCode: '', // 项目代码
  versionCode: '', // 版本代码
  versionName: '', // 版本名称
  currencyCode: '', // 货币代码
  investmentType: '', // 投资类型
  status: 1, // 状态
  versionConfig: {}, // 版本配置
  isInitialize: 0, // 是否初始化
});

// 计算引擎 [全局配置、数据池、dataId、页面数据池、变化数据池、关系数据池、初始化列配置、初始化全局数据、更新行数据、同步多表单数据、更新指标数据、计算逻辑、逐一解析sheet模版、加载sheet数据、获取指标code、根据公式构建关系图, 存在prev-code、依赖管理]
// 参数: instance, 主要作用是提供模型的基本配置信息，用于初始化表格的列结构和相关配置。这些配置会影响表格的显示方式、数据组织方式以及提交行为
const {
  globalConfig, // 全局配置
  sheetData, // 表格数据
  isChanged, // 是否改变
  dataChangedMap, // 数据变更映射
  hotkeyManager, // 快捷键管理器
  getFormulaMap, // 获取公式映射
  // getUpdateGraph, // 获得更新关系网
  getDataMap, // 获取数据映射
  initGlobalConfig, // 初始化全局配置
  addSheetTemp, // 添加表格模板
  loadSheetData, // 加载表格数据
  addRelationData, // 添加关联数据
  autoCalcData, // 自动计算数据
  // calculateFormulaByRelationData, // 根据关系网更新指定code的单元格值
  patchUpdateData, // 更新数据
  execute, // 执行 execute: executeHistory,
  undo, // 撤销
  redo, // 重做
  reset, // 重置
  setDataId, // 设置数据ID
  getDataId, // 获取数据ID
  initColumns, // 初始化表格的列配置
  commonColumns, // 通用列
  commonPresets, // 通用预设
  submitColumns, // 提交列
  // getDependencies, // 获取依赖
  // getCalcFormulaGroup,
} = useCalcEngine(instance); // From: './hooks.ts'

const {
  getCalculatedFormula,
  getRelatedMetrics,
  getCurrentValue,
  getValue,
  getFormulaRelationNodes, // 添加这一行
} = useCalculate({
  formulaMap: getFormulaMap(),
  globalConfig,
  patchUpdateData,
  getData: getDataMap,
  // getCalcFormulaGroup,
});

// 菜单类型 (参数输入/参数输出)
const menuType = ref(false);

// 抽屉可见性控制
const [drawerVisible, drawerVisibleHandle] = useToggle();

// 侧边面板数据
const slidePanel = ref<{
  data: any;
  visible: boolean;
}>({
  visible: false,
  data: {},
});

const testDialogVisible = ref(false);

// 路由
const route = useRoute();
const query = route.query as unknown as Query;

/* 
  预设数据(前缀), 如: presets = [{2025:'A'},{2026:'F'}, {2027:'F'},...,{2044:'F'}]
  注: 
    - getColumns(设置预设值: presets.value = versionPresets || commonPresets.value;)
    - autoFill(遍历presets->patchUpdateData()更新数据)
    - saveData(读取presets.value[attrName])
    - 在html中读取: <Editor v-model:presets="presets".../>、
*/
const presets = ref<EditorTs.Presets>({});

// 状态数据
const state = ref<{
  current: any;
  insertConfig: any;
}>({
  current: '',
  insertConfig: {}, // 插入配置
});

// 计算基础信息, 这个计算属性的作用是：数据转换和格式化、返回对象：包含所有处理后的数据
// 在模板中可以直接使用 baseInfo 的属性，如 {{ baseInfo.investmentType }} 计算属性会自动追踪依赖，当依赖变化时自动更新
const baseInfo = computed(() => {
  const {
    forecastTimeRange, // 预测时间范围
    investmentSubject, // 投资主体
    investmentType, // 投资类型
    forecastTimeType, // 预测时间类型
    versionName, // 版本名称
    currencyCode, // 货币代码
    projectCode, // 项目代码
    modelType, // 模型类型
    targetIndustry, // 目标行业
  } = instance.value;

  // 处理时间范围
  const time = forecastTimeRange.split(',') || [];
  const start = time?.[0]?.split('-') || [];
  const end = time?.[1]?.split('-') || [];
  let timePeriod = `${time?.[0]}-${time?.[1]}`;
  if (forecastTimeType === 'quarter') {
    timePeriod = `${start![0]}Q${getQuarter(Number(start![1]))}-${end![0]}Q${getQuarter(Number(end![1]))}`;
  }

  const investmentSubjectName = modelStore.investList.find(
    (item) => item.investCode === investmentSubject,
  )?.investName;

  // 2. 获取货币名称 (币种列表 中find)
  const currencyName = modelStore.currencyList.find(
    (item) => item.currencyCode === currencyCode,
  )?.currencyName;

  // 3. 获取项目名称 (项目列表 中find)
  const projectName = modelStore.projectList.find(
    (item) => item.projectCode === projectCode,
  )?.projectName;

  // 返回一个对象，包含所有处理后的数据
  return {
    investmentType, // 投资类型
    investmentSubject: investmentSubjectName, // 投资主体名称
    modelType, // 模型类型（"完整模型"或"速算模型"），影响列配置的生成方式
    timePeriod, // 时间周期
    projectName, // 项目名称
    operate: query.operate, // 操作类型
    currencyName, // 货币名称
    versionName, // 版本名称
    targetIndustry, // 目标行业
  };
});

// 菜单数据
const menu = ref<{
  calcList: ModelTs.ModelMenuList;
  cur?: ModelTs.ModelMenuItem | undefined;
  curList: ModelTs.ModelMenuList;
  fillList: ModelTs.ModelMenuList;
  index: number;
  pageCode: string;
  type: 'calc' | 'fill';
}>({
  type: 'fill', // 默认类型为填充
  pageCode: '', // 页面代码
  index: 0, // 索引
  curList: [], // 当前列表
  fillList: [], // 填充列表
  calcList: [], // 计算列表
});

// 菜单获取
const { runAsync: runMenu } = useRequest(getModelMenu, {
  manual: true, // 手动触发
  onSuccess(data: ModelTs.ModelMenuList) {
    // 处理菜单数据, 根据 modelType(0 或 1) 分开 参数输入 和 参数输出 2种数据分组
    for (const ele of data) {
      if (ele.modelType === 0) {
        menu.value.fillList.push(ele); // 添加到填充列表
      } else {
        menu.value.calcList.push(ele); // 添加到计算列表
      }
    }

    menu.value.curList = menu.value.fillList; // 设置当前列表(默认分组数据)
    menu.value.pageCode = menu.value.curList[0]?.pageCode || ''; // 设置页面代码
    menu.value.index = 0; // 设置索引
    menu.value.cur = menu.value.curList[0]; // 设置当前选中项
  },
});

// 获取模型版本实例信息, 通过接口getInstance 获得（模型的）单个实例信息
const { loading: instanceLoading, runAsync: runInstance } = useRequest(
  () => getInstance({ versionCode: query.versionCode }), // 版本代码
  {
    manual: true, // 手动触发
    onSuccess(res) {
      if (res[0]) {
        res[0].versionConfig = res[0].versionConfig
          ? JSON.parse(res[0].versionConfig) // 解析版本配置
          : {};
        instance.value = res[0]; // 设置实例数据

        // instance.value有数据更新, 对应的globalConfig也要更新
        initGlobalConfig(res[0]); // 初始化全局配置 (根据 forecastTimeType 配置 periodMonths - 期间月份; setGlobalConfig('periodNumber', period); setGlobalConfig('targetIndustry', targetIndustry);)
      }
    },
  },
);

/* 
  获取实例数据ID
  功能: 获取数据ID映射 和 建立数据ID映射关系, 这种映射关系在后续的数据保存和更新操作中非常重要，用于标识和定位具体的数据项
  注: 在数据保存后（saveData）也会被调用，以确保数据ID映射关系是最新的.
    例如，在保存数据时（saveData函数中），会使用这些数据ID来构建保存参数：
      const currentId = getDataId(rowOrigin.emmId, attrName);
      if (currentId) {
        p.id = currentId; // 使用数据ID作为保存参数
      }
    这样，系统就能准确地知道要更新哪些数据，以及如何将这些数据与数据库中的记录对应起来。
*/
async function runInstanceDataId() {
  try {
    /*
    1. 获取数据ID映射：
      通过调用 getInstanceDataId API，传入当前实例的 versionCode，获
      取该版本下所有指标数据的数据ID映射关系, 这些数据ID用于后续的数据保存和更新操作
      {
        "emmId": "01jrcsa13agbk4k5aynjzzq0q6",
        "metricName": "人均成本（固定）", gb
        "metricCode": "F300030100009999999",
        "pMetricCode": "F300026100009999999",
        "level": 3,
        "unit": "元/人",
        "sort": 60,
        "scale": "1"
      }
    */
    const res = await getInstanceDataId({
      versionCode: instance.value.versionCode,
      pageCode: 'E0EC014887A04961ADA13F3585751326',
    }); // 版本代码

    // 2. 建立数据ID映射关系：
    if (Array.isArray(res)) {
      res.forEach((item) => {
        // 将获取到的数据ID映射关系存储到数据池中
        setDataId(item.emmId, item); // 设置数据ID useCalcEngine -> dataId
      });
    }
  } catch {}
}

// 获取指标公式
const { runAsync: runFormula } = useRequest(
  // 1. 获取指标公式: 调用 getFormulaList API，传入当前版本的 versionCode 作为参数, 获取该版本下所有指标的计算公式
  () => getFormulaList({ 'mm.versionCode': query.versionCode }), // 版本代码
  {
    manual: true, // 手动触发
    onSuccess(res) {
      if (globalConfig.mock) {
        /*
          2. 数据处理: 在请求成功后，通过 addRelationData(res) 将获取到的公式数据添加到关系数据池中
          这些公式数据用于后续的计算和依赖关系管理
        */
        // useCalcEngine -> res + setRelationData(code, data) 同时保存关系数据池(relationPool)
        addRelationData(formulaData);
      } else {
        addRelationData(res);
      }
    },
  },
);

const description = ref('');

async function fetchMetricInfo(code: string) {
  const res = await getMetricInfo({
    metricCode: code,
  });
  description.value = res.length > 0 ? res[0].metricDescription : ''; // 设置指标描述
}

// 保存实例数据
const { runAsync: runSaveData, loading: saveLoading } = useRequest(
  saveInstanceData,
  {
    manual: true, // 手动触发
    onSuccess() {
      ElNotification({
        title: '数据保存',
        message: h('i', { style: 'color: teal' }, '数据保存成功'),
      });
    },
  },
);

// 更该版本实例信息
const { runAsync: runSaveConfig } = useRequest(updateInstanceConfig, {
  manual: true,
});

// 加载实例数据
const { runAsync: runLoadData } = useRequest(
  // 调用 getInstanceData API，传入 versionCode 参数，获取当前版本实例的数据。
  () => getInstanceData({ versionCode: instance.value.versionCode }),
  {
    manual: true, // 手动触发
    // 在请求成功后，对返回的数据进行处理，包括单位转换、数据格式调整等，最终调用 loadSheetData 将处理后的数据加载到表格中。
    onSuccess(res) {
      // 创建一个新的对象以存储修改后的属性
      const updatedData: EditorTs.IndicatorList = [];
      if (globalConfig.mock) {
        res = mockData;
      }

      // 数据处理：遍历返回的数据数组，对每个数据项进行处理：
      res.forEach((item: any) => {
        const obj: any = {};
        // 如果单位是"年"，则将 scale 设置为 1。
        if (item.unit === '年') {
          item.scale = 1; // 设置年单位比例为1
        }
        obj.scale = Number(item.scale);
        Object.keys(item).forEach((key) => {
          // 处理以 F 或 A 结尾的字段，去掉后缀并更新到新的属性名。
          if (key.endsWith('F') || key.endsWith('A')) {
            // 去掉最后一个字符 'F' or 'A'后缀 并将值 赋给新的属性名
            const newKey = key.slice(0, -1);
            obj[newKey] = item[key];
          } else {
            // 如果不是以 'F' 结尾，直接赋值
            obj[key] = item[key];
          }
          // 如果字段是 value 且是数字类型，则根据 scale 计算实际值。
          if (key === 'value' && isNumber(item.value) && obj.scale) {
            obj.value = new Decimal(item.value).div(obj.scale).toNumber(); // 计算实际值
          }
        });

        updatedData.push(obj);
      });

      // 将处理后的数据通过 loadSheetData 加载到表格中。
      loadSheetData(updatedData);
    },
  },
);

// 计算实例数据 --- 后端计算
const { runAsync: runCalc } = useRequest(
  (params: any) => {
    const fetchList = params.map((param: any) => calcInstance(param)); // 计算每个参数
    return Promise.all(fetchList);
  },
  {
    manual: true, // 手动触发
    onSuccess(res) {
      const updatedDataMap: any = {};
      res.forEach((dataList: any) => {
        dataList.forEach((item: any) => {
          const indicator = updatedDataMap[item.metricCode]; // 更新已有指标数据
          if (indicator) {
            indicator[item.yeaReportMonths] = item.values; // 创建新指标数据
          } else {
            updatedDataMap[item.metricCode] = {
              [item.yeaReportMonths]: item.values,
            };
          }
        });
      });
      for (const key in updatedDataMap) {
        const indicator = updatedDataMap[key];
        for (const time in indicator) {
          const value = indicator[time];
          const data = getDataMap(key);
          if (data) {
            data[time] = value; // 更新数据映射
          }
        }
      }
    },
  },
);

// 加载所有页面模板, 主要功能是 并行加载当前模型版本下所有页面（包括参数输入和参数输出）的模板配置。
const { runAsync: loadAllTemp } = useRequest(
  () => {
    // 收集页面信息：它从 menu.value 中获取 fillList（参数输入页面列表）和 calcList（参数输出页面列表）
    const { fillList } = menu.value; // , calcList

    // 构建请求列表：遍历这两个列表中的每一个页面信息（item），为每个页面构建一个调用 getModelTemplate API 的请求。
    // 这个 API 请求需要 versionCode、modelCode 和 pageCode 作为参数，目的是获取该页面的具体模板结构（例如列定义、初始行等）。
    const fetchList: Promise<any>[] = [];
    fillList.forEach((item) => {
      if (
        item.pageName === '假设输入-项目收入'
        // || 
        // item.pageName === '假设输入-项目参数'
      ) {
        fetchList.push(
          getModelTemplate({
            versionCode: query.versionCode,
            modelCode: item.modelCode,
            pageCode: item.pageCode,
          }),
        );
      }
    });
    // calcList.forEach((item) => {
    //   fetchList.push(
    //     getModelTemplate({
    //       versionCode: query.versionCode,
    //       modelCode: item.modelCode,
    //       pageCode: item.pageCode,
    //     }),
    //   );
    // });

    // Promise.all 返回数据如:
    // {"opUser":"","opTime":"2025-04-09 16:05:19","sort":1,"delFlag":0,"id":"01jrcsa13f34t0qtnntw88269m","metricName":"一、固定资产","unit":"","modelCode":"d91b20ee-a234-11ef-b8c2-005056aaf90d","versionCode":"8618D8DE4680400EBAF0789403D78EC9","metricCode":"","pageCode":"101018602857037827","metricCategory":1,"scale":"1","pmetricCode":""}

    // 并行请求：使用 Promise.all 同时发起所有页面的模板获取请求，以提高加载效率。s
    return Promise.all(fetchList);
  },
  {
    manual: true, // 手动触发
    onSuccess(res) {
      // 处理结果：在所有请求成功 (onSuccess) 后，它会遍历返回的模板数据数组 (res)。
      const allList = [...menu.value.fillList, ...menu.value.calcList];

      // 对于每个返回的模板数据 (dataList)，它会找到对应的 pageCode
      res.forEach((dataList: any, i) => {
        const pageCode = allList[i]?.pageCode || '';
        if (globalConfig.mock) {
          addSheetTemp(pageCode, templateData);
        } else {
          addSheetTemp(pageCode, dataList);
        }
      });
    },
  },
);

// 获取列配置, 根据menu.value里的fillList和calcList构建
// 间接影响: 由于 sheetColumn 被更新，会影响到使用 sheetColumn 的组件，比如 Editor 组件 的 <Editor :columns="sheetColumn[menu.pageCode]" .../>  // 这里会使用更新后的列配置
const getColumns = () => {
  const { versionConfig } = instance.value;
  const { presets: versionPresets, columnsMap } = versionConfig;
  const { fillList, calcList } = menu.value;
  const allList = [...fillList, ...calcList]; // 合并 参数输入 和 参数输出, fillList 填充列表 和 calcList 计算列表

  allList.forEach((item) => {
    if (columnsMap && columnsMap[item.pageCode]) {
      // 使用版本配置中的列配置
      // modelStore.setSheetColumn 这会更新表格的列配置数据，影响表格的显示结构。
      modelStore.setSheetColumn({
        key: item.pageCode,
        value: columnsMap[item.pageCode], // 使用版本配置中的 列配置 或 通用列配置
      });
    } else {
      initColumns(); // 初始化表格的列配置

      modelStore.setSheetColumn({
        key: item.pageCode,
        value: commonColumns, // 使用通用列配置
      });
    }
  });

  // 设置预设值 const presets = ref({});
  presets.value = versionPresets || commonPresets.value;
};
// 敏感性分析对话框显示隐藏
const dialogVisible = ref(false);

// 输入指标
const inputFromData = ref([
  {
    id: '1',
    parentId: '0',
    label: '标的收入',
    children: [
      {
        id: '1-1',
        parentId: '1',
        label: '标的销量',
        children: [],
      },
      {
        id: '1-2',
        parentId: '1',
        label: '食品工业销量',
        children: [],
      },
    ],
  },
  {
    id: '2',
    parentId: 0,
    label: '标的成本',
    children: [
      {
        id: '2-1',
        parentId: '2',
        label: '成本',
      },
    ],
  },
]);
const inputToData = ref([
  {
    id: '1',
    parentId: '0',
    label: '标的收入',
    children: [
      {
        id: '1-3',
        parentId: '1',
        label: '半干面生鲜面粉销量',
        children: [],
      },
    ],
  },
]);

const outputFromData = ref([
  {
    id: '1',
    parentId: '0',
    label: '管理指标',
    children: [
      {
        id: '1-1',
        parentId: '1',
        label: '净资产收益率',
        children: [],
      },
      {
        id: '1-2',
        parentId: '1',
        label: '内部收益率',
        children: [],
      },
    ],
  },
  {
    id: '2',
    parentId: 0,
    label: '损益指标',
    children: [
      {
        id: '2-1',
        parentId: '2',
        label: '损益指标',
      },
    ],
  },
]);
const outputToData = ref([]);
const sceneData = ref([
  {
    label: '情景1',
    value: '',
  },
]);

// 获取单位标签, <Editor> 里使用的格式化小方法
const getUnitLabel = (list: any, unit: any) => {
  if (list) {
    // eslint-disable-next-line eqeqeq
    return list.find((item: any) => item.value == unit)?.label;
  }
  return '';
};

// 处理函数
const handle = {
  // 关闭抽屉
  drawerClose() {
    drawerVisibleHandle.setLeft();
  },

  // 敏感性分析对话框显示/关闭
  dialogShow() {
    dialogVisible.value = true;
  },
  dialogClose() {
    dialogVisible.value = false;
  },
  // 导入数据
  async importData() {
    // @ts-ignore
    const editor = editorRef.value;
    if (editor) {
      try {
        // 创建一个隐藏的文件输入元素
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';
        // 设置安全属性
        input.setAttribute('security', 'restricted');

        const filePromise = new Promise((resolve) => {
          input.addEventListener('change', async (e: any) => {
            const file = e.target.files[0];
            if (file) {
              // 验证文件类型
              const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
              ];

              if (!validTypes.includes(file.type)) {
                throw new Error('不支持的文件类型，请上传 Excel 文件');
              }

              // 验证文件大小（例如限制为 10MB）
              const maxSize = 10 * 1024 * 1024; // 10MB
              if (file.size > maxSize) {
                throw new Error('文件大小超过限制');
              }

              resolve(file);
            }
          });
        });

        input.click();

        const file = await filePromise;

        if (!file) return;

        // 使用 FileReader 安全地读取文件
        // const reader = new FileReader();
        // const dataPromise = new Promise((resolve) => {
        //   reader.addEventListener('load', (e: any) => {
        //     const data = new Uint8Array(e.target.result);
        //     const workbook = XLSX.read(data, { type: 'array' });
        //     resolve(workbook);
        //   });
        // });

        // // eslint-disable-next-line unicorn/prefer-blob-reading-methods
        // reader.readAsArrayBuffer(file as Blob);

        try {
          // 使用现代的 Blob.arrayBuffer() 方法读取文件
          const buffer = await (file as Blob).arrayBuffer();
          const data = new Uint8Array(buffer);
          const workbook = XLSX.read(data, { type: 'array' });

          // const workbook = (await dataPromise) as any;

          const editableColumns = new Set(
            columnsTemplate
              .filter((col) => col.editType !== 'input')
              .map((col) => col.title),
          );

          // 遍历所有sheet
          const sheets = workbook.SheetNames.map((name: string) => ({
            name,
            data: XLSX.utils.sheet_to_json(workbook.Sheets[name], {
              header: 1,
            }),
          }));

          // 处理每个sheet的数据
          sheets.forEach((sheet: { data: any[][]; name: string }) => {
            const { name, data } = sheet;
            if (data.length > 0 && name) {
              // 获取表头（第一行）
              const headers = data[0];

              if (!headers) return;

              // 从第二行开始是数据
              const rows = data.slice(1);

              // 从 cons.ts 中获取可编辑列的信息
              // 根据 editableColumns 从 headers 中排除 editableColumns 出现的内容
              const validUpdateTableColumns = new Set(
                headers.filter((col: string) => !editableColumns.has(col)),
              );

              // 使用 Set 来跟踪已处理的指标，避免重复处理
              const processedMetrics = new Set<string>();

              // 处理每一行数据
              rows.forEach((row: any[]) => {
                if (row.length === 0) return;

                // 假设最后一列是 metricCode
                const metricCode = row[row.length - 1]?.toString().trim();
                // const metricName = row[0]?.toString().trim();

                // 如果这个指标已经处理过，就跳过
                if (processedMetrics.has(metricCode)) {
                  return;
                }

                const source = getDataMap(metricCode);

                if (source) {
                  // 更新每个有效的列
                  headers.forEach((header: string, index: number) => {
                    if (validUpdateTableColumns.has(header) && row[index]) {
                      const value = row[index].toString().trim();
                      const numValue = isNumber(value) ? Number(value) : value;

                      patchUpdateData(metricCode, header, numValue);
                    }
                  });

                  // 标记该指标已处理
                  processedMetrics.add(metricCode);
                }
              });
            }
          });
        } catch (error) {
          // console.error('Excel导入失败:', error);
          ElNotification({
            title: '错误',
            message: `Excel导入失败: ${error instanceof Error ? error.message : '未知错误'}`,
            type: 'error',
          });
        }

        ElNotification({
          title: '成功',
          message: 'Excel导入成功',
          type: 'success',
        });
      } catch (error) {
        // console.error('Excel import failed:', error);
        ElNotification({
          title: '错误',
          message: `Excel导入失败: ${error instanceof Error ? error.message : '未知错误'}`,
          type: 'error',
        });
      }
    }
  },

  importExcelData(res: any) {
    // 创建一个新的对象以存储修改后的属性
    const updatedData: EditorTs.IndicatorList = [];
    // 遍历原始对象的每个属性
    res.forEach((item: any) => {
      const obj: any = {};
      if (item.unit === '年') {
        item.scale = 1;
      }
      obj.scale = Number(item.scale);
      Object.keys(item).forEach((key) => {
        if (key.endsWith('F') || key.endsWith('A')) {
          // 去掉 'F' 后缀并将值赋给新的属性名
          const newKey = key.slice(0, -1); // 去掉最后一个字符 'F'
          obj[newKey] = item[key];
        } else {
          // 如果不是以 'F' 结尾，直接赋值
          obj[key] = item[key];
        }

        if (key === 'value' && isNumber(item.value) && obj.scale) {
          obj.value = new Decimal(item.value).div(obj.scale).toNumber();
        }
      });

      updatedData.push(obj);
    });
  },
  // 导出数据
  exportData() {
    const convertEditorDataToExcel = (data: any[], columns: any[]) => {
      if (!data || data.length === 0 || !columns || columns.length === 0) {
        return [[]];
      }

      // Reorder columns to put metricCode last
      const reorderedColumns = columns
        .filter((col) => !col.hidden)
        .sort((a, b) => {
          if (a.field === 'metricCode') return 1;
          if (b.field === 'metricCode') return -1;
          return 0;
        });

      // Extract column headers
      const headers = reorderedColumns.map((col) => col.title || col.field);

      // Process data rows
      const rows: any[] = [];
      // 用于跟踪已处理的行，避免重复
      const processedRows = new Set<string>();

      // Function to process a row and its children recursively
      const processRow = (row: any, level = 0) => {
        // 创建唯一标识，使用 metricCode 和其他关键字段组合
        const rowKey = `${row.metricCode}_${row.metricName}`;

        // 如果这行已经处理过，就跳过
        if (processedRows.has(rowKey)) {
          return;
        }

        const rowData = reorderedColumns.map((col) => {
          // Handle special formatting if needed
          const value = row[col.field];
          // You can add special formatting logic here based on column type
          return value === undefined ? '' : value;
        });

        // Add indentation for hierarchical data if needed
        if (level > 0 && rowData.length > 0) {
          rowData[0] = '  '.repeat(level) + rowData[0];
        }

        rows.push(rowData);
        processedRows.add(rowKey);

        // Process children recursively
        if (row.children && row.children.length > 0) {
          row.children.forEach((child: any) => processRow(child, level + 1));
        }
      };

      // Process all top-level rows
      data.forEach((row) => processRow(row));

      // Return headers and rows
      return [headers, ...rows];
    };

    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      const { fillList, calcList } = menu.value;
      const sheets_names = [...fillList, ...calcList];

      // Add sheets for each page
      sheets_names.forEach((item) => {
        const { pageCode, pageName } = item;
        const pageData = sheetData[pageCode] || [];
        const columns = sheetColumn[pageCode] || [];

        // 确保数据不为空
        if (pageData.length > 0 && columns.length > 0) {
          // Convert data for Excel format
          const excelData = convertEditorDataToExcel(pageData, columns);

          // Create worksheet
          const worksheet = XLSX.utils.aoa_to_sheet(excelData);

          // Add worksheet to workbook
          XLSX.utils.book_append_sheet(workbook, worksheet, pageName);
        }
      });

      // Generate Excel file and trigger download
      XLSX.writeFile(
        workbook,
        `${instance.value.versionName || '模型计算结果'}.xlsx`,
      );

      ElNotification({
        title: '成功',
        message: 'Excel导出成功',
        type: 'success',
      });
    } catch (error) {
      // console.error('Excel export failed:', error);
      ElNotification({
        title: '错误',
        message: `Excel导出失败: ${(error as Error).message}`,
        type: 'error',
      });
    }
  },

  // 获取数据
  getData() {},

  // 计算数据
  calculateData() {
    undo();
  },
  // 重做
  redo() {
    redo();
  },
  // 撤销
  undo() {
    undo();
  },

  // 菜单类型变更 参数输入(false, fill) or 参数输出(true, calc) 切换change事件
  menuTypeChange(val: boolean) {
    menu.value.type = val ? 'calc' : 'fill'; // 'fill': 参数输入, 'calc': 参数输出
    menu.value.curList = val ? menu.value.calcList : menu.value.fillList;
    menu.value.pageCode = menu.value.curList[0]?.pageCode || '';
    menu.value.index = 0; // 默认选择第1个
    menu.value.cur = menu.value.curList[0]; // 默认选择第1个 - 数据对象
  },
  // 单位变更
  unitChange(val: any, oldValue: any, row: any) {
    row.unit = getUnitLabel(getUnitSelectConfig(row.unit), val);

    submitColumns.forEach((key) => {
      if (key === 'scale' || key === 'unit') {
        return;
      }
      let value = row[key];
      if (isNumber(value)) {
        value = new Decimal(row[key]).mul(oldValue).div(val).toNumber(); // 计算新值
      }
      row[key] = value;
      patchUpdateData(row.metricCode, key, value); // 更新数据
    });
    patchUpdateData(row.metricCode, 'scale', val); // 更新比例
    patchUpdateData(row.metricCode, 'unit', row.unit); // 更新单位
  },
  // 自动填充, 用于批量填充数据，处理多个时间点的数据更新
  autoFill(_: string, row: any) {
    const keys = Object.keys(presets.value);
    const fetchListParams: any[] = [];

    keys.forEach((key) => {
      patchUpdateData(row.metricCode, key, row.isFixeds); // 更新数据
    });

    // 客户端计算, 系统根据 globalConfig.calcMethod 决定使用哪种计算方式
    if (globalConfig.calcMethod) {
      autoCalcData(`${row.metricCode}`, keys); // 收集需要计算的指标和字段
      execute();
    } else {
      keys.forEach((key) => {
        row[key] = row.isFixeds;
        const [year, month] = key.split('-');
        const params: any = {
          versionCode: query.versionCode,
          metricCode: row.metricCode,
          reportYear: Number(year),
          value: Number(row.isFixeds),
        };
        switch (instance.value.forecastTimeType) {
          case 'quarter': {
            params.reportQuarter = Number(month);
            break;
          }
          case 'month': {
            params.reportMonth = Number(month);
            break;
          }
        }

        fetchListParams.push(params);
      });

      runCalc(fetchListParams); // 运行计算, 后端计算方式
    }
  },
  /* 
    单元格修改触发计算, 处理单个单元格的数据变更
    触发链:
      cellChange() 
        ├── 修改 isFixeds → autoFill() --- 用于批量填充数据，处理多个时间点的数据更新
        │     ├── 调用 autoCalcData() + execute() --- 前端计算方式
        │     └── 或调用 runCalc() --- 后端计算方式
        └── 修改其他数值 → patchUpdateData() 
              ├── 调用 autoCalcData() + execute() --- 前端计算方式
              └── 或调用 runCalc() --- 后端计算方式
  */
  cellChange({ row, column, value }: EditorTs.ChangeEventPayload) {
    const d = ['metricName', 'isFixed', 'unit'];
    switch (column.field) {
      // 自动填充计算
      case 'isFixeds': {
        handle.autoFill(menu.value.pageCode, row); // autoFill() 用于批量填充数据，处理多个时间点的数据更新
        break;
      }
      default: {
        // e.g. column.field = '2023', value = 8001(oldValue=8000), row.metricCode = "C10000A0001", row.metricCategory = 0
        if (row.metricCategory === 0 && !d.includes(column.field || '')) {
          const [year, month] = column.field!.split('-');

          // 计算完成后，通过 patchUpdateData() 更新数据池中的数据
          patchUpdateData(row.metricCode, column.field!, value); // 更新数据池中的数据

          // 最终都会通过 autoCalcData() 和 execute() 或 runCalc() 完成数据计算
          if (globalConfig.calcMethod) {
            // 客户端计算, 系统根据 globalConfig.calcMethod 决定使用哪种计算方式
            autoCalcData(row.metricCode, [column.field!]); // autoCalcData()+execute() 是前端计算方式
            // calculateFormulaByRelationData(row.metricCode, [column.field!], cellRelationData)
            execute(); // 执行计算

            // return graph;
          } else {
            const params: any = {
              versionCode: query.versionCode,
              metricCode: row.metricCode,
              reportYear: Number(year),
              value: Number(value),
            };
            switch (instance.value.forecastTimeType) {
              case 'quarter': {
                params.reportQuarter = Number(month);
                break;
              }
              case 'month': {
                params.reportMonth = Number(month);
                break;
              }
            }

            runCalc([params]); // 运行计算, 后端计算方式
          }
        }
      }
    }
  },
  // 保存数据
  async saveData() {
    const submitKeys: string[] = [];
    if (editorRef.value) {
      const el: any = editorRef.value;
      el.getFlatColumns().forEach((item: any) => {
        if (item.columnType === 'calc') {
          submitKeys.push(item.field); // 收集计算列
        }
      });
    }

    const params: any = [];
    // 没有初始化过得，全量保存（暂未兼容月份存储，目前只支持速算模型）
    const isDate = (value: string): boolean => {
      const datePattern = /^(?:\d{4}|\d{4}-\d{1,2})$/;
      return datePattern.test(value);
    };

    for (const code in dataChangedMap) {
      const row = dataChangedMap[code];

      const rowOrigin: any = getDataMap(code);
      const unitParams: any = {
        id: rowOrigin.emmId,
        dataEntries: [],
      };

      for (const attrName in row) {
        // 只存指标数据，不存标题信息
        // (row[attrName] || row[attrName] === 0) &&
        if (code && submitColumns.has(attrName) && attrName !== 'unit') {
          if (isDate(attrName)) {
            const [year, month] = attrName.split('-');
            const p: any = {
              modelCode: rowOrigin?.modelCode,
              metricCode: rowOrigin?.metricCode,
              reportYear: year,
              value: row[attrName],
              versionCode: rowOrigin?.versionCode,
              valueType: presets.value[attrName],
            };
            switch (instance.value.forecastTimeType) {
              case 'quarter': {
                p.reportQuarter = Number(month);
                break;
              }
              case 'month': {
                p.reportMonth = Number(month);
                break;
              }
            }
            const currentId = getDataId(rowOrigin.emmId, attrName);
            if (currentId) {
              p.id = currentId;
            }
            unitParams.dataEntries.push(p); // 添加数据条目
          } else {
            if (attrName === 'scale') {
              unitParams.scale = row[attrName]; // 设置比例
            } else {
              let value: any =
                row[attrName] || row[attrName] === 0 ? row[attrName] : '';
              if (isNumber(value)) {
                value = new Decimal(value).mul(rowOrigin.scale).toNumber(); // 计算实际值
              }

              const p: any = {
                modelCode: rowOrigin?.modelCode,
                metricCode: rowOrigin?.metricCode,
                value,
                versionCode: rowOrigin?.versionCode,
              };
              unitParams.dataEntries.push(p); // 添加数据条目
            }
          }
        }
      }
      params.push(unitParams); // 添加参数
    }
    // return;

    const saveCount = 2000;
    for (let i = 0; i < Math.ceil(params.length / saveCount); i++) {
      const cur =
        params.length - i * saveCount > saveCount
          ? params.slice(i * saveCount, (i + saveCount) * saveCount)
          : params.slice(i * saveCount);

      runSaveData(cur); // 分批保存数据
    }

    reset(); // 重置状态
    // await runSaveConfig({
    //   id: instance.value.id,
    //   isInitialize: 1,
    // });
    await runInstance(); // 重新加载实例, 即 获取模型版本实例信息
  },
  // 提交数据
  submitData() {
    runSaveConfig({
      id: instance.value.id,
      status: 1, // 设置状态为已提交
    });
  },
  testData() {
    // 打开测试对话框
    testDialogVisible.value = true;
  },
  closeTestDialog() {
    testDialogVisible.value = false;
  },
  // 预设变更
  presetsChange() {
    runSaveConfig({
      id: instance.value.id,
      versionConfig: JSON.stringify({
        ...toRaw(instance.value.versionConfig),
        presets: toRaw(presets.value), // 保存预设值
      }),
    });
  },
  // 单元格点击
  cellClick({ column, row }: any) {
    // console.log(row);
    if (column.field === 'metricName' && row.metricCode) {
      const field = instance.value.forecastTimeRange?.split(',')[0];
      const relationAllGraph = getFormulaMap();
      if (relationAllGraph && field) {
        const _id = `${row.metricCode}-${field}`;
        const formula = relationAllGraph[_id as keyof typeof relationAllGraph];
        // console.log(formula);

        if (formula && 'formulaName' in formula) {
          slidePanel.value.data = formula; // 设置公式数据
          slidePanel.value.visible = true; // 显示侧边面板
          fetchMetricInfo(row.metricCode); // 获取指标信息
        }
      }
    } else {
      // const formula = getFormulaMap()[`${row.metricCode}-${column.field}`];
      // if (formula) {
      //   autoCalcData(row.metricCode, [column.field!]);
      // }
    }
  },
  // 关闭侧边面板
  slidePanelClose() {
    slidePanel.value.visible = false;
  },
  // 情景添加
  sceneAdd() {
    sceneData.value.push({
      label: `情景${sceneData.value.length + 1}`,
      value: '',
    });
  },
  // 情景设置删除
  sceneDelete(index: number) {
    if (sceneData.value.length > 1) {
      sceneData.value.splice(index, 1);
    }
  },
  // 提交敏感性分析数据
  submitSensitivityData() {
    // let inputData = [];
    // inputToData.value.map(item => {
    //   item.children.map(child => {
    //     inputData.push(child.label)
    //   })
    // })
    // let outputData = []
    // outputToData.value.map(item => {
    //   item.children.map(child => {
    //     outputData.push(child.label)
    //   })
    // })
    // let data = []
    // sceneData.value.map(item => {
    //   data.push({
    //     sceneName: item.value,
    //     inputData: inputData,
    //     outputData: outputData
    //   })
    // })
  },
};
// 格式化数字，添加千位分隔符
const formatNumberWithCommas = (value: any): string => {
  if (Number.isNaN(value) || value === 'NaN') {
    return 'NaN';
  }
  // 检测是否为数字
  if (typeof value === 'string' && /\d/.test(value)) {
    value = Number(value);
    // eslint-disable-next-line no-unused-vars
    const [_, decimalPart] = value.toString().split('.');
    let formattedNumber = value.toString();
    if (decimalPart && decimalPart.length > 3) {
      formattedNumber = value.toFixed(3);
    }
    const parts = formattedNumber.split('.');
    const prefix = parts[0] || '';
    parts[0] = prefix.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ','); // 添加千位分隔符
    return parts.join('.');
  }
  return value;
};

// 格式化计算标签, 在 <Editor - Column > 中使用
const formatCalcLabel = (row: any, field: string) => {
  if (
    row[field] === undefined ||
    row[field] === '' ||
    row[field] === null ||
    row[field] === '空'
  ) {
    return '';
  }
  if (row[field] === 'NaN') {
    return 'NaN';
  }
  if (row.unit === '%') {
    // 确保值是有效的数字
    const fieldValue = Number(row[field]);
    if (Number.isNaN(fieldValue)) {
      return 'NaN';
    }
    const v = new Decimal(fieldValue).mul(100); // 转换为百分比
    return `${formatNumberWithCommas(`${v.toNumber()}`)}%`;
  }
  return formatNumberWithCommas(`${row[field]}`);
};

// 标签页变更 - 如切换: 假设输入-投资参数、假设输入-标的输入、假设输入-标的支出 ...
const handleTabChange = (data: any) => {
  menu.value.index = data.index;
  menu.value.cur = menu.value.curList[data.index]; // 当前选择的标签对象信息
  menu.value.pageCode = menu.value.cur?.pageCode || ''; // pageCode: "101018602857037826"
};

const registerHotkey = () => {
  hotkeyManager.register('ctrl-z', handle.undo); // 撤销
  hotkeyManager.register('ctrl-shift-z', handle.redo); // 重做
  hotkeyManager.register('ctrl-s', handle.saveData); // 保存
};

// 计算后的公式
const calculatedFormula = computed(() => {
  const { id } = slidePanel.value?.data || {};
  if (!id) return '';
  return getCalculatedFormula(id);
});

// 相关指标列表
const relatedMetrics = computed(() => {
  const { id, marks } = slidePanel.value?.data || {};
  if (!id) return [];
  return getRelatedMetrics(id, marks);
});

// 当前指标值
const currentValue = computed(() => {
  if (!slidePanel.value?.data?.id) return undefined;
  return getCurrentValue(
    slidePanel.value.data.metricCode,
    slidePanel.value.data.id,
  );
});

// 添加公式关系节点的计算属性
const formulaRelationNodes = computed(() => {
  const { id } = slidePanel.value.data;
  if (!id) return [];
  return getFormulaRelationNodes(id);
});

/**
 * 将依赖关系数据转换为D3.js可用的格式
 */
function convertToD3Format(
  cellRelationData: Record<string, any>,
  inDegree: Record<string, number>,
) {
  // 1. 准备节点数据
  console.log('cellRelationData =', cellRelationData);

  const nodes = Object.keys(cellRelationData).map((id) => ({
    id,
    name: cellRelationData[id].metricName || id,
    inDegree: inDegree[id] || 0,
    value: cellRelationData[id].value,
    formula: cellRelationData[id].formula?.formula || '',
    field: cellRelationData[id]?.formula?.field || '',
    // 可以根据入度设置节点大小
    size: (inDegree[id] || 0) + 1,
  }));

  // 2. 准备边数据
  const links: Array<{ source: string; target: string; type: string }> = [];
  const specialSource = new Set([
    'arrayAllDate',
    'arrayAllValue',
    'everyPeriod',
    'everyPeriods',
    'global',
    'periodAdd',
    'periodMonths',
    'periodNumber',
    'prev',
    'prevPeriodAdd',
    'targetIndustry',
    'total',
    'totalYear',
    'var',
  ]);

  Object.entries(cellRelationData).forEach(([id, data]) => {
    // 添加依赖关系边
    (data.dependencies || []).forEach((depId: string) => {
      if (depId && id) {
        const prefix1 = depId?.split('-')[0] || '';
        const prefix2 = id?.split('-')[0] || '';
        if (!specialSource.has(prefix1) && !specialSource.has(prefix2)) {
          links.push({
            source: depId,
            target: id,
            type: 'dependency',
          });
        }
      }
    });
  });

  // 3. 返回D3.js可用的数据格式
  return {
    nodes,
    links,
  };
}

function convertToD3FormatForRelationData(cellRelationData) {
  const links: Array<{ source: string; target: string; type: string }> = [];
  const specialSource = new Set([
    /* 特殊源列表 */
  ]);

  const nodes = Object.keys(cellRelationData).map((id) => ({
    id,
    name: cellRelationData[id].metricName || id,
    value: cellRelationData[id].value,
    formula: cellRelationData[id].formula?.formula || '',
    field: cellRelationData[id]?.formula?.field || '',
    size: (cellRelationData[id].dependencies?.length || 0) + 1,
  }));

  Object.entries(cellRelationData).forEach(([id, data]) => {
    (data.dependencies || []).forEach((depId: string) => {
      if (depId && id) {
        const prefix1 = depId?.split('-')[0] || '';
        const prefix2 = id?.split('-')[0] || '';
        if (!specialSource.has(prefix1) && !specialSource.has(prefix2)) {
          links.push({
            source: depId,
            target: id,
            type: 'dependency',
          });
        }
      }
    });
  });

  return {
    nodes,
    links,
  };
}

/**
 * 对 cellRelationData 进行拓扑排序，返回可计算的顺序。
 * 如有循环依赖，返回详细的错误信息。
 *
 * 注: 某个id依赖别人，它的入度是 0，它被别人依赖时, 入度才会增加;
 *    如: C10000A0039-2025 的 dependencies 是 ["C10000A0040-2025", "C10000A0038-2025"], 所以它的入度应该是 0（它被谁依赖？如果没有其他节点依赖它，它的入度就是 0）,
 *        但实际上，它依赖别人，它的入度是 0，它被别人依赖时入度才会增加。
 */
function topologicalSortCellRelationData(
  cellRelationData: Record<string, any>,
) {
  // 1. 构建依赖图
  const graph: Record<string, string[]> = {};
  Object.keys(cellRelationData).forEach((cellId) => {
    graph[cellId] = cellRelationData[cellId].dependencies || [];
  });

  // 2. 计算入度(入度 = 被多少个节点依赖, 也就是有多少个“箭头”指向它。)
  const inDegree: Record<string, number> = {};
  Object.keys(graph).forEach((id) => (inDegree[id] = 0)); // 初始化所有节点的入度为0

  // 统计每个节点被依赖的次数
  Object.entries(graph).forEach(([id, deps]) => {
    if (id) {
      // 如: graph = { "C10000A0039-2025": ["C10000A0040-2025", "C10000A0038-2025"], ... }, 对每个依赖执行 inDegree[depId]++,
      // 即 inDegree["C10000A0040-2025"]++ 和 inDegree["C10000A0038-2025"]++
      deps.forEach((depId) => {
        if (inDegree[depId] !== undefined) {
          // 防止访问未定义的节点导致错误, 确保只对存在于 inDegree 中的节点增加入度
          inDegree[depId]++;
        }
      });
    }
  });

  console.log('[被别人依赖] inDegree =', inDegree);

  // 检查哪些节点依赖了 C10000A0038-2033
  const targetId = 'C10000A0038-2033';
  const dependers = Object.entries(graph)
    .filter(([deps]) => deps.includes(targetId)) // id,
    .map(([id]) => id);
  console.log(`依赖 ${targetId} 的节点有:`, dependers);
  console.log(`inDegree[${targetId}] =`, inDegree[targetId]);

  // 使用 D3.js 的力导向图(Force-Directed Graph)来可视化这些依赖关系
  // 在计算完入度后，转换数据格式
  const d3Data = convertToD3Format(cellRelationData, inDegree);
  // const mermaidData = convertToMermaidFormat(cellRelationData);
  // const cytoscapeData = convertToCytoscapeFormat(cellRelationData, inDegree);

  // 输出转换后的数据
  console.log('D3.js 数据格式:', d3Data);
  // console.log('Mermaid.js 数据格式:', mermaidData);
  // console.log('Cytoscape.js 数据格式:', cytoscapeData);

  // 3. BFS拓扑排序
  const queue: string[] = [];
  Object.keys(inDegree).forEach((id) => {
    if (inDegree[id] === 0) queue.push(id);
  });

  console.groupCollapsed('BFS拓扑排序:');
  console.log('queue: ', queue);
  console.log('inDegree: ', inDegree);
  console.groupEnd();

  const result: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    result.push(id);

    const dependents = cellRelationData[id]?.dependents || [];
    dependents.forEach((depId: string) => {
      if (inDegree[depId] !== undefined) {
        inDegree[depId]--;
        // 每弹出一个单元格，更新它的 dependents 的入度，入度变0的再入队。直到所有单元格都排序完毕
        if (inDegree[depId] === 0) {
          queue.push(depId);
        }
      }
    });
  }

  // 4. 检查是否有环
  if (result.length !== Object.keys(graph).length) {
    // 有环，找出所有入度>0的节点
    const cycleNodes = Object.keys(inDegree).filter(
      (id) => inDegree[id] !== undefined && inDegree[id] > 0,
    );
    return {
      success: false,
      order: result,
      cycle: cycleNodes,
      message: `检测到循环依赖，涉及节点: ${cycleNodes.join(', ')}`,
    };
  }

  // 5. 返回排序结果
  return {
    success: true,
    order: result,
  };
}

// 测试 window.all 里的关系所有节点的关系构建
const testAll = () => {
  // const _all = (window as any).all || {};
  // const keys = Object.keys(_all) || [];
  // const keyLength = keys.length;

  // const iLen = 2; // keyLength
  // const field = '2025';

  // if(keyLength>0){

  //   for(let i=0; i<iLen; i++) {
  //     const key: string | undefined = keys[i];
  //     if(key) {
  //       const item = _all[key];
  //       if(item) {
  //         // console.log('item = ', item);
  //         const { metricCode, metricName } = item
  //         // console.log(metricCode, ', ', metricName);

  //         const id = metricCode + '-' + field;
  //         const _formula = (window as any).formula || {};
  //         let formulaName = '';
  //         if(_formula) {
  //           // const {calcMarks, formula, formulaDescription, formulaName } = _formula[id];
  //           // console.log(metricCode, metricName, calcMarks, formula, formulaDescription, formulaName)
  //           formulaName = _formula[id]?.formulaName;
  //         }
  //         const graph = getUpdateGraph(metricCode, [field]);
  //         console.log('metricCode: ', metricCode, ', metricName = ', metricName, ', graph = ', graph, ', formulaName = ', formulaName);
  //       }
  //     }
  //   }
  // }

  // 获取特定指标的所有数据
  // const getMetricData = (metricCode: string) => {
  //   return getDataMap(metricCode);
  // };

  // 1. 获取当前页面的所有数据
  // const currentPageData = sheetData[menu.value.pageCode] || [];

  // currentPageData 以 'metricCode + "-" + field' 为key, window.all[metricCode] 为value 保存
  // const newPageData = currentPageData.filter(item=>{
  //   const code = item.metricCode;
  //   if(_all[code]){
  //     return {code: _all[code]}
  //   }
  // });

  // console.log('newPageData = ', newPageData);

  // 2. 获取当前页面的列配置
  // const currentColumns = sheetColumn[menu.value.pageCode] || [];

  // 3. 获取表格实例的详细信息
  // const cellsInfo = getAllCellsInfo();
  // console.log(cellsInfo, ', len: ', Object.keys(cellsInfo).length);

  // 4. 获取已修改的数据
  // const changedData = dataChangedMap;

  // 5. 获取特定指标的数据
  // const metricData = getDataMap('specific-metric-code');

  // cellsInfo 保存了当前表格所有单元格的数据(其格式是: {公式id:单元格信息}), window.formula[公式id]获取对应公式, 根据以上已知条件, 生成单元格关系数据

  // 用法
  // const cellRelationData = getCellRelationData();
  
  const cellRelationData = getCellRelationData(
    modelStore.sheetColumn,
    sheetData,
    menu.value.pageCode,
    getFormulaMap(),
  );
  
  console.log(cellRelationData);

  const d3Data = convertToD3FormatForRelationData(cellRelationData);
  console.log('[cellRelationData] D3.js 数据格式:', d3Data);

  // 你可以 JSON.stringify(cellRelationData, null, 2) 导出为标准json

  // (window as any).cellRelationData = cellRelationData;

  const topoResult = topologicalSortCellRelationData(cellRelationData);
  if (topoResult.success) {
    // topoResult.order 是可计算的单元格顺序
    console.log('可计算顺序:', topoResult.order);

    // debugger

    // 你可以按顺序依次计算每个单元格
    // topoResult.order.forEach(cellId => {
    //   calculateFormulaByRelationData(cellId, [], cellRelationData);
    // });
  } else {
    // 处理循环依赖
    console.error(topoResult.message);
    // 你可以在UI上提示用户
  }
};

// 组件挂载时执行
onMounted(async () => {
  await modelStore.fetchAllList(); // 获取所有列表(获取模型、项目、币种、投资公司、脚本公式列表)
  await runInstance(); // 获取模型版本实例信息, 更新 instance.value, 因instance.value有数据更新, 对应的globalConfig也要更新
  await runMenu({ modelCode: instance.value.modelCode }); // getModelMenu -> 获取菜单数据

  // getColumns() 更新会影响到表格的显示结构、数据展示和编辑功能，是表格功能正常工作的基础配置
  getColumns(); // 获取表格列配置, 包括: analysisColumns(数据分析视图列) 和 commonColumns(数据编辑视图列)

  /*
    数据池的填充主要发生在：
      1. 初始化阶段 - addSheetTemp 函数: setData(node.metricCode, JSON.parse(JSON.stringify(rest)));
        这是数据池的第一次填充，发生在加载页面模板时。每个非标题节点（即实际指标数据）都会被添加到数据池中

        注: addSheetTemp 函数 同时保存数据页面池(pagePool -> setSheetData(code, data) )

      2. 数据加载阶段 - loadSheetData 函数,
        * 数据池的第二次填充，发生在加载实际数据时。它会更新数据池中已有的数据。
        const cur = getData(item.metricCode);
        if (cur) {
          // 如果数据已存在，则合并更新
          Object.assign(cur, item);
          patchUpdateSheetRowData(item.metricCode, item);
        }

      3. 数据更新阶段 - patchUpdateData 函数: 
        这是数据池的持续更新阶段，发生在 用户修改数据 或 系统计算更新数据 时。
  */
  await loadAllTemp(); // 加载所有模板
  await runLoadData(); // 加载数据

  await runInstanceDataId(); // 获取实例数据ID

  // runFormula -> addRelationData 函数将处理后的公式和依赖关系信息主要存储在 formulaMap 这个响应式引用中。
  // formulaMap 是通过 useRelationPool hook 创建和管理的。所以，公式和它们构建的依赖关系图存储在 useRelationPool 管理的数据结构 (formulaMap) 中。
  // 计算引擎 (useCalculate): hooks.ts 中引入了 useCalculate，它接收 formulaMap 作为参数。
  await runFormula(); // 加载公式

  globalConfig.isLoad = true; // 设置加载完成
  registerHotkey(); // 注册快捷键

  testAll(); // 测试 window.all 里的关系所有节点的关系构建
});
</script>

<template>
  <div
    class="page"
    v-loading="instanceLoading || saveLoading || !globalConfig.isLoad"
  >
    <div class="wrap">
      <div class="top_info">
        <div class="info_title">基础信息</div>
        <el-row class="info_content">
          <el-col :lg="6" :md="6" class="info_item">
            <span class="info__label"> 投资类型： </span>
            {{ baseInfo.investmentType }}
          </el-col>
          <el-col :lg="6" :md="6" class="info_item">
            <span class="info__label"> 模型类型： </span>
            {{ baseInfo.modelType }}
          </el-col>
          <el-col :lg="6" :md="6" class="info_item">
            <span class="info__label"> 版本名称： </span>
            {{ baseInfo.versionName }}
          </el-col>
          <el-col :lg="6" :md="6" class="info_item">
            <span class="info__label"> 专业化公司： </span>
            {{ baseInfo.investmentSubject }}
          </el-col>
          <el-col :lg="6" :md="6" class="info_item">
            <span class="info__label"> 预测时间： </span>
            {{ baseInfo.timePeriod }}
          </el-col>

          <el-col :lg="6" :md="6" class="info_item">
            <span class="info__label"> 项目名称： </span>
            {{ baseInfo.projectName }}
          </el-col>
          <el-col :lg="6" :md="6" class="info_item">
            <span class="info__label"> 货币类型： </span>
            {{ baseInfo.currencyName }}
          </el-col>
          <el-col
            v-if="instance.modelType === '速算模型'"
            :lg="6"
            :md="6"
            class="info_item"
          >
            <span class="info__label">目标行业：</span>
            {{ baseInfo.targetIndustry }}
          </el-col>
        </el-row>
      </div>
      <div class="main">
        <div class="tools">
          <el-radio-group
            v-if="menu.calcList.length > 0 && menu.fillList.length > 0"
            v-model="menuType"
            class="tool-left"
            size="small"
            @change="handle.menuTypeChange"
          >
            <el-radio-button :value="false">参数输入</el-radio-button>
            <el-radio-button :value="true">参数输出</el-radio-button>
          </el-radio-group>
          <el-button
            v-if="menu.cur?.pageCode === '101018602857037828'"
            size="small"
            type="primary"
            @click="handle.dialogShow"
          >
            敏感性分析
          </el-button>
        </div>
        <div class="content">
          <div class="operate_area">
            <el-space direction="vertical">
              <el-tooltip
                v-if="globalConfig.isUndo"
                content="撤销"
                effect="dark"
                placement="left"
              >
                <el-button
                  circle
                  class="operate_box revoke_box"
                  size="small"
                  type="primary"
                  @click="handle.undo"
                />
              </el-tooltip>
              <el-tooltip
                v-if="globalConfig.isRedo"
                content="重做"
                effect="dark"
                placement="left"
              >
                <el-button
                  circle
                  class="operate_box redo_box"
                  size="small"
                  type="primary"
                  @click="handle.redo"
                />
              </el-tooltip>
              <el-tooltip
                v-if="globalConfig.isImport"
                content="导入"
                effect="dark"
                placement="left"
              >
                <el-button
                  circle
                  class="operate_box import_box"
                  size="small"
                  type="primary"
                  @click="handle.importData"
                />
              </el-tooltip>
              <el-tooltip
                v-if="globalConfig.isExport"
                content="导出"
                effect="dark"
                placement="left"
              >
                <el-button
                  circle
                  class="operate_box export_box"
                  size="small"
                  type="primary"
                  @click="handle.exportData"
                />
              </el-tooltip>
              <el-tooltip
                v-if="!globalConfig.calcMethod"
                content="计算"
                effect="dark"
                placement="left"
              >
                <el-button
                  circle
                  class="operate_box compute_box"
                  size="small"
                  type="primary"
                  @click="handle.calculateData"
                />
              </el-tooltip>
              <el-tooltip
                v-if="globalConfig.calcMethod"
                content="保存"
                effect="dark"
                placement="left"
              >
                <el-button
                  :disabled="!isChanged"
                  circle
                  class="operate_box save_box"
                  size="small"
                  type="primary"
                  @click="handle.saveData"
                />
              </el-tooltip>
              <el-tooltip content="提交" effect="dark" placement="left">
                <el-button
                  :disabled="instance.isInitialize === 1"
                  circle
                  class="operate_box submit_box"
                  size="small"
                  type="primary"
                  @click="handle.submitData"
                />
              </el-tooltip>

              <el-tooltip
                v-if="globalConfig.calcMethod"
                content="测试"
                effect="dark"
                placement="left"
              >
                <el-button
                  :disabled="false"
                  circle
                  class="operate_box compute_box"
                  size="small"
                  type="primary"
                  @click="handle.testData"
                />
              </el-tooltip>
            </el-space>
          </div>
          <div class="box">
            <div class="menu">
              <el-tabs
                v-model="menu.pageCode"
                style="height: 100%"
                tab-position="left"
                @tab-click="handleTabChange"
              >
                <el-tab-pane
                  v-for="item in menu.curList"
                  :key="item.pageCode"
                  :label="item.pageName"
                  :name="item.pageCode"
                  style="height: 100%"
                />
              </el-tabs>
            </div>
            <div
              :style="menu.curList.length <= 2 ? 'width: 100%' : ''"
              class="editor"
            >
              <div class="editor-wrap">
                <div class="box">
                  <Editor
                    ref="editorRef"
                    v-model:presets="presets"
                    :change-data="dataChangedMap"
                    :columns="sheetColumn[menu.pageCode]"
                    :data="sheetData[menu.pageCode] || []"
                    :is-edit="true"
                    :page-code="menu.pageCode"
                    :tree-config="{
                      rowField: `${menu.pageCode}-id`,
                      parentField: `${menu.pageCode}-pid`,
                      expandAll: true,
                      transform: true,
                      reserve: true,
                    }"
                    @cell-click="handle.cellClick"
                    @change="handle.cellChange"
                    @presets-change="handle.presetsChange"
                  >
                    <template #unitDefault="{ row }">
                      <span>{{
                        getUnitLabel(
                          getUnitSelectConfig(row.unit),
                          row.scale,
                        ) || row.unit
                      }}</span>
                    </template>
                    <template #unitEdit="{ row }">
                      <ZlSelect
                        v-if="getUnitSelectConfig(row.unit)"
                        :key="row.id"
                        v-model="row.scale"
                        popper-class="vxe-table--ignore-clear"
                        @change="
                          (val: any, olcValue: any) =>
                            handle.unitChange(val, olcValue, row)
                        "
                      >
                        <el-option
                          v-for="item in getUnitSelectConfig(row.unit)"
                          :key="item.value"
                          :label="item.label"
                          :value="`${item.value}`"
                        />
                      </ZlSelect>
                      <span v-else>{{
                        getUnitLabel(
                          getUnitSelectConfig(row.unit),
                          row.scale,
                        ) || row.unit
                      }}</span>
                    </template>
                    <template #calcDefault="{ row, column }">
                      <span>{{ formatCalcLabel(row, column.field) }}</span>
                    </template>
                  </Editor>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-drawer
        v-model="drawerVisible"
        title="指标详情"
        @close="handle.drawerClose"
      >
        <span>{{ state.current.name }}</span>
      </el-drawer>
      <el-dialog
        v-model="dialogVisible"
        title="敏感性分析参数"
        width="680"
        @close="handle.dialogClose"
      >
        <div class="dialog-content">
          <div class="module-box">
            <div class="module-title">输入指标</div>
            <div class="module-content">
              <TreeTransfer
                v-model:from-data="inputFromData"
                v-model:to-data="inputToData"
                ,
                :default-props="{
                  id: 'id', // 节点id
                  parentId: 'parentId', // 父节点id
                  label: 'label',
                  children: 'children',
                  disabled: 'disabled',
                }"
                :title-list="['源列表', '目标列表']"
                root-pid="0"
              />
            </div>
          </div>
          <div class="module-box">
            <div class="module-title">输出指标</div>
            <div class="module-content">
              <TreeTransfer
                v-model:from-data="outputFromData"
                v-model:to-data="outputToData"
                ,
                :default-props="{
                  id: 'id', // 节点id
                  parentId: 'parentId', // 父节点id
                  label: 'label',
                  children: 'children',
                  disabled: 'disabled',
                }"
                :title-list="['源列表', '目标列表']"
                root-pid="0"
              />
            </div>
          </div>
          <div class="module-box">
            <div class="module-title">情景设置</div>
            <div class="scene-module">
              <div
                v-for="(item, index) in sceneData"
                :key="index"
                class="scene-item"
              >
                <div>情景{{ index + 1 }}：</div>
                <el-input
                  v-model="item.value"
                  class="input-box"
                  placeholder="请输入"
                />
                <el-button
                  :disabled="sceneData.length > 1 ? false : true"
                  size="small"
                  type="danger"
                  @click="handle.sceneDelete(index)"
                >
                  删除
                </el-button>
              </div>
              <div class="scene-add-box">
                <div class="scene-add" @click="handle.sceneAdd">+ 添加</div>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button type="primary" @click="handle.submitSensitivityData">
              确定
            </el-button>
            <el-button @click="handle.dialogClose">取消</el-button>
          </div>
        </template>
      </el-dialog>
    </div>
    <el-drawer
      v-model="slidePanel.visible"
      :title="`${slidePanel.data.formulaName}`"
      size="65%"
      @close="handle.slidePanelClose"
    >
      <div class="panel__title">指标描述</div>
      <el-divider />
      <div class="panel__title">指标code</div>
      <div class="panel__content">
        {{ slidePanel.data.metricCode }}
      </div>
      <el-divider />
      <div class="panel__content">
        {{ description }}
      </div>
      <div class="panel__title">计算逻辑</div>
      <el-divider />
      <div class="panel__content">
        {{ slidePanel.data.formulaDescription }}
      </div>

      <el-divider />

      <div class="panel__title">公式详情</div>
      <el-divider />
      <div class="panel__content formula-details">
        <div class="formula-expression">
          <strong>原始公式表达式：</strong> {{ slidePanel.data.formula }}
        </div>
        <div v-if="calculatedFormula" class="formula-calculated">
          <strong>计算后公式：</strong> {{ calculatedFormula }} =
          {{ currentValue }}
        </div>

        <div class="formula-metrics">
          <div class="metrics-title">相关指标：</div>
          <el-table
            :data="relatedMetrics"
            border
            style="width: 100%; margin-top: 10px"
          >
            <el-table-column label="指标Code" prop="code" width="120" />
            <el-table-column label="指标名称" prop="name" width="220" />
            <el-table-column label="当前值" prop="value" />
          </el-table>
        </div>

        <!-- 新增公式关系指标节点展示 -->
        <div class="formula-relations">
          <div class="metrics-title">公式关系指标节点：</div>
          <el-tree
            :data="formulaRelationNodes"
            :props="{
              label: (data: object) => {
                const prefix = ''.padStart(data.level * 2, '  ');
                let label = `${prefix}${data.name} (${data.code})`;
                if (data.formula) {
                  label += ` , 公式: ${data.formula}`;
                }
                if (data.value !== undefined) {
                  label += ` = ${data.value}`;
                }
                return label;
              },
            }"
            default-expand-all
          />
        </div>
      </div>
    </el-drawer>
    <el-dialog
      v-model="testDialogVisible"
      :before-close="handle.closeTestDialog"
      title="公式计算测试工具"
      width="80%"
    >
      <FormulaTestPanel
        :formula-map="getFormulaMap()"
        :get-calculated-formula="getCalculatedFormula"
        :get-current-value="getCurrentValue"
        :get-data="getDataMap"
        :get-related-metrics="getRelatedMetrics"
        :get-value="getValue"
        :global-config="globalConfig"
      />
    </el-dialog>
  </div>
</template>

<style scoped lang="less">
.page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
  .wrap {
    background-color: hsl(var(--sidebar));
    width: 100%;
    height: 100%;
    border-radius: 10px;
    border-width: 1px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 10px 10px;
    .top_info {
      width: 100%;
      font-size: 12px;
      .info_title {
        font-size: 14px;
        font-weight: bold;
        color: #61a6f2;
      }
      .info_content {
        padding: 5px 10px;
        .info_item {
          padding: 5px 0;
          white-space: nowrap;
          .info__label {
            font-weight: bold;
          }
        }
      }
    }
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      .tools {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        .tool-left {
          margin-left: 20px;
          justify-content: center;
        }
      }
      .content {
        position: relative;
        flex: 1;
        .operate_area {
          position: absolute;
          right: 0;
          bottom: 0;
          z-index: 999;
          .operate_box {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-size: contain;
            border: none;
          }
          .revoke_box {
            background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Frevoke.png');
            &:hover {
              background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Frevoke_light.png');
            }
          }
          .redo_box {
            background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fredo.png');
            &:hover {
              background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fredo_light.png');
            }
          }
          .import_box {
            background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fimport.png');
            &:hover {
              background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fimport_light.png');
            }
          }
          .export_box {
            background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fexport.png');
            &:hover {
              background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fexport_light.png');
            }
          }
          .compute_box {
            background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fcompute.png');
            &:hover {
              background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fcompute_light.png');
            }
          }
          .save_box {
            background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fsave.png');
            &:hover {
              background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fsave_light.png');
            }
          }
          .submit_box {
            background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fsubmit.png');
            &:hover {
              background-image: url('https://cofco001-1308084433.cos.ap-beijing.myqcloud.com/image%2FeconomicModel%2Fsubmit_light.png');
            }
          }
        }
        :deep(.el-tabs__nav-wrap.is-left) {
          width: auto;
          .el-tabs__nav.is-left {
            width: 100%;
          }
        }
        .editor {
          position: relative;
          width: calc(100% - 200px);
          height: 100%;
          display: inline-flex;
          flex-direction: column;
          .editor-tool {
            text-align: right;
          }
          .editor-wrap {
            position: relative;
            flex: 1;
            :deep(.el-select__wrapper) {
              min-height: 28px;
            }
          }
        }
      }
      .menu {
        display: inline-block;
        width: 200px;
        height: 100%;
      }
      .box {
        position: absolute;
        top: 0;
        bottom: 0;
        right: 0;
        left: 0;
        .tabs_box {
        }
        .table_box {
          flex: 1;
          overflow: hidden;
        }
      }
    }
  }
  .panel__title {
    margin: 15px 0;
    font-weight: bold;
  }
  .panel__content {
    font-size: 14px;
    min-height: 20px;

    .formula-details {
      margin-top: 16px;
    }

    .formula-expression,
    .formula-calculated,
    .formula-result {
      margin-bottom: 16px;
      word-break: break-all;
    }

    .metrics-title {
      font-weight: bold;
      margin-bottom: 8px;
    }

    .formula-metrics {
      margin-top: 16px;
      margin-bottom: 16px;
    }
  }
}
.cell-content {
  position: relative;
  padding-right: 40px;
}

.is-autofill:hover {
  background-color: #f5f7fa;
}

.arrow {
  position: absolute;
  top: 50%;
  font-size: 16px;
  color: #409eff;
  cursor: pointer;
  transform: translateY(-50%);
}

.copy-arrow,
.undo-arrow {
  position: absolute;
  font-size: 16px;
  color: #409eff;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.copy-arrow {
  right: 20px;
}

.undo-arrow {
  right: 4px;
}

.copy-arrow:focus,
.undo-arrow:focus {
  border-radius: 2px;
  outline: 2px solid #409eff;
}
.dialog-content {
  max-height: 450px;
  overflow: hidden;
  overflow-y: auto;
  .module-box {
    font-size: 12px;
    .module-title {
      font-size: 14px;
      margin-bottom: 10px;
    }
    .module-content {
      display: flex;
      justify-content: center;
      margin-bottom: 10px;
    }
    .scene-module {
      .scene-item {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        .input-box {
          width: 280px;
          padding: 0 10px;
          box-sizing: border-box;
        }
      }
      .scene-add-box {
        display: flex;
        .scene-add {
          color: #409eff;
          cursor: pointer;
        }
      }
    }
  }
}
.dialog-footer {
  display: flex;
  justify-content: center;
}

.formula-relations {
  margin-top: 20px;

  :deep(.el-tree-node__content) {
    height: auto;
    padding: 8px 0;
    white-space: pre-wrap;
    line-height: 1.5;
  }

  :deep(.el-tree-node__label) {
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
