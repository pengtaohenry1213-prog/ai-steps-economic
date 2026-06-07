<script lang="ts" setup>
// 导入Vue相关依赖
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  unref,
  watchEffect,
} from 'vue';
import { useRequest } from 'vue-hooks-plus';
import { useRoute } from 'vue-router';

// 导入第三方库
import Decimal from 'decimal.js';
import { ElNotification } from 'element-plus';
import * as XLSX from 'xlsx';

// api
import {
  getFormulaList,
  getInstance,
  getInstanceData,
  getModelMenu,
  saveInstanceData,
  updateInstanceConfig,
} from '#/api/index';

// 导入组件
import BaseInfo from './components/BaseInfo.vue';
import ZlInput from './components/Input.vue';
import ZlLoading from './components/Loading.vue';
import Operate from './components/Operate.vue';
import Scan from './components/Scan/index.vue';
import SetProduct from './components/SetProduct.vue';
import SetUnit from './components/SetUnit.vue';
import SlidePanel from './components/SlidePanel.vue';
import calculate from './utils/calculate';
import { getColumnIndex, initColumns, quickColumns } from './utils/column';
import format from './utils/format';
// utils
import { download, parseString } from './utils/util';

// constants
import { collapseCodes } from './constants/special';

// hooks
import {
  useAnimationData,
  useChangeData,
  useData,
  useFormula,
  useGridOptions,
  usePageData,
} from './hooks/index';

// strore
import { useModelStore } from '#/store/index';

const { setData, clone, updateData, getData, setVisibleRows, clearData } =
  useData();
const { pageData, setPageData, clear: clearPageData } = usePageData();
const { getAnimationData, hasAnimationData, clearAnimationData, highlight } =
  useAnimationData();

const isDev = import.meta.env.DEV;
console.log('isDev =', isDev);

const {
  setFormula,
  setFormulaDetail,
  clear: clearFormula,
  formula,
} = useFormula();
const { changeData, clear: clearChangeData } = useChangeData();
const { gridOptions } = useGridOptions();
const { unitDict, fetchAllList } = useModelStore();

// 路由+query
const route = useRoute();
const query = route.query as Record<string, any>;
const iframeParams =
  query && typeof query.iframeParams === 'string'
    ? JSON.parse(query.iframeParams)
    : null;

// 初始化页面变量
let excelWorker: any = null; // 创建ExcelWorker
let sortWorker: any = null; // 创建排序Worker
let fullOrder: any; // 全量排序
let menuFlat: any = []; // 扁平菜单
let timer: any = null; // 自动保存计时器
let codeIdMap: any = {}; // 指标:行ID:单元格ID 一对多关系
const pageColumns: any = ref({}); // 分页列配置
const instance: any = ref({}); // 版本信息
const pageLoading = ref<boolean>(true); // 全局加载中
const menuType = ref(0); // 类型切换
const menuTree: any = ref({});
const activePageCode = ref<string>('');
const activeInterfaceType = ref(0);
const gridRef = ref<any>(); // gridRef

// 生成排序表
const generateOrder = () => {
  sortWorker = new Worker(new URL('workers/sort/index.ts', import.meta.url), {
    type: 'module',
  });
  sortWorker.addEventListener('message', (e: any) => {
    console.log('sortWorker', e.data);
    if (e.data.success) {
      fullOrder = e.data.order.ids;
    }
    // 终止 Worker
    sortWorker.terminate();
    sortWorker = null;
  });
  // console.log('formula', formula);

  instance.value.timeType =
    instance.value.timeType || instance.value.forecastTimeType || 'year';

  sortWorker.postMessage(
    JSON.stringify({
      instance: instance.value,
      // dateFields: instance.value.dateFields,
      // timeType: instance.value.timeType,
      formula,
    }),
  );
};

// 获取指标公式
const { runAsync: runFormula } = useRequest(
  () => getFormulaList({ 'mm.versionCode': query.versionCode }),
  {
    manual: true,
    onSuccess(res: any) {
      res.forEach((element: any) => {
        setFormula(element.metricCode, element.formulaExpression);
        setFormulaDetail(element.metricCode, element);
      });

      generateOrder();
    },
  },
);

// 版本信息
const { runAsync: runInstance } = useRequest(
  () => getInstance({ versionCode: query.versionCode }),
  {
    manual: true,
    onSuccess(res: any) {
      if (res[0]) {
        res[0].versionConfig = res[0].versionConfig
          ? JSON.parse(res[0].versionConfig)
          : {};
        instance.value = res[0];
      }
    },
  },
);

