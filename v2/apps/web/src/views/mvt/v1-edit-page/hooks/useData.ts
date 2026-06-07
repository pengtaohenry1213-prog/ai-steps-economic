/**
 * useData hook - v1 数据池适配到 v2
 *
 * 来源: MVT/v1/pages/edit/hooks/modules/useData.ts
 * 功能: 数据池、ID池、公式池、变化池统一入口
 */

import { ref, reactive } from 'vue'

// 动画数据
const animationData = reactive<Map<string, any>>(new Map())

export function useAnimationData() {
  const highlight = ref<{ enabled: boolean; metricCode?: string; field?: string }>({
    enabled: false,
  })

  function hasAnimationData(key: string): boolean {
    return animationData.has(key)
  }

  function addAnimationData(key: string, value: any) {
    animationData.set(key, value)
  }

  function getAnimationData(key: string): any {
    return animationData.get(key)
  }

  function clearAnimationData() {
    animationData.clear()
  }

  function setHighlight(params: { metricCode?: string; field?: string }) {
    highlight.value = { enabled: true, ...params }
  }

  function clearHighlight() {
    highlight.value = { enabled: false }
  }

  return {
    highlight,
    hasAnimationData,
    addAnimationData,
    getAnimationData,
    clearAnimationData,
    setHighlight,
    clearHighlight,
  }
}

// 变更数据
const changeDataMap = reactive<Map<string, any>>(new Map())

export function useChangeData() {
  // key 格式: "code-field"
  function setData(key: string, value: any) {
    changeDataMap.set(key, value)
  }

  function getData(key: string): any {
    return changeDataMap.get(key)
  }

  function removeData(key: string) {
    changeDataMap.delete(key)
  }

  function hasData(key: string): boolean {
    return changeDataMap.has(key)
  }

  function getAllData(): Map<string, any> {
    return changeDataMap
  }

  function clear() {
    changeDataMap.clear()
  }

  return {
    setData,
    getData,
    removeData,
    hasData,
    getAllData,
    clear,
  }
}

// 页面数据
const pageDataMap = reactive<Map<string, any>>(new Map())

export function usePageData() {
  function update(key: string, value: any) {
    pageDataMap.set(key, value)
  }

  function get(code: string, field: string): any {
    const key = `${code}-${field}`
    return pageDataMap.get(key)
  }

  function clear() {
    pageDataMap.clear()
  }

  return {
    update,
    get,
    clear,
  }
}

// 主数据池
let data: any = {}
let _data: any = {}
let visibleRows: string[] = []

const isEqual = (valA: any, valB: any): boolean => {
  const isEmpty = (value: any) =>
    ['', '0', 0, 'NaN', null, undefined, '空'].includes(value)

  if (isEmpty(valA) && isEmpty(valB)) {
    return true
  }
  if (!isEmpty(valA) && !isEmpty(valB)) {
    return valA == valB
  }
  return false
}

export function useData() {
  const { update: updatePageData } = usePageData()
  const { setData: setChangeData, removeData: removeChangeData } = useChangeData()
  const { addAnimationData } = useAnimationData()

  const setData = (key: string, field: string, value: number | string) => {
    if (!data[key]) {
      data[key] = {}
    }
    data[key][field] = value
  }

  const getData = (key: string, field: number | string) => {
    return data[key]?.[field]
  }

  const clone = () => {
    _data = JSON.parse(JSON.stringify(data))
  }

  const setVisibleRows = (value: any) => {
    visibleRows = JSON.parse(value)
  }

  const updateData = (code: string, field: string, value: number | string) => {
    const oldValue = data[code]?.[field] || undefined
    const changeKey = `${code}-${field}`

    if (isEqual(oldValue, value)) return

    if (visibleRows.includes(code)) {
      addAnimationData(changeKey, oldValue)
    }

    if (!data[code]) data[code] = {}
    data[code][field] = value
    updatePageData(changeKey, value)

    if (isEqual(_data[code]?.[field], value)) {
      removeChangeData(changeKey)
    } else {
      setChangeData(changeKey, value)
    }
  }

  const clearData = () => {
    data = {}
    _data = {}
    visibleRows = []
  }

  return {
    setData,
    clone,
    updateData,
    getData,
    setVisibleRows,
    clearData,
  }
}