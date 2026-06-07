/**
 * v1 API Mock - 完全迁移需要
 *
 * 来源: docs/v1_docs/参考/2025项目源码/apps/web-ele/src/api/core/instance.ts
 * 这些 API 调用需要后端支持，这里提供 Mock 数据用于前端迁移验证
 */

// ==================== 类型定义 ====================

export namespace InstanceApi {
  export interface InstanceParams {
    versionCode: number | string;
  }
  export interface InstanceListParams {
    versionCode?: string;
    pageSize?: number;
    pageNo?: number;
  }
  export type DeleteInstanceParams = Array<number | string>;
  export interface InstanceInfoParams {
    modelCode: string;
  }
  export interface InstanceDataParams {
    versionCode: string;
    pageCode?: string;
    interfaceType?: number;
  }
  export interface SaveInstanceParams {
    modelCode: string | undefined;
    reportYear: string | undefined;
    value: string;
    versionCode: string;
    valueType: string;
    reportMonth?: string;
    reportQuarter?: string;
  }
  export interface SaveInstanceConfigParams {
    id?: string;
    versionConfig?: string;
    currencyCode?: string;
    versionName?: string;
    modelCode?: string;
    modelType?: string;
    forecastTimeType?: 'month' | 'quarter' | 'year';
    forecastTimeRange?: string;
    investmentSubject?: string;
    projectCode?: string;
    [key: string]: any;
  }
  export interface CalcInstanceParams {
    metricCode: string;
    reportYear: number | string | undefined;
    reportMonth?: number | string | undefined;
    value: any;
  }
  export interface FormulaListParams {
    'mm.versionCode': string;
  }
}

// ==================== Mock 数据 ====================

// Mock 实例列表数据
const mockInstanceList = {
  records: [
    {
      id: 1,
      versionCode: 'V2024Q1',
      versionName: '2024年第一季度',
      modelCode: 'M001',
      modelName: '经济测算模型A',
      status: 'published',
      createTime: '2024-01-01',
    },
    {
      id: 2,
      versionCode: 'V2024Q2',
      versionName: '2024年第二季度',
      modelCode: 'M001',
      modelName: '经济测算模型A',
      status: 'draft',
      createTime: '2024-04-01',
    },
  ],
  total: 2,
}

// Mock 公式列表
const mockFormulaList = {
  records: [
    {
      id: 1,
      metricCode: 'C10000A0320100003',
      formula: '${C10000A0321100003}+${C10000A0322100003}+${C10000A0323100003}',
      formulaName: '半干面生鲜面粉生产成本合计（含税）',
    },
    {
      id: 2,
      metricCode: 'C10000A0387',
      formula: '${C10000A0388}/${C10000A0038}',
      formulaName: '标的售价（含税）',
    },
  ],
}

// Mock 表格数据
const mockTableData = {
  rows: [
    { id: 1, metricCode: 'C10000A0321100003', value: 100, formula: null },
    { id: 2, metricCode: 'C10000A0322100003', value: 200, formula: null },
    { id: 3, metricCode: 'C10000A0323100003', value: 300, formula: null },
    { id: 4, metricCode: 'C10000A0320100003', value: null, formula: '${C10000A0321100003}+${C10000A0322100003}+${C10000A0323100003}' },
  ],
  columns: [
    { field: 'metricCode', title: '指标编码', width: 150 },
    { field: 'value', title: '值', width: 120 },
    { field: 'formula', title: '公式', width: 200 },
  ],
}

// ==================== Mock API 函数 ====================

/**
 * 获得实例列表
 */
export async function getInstanceList(params: InstanceApi.InstanceListParams) {
  console.log('[Mock API] getInstanceList', params)
  return mockInstanceList
}

/**
 * 删除实例
 */
export async function deleteInstance(params: InstanceApi.DeleteInstanceParams) {
  console.log('[Mock API] deleteInstance', params)
  return { success: true }
}

/**
 * 获得单个实例信息
 */
export async function getInstance(params: InstanceApi.InstanceParams) {
  console.log('[Mock API] getInstance', params)
  return {
    records: [
      {
        id: 1,
        versionCode: params.versionCode,
        versionName: '经济测算模型',
        modelCode: 'M001',
      },
    ],
  }
}

/**
 * 获得版本所有指标计算公式
 */
export async function getFormulaList(params: InstanceApi.FormulaListParams) {
  console.log('[Mock API] getFormulaList', params)
  return mockFormulaList
}

/**
 * 获得单个版本实例数据
 */
export async function getInstanceData(params: InstanceApi.InstanceDataParams) {
  console.log('[Mock API] getInstanceData', params)
  return mockTableData
}

/**
 * 获取单个版本实例数据ID
 */
export async function getInstanceDataId(params: InstanceApi.InstanceDataParams) {
  console.log('[Mock API] getInstanceDataId', params)
  return { ids: [1, 2, 3, 4] }
}

/**
 * 保存版本实例数据
 */
export async function saveInstanceData(params: InstanceApi.SaveInstanceParams[]) {
  console.log('[Mock API] saveInstanceData', params)
  return { success: true, count: params.length }
}

/**
 * 保存版本
 */
export async function saveInstanceConfig(params: InstanceApi.SaveInstanceConfigParams) {
  console.log('[Mock API] saveInstanceConfig', params)
  return { success: true }
}

/**
 * 保存版本配置项
 */
export async function updateInstanceConfig(params: InstanceApi.SaveInstanceConfigParams) {
  console.log('[Mock API] updateInstanceConfig', params)
  return { success: true }
}

/**
 * 计算接口
 */
export async function calcInstance(params: InstanceApi.CalcInstanceParams) {
  console.log('[Mock API] calcInstance', params)
  return { success: true }
}

/**
 * 获取指标信息
 */
export async function getMetricInfo(params: any) {
  console.log('[Mock API] getMetricInfo', params)
  return { records: [] }
}

/**
 * 获取目标节点
 */
export async function getTargetNodes(params: any) {
  console.log('[Mock API] getTargetNodes', params)
  return { records: [] }
}