// 菜单
const { runAsync: runMenu } = useRequest(
  () =>
    getModelMenu({ modelCode: instance.value.modelCode, orderBy: 'sort asc' }),
  {
    manual: true,
    onSuccess(data: any) {
      // 扁平数据（过滤掉经济扫描）
      menuFlat = data.filter((item: any) => item.interfaceType !== 2);
      // 树形数据
      data.forEach((e: any) => {
        if (!menuTree.value[e.modelType]) {
          menuTree.value[e.modelType] = [];
        }
        menuTree.value[e.modelType].push(e);
      });
    },
  },
);

// 初始化列配置
const initPageColumns = () => {
  const { modelType, forecastTimeRange, forecastTimeType } = instance.value;
  // 生成配置
  const { yearColumns, quarterColumns, presets, dateFields } = initColumns({
    forecastTimeRange,
    forecastTimeType,
  });
  // 日期Fields
  instance.value.dateFields = dateFields;
  // 预设值
  instance.value.presets = instance.value.versionConfig.presets || presets;
  // 赋值
  switch (modelType) {
    case '完整模型': {
      menuFlat.forEach(({ pageCode, interfaceType }: any) => {
        if (forecastTimeType === 'year') {
          pageColumns.value[pageCode] = yearColumns;
        } else if (forecastTimeType === 'quarter') {
          pageColumns.value[pageCode] =
            interfaceType === 1 ? yearColumns : quarterColumns;
        }
      });
      break;
    }
    case '速算模型': {
      quickColumns.at(-1)!.field = dateFields[0] || '';
      pageColumns.value[menuFlat[0].pageCode] = quickColumns;
      break;
    }
  }
};

// 处理单个page
const loadPage = (code: string, res: any[]) => {
  const reg = /^(?:\d{4}|\d{4}-[1-4])$/; // 正则匹配YYYY,YYYY-Q
  // 构建parentField、rowField 关系，平用于铺数据的树形展示
  const treeFlat: any[] = [];
  // columns
  const columns = pageColumns.value[code];

  res.forEach((item, index) => {
    const { metricCode, emmId, level } = item;
    // 倒序查找最近的父级,给当前项赋值parentField
    if (level > 0) {
      for (let i = index - 1; i >= 0; i--) {
        if (res[i].level === level - 1) {
          item.parentEmmId = res[i].emmId;
          break;
        }
      }
    }
    // 拆分 id#value 格式字符串
    if (metricCode && !metricCode.startsWith('title-')) {
      const ids: any = {}; // ID对象
      // 处理日期字段
      columns.forEach(({ field }: any) => {
        if (reg.test(field)) {
          const [id, value] = item[field]
            ? item[field].split('#')
            : [undefined, undefined];
          ids[field] = id;
          const val = parseString(value);
          item[field] = val;
          setData(metricCode, field, val);
        }
      });
      // 处理信息字段
      ['unitCode', 'unit', 'scale'].forEach((key) => {
        const val = parseString(item[key]);
        item[key] = val;
        setData(metricCode, key, val);
      });
      // codeIdMap
      if (!codeIdMap[metricCode]) {
        codeIdMap[metricCode] = {};
      }
      codeIdMap[metricCode][emmId] = ids;
      // 处理单一值：取单一值行的第一个有值的日期值回填单一值
      if ([0, '0'].includes(item.isFixed)) {
        const k: string | undefined = Object.keys(item).find(
          (key) => /^(?:\d{4}|\d{4}-[1-4])$/.test(key) && item[key],
        );
        item.isFixeds = k ? item[k] : '';
      }
    }
    // 树形关系
    treeFlat.push(item);
    // 单独维护指标详情
    setFormulaDetail(metricCode, {
      remarks: item.remarks,
      metricName: item.metricName,
    });
  });
  // 存储页面数据池
  setPageData(code, treeFlat);
};
// 加载实例数据
const { runAsync: runLoadData } = useRequest(
  () => {
    const fetchList: Promise<any>[] = menuFlat.map((item: any) =>
      getInstanceData({
        versionCode: instance.value.versionCode,
        pageCode: item.pageCode,
      }),
    );
    return Promise.all(fetchList);
  },
  {
    manual: true,
    onSuccess(res: any) {
      menuFlat.forEach((item: any, i: number) => {
        loadPage(item.pageCode, res[i]);

        if (isDev) {
          const _pageName = item.pageName;
          const _pageCode = item.pageCode;

          // 判断 (window as any).all 有没有定义, 如果没有则初始化
          if (!(window as any).all) {
            (window as any).all = [];
          }

          res[i].forEach((item: any) => {
            // 追加页面名称到item里
            item.pageName = _pageName;
            item.pageCode = _pageCode;
          });

          (window as any).all.push(...res[i]);
        }
      });
      // 克隆数据
      clone();
      // console.log('codeIdMap', codeIdMap);
    },
    onFinally() {
      if (isDev) {
        console.warn('(window as any).all =', (window as any).all);
        // 根据window.all生成codeIdMap, 在 window 中追加一个查询方法, 可根据metricCode查询对应的codeIdMap
        (window as any).getMetricInfo = (metricCode: string) => {
          return (window as any).all.find(
            (item: any) => item.metricCode === metricCode,
          );
        };
      }
    },
  },
);

