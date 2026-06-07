<script setup>
// import type { VxeTableInstance } from '#/adapter/vxe-table'; // 导入在线表格插件

// 导入Vue相关依赖
import { computed, h, onMounted, ref, toRaw } from 'vue';
import { useRequest, useToggle } from 'vue-hooks-plus';
import { useRoute } from 'vue-router';

// 导入第三方库
import Decimal from 'decimal.js'; // 科学计算三方插件
import { ElNotification } from 'element-plus';
import TreeTransfer from 'tree-transfer-vue3';

// 导入API方法
import {
  // 计算接口
  getFormulaList, // 获得版本所有指标计算公式
  getInstance, // 获得单个实例信息（模型的）
  getInstanceData, // 获得单个版本实例数据
  getInstanceDataId, // 获取指标信息
  getModelMenu, // 获得模型表单的列表modeCode
  getModelTemplate, // 获得表里模型指标配置
  saveInstanceData,
} from '#/api/index';

// 导入组件
import ZlSelect from '#/component/select/index.vue';
import { useModelStore } from '#/store/index';

import Editor from './editor.vue'; // 表格核心文件
import { useCalcEngine } from './hooks'; // 数据引擎核心文件 hooks.ts 里的大部分功能都被开启
import { getUnitSelectConfig } from './unit';
import { getQuarter, isNumber } from './utils';

// 表格编辑器引用
const editorRef = ref(); // <VxeTableInstance>

// 使用模型存储
const modelStore = useModelStore(); // 注: 在 onMounted(async () => { 中 有对  await modelStore.fetchAllList(); // 获取所有列表 加载
const { sheetColumn } = modelStore; // sheetColumn 表格列数据

