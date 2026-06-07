/**
 * 公式集 {{code: expression}, ...}
 * 公式详细信息
 */

interface Formula {
  [key: string]: string;
}
let formula: Formula = {};

interface FormulaDetail {
  [key: string]: any;
}
let formulaDetail: FormulaDetail = {};

export function useFormula() {
  const setFormula = (code: string, value: string) => {
    formula[code] = value;
  };
  const getFormula = (code: string): string => formula[code] || '';

  const setFormulaDetail = (code: string, value: object) => {
    if (!formulaDetail[code]) {
      formulaDetail[code] = {};
    }
    Object.assign(formulaDetail[code], value);
  };
  const getFormulaDetail = (code: string): string => formulaDetail[code] || {};

  return {
    formula,
    setFormula,
    getFormula,
    setFormulaDetail,
    getFormulaDetail,
    clear: () => {
      formula = {};
      formulaDetail = {};
    },
  };
}
