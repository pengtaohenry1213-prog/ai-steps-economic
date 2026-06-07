/**
 * useFormula hook - v1 公式管理适配到 v2
 *
 * 来源: MVT/v1/pages/edit/hooks/modules/useFormula.ts
 * 功能: 公式集 ${code: expression} 和公式详细信息管理
 */

import { reactive } from 'vue'

interface Formula {
  [key: string]: string
}

interface FormulaDetail {
  [key: string]: any
}

const formula: Formula = reactive({})
const formulaDetail: FormulaDetail = reactive({})

export function useFormula() {
  const setFormula = (code: string, value: string) => {
    formula[code] = value
  }

  const getFormula = (code: string): string => formula[code] || ''

  const setFormulaDetail = (code: string, value: object) => {
    if (!formulaDetail[code]) {
      formulaDetail[code] = {}
    }
    Object.assign(formulaDetail[code], value)
  }

  const getFormulaDetail = (code: string): any => formulaDetail[code] || {}

  const clear = () => {
    Object.keys(formula).forEach(key => delete formula[key])
    Object.keys(formulaDetail).forEach(key => delete formulaDetail[key])
  }

  return {
    formula,
    setFormula,
    getFormula,
    setFormulaDetail,
    getFormulaDetail,
    clear,
  }
}