// 保存实例数据
const { runAsync: runSaveData } = useRequest(
  (params: any) => {
    console.log('runSaveData', changeData.value);
    // 组装数据：接口待优化
    const modelMetrics: any = [];
    const dataEntries: any = [];
    Object.keys(changeData.value).forEach((key) => {
      const { unitCode, unit, scale, ...dates } = changeData.value[key];
      // 遍历 指标:行ID:单元格ID 一对多关系
      const idMap = codeIdMap[key];
      Object.keys(idMap).forEach((rowId: string) => {
        // modelMetrics 使用行ID做为id
        if (unitCode) {
          modelMetrics.push({
            id: rowId,
            metricCode: key,
            unitCode,
            unit,
            scale,
          });
        }
        // dataEntries 使用单元格ID做为id
        if (dates && Object.keys(dates).length > 0) {
          Object.keys(dates).forEach((date) => {
            const [reportYear, reportQuarter] = date.split('-');
            dataEntries.push({
              id: idMap[rowId][date],
              metricCode: key,
              value: dates[date],
              reportYear,
              reportQuarter,
            });
          });
        }
      });
    });
    const info = {
      modelCode: instance.value.modelCode,
      versionCode: query.versionCode,
    };
    modelMetrics.forEach((item: any) => Object.assign(item, info));
    dataEntries.forEach((item: any) => Object.assign(item, info));

    return saveInstanceData({ modelMetrics, dataEntries, ...params });
  },
  {
    manual: true,
    onSuccess() {
      clearChangeData();
    },
  },
);

// 更新版本信息
const { runAsync: runSaveConfig } = useRequest(updateInstanceConfig, {
  manual: true,
});

// 菜单
const menuTypeChange = () => {
  activePageCode.value = menuTree.value[menuType.value][0].pageCode;
};

// 处理表格展开与折叠
const setTree = () => {
  nextTick(() => {
    // 全部展开
    gridRef.value!.setAllTreeExpand(true);
    // 默认折叠行
    const rows: any[] = [];
    gridRef.value!.getData().forEach((row: any) => {
      if (collapseCodes.has(row.metricCode)) {
        rows.push(row);
      }
    });
    if (rows.length > 0) {
      gridRef.value!.setTreeExpand(rows, false);
    }
  });
};

// 监听sheet切换
watchEffect(() => {
  if (!activePageCode.value) return;
  // 监听菜单 pageCode 变化，赋值 interfaceType
  nextTick(() => {
    const obj = menuTree.value[menuType.value].find(
      ({ pageCode }: any) => pageCode === activePageCode.value,
    );
    activeInterfaceType.value = obj.interfaceType;
    // 清除高亮
    highlight.value.metricCode = null;
    highlight.value.field = null;
    // 处理表格展开与折叠
    setTree();
  });
});

// 保存数据
const saveData = async () => {
  console.log('runSaveData', changeData.value);
  const crUser = iframeParams?.cname;
  const companyCode = iframeParams?.companyCode;
  // 保存数据前, 判断必要参数是否存在, 必要参数包括: crUser, companyCode, 不存在则console提示并返回
  if (!crUser || !companyCode) {
    console.log('保存数据必要参数不存在!');
    return;
  }

  await runSaveData({ crUser, companyCode });

  // 在更新操作用户前, 判断必要参数是否存在, 必要参数包括: account, 不存在则console提示并返回
  const id = instance.value.id;
  const opUser = iframeParams?.account;
  if (!id || !opUser) {
    console.warn('更新操作用户必要参数不存在!');
    return;
  }

  // 保存成功后更新操作用户
  runSaveConfig({ id, opUser });
  ElNotification({ title: '提示', message: '保存成功', type: 'success' });
};

