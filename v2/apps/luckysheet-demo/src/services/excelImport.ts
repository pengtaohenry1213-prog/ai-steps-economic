import * as XLSX from 'xlsx'
import type { SheetData, CellData } from '@/types/spreadsheet'

/**
 * 导入 Excel 文件，转换为 Luckysheet 格式
 * @param file Excel 文件
 * @returns Luckysheet SheetData[]
 */
export async function importExcel(file: File): Promise<SheetData[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellFormula: true })

  return workbook.SheetNames.map((sheetName, index) => {
    const sheet = workbook.Sheets[sheetName]
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')

    const celldata: CellData[] = []

    for (let R = range.s.r; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        const cell = sheet[cellAddress]

        if (!cell) continue

        const cellData: CellData = {
          r: R,
          c: C,
          v: {
            v: cell.v ?? null,
            f: cell.f ?? null,
            ct: cell.ct
              ? { fa: cell.ct.fa, t: cell.ct.t }
              : undefined,
            bg: cell.bg,
            fc: cell.fc
          }
        }

        celldata.push(cellData)
      }
    }

    return {
      id: `sheet_${index + 1}`,
      name: sheetName,
      celldata,
      row: range.e.r - range.s.r + 1,
      column: range.e.c - range.s.c + 1
    }
  })
}