/**
 * Mock 数据加载服务
 * 基于经济测算模型真实数据结构:
 * - dataPool: { metricCode: { field: value } } 多期数据池
 * - formulaMap: { "metricCode-field": FormulaNode } 公式依赖图
 * - modelMetrics: 指标配置列表
 * - modelFormulas: 公式定义列表
 * - globalConfig: 全局计算配置
 */

import cellsData from '@/mock/cells.json'
import formulasData from '@/mock/formulas.json'
import type { SheetData } from '@/types/spreadsheet'

/** 全局配置 */
export interface GlobalConfig {
  startTime: string
  periodNumber: number
  periodMonths: number
  timeType: 'year' | 'quarter' | 'month'
  targetIndustry: string
  calcMethod: 0 | 1
  isLoad: boolean
  currencyCode: string
  investmentSubject: string
  projectCode: string
  projectName: string
  modelType: string
  investmentType: string
}

/** FormulaNode - 公式节点 */
export interface FormulaNode {
  id: string
  metricCode: string
  field: string
  formula: string
  formulaName: string
  marks: Array<{
    deCode: string
    enCode: string
    from: number
    to: number
  }>
  calcMarks: string[]
  children: Array<{ id: string; field: string }>
  parent: string[]
}

/** ModelMetric - 指标配置 */
export interface ModelMetric {
  id: string
  metricCode: string
  metricName: string
  pMetricCode: string
  level: number
  metricCategory: number
  unit: string
  scale: string
  sort: number
  isFixed: number
  versionCode: string
  modelCode: string
}

/** DataEntry - 单元格值 */
export interface DataEntry {
  id: string
  metricCode: string
  value: number | string | null
  reportYear: string
  reportQuarter?: string
  reportMonth?: string
  modelCode: string
  versionCode: string
}

/** 全局配置 */
export function getGlobalConfig(): GlobalConfig {
  return (cellsData as any).globalConfig
}

/**
 * 获取 dataPool（多期数据池）
 * 结构: { metricCode: { field: value, ...unit, scale, ... } }
 */
export function getDataPool(): Record<string, Record<string, any>> {
  return (cellsData as any).dataPool
}

/**
 * 获取 formulaMap（公式依赖图）
 * 结构: { "metricCode-field": FormulaNode }
 */
export function getFormulaMap(): Record<string, FormulaNode> {
  return (formulasData as any).formulaMap
}

/**
 * 获取 modelMetrics（指标配置列表）
 */
export function getModelMetrics(): ModelMetric[] {
  return (cellsData as any).modelMetrics
}

/**
 * 获取 modelFormulas（公式定义列表）
 */
export function getModelFormulas(): any[] {
  return (cellsData as any).modelFormulas
}

/**
 * 获取所有时间字段数组
 */
export function getTimeFields(): string[] {
  const globalConfig = getGlobalConfig()
  const startYear = parseInt(globalConfig.startTime, 10)
  const fields: string[] = []
  for (let i = 0; i < globalConfig.periodNumber; i++) {
    fields.push(String(startYear + i))
  }
  return fields
}

/**
 * 将 dataPool + formulaMap 转换为 Luckysheet SheetData 格式
 * 仅取第一列时间字段 (2025) 作为展示
 */
export function loadMockSheetData(): SheetData {
  const dataPool = getDataPool()
  const formulaMap = getFormulaMap()
  const timeField = getGlobalConfig().startTime

  const celldata: SheetData['celldata'] = []
  const metrics = getModelMetrics()

  let rowIndex = 0
  for (const metric of metrics) {
    const pool = dataPool[metric.metricCode]
    if (!pool) continue

    const formulaKey = `${metric.metricCode}-${timeField}`
    const formulaNode = formulaMap[formulaKey]
    const value = pool[timeField] ?? null
    const isCalculated = metric.metricCategory === 1

    celldata.push({
      r: rowIndex,
      c: 0,
      v: {
        v: isCalculated ? null : value,
        f: formulaNode?.formula ?? null,
        ct:
          value !== null
            ? { fa: 'General', t: typeof value === 'number' ? 'n' : 'g' }
            : undefined,
        bg: isCalculated ? '#fff9c4' : '#e3f2fd'
      }
    })

    celldata.push({
      r: rowIndex,
      c: 1,
      v: {
        v: metric.metricName,
        ct: { fa: 'General', t: 'g' }
      }
    })

    celldata.push({
      r: rowIndex,
      c: 2,
      v: {
        v: metric.unit,
        ct: { fa: 'General', t: 'g' }
      }
    })

    // 显示公式描述
    if (formulaNode) {
      celldata.push({
        r: rowIndex,
        c: 3,
        v: {
          v: formulaNode.formulaName,
          ct: { fa: 'General', t: 'g' }
        }
      })
    }

    rowIndex++
  }

  return {
    id: 'mock_sheet',
    name: '经济测算模型（多期）',
    celldata,
    row: rowIndex + 1,
    column: 5
  }
}