// 提交版本，
const submitData = async () => {
  // 先执行保存
  await saveData();
  // 提交成功后更新设置状态为已提交
  runSaveConfig({
    id: instance.value.id,
    status: 1,
  });
  // 返回上页
  window.history.back();
};

// // kahn全量计算-测试
const kahnCalculate = async () => {
  if (!fullOrder || fullOrder.length === 0) return;

  // 全量计算
  await calculate(unref(instance.value), fullOrder);
};

// 导入数据
const importData = async (file: File) => {
  // 输入表名称
  const inputSheetNames =
    instance.value.modelType === '速算模型'
      ? ['速算模型']
      : ['31-项目参数', '32-项目收入', '33-项目支出', '34-项目资产'];
  // 计算基础单位下的值
  const getBaseValue = (value: number | string, scale: number) => {
    return typeof value === 'number'
      ? new Decimal(value).mul(scale).toNumber()
      : value;
  };
  // 列索引
  const metricCodeIndex = getColumnIndex('metricCode');
  const metricCategoryIndex = getColumnIndex('metricCategory');
  const isFixedIndex = getColumnIndex('isFixed');
  const isFixedsIndex = getColumnIndex('isFixeds');
  const scaleIndex = getColumnIndex('scale');
  const dateStartsIndex = isFixedsIndex + 1; // 日期列开始索引

  try {
    // 读取文件
    const buffer = await (file as Blob).arrayBuffer();
    const data = new Uint8Array(buffer);
    const workbook = XLSX.read(data, { type: 'array' });

    // 校验输入表指标
    inputSheetNames.forEach((sheetName) => {
      const worksheet: any = workbook.Sheets[sheetName];
      const data: any = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      // console.log(sheetName, data);
      // 数据行
      const rows = data.slice(1);
      // 导入的指标
      const excelCodes = rows.map((item: any) => item[metricCodeIndex]);
      // 系统里的指标
      const currentCode = menuFlat.find(
        (item: any) => item.pageName === sheetName,
      ).pageCode;
      const systemCodes = pageData.value[currentCode]?.map(
        (item: any) => item.metricCode,
      );
      // console.log({ sheetName, excelCodes, systemCodes });
      // 比较
      if (JSON.stringify(excelCodes) !== JSON.stringify(systemCodes)) {
        throw new Error('该模板与当前系统模型不一致，请重新下载模板');
      }
    });

    // 校验通过，清空可视行
    console.log('指标校验通过');
    pageLoading.value = true;
    await new Promise((resolve) => setTimeout(resolve));
    setVisibleRows('[]');

    // 更新数据池、页面池
    inputSheetNames.forEach((sheetName) => {
      const worksheet: any = workbook.Sheets[sheetName];
      const data: any = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // 取数据行，并手动转换数字格式
      const rows = data
        .slice(1)
        .map((row: any) =>
          row.map((cell: number | string) => parseString(cell)),
        );

      // 遍历行
      rows.forEach((row: any) => {
        const metricCode = row[metricCodeIndex];
        const metricCategory = row[metricCategoryIndex];
        if (!metricCode || metricCategory !== 0) return;

        const isFixed = row[isFixedIndex];
        const scale = row[scaleIndex];
        const isFixeds = getBaseValue(row[isFixedsIndex], scale);

        // 处理单一值列和日期列
        if (isFixed === 0) {
          instance.value.dateFields.forEach((field: string) => {
            updateData(metricCode, field, isFixeds);
          });
        } else {
          instance.value.dateFields.forEach((field: string, index: number) => {
            const value = getBaseValue(row[dateStartsIndex + index], scale);
            updateData(metricCode, field, value);
          });
        }
        // 处理单位
        ['unitCode', 'unit', 'scale'].forEach((key) => {
          updateData(metricCode, key, row[getColumnIndex(key)]);
        });
      });
    });
    // 全量计算
    await calculate(unref(instance.value), fullOrder);
    ElNotification({ title: '提示', message: '导入成功', type: 'success' });
  } catch (error: any) {
    ElNotification({ title: '提示', message: error.message, type: 'error' });
  } finally {
    pageLoading.value = false;
  }
};

