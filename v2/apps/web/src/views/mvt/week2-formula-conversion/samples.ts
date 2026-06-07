/**
 * Week2 公式样本 - v1 典型公式
 *
 * 来源: docs/v1_docs/参考/2025项目源码/apps/web-ele/tests/mock/formula-data.ts
 */

// v1 公式样本 (metricCode 格式)
export interface FormulaSample {
  id: string
  metricCode: string
  formulaName: string
  v1Formula: string  // 原始 v1 格式: ${metricCode}
  description: string
  // 测试数据
  testValues: Record<string, number>
  expectedResult: number
}

// 公式样本列表
export const formulaSamples: FormulaSample[] = [
  {
    id: 'sample-1',
    metricCode: 'C10000A0320100003',
    formulaName: '半干面生鲜面粉生产成本合计（含税）',
    v1Formula: '${C10000A0321100003}+${C10000A0322100003}+${C10000A0323100003}',
    description: '三个成本指标求和',
    testValues: {
      'C10000A0321100003': 100,
      'C10000A0322100003': 200,
      'C10000A0323100003': 300,
    },
    expectedResult: 600,
  },
  {
    id: 'sample-2',
    metricCode: 'C10000A0387',
    formulaName: '标的售价（含税）',
    v1Formula: '${C10000A0388}/${C10000A0038}',
    description: '销额除以销量',
    testValues: {
      'C10000A0388': 1000,
      'C10000A0038': 10,
    },
    expectedResult: 100,
  },
  {
    id: 'sample-3',
    metricCode: 'C10000A0007',
    formulaName: '非生产用固定资产合计',
    v1Formula: '${C10000A0008}+${C10000A0009}',
    description: '两个固定资产指标求和',
    testValues: {
      'C10000A0008': 500,
      'C10000A0009': 300,
    },
    expectedResult: 800,
  },
  {
    id: 'sample-4',
    metricCode: 'C10000A0010',
    formulaName: '生产设备合计',
    v1Formula: '${C10000A0011}+${C10000A0012}+${C10000A0013}',
    description: '三个生产设备指标求和',
    testValues: {
      'C10000A0011': 1000,
      'C10000A0012': 1500,
      'C10000A0013': 800,
    },
    expectedResult: 3300,
  },
  {
    id: 'sample-5',
    metricCode: 'C10000A0020',
    formulaName: '在产品期末余额',
    v1Formula: '${C10000A0021}+${C10000A0022}-${C10000A0023}',
    description: '加总后减去消耗',
    testValues: {
      'C10000A0021': 5000,
      'C10000A0022': 2000,
      'C10000A0023': 1500,
    },
    expectedResult: 5500,
  },
  {
    id: 'sample-6',
    metricCode: 'C10000A0030',
    formulaName: '毛利率',
    v1Formula: '(${C10000A0031}-${C10000A0032})/${C10000A0031}',
    description: '(收入-成本)/收入',
    testValues: {
      'C10000A0031': 10000,
      'C10000A0032': 6000,
    },
    expectedResult: 0.4,
  },
  {
    id: 'sample-7',
    metricCode: 'C10000A0040',
    formulaName: '环比增长率',
    v1Formula: '(${C10000A0041}-${C10000A0040})/${C10000A0040}',
    description: '(本期-上期)/上期',
    testValues: {
      'C10000A0040': 1000,  // 上期
      'C10000A0041': 1200,  // 本期
    },
    expectedResult: 0.2,
  },
  {
    id: 'sample-8',
    metricCode: 'C10000A0050',
    formulaName: '成本合计',
    v1Formula: '${C10000A0051}*${C10000A0052}+${C10000A0053}',
    description: '数量*单价+固定成本',
    testValues: {
      'C10000A0051': 100,
      'C10000A0052': 50,
      'C10000A0053': 1000,
    },
    expectedResult: 6000,
  },
  {
    id: 'sample-9',
    metricCode: 'C10000A0060',
    formulaName: '利润率',
    v1Formula: '(${C10000A0061}-${C10000A0062})/${C10000A0061}*100',
    description: '利润率百分比',
    testValues: {
      'C10000A0061': 50000,
      'C10000A0062': 30000,
    },
    expectedResult: 40,
  },
  {
    id: 'sample-10',
    metricCode: 'C10000A0070',
    formulaName: '累计折旧',
    v1Formula: '${C10000A0071}+${C10000A0072}+${C10000A0073}',
    description: '三项折旧求和',
    testValues: {
      'C10000A0071': 200,
      'C10000A0072': 150,
      'C10000A0073': 100,
    },
    expectedResult: 450,
  },
]

/**
 * 转换 v1 公式为 HyperFormula 格式
 *
 * @param v1Formula - v1 公式: ${metricCode}
 * @param codeToCell - 指标Code到单元格地址的映射
 * @returns HyperFormula 格式公式
 */
export function convertV1Formula(
  v1Formula: string,
  codeToCell: Record<string, string>
): string {
  // 匹配 ${metricCode} 格式
  const pattern = /\$\{([^}]+)\}/g

  return v1Formula.replace(pattern, (match, metricCode) => {
    const cellAddress = codeToCell[metricCode]
    if (!cellAddress) {
      console.warn(`[FormulaConverter] 未找到 metricCode: ${metricCode}`)
      return match // 保留原样
    }
    return cellAddress
  })
}

/**
 * 构建指标Code到单元格地址的映射表
 * 假设指标按顺序排列在 A, B, C... 列
 */
export function buildCodeToCellMapping(samples: FormulaSample[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const usedCodes = new Set<string>()

  // 收集所有需要引用的 metricCodes
  for (const sample of samples) {
    const pattern = /\$\{([^}]+)\}/g
    let match
    while ((match = pattern.exec(sample.v1Formula)) !== null) {
      usedCodes.add(match[1])
    }
  }

  // 按字母顺序排列，映射到 A, B, C... 列
  const sortedCodes = [...usedCodes].sort()
  sortedCodes.forEach((code, index) => {
    const colLetter = String.fromCharCode(65 + index) // A=65
    mapping[code] = `${colLetter}1`
  })

  return mapping
}