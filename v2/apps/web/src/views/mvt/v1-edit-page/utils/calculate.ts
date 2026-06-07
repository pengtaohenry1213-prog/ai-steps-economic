/**
 * calculate.ts - v1 公式计算引擎适配到 v2
 *
 * 来源: MVT/v1/pages/edit/utils/calculate.ts
 * 功能: 解析 v1 公式 ${metricCode} 并计算结果
 */

import { useData, useFormula } from '../hooks'

const VARIABLE_REGEX = /\$\{([^${}]+)\}/g

interface Instance {
  dateFields: string[]
  forecastTimeType: 'month' | 'quarter' | 'year'
  targetIndustry: string
  investmentType?: string
}

// 简化的公式计算核心
class FunctionCore {
  executeFunction(expr: string): number | string {
    try {
      // 处理空表达式
      if (!expr || expr.trim() === '') return 0

      // 简单的算术表达式计算
      // 移除所有空格
      expr = expr.replace(/\s+/g, '')

      // 处理连续负号
      expr = expr.replace(/--/g, '+')

      // 使用 Function 构造器计算简单表达式（仅用于演示）
      // 警告：生产环境不应使用 eval，应使用安全的表达式解析器
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${expr}`)()

      if (typeof result === 'number') {
        return Number.isFinite(result) ? result : 'NaN'
      }
      return result
    } catch (e) {
      console.error('[FunctionCore] 计算错误:', e, '表达式:', expr)
      return '#ERROR'
    }
  }
}

const core = new FunctionCore()

export default async function calculate(
  instance: Instance,
  graph: string[],
): Promise<void> {
  const {
    dateFields,
    forecastTimeType: timeType,
    targetIndustry,
    investmentType = '新建',
  } = instance

  const { getFormula } = useFormula()
  const { getData, updateData } = useData()

  // 预计算常量
  const precomputed = {
    periodMonths: timeType === 'year' ? 12 : 3,
    periodNumber: dateFields.length,
    arrayAllPeriod: JSON.stringify(dateFields.map((_, i) => i + 1)),
    arrayAllDate: JSON.stringify(dateFields),
    targetIndustry: `'${targetIndustry}'`,
    investmentType: `'${investmentType}'`,
  }

  // 全局变量处理器
  const globalHandlers: Record<string, any> = {
    'global-arrayAllDate': precomputed.arrayAllDate,
    'global-arrayAllPeriod': precomputed.arrayAllPeriod,
    'global-periodNumber': precomputed.periodNumber,
    'global-periodMonths': precomputed.periodMonths,
    'global-targetIndustry': precomputed.targetIndustry,
    'global-investmentType': precomputed.investmentType,
    'var-everyPeriod': (date: string) => dateFields.indexOf(date) + 1,
  }

  // 特殊表达式处理器
  const expressionHandlers: Record<string, (code: string, date: string) => any> = {
    lastPeriod: (code, date) =>
      timeType === 'year'
        ? getData(code, date) || 0
        : getData(
            code,
            [...dateFields].reverse().find((f) => f.startsWith(date.slice(0, 4))) || 0,
          ) || 0,

    arrayAllValue: (code) =>
      JSON.stringify(dateFields.map((f) => +(getData(code, f) || 0))),

    prevPeriodAdd: (code, date) => {
      let sum = 0
      for (const f of dateFields) {
        if (f === date) break
        sum += +(getData(code, f) || 0)
      }
      return sum
    },

    periodAdd: (code, date) => {
      let sum = 0
      for (const f of dateFields) {
        sum += +(getData(code, f) || 0)
        if (f === date) break
      }
      return sum
    },

    futurePeriodAdd: (code, date) => {
      let sum = 0
      for (let i = dateFields.length - 1; i >= 0; i--) {
        const f = dateFields[i]
        if (f === date) break
        sum += +(getData(code, f) || 0)
      }
      return sum
    },

    prev: (code, date) => {
      const idx = dateFields.indexOf(date)
      return idx > 0 ? +(getData(code, dateFields[idx - 1]) || 0) : 0
    },

    total: (code) =>
      dateFields.reduce((sum, f) => sum + +(getData(code, f) || 0), 0),

    totalYear: (code, date) =>
      timeType === 'year'
        ? +(getData(code, date) || 0)
        : dateFields.reduce(
            (sum, f) =>
              f.startsWith(date.slice(0, 4))
                ? sum + +(getData(code, f) || 0)
                : sum,
            0,
          ),
  }

  // 日志
  const log = {
    notInFormula: new Set<string>(),
    calcData: [] as any[],
    illegalData: [] as any[],
  }

  // 解析公式
  const assignExpression = (str: string) => {
    const [metricCode, date] = str.split('-', 2) as [string, string]
    if (!metricCode) return

    const expression = getFormula(metricCode)
    if (!expression) {
      log.notInFormula.add(metricCode)
      return
    }

    const matches = expression.match(VARIABLE_REGEX)
    if (!matches) return

    const values: Record<string, any> = {}
    for (const match of matches) {
      const content = match.slice(2, -1)
      if (content in globalHandlers) {
        values[match] =
          typeof globalHandlers[content] === 'function'
            ? globalHandlers[content](date)
            : globalHandlers[content]
      } else if (content.includes('-')) {
        const [prefix, code] = content.split('-') as [string, string]
        values[match] = expressionHandlers[prefix]?.(code, date)
      } else {
        values[match] = getData(content, date) || 0
      }
    }

    // 替换指标编码为对应值，并处理连续负号
    const newExpr = expression
      .replace(VARIABLE_REGEX, (m) => values[m] ?? m)
      .replace(/--/g, '+')

    // 计算结果
    let result = core.executeFunction(newExpr)

    // 处理计算结果
    const resultType = typeof result
    switch (resultType) {
      case 'boolean':
        result = result ? 'TRUE' : 'FALSE'
        break
      case 'number':
        result = Number.isFinite(result) ? result : 'NaN'
        break
      case 'string':
        if (result === '#ERROR') {
          log.illegalData.push({ cell: str, expression, newExpr, result })
        }
        break
      default:
        log.illegalData.push({ cell: str, expression, newExpr, result })
    }

    // 更新数据池
    updateData(metricCode, date, result)
    log.calcData.push({ cell: str, expression, newExpr, result })
  }

  // 执行计算
  console.time('计算耗时')
  graph.forEach((item) => assignExpression(item))
  console.timeEnd('计算耗时')

  console.log('计算日志', log)
}