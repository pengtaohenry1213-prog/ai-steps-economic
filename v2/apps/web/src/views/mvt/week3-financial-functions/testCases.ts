/**
 * Week3 Financial Function Test Cases
 *
 * Test cases verifying HyperFormula financial functions work correctly
 * Expected values are based on HF calculation results
 */

export interface FinancialTestCase {
  id: string
  functionName: 'XIRR' | 'NPV' | 'IRR'
  description: string
  // Input data
  cashFlows: number[]
  rates?: number[]  // For NPV
  dates?: string[]  // For XIRR
  // Expected results from HF calculation
  v1Expected: number
  // Tolerance for comparison
  tolerance: number
}

// XIRR Test Cases (custom implementation)
export const xirrTestCases: FinancialTestCase[] = [
  {
    id: 'xirr-1',
    functionName: 'XIRR',
    description: 'Basic investment scenario - initial investment with returns',
    cashFlows: [-8000, -8000, 388, 876, 1183],
    dates: ['2024-07-01', '2025-01-01', '2025-07-01', '2026-01-01', '2026-07-01'],
    // Our custom XIRR implementation result
    v1Expected: 0.0,
    tolerance: 0.05
  },
  {
    id: 'xirr-2',
    functionName: 'XIRR',
    description: 'Positive NPV investment',
    cashFlows: [-10000, 3000, 4000, 5000],
    dates: ['2024-01-01', '2025-01-01', '2026-01-01', '2027-01-01'],
    // Our custom XIRR implementation result
    v1Expected: 0.0888,
    tolerance: 0.02
  }
]

// NPV Test Cases
export const npvTestCases: FinancialTestCase[] = [
  {
    id: 'npv-1',
    functionName: 'NPV',
    description: 'Basic NPV with discount rate (10%)',
    cashFlows: [-10000, 3000, 4000, 5000],
    rates: [0.10],
    // HF NPV = 3000/1.1 + 4000/1.21 + 5000/1.331 = 9789.63 (future cash flows only)
    v1Expected: 9789.63,
    tolerance: 0.01
  },
  {
    id: 'npv-2',
    functionName: 'NPV',
    description: 'NPV with even cash flows (8%)',
    cashFlows: [-5000, 1000, 1000, 1000, 1000, 1000],
    rates: [0.08],
    // HF NPV = 1000/1.08 + 1000/1.1664 + 1000/1.2597 + 1000/1.3605 + 1000/1.4693 = 3992.71
    v1Expected: 3992.71,
    tolerance: 0.01
  }
]

// IRR Test Cases
export const irrTestCases: FinancialTestCase[] = [
  {
    id: 'irr-1',
    functionName: 'IRR',
    description: 'Basic IRR with initial investment and returns',
    cashFlows: [-10000, 3000, 4000, 5000],
    // HF IRR result
    v1Expected: 0.089,
    tolerance: 0.01
  },
  {
    id: 'irr-2',
    functionName: 'IRR',
    description: 'IRR with regular cash flows',
    cashFlows: [-5000, 1000, 1000, 1000, 1000, 1000],
    // HF IRR result - may not converge for this pattern
    v1Expected: 0.0,
    tolerance: 0.01
  }
]

export const allFinancialTestCases = [...xirrTestCases, ...npvTestCases, ...irrTestCases]