// 比对
const compareData = async (file: File) => {
  try {
    // 读取文件
    const buffer = await (file as Blob).arrayBuffer();
    const data = new Uint8Array(buffer);
    const workbook = XLSX.read(data, { type: 'array' });

    // 遍历sheet比对
    const log: any = {};
    workbook.SheetNames.forEach((sheetName: string) => {
      if (sheetName === '21-年度财报') return;

      const worksheet: any = workbook.Sheets[sheetName];
      const rowData: any = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      log[sheetName] = [];

      const isFixedsIndex = getColumnIndex('isFixeds');
      rowData.forEach((row: any) => {
        const metricCode = row[getColumnIndex('metricCode')];
        if (!metricCode || metricCode.startsWith('title-')) return;

        const scaleA = Number(row[getColumnIndex('scale')]);
        const obj: any = {};
        instance.value.dateFields.forEach((field: string, index: number) => {
          const A = row[isFixedsIndex + index];
          const B = getData(metricCode, field);
          const numA = Number(A);
          const numB = Number(B);
          const scaleB = Number(getData(metricCode, 'scale'));

          let res = false;
          if (Number.isNaN(numA) && Number.isNaN(numB)) {
            // 都不是数字，按照字符串比较
            res = A === B;
          } else if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
            // 都是数字，加入刻度计算后比较
            const calcA = new Decimal(numA).mul(scaleA).toNumber();
            const calcB = new Decimal(numB).mul(scaleB).toNumber();
            res = calcA === calcB;
          }
          // else: 一个数字一个非数字，不相等

          if (!res) {
            obj[field] = `excel: ${A}, system: ${B}`;
          }
        });
        if (Object.keys(obj).length > 0) {
          obj.metricCode = metricCode;
          log[sheetName].push(obj);
        }
      });
    });
    // 打印结果
    console.log('比对结果', log);
  } catch (error: any) {
    ElNotification({
      title: '错误',
      message: `Excel导入失败: ${error.message}`,
      type: 'error',
    });
  }
};

// 导出数据
const exportData = () => {
  ElNotification({
    title: '提示',
    message: 'Excel生成中，请勿关闭页面',
    type: 'warning',
  });
  excelWorker = new Worker(new URL('workers/excel.ts', import.meta.url), {
    type: 'module',
  });

  excelWorker.addEventListener('message', (e: any) => {
    console.log('excelWorker', e.data);
    if (e.data.success) {
      download(e.data.buffer, instance.value.versionName);
      ElNotification({ title: '提示', message: '导出成功', type: 'success' });
    } else {
      ElNotification({ title: '提示', message: '导出失败', type: 'error' });
    }
    // 终止 Worker
    excelWorker.terminate();
    excelWorker = null;
  });

  excelWorker.postMessage(
    JSON.stringify({
      menuFlat,
      sheetData: unref(pageData.value),
      sheetColumn: unref(pageColumns.value),
    }),
  );
};

// 预设变更
const onPresetsChange = () => {
  runSaveConfig({
    id: instance.value.id,
    versionConfig: JSON.stringify({ presets: instance.value.presets }),
  });
};

// 修改单位
const onUnitChange = (row: any) => {
  nextTick(() => {
    console.log('onUnitChange', row);
    // 更新到数据池 => 数据池中再遍历页面池更新
    updateData(row.metricCode, 'unitCode', row.unitCode);
    updateData(row.metricCode, 'unit', unitDict[row.unitCode].unit);
    updateData(row.metricCode, 'scale', unitDict[row.unitCode].scale);
  });
};
// 批量修改单位
const unitVisible = ref(false);
const onUnitUpdate = (e: any) => {
  // console.log('onUnitUpdate', e);
  unitVisible.value = false;
  Object.values(pageData.value).forEach((rows: any) => {
    rows.forEach((row: any) => {
      if (e[row.unitCode]) {
        row.unitCode = e[row.unitCode];
        onUnitChange(row);
      }
    });
  });
};

