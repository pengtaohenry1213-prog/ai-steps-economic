/**
 * v1 Model Store 适配到 v2
 *
 * 来源: docs/v1_docs/参考/2025项目源码/apps/web-ele/src/store/model.ts
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

// ==================== Mock API (稍后替换为真实 API) ====================

async function getProjectList() {
  return [
    { projectCode: 'P001', projectName: '项目A' },
    { projectCode: 'P002', projectName: '项目B' },
  ]
}

async function getCurrencyList() {
  return [
    { currencyCode: 'CNY', currencyName: '人民币' },
    { currencyCode: 'USD', currencyName: '美元' },
  ]
}

async function getInvestList() {
  return [
    { investCode: 'I001', investName: '投资公司A' },
    { investCode: 'I002', investName: '投资公司B' },
  ]
}

async function getModelList() {
  return {
    records: [
      { modelCode: 'M001', modelName: '经济测算模型A', sort: 1 },
      { modelCode: 'M002', modelName: '经济测算模型B', sort: 2 },
    ],
  }
}

async function getUnitAndCategorylist() {
  return {
    data: [
      {
        categoryName: '重量',
        unitList: [
          { unitCode: 'kg', unitName: '千克', conversionFactor: 1 },
          { unitCode: 'g', unitName: '克', conversionFactor: 1000 },
        ],
      },
      {
        categoryName: '金额',
        unitList: [
          { unitCode: 'yuan', unitName: '元', conversionFactor: 1 },
          { unitCode: 'wanYuan', unitName: '万元', conversionFactor: 0.0001 },
        ],
      },
    ],
  }
}

// ==================== Store 定义 ====================

export const useModelStore = defineStore('model', () => {
  // State
  const unitDict = ref<Record<string, any>>({})
  const unitTree = ref<any[]>([])
  const modelType = ref('')
  const forecastTimeType = ref('')
  const isInit = ref(false)
  const currencyList = ref<any[]>([])
  const projectList = ref<any[]>([])
  const investList = ref<any[]>([])
  const modelList = ref<any[]>([])
  const targetIndustryList = ref([
    { label: '农粮', value: '农粮' },
    { label: '食品', value: '食品' },
    { label: '地产', value: '地产' },
    { label: '金融', value: '金融' },
  ])
  const organization = ref<any[]>([])

  // Actions
  function setModelType(val: string) {
    modelType.value = val
  }

  function setForecastTimeType(val: string) {
    forecastTimeType.value = val
  }

  function setIsInit(payload: boolean) {
    isInit.value = payload
  }

  function setCurrencyList(payload: any[]) {
    currencyList.value = payload
  }

  function setProjectList(payload: any[]) {
    projectList.value = payload
  }

  function setInvestList(payload: any[]) {
    investList.value = payload
  }

  function setModelList(payload: any[]) {
    modelList.value = payload
  }

  async function fetchProjectList() {
    try {
      const response = await getProjectList()
      const data = response.filter((item: any) => !!item?.projectCode)
      setProjectList(data)
      return response
    } catch (error) {
      console.error('Failed to fetch project list:', error)
    }
  }

  async function fetchCurrencyList() {
    try {
      const response = await getCurrencyList()
      setCurrencyList(response)
      return response
    } catch (error) {
      console.error('Failed to fetch currency list:', error)
    }
  }

  async function fetchInvestList() {
    try {
      const response = await getInvestList()
      const data = response.filter((item: any) => item !== null)
      setInvestList(data)
      return response
    } catch (error) {
      console.error('Failed to fetch invest list:', error)
    }
  }

  async function fetchUnit() {
    try {
      const response = await getUnitAndCategorylist()
      const tree = response.data.filter((item: any) => item.unitList && item.unitList.length > 1)
      const dict: Record<string, any> = {}
      tree.forEach((item: any) => {
        item.unitList.forEach((e: any) => {
          dict[e.unitCode] = {
            unit: e.unitName,
            scale: e.conversionFactor,
            options: item.unitList.map((u: any) => ({
              value: u.unitCode,
              label: u.unitName,
            })),
          }
        })
      })
      unitTree.value = tree
      unitDict.value = dict
      return response
    } catch (error) {
      console.error('Failed to fetch unit:', error)
    }
  }

  async function fetchModelList() {
    try {
      const response = await getModelList()
      const data =
        response.records && response.records.length > 0
          ? response.records.filter((item: any) => item !== null)
          : []
      setModelList(data)
      return response
    } catch (error) {
      console.error('Failed to fetch model list:', error)
    }
  }

  async function fetchAllList() {
    if (!isInit.value) {
      setIsInit(true)
      return Promise.all([
        fetchModelList(),
        fetchProjectList(),
        fetchCurrencyList(),
        fetchInvestList(),
        fetchUnit(),
      ])
    }
  }

  return {
    // State
    unitDict,
    unitTree,
    modelType,
    forecastTimeType,
    isInit,
    currencyList,
    projectList,
    investList,
    modelList,
    targetIndustryList,
    organization,
    // Actions
    setModelType,
    setForecastTimeType,
    setIsInit,
    setCurrencyList,
    setProjectList,
    setInvestList,
    setModelList,
    fetchProjectList,
    fetchCurrencyList,
    fetchInvestList,
    fetchUnit,
    fetchModelList,
    fetchAllList,
  }
})