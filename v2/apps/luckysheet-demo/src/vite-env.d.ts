///<reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Luckysheet 通过 CDN 加载，全局 window.luckysheet
interface LuckysheetCellValue {
  v?: any
  f?: string | null
  ct?: { fa?: string; t?: string }
  bg?: string
  fc?: string
}

interface LuckysheetCellData {
  r: number
  c: number
  v?: LuckysheetCellValue
}

interface LuckysheetSheetData {
  id: string
  name: string
  celldata?: LuckysheetCellData[]
  row?: number
  column?: number
  config?: any
}

interface LuckysheetSheet {
  id: string
  name: string
  data: LuckysheetCellData[][]
}

interface LuckysheetAPI {
  create: (options: { container: string | HTMLElement; data?: LuckysheetSheetData[]; lang?: string; showtoolbar?: boolean; showinfobar?: boolean; showsheetbar?: boolean; showstatisticBar?: boolean }) => void
  destroy: () => void
  getAllSheets: () => LuckysheetSheet[]
  getSheet: (sheetId: string) => LuckysheetSheet | undefined
  config: { load: (data: LuckysheetSheetData) => void }
}

declare global {
  interface Window {
    luckysheet: LuckysheetAPI
  }
}

export {}