// 单元格变更
const onCellChange = async ({ row, field }: any) => {
  // console.log('cellChange', field, row);
  // 处理可视行
  const rowIndex = gridRef.value?.getData().indexOf(row) || 0;
  const visibleRows = pageData.value[activePageCode.value]
    .filter((_item: any, index: number) => Math.abs(index - rowIndex) < 20)
    .map((item: any) => item.metricCode);
  setVisibleRows(JSON.stringify(visibleRows));

  // 更新数据池
  if (field === 'isFixeds') {
    instance.value.dateFields.forEach((date: string) => {
      updateData(row.metricCode, date, row[field]);
    });
  } else {
    updateData(row.metricCode, field, row[field]);
  }

  // ...查询相关单元格和排序后计算
  pageLoading.value = true;
  await new Promise((resolve) => setTimeout(resolve));
  await calculate(unref(instance.value), fullOrder);
  pageLoading.value = false;
};

// 表格右键事件
const onMenuClick = ({ menu, row }: any) => {
  const getRows = (level: number) => {
    const res: any[] = [];
    gridRef.value?.getData().forEach((row: any) => {
      if (row.level === level) {
        res.push(row);
      }
    });
    return res;
  };
  switch (menu.code) {
    case 'expand': {
      const rows = getRows(row.level);
      gridRef.value?.setTreeExpand(rows, true);
      break;
    }
    case 'collapse': {
      const rows = getRows(row.level);
      gridRef.value?.setTreeExpand(rows, false);
      break;
    }
    case 'expandNext': {
      const rows = getRows(row.level + 1);
      gridRef.value?.setTreeExpand([...rows, row], true);
      break;
    }
    case 'collapseNext': {
      const rows = getRows(row.level + 1);
      gridRef.value?.setTreeExpand(rows, false);
      break;
    }
  }
};

// 编辑产品
const productVisible = ref(false);
const onProductUpdate = async () => {
  productVisible.value = false;
  pageLoading.value = true;
  // 重新加载数据
  codeIdMap = {};
  clearData();
  clearPageData();
  await runLoadData();
  // 处理表格展开与折叠
  setTree();
  // 全量计算
  await calculate(unref(instance.value), fullOrder);
  pageLoading.value = false;
};
const showProduct = async () => {
  // 修改产品前保存数据
  await saveData();
  productVisible.value = true;
};

// 侧边面板
const slideVisible = ref<boolean>(false);
const slideCode = ref<string>('');
const onSlideClose = () => {
  slideCode.value = '';
  slideVisible.value = false;
};
// 点击单元格
const onCellClick = ({ column, row }: any) => {
  // console.log('onCellClick', row.metricCode, column.field);
  // 打开侧边栏
  if (column.field === 'metricName' && !row.metricCode.startsWith('title-')) {
    slideCode.value = row.metricCode;
    slideVisible.value = true;
  }
  // 高亮
  if (highlight.value.enabled) {
    highlight.value.metricCode = row.metricCode;
    highlight.value.field = column.field;
  }
};

// 左上角返回
const goBack = () => {
  window.history.back();
};

// 编辑权限
const canEdit = computed(() => {
  // 开发环境显示全部按钮
  if ((import.meta as any).env.DEV) return true;
  // 集团用户, 则放行
  if (iframeParams && iframeParams.isGroup) return true;
  // 已提交时, 返回 false
  if (instance.value.status === 1) return false;
  // query.isLocked 有值时, 再判断isLocked === iframeParams.account, 是则返回 true, 或当前用户为集团用户也要返回㹖, 其余情况 返回 false
  if (query.isLocked) {
    // 如果被锁定时, 判断当前用户是还是开启锁定的用户, 则放行.
    if (iframeParams && query.isLocked === iframeParams.account) return true;
    return false;
  } else {
    if (iframeParams && iframeParams.account) {
      runSaveConfig({
        id: instance.value.id,
        isLocked: iframeParams.account,
      });
    }
    return true;
  }
});

onMounted(async () => {
  console.time('首次加载耗时');
  await fetchAllList(); // 模型、项目、币种、投资公司、脚本公式列表、单位
  await runInstance(); // 版本信息
  await runMenu(); // 菜单
  initPageColumns(); // 列配置
  await runLoadData(); // 所有数据（包括数据id）
  // 初始化 activePageCode 为第一个 sheet
  activePageCode.value = menuTree.value[0][0].pageCode;
  // 关闭Loading
  pageLoading.value = false;
  console.timeEnd('首次加载耗时');
  runFormula(); // 公式

  if (canEdit.value) {
    // 初始化自动保存计时器
    timer = setInterval(saveData, 1000 * 60 * 10);
  }

  console.group('onMounted');
  console.log('instance', instance.value);
  console.log('pageColumns', pageColumns.value);
  console.log('pageData', pageData.value);
  console.groupEnd();
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
  clearAnimationData();
  clearPageData();
  clearData();
  clearFormula();
  clearChangeData();
});
</script>

