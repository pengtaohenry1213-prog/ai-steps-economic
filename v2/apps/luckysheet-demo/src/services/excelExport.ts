import * as XLSX from 'xlsx'

interface ExportSheet {
  name: string
  cells: CellData[][]
}

interface CellData {
  r: number
  c: number
  v?: {
    v?: any
    f?: string | null
  }
}

/**
 * 导出 Luckysheet 数据为 Excel 文件
 * @param sheets Luckysheet Sheet数组
 * @param fileName 文件名（不含扩展名）
 */
export async function exportExcel(sheets: ExportSheet[], fileName: string): Promise<void> {
  const workbook = XLSX.utils.book_new()

  for (const sheet of sheets) {
    // 构建 A1 范围的单元格数据
    const wsData: Record<string, any> = {}

    for (const row of sheet.cells) {
      if (!row) continue
      for (const cell of row) {
        if (!cell) continue
        const cellAddr = XLSX.utils.encode_cell({ r: cell.r, c: cell.c })
        const cellValue: any = { v: cell.v?.v ?? null }

        //保留公式
        if (cell.v?.f) {
          cellValue.f = cell.v.f
        }

        wsData[cellAddr] = cellValue
      }
    }

    // 计算范围
    const refs = Object.keys(wsData).map((addr) => XLSX.utils.decode_cell(addr))
    if (refs.length > 0) {
      const minR = Math.min(...refs.map((r) => r.r))
      const maxR = Math.max(...refs.map((r) => r.r))
      const minC = Math.min(...refs.map((r) => r.c))
      const maxC = Math.max(...refs.map((r) => r.c))
      const sheetRange = XLSX.utils.encode_range({
        s: { r: minR, c: minC },
        e: { r: maxR, c: maxC }
      })
      const ws = XLSX.utils.json_to_sheet([], { skipHeader: true })
      // 应用数据
      XLSX.utils.sheet_add_json(ws, [], { skipHeader: true, origin: 'A1' })
      // 手动填充每个单元格
      for (const [addr, val] of Object.entries(wsData)) {
        const cell = ws[addr] || {}
        ws[addr] = { ...cell, ...val }
      }
      ws['!ref'] = sheetRange
      XLSX.utils.book_append_sheet(workbook, ws, sheet.name)
    }
  }

  // 生成文件并触发下载
  const wbout = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}