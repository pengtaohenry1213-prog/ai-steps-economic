// Luckysheet 数据结构类型定义（本地类型，不依赖 npm 包）
export interface CellValue {
  v?: any
  f?: string | null
  ct?: { fa?: string; t?: string }
  bg?: string
  fc?: string
}

export interface CellData {
  r: number
  c: number
  v?: CellValue
}

export interface SheetData {
  id: string
  name: string
  celldata?: CellData[]
  row?: number
  column?: number
  config?: any
}

export interface Sheet {
  id: string
  name: string
  data: CellData[][]
}