// 版本实例数据
const instance = ref({
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
  getDataMap, // 获取数据映射
  initGlobalConfig, // 初始化全局配置
  addSheetTemp, // 添加表格模板
  loadSheetData, // 加载表格数据
  addRelationData, // 添加关联数据
  autoCalcData, // 自动计算数据
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
  getDependencies, // 获取依赖
} = useCalcEngine(instance); // From: './hooks.ts‘

// 菜单类型 (参数输入/参数输出)
const menuType = ref(false);

// 抽屉可见性控制
const drawerVisible = ref(false);
const [drawerVisibleHandle] = useToggle(drawerVisible);
// const [drawerVisible, drawerVisibleHandle] = useToggle();

// 侧边面板数据
const slidePanel = ref({ visible: false, data: {} });

// 路由
const route = useRoute();
const query = route.query; // as unknown as Query;

/* 
  预设数据(前缀), 如: presets = [{2025:'A'},{2026:'F'}, {2027:'F'},...,{2044:'F'}]
  注: 
    - getColumns(设置预设值: presets.value = versionPresets || commonPresets.value;)
    - autoFill(遍历presets->patchUpdateData()更新数据)
    - saveData(读取presets.value[attrName])
    - 在html中读取: <Editor v-model:presets="presets".../>、
*/
const presets = ref({}); // <EditorTs.Presets>

// 状态数据
const state = ref({
  current: '',
  insertConfig: {}, // 插入配置
});

// 计算基础信息, 这个计算属性的作用是：数据转换和格式化、返回对象：包含所有处理后的数据
// 在模板中可以直接使用 baseInfo 的属性，如 {{ baseInfo.investmentType }} 计算属性会自动追踪依赖，当依赖变化时自动更新
const baseInfo = computed(() => {
  // 从 instance.value 中解构出需要的属性
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
    timePeriod = `${start[0]}Q${getQuarter(Number(start[1]))}-${end[0]}Q${getQuarter(Number(end[1]))}`;
  }

  // ----------------------- 从 modelStore 中查找相关数据 -----------------------
  // 1. 获取投资主体名称(投资公司列表 中find)
  const investmentSubjectName = modelStore?.investList.find(
    (item) => item.investCode === investmentSubject,
  )?.investName;

  // 2. 获取货币名称 (币种列表 中find)
  const currencyName = modelStore?.currencyList.find(
    (item) => item.currencyCode === currencyCode,
  )?.currencyName;

  // 3. 获取项目名称 (项目列表 中find)
  const projectName = modelStore?.projectList.find(
    (item) => item.projectCode === projectCode,
  )?.projectName;
  // --------------------------------------------------------------------------

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
const menu = ref({
  type: 'fill', // 默认类型为填充
  pageCode: '', // 页面代码
  index: 0, // 索引
  curList: [], // 当前列表
  fillList: [], // 填充列表
  calcList: [], // 计算列表
});

// 获取菜单数据
const { runAsync: runMenu } = useRequest(getModelMenu, {
  manual: true, // 手动触发
  onSuccess(data) {
    // 处理菜单数据, 根据 modelType(0 或 1) 分开 参数输入 和 参数输出 2种数据分组
    for (const ele of data) {
      if (ele.modelType === 0) {
        menu.value.fillList.push(ele); // 添加到填充列表
      } else {
        menu.value.calcList.push(ele); // 添加到计算列表
      }
    }
    // if (menu.value?.fillList && menu.value.fillList?.length < 1) {
    //   console.warn('参数输入-填充列表获取数据失败!');
    // }
    // if (menu.value?.calcList && menu.value.calcList?.length < 1) {
    //   console.warn('参数输出-计算列表获取数据失败!');
    // }

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
      /*
        res = [
          {
            "opTime": "2025-04-08 17:17:31",
            "id": "01jrab1gw73c26tmayes54g6r5",
            "versionName": "test-henry-02",
            "versionCode": "81B9CFAD88EE48729BAAE7D2EACEEE44",
            "currencyCode": "USD",
            "forecastTimeType": "quarter",
            "forecastTimeRange": "2025-4,2044-7",
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
        "metricName": "人均成本（固定）",
        "metricCode": "F300030100009999999",
        "pMetricCode": "F300026100009999999",
        "level": 3,
        "unit": "元/人",
        "sort": 60,
        "scale": "1"
      }
    */
    const res = await getInstanceDataId({
      versionCode: instance.value.versionCode, // 版本代码
    });

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
      /*
        2. 数据处理: 在请求成功后，通过 addRelationData(res) 将获取到的公式数据添加到关系数据池中
        这些公式数据用于后续的计算和依赖关系管理
      */
      // ??? 添加关联数据 useCalcEngine -> res + setRelationData(code, data) 同时保存关系数据池(relationPool)
      addRelationData(res);
    },
  },
);

// // 指标描述
// const description = ref('');

// // 获取指标信息
// async function fetchMetricInfo(code) {
//   const res = await getMetricInfo({
//     metricCode: code, // 指标代码
//   });
//   description.value = res.length > 0 ? res[0].metricDescription : ''; // 设置指标描述
// }

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

// // 更该版本实例信息
// const { runAsync: runSaveConfig } = useRequest(updateInstanceConfig, {
//   manual: true, // 手动触发
// });

// 加载实例数据
const { runAsync: runLoadData } = useRequest(
  // 调用 getInstanceData API，传入 versionCode 参数，获取当前版本实例的数据。
  () => getInstanceData({ versionCode: instance.value.versionCode }),
  {
    manual: true, // 手动触发
    // 在请求成功后，对返回的数据进行处理，包括单位转换、数据格式调整等，最终调用 loadSheetData 将处理后的数据加载到表格中。
    onSuccess(res) {
      const updatedData = [];
      // 数据处理：遍历返回的数据数组，对每个数据项进行处理：
      res.forEach((item) => {
        const obj = {};

        // 如果单位是“年”，则将 scale 设置为 1。
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

      // console.log(
      //   '=========== 加载实例数据 runLoadData -> loadSheetData(updatedData) = ',
      //   updatedData,
      // );

      // updatedData: [
      //  {
      //    scale: '1', level: 1, emmId: '01jrcsa14kmpt50twyjb0a39dn', sort: 2, unit: "元/吨"
      //    metricName: '半干面生鲜面粉', metricCode: 'F300003100003999999', pMetricCode: '0'
      //  }
      // ]

      // 将处理后的数据通过 loadSheetData 加载到表格中。
      loadSheetData(updatedData); // 加载表格数据
    },
  },
);

// 计算实例数据 --- 后端计算
const { runAsync: runCalc } = useRequest(
  (params) => {
    const fetchList = params.map((param) => calcInstance(param)); // 计算每个参数
    return Promise.all(fetchList);
  },
  {
    manual: true, // 手动触发
    onSuccess(res) {
      const updatedDataMap = {};
      res.forEach((dataList) => {
        dataList.forEach((item) => {
          const indicator = updatedDataMap[item.metricCode];
          if (indicator) {
            indicator[item.yeaReportMonths] = item.values; // 更新已有指标数据
          } else {
            updatedDataMap[item.metricCode] = {
              [item.yeaReportMonths]: item.values, // 创建新指标数据
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
    const { fillList, calcList } = menu.value;
    // const fetchList: Promise<any>[] = [];

    // 构建请求列表：遍历这两个列表中的每一个页面信息（item），为每个页面构建一个调用 getModelTemplate API 的请求。
    // 这个 API 请求需要 versionCode、modelCode 和 pageCode 作为参数，目的是获取该页面的具体模板结构（例如列定义、初始行等）。
    const fetchList = [];
    fillList.forEach((item) => {
      fetchList.push(
        getModelTemplate({
          versionCode: query.versionCode,
          modelCode: item.modelCode,
          pageCode: item.pageCode,
        }),
      );
    });
    calcList.forEach((item) => {
      fetchList.push(
        getModelTemplate({
          versionCode: query.versionCode,
          modelCode: item.modelCode,
          pageCode: item.pageCode,
        }),
      );
    });

    // Promise.all 返回数据如:
    // {"opUser":"","opTime":"2025-04-09 16:05:19","sort":1,"delFlag":0,"id":"01jrcsa13f34t0qtnntw88269m","metricName":"一、固定资产","unit":"","modelCode":"d91b20ee-a234-11ef-b8c2-005056aaf90d","versionCode":"8618D8DE4680400EBAF0789403D78EC9","metricCode":"","pageCode":"101018602857037827","metricCategory":1,"scale":"1","pmetricCode":""}

    // 并行请求：使用 Promise.all 同时发起所有页面的模板获取请求，以提高加载效率。
    return Promise.all(fetchList); // 并行加载所有模板
  },
  {
    manual: true, // 手动触发
    onSuccess(res) {
      // 处理结果：在所有请求成功 (onSuccess) 后，它会遍历返回的模板数据数组 (res)。
      const allList = [...menu.value.fillList, ...menu.value.calcList];

      // 对于每个返回的模板数据 (dataList)，它会找到对应的 pageCode，然后调用 addSheetTemp(pageCode, dataList)。
      res.forEach((dataList, i) => {
        const pageCode = allList[i]?.pageCode || '';
        // if (pageCode === '101018602857037824') {
        //   console.log(
        //     'loadAllTemp -》 success -> addSheetTemp: pageCode = ',
        //     pageCode,
        //     ', dataList = ',
        //     dataList,
        //   );
        // }

        // 存储模板：addSheetTemp 函数的作用是 将获取到的页面模板数据存储起来（很可能是存储在 useCalcEngine hook 管理的状态中），
        // 并与对应的 pageCode 关联。这样，当用户切换到不同的页面标签时，系统可以根据 pageCode 找到并使用正确的模板来渲染表格 (Editor 组件)。
        // 将页面模板数据转换为树形结构，并存储到数据池中，以便后续渲染和编辑表格时使用。
        addSheetTemp(pageCode, dataList); // 添加表格模板 useCalcEngine -> useDataPool + setSheetData(code, data) 同时保存数据页面池(pagePool)
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
    // columnsMap ??? 是不是在 versionConfig 里缓存的列数据
    if (columnsMap && columnsMap[item.pageCode]) {
      /* 
        格式: {pageCode: }
        modelStore.sheetColumn = [
          {
            '101018602857037824': [{title: '科目名称', field: 'metricName', editType: '', width: 280, treeNode: true, …}, ...] 
            ...
          },
          {...}
        ]
      */

      // 使用版本配置中的列配置
      // modelStore.setSheetColumn 这会更新表格的列配置数据，影响表格的显示结构。
      modelStore.setSheetColumn({
        key: item.pageCode,
        value: columnsMap[item.pageCode], // 使用版本配置中的 列配置 或 通用列配置
      });

      // console.log(
      //   'columnsMap = ',
      //   columnsMap,
      //   ', key(item.pageCode) = ',
      //   item.pageCode,
      // );
    } else {
      initColumns(); // 初始化表格的列配置

      // 使用通用列配置
      modelStore.setSheetColumn({
        key: item.pageCode,
        value: commonColumns, // 使用通用列配置
      });
    }
  });

  // 设置预设值 const presets = ref({});
  presets.value = versionPresets || commonPresets.value;
};

// // 敏感性分析对话框显示隐藏
const dialogVisible = ref(false);

// // 输入指标
// const inputFromData = ref([
//   {
//     id: '1',
//     parentId: '0',
//     label: '标的收入',
//     children: [
//       {
//         id: '1-1',
//         parentId: '1',
//         label: '标的销量',
//         children: [],
//       },
//       {
//         id: '1-2',
//         parentId: '1',
//         label: '食品工业销量',
//         children: [],
//       },
//     ],
//   },
//   {
//     id: '2',
//     parentId: 0,
//     label: '标的成本',
//     children: [
//       {
//         id: '2-1',
//         parentId: '2',
//         label: '成本',
//       },
//     ],
//   },
// ]);

// const inputToData = ref([
//   {
//     id: '1',
//     parentId: '0',
//     label: '标的收入',
//     children: [
//       {
//         id: '1-3',
//         parentId: '1',
//         label: '半干面生鲜面粉销量',
//         children: [],
//       },
//     ],
//   },
// ]);

// const outputFromData = ref([
//   {
//     id: '1',
//     parentId: '0',
//     label: '管理指标',
//     children: [
//       {
//         id: '1-1',
//         parentId: '1',
//         label: '净资产收益率',
//         children: [],
//       },
//       {
//         id: '1-2',
//         parentId: '1',
//         label: '内部收益率',
//         children: [],
//       },
//     ],
//   },
//   {
//     id: '2',
//     parentId: 0,
//     label: '损益指标',
//     children: [
//       {
//         id: '2-1',
//         parentId: '2',
//         label: '损益指标',
//       },
//     ],
//   },
// ]);

// const outputToData = ref([]);
// const sceneData = ref([
//   {
//     label: '情景1',
//     value: '',
//   },
// ]);

// 获取单位标签, <Editor> 里使用的格式化小方法
const getUnitLabel = (list, unit) => {
  if (list) {
    return list.find((item) => item.value === unit)?.label;
  }
  return '';
};

// 处理函数
const handle = {
  // 关闭抽屉
  drawerClose() {
    drawerVisibleHandle.setLeft();
  },

  // 显示/关闭敏感性分析对话框
  dialogShow() {
    dialogVisible.value = true;
  },
  dialogClose() {
    dialogVisible.value = false;
  },

  // 导入数据
  async importData() {
    // console.log('========== importData -> patchUpdateData');
    const editor = editorRef.value;
    if (editor) {
      const { columns, data } = await editor.importData();
      if (data) {
        data.forEach((rowStr) => {
          const rowArr = rowStr.split(',') || [];
          const source = getDataMap(rowArr[1]);
          if (source) {
            columns.forEach((key, i) => {
              if (i > 3 && source[key] !== rowArr[i] && rowArr[i]) {
                patchUpdateData(rowArr[1], key, Number(rowArr[i])); // 更新数据
              }
            });
          }
        });
      }
    }
  },

  // 导出数据
  exportData() {
    if (editorRef.value) {
      editorRef.value.exportData();
    }
  },

  // 获取数据
  getData() {},

  // 重做
  redo() {
    redo();
  },

  // 撤销
  undo() {
    undo();
  },

  // 计算数据
  calculateData() {
    undo();
  },

  // 菜单类型变更 参数输入(false, fill) or 参数输出(true, calc) 切换change事件
  menuTypeChange(val) {
    // console.log('菜单类型变更 menuTypeChange -> val = ', val);
    menu.value.type = val ? 'calc' : 'fill'; // 'fill': 参数输入, 'calc': 参数输出
    menu.value.curList = val ? menu.value.calcList : menu.value.fillList;
    menu.value.pageCode = menu.value.curList[0]?.pageCode || '';
    menu.value.index = 0; // 默认选择第1个
    menu.value.cur = menu.value.curList[0]; // 默认选择第1个 - 数据对象
  },

  // 单位变更
  unitChange(val, oldValue, row) {
    // console.log('========== unitChange -> val = ', val, ' -> patchUpdateData ');
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
  autoFill(_, row) {
    const keys = Object.keys(presets.value);
    const fetchListParams = [];

    // console.log('========== autoFill -> keys = ', keys, ', patchUpdateData = ', patchUpdateData);

    keys.forEach((key) => {
      patchUpdateData(row.metricCode, key, row.isFixeds); // 更新数据
    });

    // 客户端计算, 系统根据 globalConfig.calcMethod 决定使用哪种计算方式
    if (globalConfig.calcMethod) {
      // 收集需要计算的指标和字段
      autoCalcData(`${row.metricCode}`, keys);
      execute();
    } else {
      keys.forEach((key) => {
        row[key] = row.isFixeds;
        const [year, month] = key.split('-') || [];
        const params = {
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
  cellChange({ row, column, value }) {
    const d = ['metricName', 'isFixed', 'unit'];
    // console.log('========== cellChange -> column.field = ', column.field, ', row = ', row, ', value = ', value);

    // 根据修改的字段类型，选择不同的处理路径
    switch (column.field) {
      case 'isFixeds': {
        // 自动填充计算
        // autoFill() 用于批量填充数据，处理多个时间点的数据更新
        handle.autoFill(menu.value.pageCode, row); // 自动填充
        break;
      }
      default: {
        // e.g. column.field = '2023', value = 8001(oldValue=8000), row.metricCode = "C10000A0001", row.metricCategory = 0
        if (row.metricCategory === 0 && !d.includes(column.field || '')) {
          const [year, month] = column.field?.split('-') || [];

          // 计算完成后，通过 patchUpdateData() 更新数据池中的数据
          patchUpdateData(row.metricCode, column.field, value); // 更新数据池中的数据

          // 最终都会通过 autoCalcData() 和 execute() 或 runCalc() 完成数据计算
          if (globalConfig.calcMethod) {
            // 客户端计算, 系统根据 globalConfig.calcMethod 决定使用哪种计算方式
            // 自动计算数据(useCalculate->autoCalcData: calculateFormula) -> 执行实际计算
            // const calculateFormula = (code: string, attrs: string[])
            // autoCalcData()+execute() 是前端计算方式
            autoCalcData(row.metricCode, [column.field]);

            execute(); // 执行计算
          } else {
            const params = {
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
    const submitKeys = [];
    if (editorRef.value) {
      const el = editorRef.value;
      el.getFlatColumns().forEach((item) => {
        if (item.columnType === 'calc') {
          submitKeys.push(item.field); // 收集计算列
        }
      });
    }

    const params = [];
    // 没有初始化过得，全量保存（暂未兼容月份存储，目前只支持速算模型）
    const isDate = (value) => {
      const datePattern = /^(?:\d{4}|\d{4}-\d{1,2})$/;
      return datePattern.test(value);
    };

    for (const code in dataChangedMap) {
      const row = dataChangedMap[code];
      const rowOrigin = getDataMap(code);
      // const unitParam = {
      //   id: rowOrigin.emmId,
      //   dataEntries: [],
      // };
      for (const attrName in row) {
        // 只存指标数据，不存标题信息
        // (row[attrName] || row[attrName] === 0) &&
        if (code && submitColumns.has(attrName) && attrName !== 'unit') {
          if (isDate(attrName)) {
            const [year, month] = attrName.split('-') || [];
            const p = {
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
              let value =
                row[attrName] || row[attrName] === 0 ? row[attrName] : '';
              if (isNumber(value)) {
                value = new Decimal(value).mul(rowOrigin.scale).toNumber(); // 计算实际值
              }

              const p = {
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

    // await runSaveConfig({
    //   id: instance.value.id,
    //   isInitialize: 1,
    // });

    reset(); // 重置状态

    // console.log('=== runInstance() [in saveData]');
    await runInstance(); // 重新加载实例, 即 获取模型版本实例信息
  },

  // 提交数据
  submitData() {
    runSaveConfig({
      id: instance.value.id,
      status: 1, // 设置状态为已提交
    });
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
  cellClick({ column, row }) {
    // console.log('cellClick -> column = ', column.field, ' , row = ', row.metricCode);
    if (column.field === 'metricName' && row.metricCode) {
      const formula = getFormulaMap()[`${row.metricCode}-2025`];
      // console.log('formula = ', formula)
      if (formula?.formulaName) {
        slidePanel.value.data = formula; // 设置公式数据
        slidePanel.value.visible = true; // 显示侧边面板
        fetchMetricInfo(row.metricCode); // 获取指标信息
      }
    }
  },

  // 关闭侧边面板
  slidePanelClose() {
    slidePanel.value.visible = false;
  },

  // 添加场景
  sceneAdd() {
    sceneData.value.push({
      label: `情景${sceneData.value.length + 1}`,
      value: '',
    });
  },

  // 删除场景
  sceneDelete(index) {
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

// 显示依赖关系
const showDependencies = (row, field) => {
  const dependencies = getDependencies(row.metricCode);
  console.error('当前单元格:', {
    metricCode: row.metricCode,
    field,
    dependencies,
  });
};

// 格式化数字，添加千位分隔符
const formatNumberWithCommas = (value) => {
  if (Number.isNaN(value) || value === 'NaN') {
    return 'NaN';
  }
  if (typeof value === 'string' && /\d/.test(value)) {
    value = Number(value);
    // eslint-disable-next-line no-unused-vars
    const [_, decimalPart] = value.toString().split('.') || [];
    let formattedNumber = value.toString();
    if (decimalPart && decimalPart.length > 3) {
      formattedNumber = value.toFixed(3); // 保留3位小数
    }
    const parts = formattedNumber.split('.') || [];
    const prefix = parts[0] || '';
    parts[0] = prefix.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ','); // 添加千位分隔符
    return parts.join('.');
  }
  return value;
};

// 格式化计算标签, 在 <Editor - Column > 中使用
const formatCalcLabel = (row, field) => {
  // console.log('formatCalcLabel -> row = ', row);
  // console.log('formatCalcLabel -> field = ', field);

  if (row[field] === undefined || row[field] === '') {
    return '';
  }
  if (row[field] === 'NaN') {
    return 'NaN';
  }
  if (row.unit === '%') {
    const v = new Decimal(row[field]).mul(100); // 转换为百分比
    return `${formatNumberWithCommas(`${v.toNumber()}`)}%`;
  }
  return formatNumberWithCommas(`${row[field]}`);
};

// 标签页变更 - 如切换: 假设输入-投资参数、假设输入-标的输入、假设输入-标的支出 ...
const handleTabChange = (data) => {
  // console.log('[标签页变更] handleTabChange -> data = ', data);
  menu.value.index = data.index;
  menu.value.cur = menu.value.curList[data.index]; // 当前选择的标签对象信息
  menu.value.pageCode = menu.value.cur?.pageCode || ''; // pageCode: "101018602857037826"
  // console.log('menu.value = ', menu.value);
};

// 注册快捷键
const registerHotkey = () => {
  hotkeyManager.register('ctrl-z', handle.undo); // 撤销
  hotkeyManager.register('ctrl-shift-z', handle.redo); // 重做
  hotkeyManager.register('ctrl-s', handle.saveData); // 保存
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
            </el-space>
          </div>
          <div class="box">
            <div v-if="menu.curList.length > 2" class="menu">
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
                        @change="(val: any, olcValue: any) => handle.unitChange(val, olcValue, row)"
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
                      <span
                        style="cursor: pointer"
                        @mouseenter="showDependencies(row, column.field)"
                      >
                        {{ formatCalcLabel(row, column.field) }}
                      </span>
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
      @close="handle.slidePanelClose"
    >
      <div class="panel__title">指标描述</div>
      <el-divider />
      <div class="panel__content">
        {{ description }}
      </div>
      <div class="panel__title">计算逻辑</div>
      <el-divider />
      <div class="panel__content">
        {{ slidePanel.data.formulaDescription }}
      </div>
    </el-drawer>
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
</style>