/**
 * 获取所有带公式的单元格（用于算法测试）
 */
export function getFormulaCells(): Array<{
  row: number
  col: number
  formula: string | null
}> {
  const formulaMap = getFormulaMap()
  const metrics = getModelMetrics()

  const metricIndexMap = new Map<string, number>()
  metrics.forEach((m, idx) => metricIndexMap.set(m.metricCode, idx))

  const result: Array<{ row: number; col: number; formula: string | null }> = []

  for (const [key, node] of Object.entries(formulaMap)) {
    const metricCode = key.split('-')[0]
    const rowIndex = metricIndexMap.get(metricCode) ??0
    result.push({
      row: rowIndex,
      col: 0,
      formula: node.formula
    })
  }

  return result
}

/**
 * 获取 metricCode -> formula 映射（用于拓扑排序构建依赖图）
 */
export function getMetricFormulaMap(): Map<string, string> {
  const formulaMap = getFormulaMap()
  const map = new Map<string, string>()

  for (const [key, node] of Object.entries(formulaMap)) {
    const metricCode = key.split('-')[0]
    if (!map.has(metricCode)) {
      map.set(metricCode, node.formula)
    }
  }

  return map
}

/**
 * 获取 DAG 依赖图（用于拓扑排序）
 * 结构: { cellId: [依赖的cellId数组] }
 * e.g. { "F300003100009999999-2025": ["F300008100009999999-2025", ...] }
 */
export function getDependencyGraph(): Record<string, string[]> {
  const formulaMap = getFormulaMap()
  const graph: Record<string, string[]> = {}

  for (const [key, node] of Object.entries(formulaMap)) {
    graph[key] = node.calcMarks
  }

  return graph
}

/**
 * Kahn 拓扑排序（基于 formulaMap 的 calcMarks 构建的有向无环图）
 * @param formulaMapData 可选，传入时使用该数据；否则使用 mock 数据
 * @returns 排序后的 nodeId 数组
 */
export function topologicalSortFromFormulaMap(
  formulaMapData?: Record<string, FormulaNode>
): string[] {
  const formulaMap = formulaMapData ?? getFormulaMap()

  // 构建邻接表: calcMark -> [被它依赖的节点]
  const graph: Record<string, string[]> = {}
  const inDegree: Record<string, number> = {}

  // 初始化所有节点
  for (const [nodeId] of Object.entries(formulaMap)) {
    graph[nodeId] = []
    inDegree[nodeId] = 0
  }

  // 构建反向依赖关系 + 入度统计
  for (const [nodeId, node] of Object.entries(formulaMap)) {
    for (const dep of node.calcMarks) {
      if (graph[dep] !== undefined) {
        graph[dep].push(nodeId)
        inDegree[nodeId]++
      }
    }
  }

  // Kahn 算法
  const queue: string[] = []
  for (const [nodeId, degree] of Object.entries(inDegree)) {
    if (degree === 0) queue.push(nodeId)
  }

  const sorted: string[] = []
  while (queue.length > 0) {
    const nodeId = queue.shift()!
    sorted.push(nodeId)

    for (const neighbor of graph[nodeId]) {
      inDegree[neighbor]--
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor)
      }
    }
  }

  return sorted // 如果有环，sorted.length < Object.keys(formulaMap).length
}

/**
 * 获取 FormulaNode（单节点）
 */
export function getFormulaNode(metricCode: string, field: string): FormulaNode | undefined {
  const formulaMap = getFormulaMap()
  return formulaMap[`${metricCode}-${field}`]
}

/**
 * 循环引用测试用例
 */
export function getCircularRefTestData(): Array<{
  row: number
  col: number
  formula: string | null
}> {
  return [
    { row: 0, col: 0, formula: '=B1*2' },
    { row: 0, col: 1, formula: '=C1+10' },
    { row: 1, col: 0, formula: '=A1' } // 形成循环: A1→B1→C1→A1
  ]
}