<template>
  <div style="height: 100%">
    <div class="main">
      <!-- 基础信息 -->
      <BaseInfo :data="instance" />
      <el-radio-group
        v-model="menuType"
        class="menu-type-bar"
        @change="menuTypeChange"
      >
        <template v-if="instance?.modelType === '速算模型'">
          <el-radio-button :key="0" :value="0">假设输入</el-radio-button>
        </template>
        <template v-else>
          <el-radio-button
            v-for="(item, index) in [
              '假设输入',
              '模型测算',
              '指标输出',
              '图形展示',
            ]"
            :key="index"
            :value="index"
          >
            {{ item }}
          </el-radio-button>
        </template>
      </el-radio-group>
      <div class="content">
        <el-tabs v-model="activePageCode" tab-position="left">
          <el-tab-pane
            v-for="item in menuTree[menuType]"
            :key="item.pageCode"
            :label="item.pageName"
            :name="item.pageCode"
            style="height: 100%"
          />
        </el-tabs>
        <div class="editor">
          <!-- activeInterfaceType:2 经济扫描 -->
          <Scan
            v-if="activeInterfaceType === 2"
            :date-fields="instance.dateFields"
          />
          <vxe-grid
            v-show="activeInterfaceType !== 2"
            ref="gridRef"
            v-bind="gridOptions"
            :columns="pageColumns[activePageCode]"
            :data="pageData[activePageCode]"
            @cell-click="onCellClick"
            @menu-click="onMenuClick"
          >
            <!-- 表头 -->
            <template #header="{ column }">
              <div class="header-cell">
                <div :class="column.title">{{ column.title }}</div>
                <el-select
                  v-model="instance.presets[column.field]"
                  size="small"
                  @change="onPresetsChange"
                >
                  <el-option label="A" value="A" />
                  <el-option label="F" value="F" />
                </el-select>
              </div>
            </template>

            <!-- 编辑单位 -->
            <!-- popper-class="vxe-table--ignore-clear" 告知表格忽略对特定弹出层的清除操作 -->
            <template #unitEdit="{ row }">
              <el-select
                v-if="unitDict[row.unitCode]"
                v-model="row.unitCode"
                :options="unitDict[row.unitCode].options"
                popper-class="vxe-table--ignore-clear"
                @change="onUnitChange(row)"
              />
              <span v-else>{{ row.unit }}</span>
            </template>

            <!-- 编辑单元格 -->
            <template #edit="{ row, column }">
              <ZlInput
                v-model="row[column.field]"
                :scale="row.scale"
                @change="onCellChange({ row, field: column.field })"
              />
            </template>

            <!-- 单元格显示 -->
            <template #default="{ row, column }">
              <div class="card">
                <div class="card-front">
                  {{
                    hasAnimationData(`${row.metricCode}-${column.field}`)
                      ? format(
                          row,
                          column.field,
                          getAnimationData(`${row.metricCode}-${column.field}`),
                        )
                      : format(row, column.field)
                  }}
                </div>
                <div class="card-back">{{ format(row, column.field) }}</div>
              </div>
            </template>
          </vxe-grid>
        </div>
      </div>
    </div>

    <!-- 按钮区 -->
    <Operate
      v-if="canEdit"
      @compare="compareData"
      @export="exportData"
      @import="importData"
      @kahn-calculate="kahnCalculate"
      @save="saveData"
      @show-product="showProduct"
      @show-unit="unitVisible = true"
      @submit="submitData"
    />

    <!-- 编辑产品 -->
    <el-dialog v-model="productVisible" title="编辑产品" width="680">
      <SetProduct
        v-if="productVisible"
        :data="{
          modelCode: instance.modelCode,
          versionCode: query.versionCode,
        }"
        @cancel="productVisible = false"
        @update="onProductUpdate"
      />
    </el-dialog>

    <!-- 编辑单位 -->
    <el-dialog v-model="unitVisible" title="编辑产品" width="680">
      <SetUnit
        v-if="unitVisible"
        @cancel="unitVisible = false"
        @submit="onUnitUpdate"
      />
    </el-dialog>

    <!-- 侧边栏 -->
    <el-drawer
      v-model="slideVisible"
      :with-header="false"
      size="50%"
      @close="onSlideClose"
    >
      <SlidePanel v-if="slideVisible" :code="slideCode" />
    </el-drawer>

    <!-- 加载动画 -->
    <ZlLoading v-show="pageLoading" />

    <!-- 返回按钮（临时方案） -->
    <!-- eslint-disable-next-line vue/no-parsing-error -->
    <div class="back-btn" @click="goBack"><span><</span>返回</div>
  </div>
