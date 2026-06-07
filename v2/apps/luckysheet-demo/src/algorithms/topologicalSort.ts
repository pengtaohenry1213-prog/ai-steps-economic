/**
 * 拓扑排序 - 对公式单元格按依赖层级排序
 * 确保按依赖层级计算（被依赖的先计算）
 */

export interface CellRef {
  row: number
  col: number
}

/**
 * 解析单元格引用字符串（如 "A1", "B2"）为行列索引
 */
export function parseCellRef(cellStr: string): CellRef | null {
  const match = cellStr.match(/^([A-Z]+)(\d+)$/i)
  if (!match) return null

  const colStr = match[1].toUpperCase()
  const row = parseInt(match[2], 10) - 1 // 转为 0-index

  let col = 0
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64)
  }
  col -= 1 // 转为 0-index

  return { row, col }
}

/**
 * 解析公式字符串，提取所有单元格引用
 */
export function extractCellRefs(formula: string): CellRef[] {
  const refs: CellRef[] = []
  const cellRefRegex = /\$?([A-Z]+)\$?(\d+)/gi
  let match: RegExpExecArray | null

  while ((match = cellRefRegex.exec(formula)) !== null) {
    const ref = parseCellRef(match[0])
    if (ref) refs.push(ref)
  }

  return refs
}

/**
 * 拓扑排序
 * @param cells 单元格数组，每个单元格包含行列索引和公式
 * @returns排序后的单元格数组（按依赖层级）
 */
export function topologicalSort(
  cells: Array<{
    row: number
    col: number
    formula: string | null
  }>
): Array<{ row: number; col: number; formula: string | null }> {
  // 构建邻接表：cell -> 它依赖的单元格
  const adjList = new Map<string, string[]>()
  const cellKey = (r: number, c: number) => `${r},${c}`

  //初始化所有单元格
  for (const cell of cells) {
    if (!adjList.has(cellKey(cell.row, cell.col))) {
      adjList.set(cellKey(cell.row, cell.col), [])
    }
  }

  // 构建依赖关系
  for (const cell of cells) {
    if (!cell.formula) continue

    const deps = extractCellRefs(cell.formula)
    for (const dep of deps) {
      const depKey = cellKey(dep.row, dep.col)
      if (adjList.has(depKey)) {
        // 确保 depKey 在邻接表中（即使没有公式的单元格也可能被引用）
        const existing = adjList.get(cellKey(cell.row, cell.col)) || []
        existing.push(depKey)
        adjList.set(cellKey(cell.row, cell.col), existing)
      }
    }
  }

  // Kahn 算法
  const inDegree = new Map<string, number>()
  for (const [key] of adjList) {
    inDegree.set(key, 0)
  }

  for (const [, neighbors] of adjList) {
    for (const neighbor of neighbors) {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) + 1)
    }
  }

  const queue: string[] = []
  for (const [key, degree] of inDegree) {
    if (degree === 0) queue.push(key)
  }

  const sorted: string[] = []
  while (queue.length > 0) {
    const key = queue.shift()!
    sorted.push(key)

    const neighbors = adjList.get(key) || []
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) || 1) - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) queue.push(neighbor)
    }
  }

  // 如果有环，返回原始顺序（会触发循环引用检测）
  if (sorted.length !== adjList.size) {
    return cells
  }

  //转换为原始格式
  const keyToCell = new Map<string, { row: number; col: number; formula: string | null }>()
  for (const cell of cells) {
    keyToCell.set(cellKey(cell.row, cell.col), cell)
  }

  return sorted.map((key) => keyToCell.get(key)!).filter(Boolean)
}