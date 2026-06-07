/**
 * 不动点迭代（Gauss-Seidel 迭代）
 * 用于循环引用的收敛计算
 * 当连续结果差值 < 阈值时终止
 *
 * 注：实际公式计算由 Luckysheet 内置引擎执行，
 * 此模块仅负责迭代收敛控制逻辑
 */

export interface IterationResult {
  converged: boolean
  finalValues: Map<string, number>
  iterations: number
  finalError: number
}

export interface CellRef {
  row: number
  col: number
}

const DEFAULT_TOLERANCE = 1e-6
const DEFAULT_MAX_ITERATIONS = 100

/**
 * 获取单元格键名
 */
function cellKey(row: number, col: number): string {
  return `${row},${col}`
}

/**
 * 执行 Gauss-Seidel 迭代计算
 * @param cycleCells 循环引用中的单元格（已包含公式）
 * @param evaluateFormula 公式引擎求值函数 (formula, currentValues) => number
 * @param tolerance 收敛阈值（默认 1e-6）
 * @param maxIterations 最大迭代次数（默认 100）
 */
export function gaussSeidelIterate(
  cycleCells: Array<{ row: number; col: number; formula: string }>,
  evaluateFormula: (formula: string, cellValues: Map<string, number>) => number,
  tolerance: number = DEFAULT_TOLERANCE,
  maxIterations: number = DEFAULT_MAX_ITERATIONS
): IterationResult {
  const values = new Map<string, number>()
  const formulas = new Map<string, string>()

  // 初始化值为 0
  for (const cell of cycleCells) {
    const key = cellKey(cell.row, cell.col)
    values.set(key, 0)
    formulas.set(key, cell.formula)
  }

  let iterations = 0
  let maxError = Infinity

  while (iterations < maxIterations && maxError > tolerance) {
    maxError = 0

    for (const cell of cycleCells) {
      const key = cellKey(cell.row, cell.col)
      const formula = formulas.get(key)!

      // 调用公式引擎计算（Luckysheet 内置引擎会处理循环引用收敛）
      const newValue = evaluateFormula(formula, values)

      if (newValue !== null && !isNaN(newValue)) {
        const oldValue = values.get(key) ?? 0
        const error = Math.abs(newValue - oldValue)
        maxError = Math.max(maxError, error)
        values.set(key, newValue)
      }
    }

    iterations++
  }

  return {
    converged: maxError <= tolerance,
    finalValues: values,
    iterations,
    finalError: maxError
  }
}

/**
 * 检测收敛性 -连续迭代差值是否小于阈值
 */
export function checkConvergence(
  oldValues: Map<string, number>,
  newValues: Map<string, number>,
  tolerance: number = DEFAULT_TOLERANCE
): boolean {
  for (const [key, newVal] of newValues) {
    const oldVal = oldValues.get(key) ?? 0
    if (Math.abs(newVal - oldVal) >= tolerance) {
      return false
    }
  }
  return true
}