</template>

<style scoped lang="less">
.main {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  background-color: hsl(var(--sidebar));

  .menu-type-bar {
    margin: 10px 20px;
  }

  .content {
    flex: 1;
    display: flex;
    overflow: hidden;
    padding: 0 10px 10px 0;

    .editor {
      flex: 1;
      overflow: hidden;
    }
  }
}

.header-cell {
  .Q {
    box-sizing: border-box;
    min-width: 75px;
    border-width: 1px;
    border-radius: 5px;
  }

  .Q1 {
    .Q();
    background-color: var(--vxe-ui-background-color-q1);
    border-color: var(--vxe-ui-border-color-q1);
  }

  .Q2 {
    .Q();
    background-color: var(--vxe-ui-background-color-q2);
    border-color: var(--vxe-ui-border-color-q2);
  }

  .Q3 {
    .Q();
    background-color: var(--vxe-ui-background-color-q3);
    border-color: var(--vxe-ui-border-color-q3);
  }

  .Q4 {
    .Q();
    background-color: var(--vxe-ui-background-color-q4);
    border-color: var(--vxe-ui-border-color-q4);
  }

  .el-select {
    margin-top: 4px;
    width: 50px;
    transform: scale(0.8);
    :deep(.el-select__wrapper) {
      background-color: var(--vxe-ui-select-background-color);
      // border-color: var(--vxe-ui-select-border-color);
      // border-width: 1px;
    }
    :deep(.el-select__icon) {
      color: #fff;
    }
  }
}

:deep(.vxe-header--column) {
  text-align: center !important;
}

:deep(.is--title) {
  font-weight: bold !important;
}

:deep(.is--italic) {
  font-style: italic;
}

:deep(.is--check) {
  font-style: italic;
  color: #4b7dcc;
  font-size: 12px;
}

:deep(.is--negative) {
  color: #c24343;
}

:deep(.mini-cell) {
  font-size: 12px;
  text-align: center !important;
}

:deep(.is--changed) {
  &::before {
    content: '';
    top: calc(var(--vxe-ui-table-cell-dirty-width) * -1);
    left: calc(var(--vxe-ui-table-cell-dirty-width) * -1);
    position: absolute;
    border-width: var(--vxe-ui-table-cell-dirty-width);
    border-style: solid;
    border-color: transparent var(--vxe-ui-table-cell-dirty-update-color)
      transparent transparent;
    transform: rotate(45deg);
  }
}

:deep(.is--highlight) {
  background-color: var(--vxe-ui-table-highlight-background-color);
}

// 卡片效果
.card {
  position: relative;
  transform-style: preserve-3d;
  height: 30px;
  line-height: 30px;
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  backface-visibility: hidden;
  overflow: hidden;
  text-overflow: ellipsis;
  box-sizing: border-box;
  padding: 0 4px;
}

.card-back {
  transform: rotateX(180deg);
}

:deep(.is--animate .card) {
  animation: flip 2s forwards 1;
}
@keyframes flip {
  0% {
    transform: rotateX(0);
  }
  100% {
    transform: rotateX(180deg);
  }
}

:deep(.is--animate .card-front) {
  animation: fadeIn 1s forwards 1;
}
@keyframes fadeIn {
  0% {
    background: transparent;
  }
  100% {
    background: #569ff1;
  }
}

:deep(.is--animate .card-back) {
  animation: fadeOut 10s forwards 1;
}
@keyframes fadeOut {
  0% {
    background: #0b48a0;
  }
  10% {
    background: #0b48a0;
  }
  100% {
    background: transparent;
  }
}
// 返回按钮
.back-btn {
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 999999;
  font-size: 14px;
  font-weight: 400;
  height: 30px;
  padding: 0 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  cursor: pointer;
  span {
    margin: -2px 4px 0 0;
    transform: scaleY(1.5);
  }
}
</style>
