/**
 * 循环引用检测 - 使用 DFS 追踪引用路径，定位循环节点
 */

export interface CellRef {
  row: number
  col: number
}

export interface CycleInfo {
  hasCycle: boolean
  cycleNodes: CellRef[]
  cyclePath: string[]
}

/**
 * 检测单元格引用是否形成循环
 * 使用 DFS 追踪从起始单元格开始的引用路径
 */
export function detectCycle(
  startRow: number,
  startCol: number,
  getCellFormula: (row: number, col: number) => string | null
): CycleInfo {
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const cyclePath: string[] = []

  const cellKey = (r: number, c: number) => `${r},${c}`

  // 解析公式中的单元格引用
  function extractRefs(formula: string): CellRef[] {
    const refs: CellRef[] = []
    const cellRefRegex = /([A-Z]+)(\d+)/gi
    let match: RegExpExecArray | null

    while ((match = cellRefRegex.exec(formula)) !== null) {
      const colStr = match[1].toUpperCase()
      const row = parseInt(match[2], 10) - 1
      let col = 0
      for (let i = 0; i < colStr.length; i++) {
        col = col * 26 + (colStr.charCodeAt(i) - 64)
      }
      col -= 1
      refs.push({ row, col })
    }
    return refs
  }

  // DFS 检测循环
  function dfs(row: number, col: number): boolean {
    const key = cellKey(row, col)

    if (recursionStack.has(key)) {
      cyclePath.push(key)
      return true
    }

    if (visited.has(key)) {
      return false
    }

    visited.add(key)
    recursionStack.add(key)
    cyclePath.push(key)

    const formula = getCellFormula(row, col)
    if (formula) {
      const refs = extractRefs(formula)
      for (const ref of refs) {
        if (dfs(ref.row, ref.col)) {
          return true
        }
      }
    }

    recursionStack.delete(key)
    cyclePath.pop()
    return false
  }

  const hasCycle = dfs(startRow, startCol)

  return {
    hasCycle,
    cycleNodes: cyclePath.map((key) => {
      const [r, c] = key.split(',').map(Number)
      return { row: r, col: c }
    }),
    cyclePath
  }
}

/**
 * 检测所有循环引用（全局检测）
 */
export function detectAllCycles(
  cells: Array<{ row: number; col: number; formula: string | null }>
): CycleInfo[] {
  const formulaMap = new Map<string, string | null>()
  for (const cell of cells) {
    formulaMap.set(`${cell.row},${cell.col}`, cell.formula)
  }

  const getFormula = (row: number, col: number) =>
    formulaMap.get(`${row},${col}`) ?? null

  const checked = new Set<string>()
  const cycles: CycleInfo[] = []

  for (const cell of cells) {
    if (!cell.formula) continue
    const key = `${cell.row},${cell.col}`
    if (checked.has(key)) continue

    const result = detectCycle(cell.row, cell.col, getFormula)
    if (result.hasCycle) {
      cycles.push(result)
      result.cyclePath.forEach((k) => checked.add(k))
    }
  }

  return cycles
}