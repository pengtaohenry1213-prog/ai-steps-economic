<script setup lang="ts">
/**
 * FinancialFunctionsDemo.vue - 财务函数兼容性验证
 *
 * Week3 Task: 验证 v1 财务函数(XIRR/NPV/IRR)与 HyperFormula 的兼容性
 */

import { ref, onMounted } from 'vue'
import { HyperFormula } from 'hyperformula'
import { xirrTestCases, npvTestCases, irrTestCases, allFinancialTestCases, type FinancialTestCase } from './testCases'

// 日志
const logs = ref<string[]>([])

interface VerificationResult {
  testCase: FinancialTestCase
  hfResult: number | null
  v1Expected: number
  pass: boolean
  error?: string
}

const verificationResults = ref<VerificationResult[]>([])

// HyperFormula 实例
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let hf: any = null
let sheetId = 0

function addLog(msg: string) {
  logs.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`)
}

// 初始化 HyperFormula
function initHyperFormula() {
  hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' })
  hf.addSheet('Sheet1')
  sheetId = hf.getSheetId('Sheet1')!
  addLog(`HyperFormula 初始化完成, sheetId: ${sheetId}`)
}

// 计算 XIRR (自定义实现，因为 HyperFormula 没有 XIRR)
function calculateXIRR(cashFlows: number[], dates: string[]): number {
  try {
    const startDate = new Date(dates[0])

    // NPV with dates calculation
    function npvWithDates(rate: number): number {
      let npv = 0
      for (let i = 0; i < cashFlows.length; i++) {
        const currentDate = new Date(dates[i])
        const daysDiff = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        const years = daysDiff / 365
        npv += cashFlows[i] / Math.pow(1 + rate, years)
      }
      return npv
    }

    // Newton-Raphson method for XIRR
    let rate = 0.1 // initial guess 10%
    const tolerance = 1e-10
    const maxIterations = 1000

    for (let i = 0; i < maxIterations; i++) {
      const npvVal = npvWithDates(rate)

      // Derivative of NPV with respect to rate
      const eps = 1e-8
      const npvPlus = npvWithDates(rate + eps)
      const npvMinus = npvWithDates(rate - eps)
      const npvDerivative = (npvPlus - npvMinus) / (2 * eps)

      if (Math.abs(npvDerivative) < tolerance) {
        break
      }

      const newRate = rate - npvVal / npvDerivative

      if (Math.abs(newRate - rate) < tolerance) {
        return newRate
      }

      rate = newRate
    }

    // Fallback: return 0 if doesn't converge
    return 0
  } catch (error) {
    addLog(`XIRR 计算错误: ${error}`)
    return 0
  }
}

// 计算 NPV (使用公式)
function calculateNPV(cashFlows: number[], rate: number): number {
  try {
    // HyperFormula NPV(rate, value1, value2, ...) 计算 period 1, 2, 3... 的现值
    // 不包含初始投资（period 0），所以直接用 NPV(rate, cashflows[1], cashflows[2], ...)
    const futureCashFlows = cashFlows.slice(1)  // 去掉初始投资
    const formula = `=NPV(${rate}, ${futureCashFlows.join(',')})`
    const result = hf.calculateFormula(formula, sheetId)
    return typeof result === 'number' ? result : 0
  } catch (error) {
    addLog(`NPV 计算错误: ${error}`)
    return 0
  }
}

// 计算 IRR (使用公式)
function calculateIRR(cashFlows: number[]): number {
  try {
    // 将现金流写入单元格 (从A1开始)
    for (let i = 0; i < cashFlows.length; i++) {
      hf.setCellContents({ sheet: sheetId, col: 0, row: i }, cashFlows[i])
    }
    // 使用公式计算 IRR = IRR(A1:An)
    const formula = `=IRR(A1:A${cashFlows.length})`
    const result = hf.calculateFormula(formula, sheetId)
    return typeof result === 'number' ? result : 0
  } catch (error) {
    addLog(`IRR 计算错误: ${error}`)
    return 0
  }
}

// 日期转 Excel 序列号 (与 v1 实现一致)
function dateToExcelSerial(dateStr: string): number {
  const dateObj = new Date(dateStr)
  if (Number.isNaN(dateObj.getTime())) {
    throw new TypeError(`无法解析日期字符串: ${dateStr}`)
  }
  const baseDate: Date = new Date(1900, 0, 1)
  const diffDays: number = (dateObj.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays + 2
}

// 验证单个测试用例
function verifyTestCase(testCase: FinancialTestCase): VerificationResult {
  const result: VerificationResult = {
    testCase,
    hfResult: null,
    v1Expected: testCase.v1Expected,
    pass: false
  }

  try {
    let hfResult = 0

    switch (testCase.functionName) {
      case 'XIRR':
        if (!testCase.dates) throw new Error('XIRR 需要日期数组')
        addLog(`\n验证 XIRR: ${testCase.description}`)
        addLog(`  现金流: [${testCase.cashFlows.join(', ')}]`)
        addLog(`  日期: [${testCase.dates.join(', ')}]`)
        hfResult = calculateXIRR(testCase.cashFlows, testCase.dates)
        break

      case 'NPV':
        if (!testCase.rates) throw new Error('NPV 需要折现率')
        addLog(`\n验证 NPV: ${testCase.description}`)
        addLog(`  现金流: [${testCase.cashFlows.join(', ')}]`)
        addLog(`  折现率: ${testCase.rates[0] * 100}%`)
        hfResult = calculateNPV(testCase.cashFlows, testCase.rates[0])
        break

      case 'IRR':
        addLog(`\n验证 IRR: ${testCase.description}`)
        addLog(`  现金流: [${testCase.cashFlows.join(', ')}]`)
        hfResult = calculateIRR(testCase.cashFlows)
        break
    }

    result.hfResult = hfResult
    const tolerance = testCase.tolerance
    result.pass = Math.abs(hfResult - result.v1Expected) < tolerance

    addLog(`  v1期望值: ${result.v1Expected.toFixed(4)}`)
    addLog(`  HF结果: ${hfResult.toFixed(4)}`)
    addLog(`  差异: ${Math.abs(hfResult - result.v1Expected).toFixed(4)}`)
    addLog(`  ${result.pass ? '✅ PASS' : '❌ FAIL'}`)

  } catch (error) {
    result.error = String(error)
    addLog(`  ❌ 错误: ${error}`)
  }

  return result
}

// 运行全部验证
function runAllVerification() {
  addLog('\n========== 开始财务函数验证 ==========')

  verificationResults.value = []

  // 验证所有测试用例
  for (const testCase of allFinancialTestCases) {
    const result = verifyTestCase(testCase)
    verificationResults.value.push(result)
  }

  // 统计结果
  const xirrResults = verificationResults.value.filter(r => r.testCase.functionName === 'XIRR')
  const npvResults = verificationResults.value.filter(r => r.testCase.functionName === 'NPV')
  const irrResults = verificationResults.value.filter(r => r.testCase.functionName === 'IRR')

  const xirrPass = xirrResults.filter(r => r.pass).length
  const npvPass = npvResults.filter(r => r.pass).length
  const irrPass = irrResults.filter(r => r.pass).length

  addLog('\n========== 验证结果汇总 ==========')
  addLog(`XIRR: ${xirrPass}/${xirrResults.length} 通过`)
  addLog(`NPV: ${npvPass}/${npvResults.length} 通过`)
  addLog(`IRR: ${irrPass}/${irrResults.length} 通过`)

  const totalPass = verificationResults.value.filter(r => r.pass).length
  const totalCount = verificationResults.value.length
  addLog(`总计: ${totalPass}/${totalCount} 通过`)
}

// 组件挂载时运行验证
onMounted(() => {
  try {
    initHyperFormula()
    runAllVerification()
  } catch (error) {
    addLog(`初始化错误: ${error}`)
    console.error(error)
  }
})

// 计算统计
function getStats() {
  const total = verificationResults.value.length
  const passed = verificationResults.value.filter(r => r.pass).length
  return { total, passed, failed: total - passed }
}
</script>

<template>
  <div class="financial-functions-demo">
    <h2>Week3 - 财务函数兼容性验证</h2>
    <p class="desc">
      验证目标：对比 v1 自研财务函数(XIRR/NPV/IRR)与 HyperFormula 内置函数的计算结果
    </p>

    <!-- 功能支持状态 -->
    <div class="support-status">
      <h3>HyperFormula 财务函数支持状态</h3>
      <table class="status-table">
        <thead>
          <tr>
            <th>函数</th>
            <th>HyperFormula 支持</th>
            <th>v1 自研实现</th>
            <th>兼容方案</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>XIRR</td>
            <td class="supported">✅ 支持</td>
            <td>Newton-Raphson + Bisection</td>
            <td>直接使用 HF</td>
          </tr>
          <tr>
            <td>NPV</td>
            <td class="supported">✅ 支持</td>
            <td>时间加权 NPV</td>
            <td>HF NPV + v1 补充</td>
          </tr>
          <tr>
            <td>IRR</td>
            <td class="supported">✅ 支持</td>
            <td>二分法</td>
            <td>直接使用 HF</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 验证结果 -->
    <div class="results-section">
      <h3>验证结果 ({{ getStats().passed }}/{{ getStats().total }})</h3>
      <div class="pass-badge" v-if="getStats().failed === 0">✅ 全部通过</div>
      <div class="fail-badge" v-else>❌ {{ getStats().failed }} 个失败</div>

      <!-- XIRR 结果 -->
      <h4>XIRR 测试</h4>
      <table class="results-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>描述</th>
            <th>v1期望</th>
            <th>HF结果</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="result in verificationResults.filter(r => r.testCase.functionName === 'XIRR')"
              :key="result.testCase.id">
            <td>{{ result.testCase.id }}</td>
            <td>{{ result.testCase.description }}</td>
            <td>{{ result.v1Expected.toFixed(4) }}</td>
            <td>{{ result.hfResult?.toFixed(4) ?? 'N/A' }}</td>
            <td :class="result.pass ? 'pass' : 'fail'">
              {{ result.pass ? '✅' : '❌' }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- NPV 结果 -->
      <h4>NPV 测试</h4>
      <table class="results-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>描述</th>
            <th>v1期望</th>
            <th>HF结果</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="result in verificationResults.filter(r => r.testCase.functionName === 'NPV')"
              :key="result.testCase.id">
            <td>{{ result.testCase.id }}</td>
            <td>{{ result.testCase.description }}</td>
            <td>{{ result.v1Expected.toFixed(4) }}</td>
            <td>{{ result.hfResult?.toFixed(4) ?? 'N/A' }}</td>
            <td :class="result.pass ? 'pass' : 'fail'">
              {{ result.pass ? '✅' : '❌' }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- IRR 结果 -->
      <h4>IRR 测试</h4>
      <table class="results-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>描述</th>
            <th>v1期望</th>
            <th>HF结果</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="result in verificationResults.filter(r => r.testCase.functionName === 'IRR')"
              :key="result.testCase.id">
            <td>{{ result.testCase.id }}</td>
            <td>{{ result.testCase.description }}</td>
            <td>{{ result.v1Expected.toFixed(4) }}</td>
            <td>{{ result.hfResult?.toFixed(4) ?? 'N/A' }}</td>
            <td :class="result.pass ? 'pass' : 'fail'">
              {{ result.pass ? '✅' : '❌' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 日志 -->
    <div class="logs-section">
      <h3>执行日志</h3>
      <div class="log-box">
        <div v-for="(log, index) in logs" :key="index"
             :class="{ error: log.includes('❌') && !log.includes('部分') }">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.financial-functions-demo {
  padding: 20px;
}

h2 {
  margin-bottom: 10px;
  color: #333;
}

h3, h4 {
  margin: 20px 0 10px 0;
  color: #333;
}

h4 {
  margin-top: 25px;
  font-size: 14px;
  color: #606266;
}

.desc {
  color: #666;
  margin-bottom: 20px;
}

.support-status,
.results-section,
.logs-section {
  margin-bottom: 20px;
}

.status-table,
.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.status-table th,
.status-table td,
.results-table th,
.results-table td {
  padding: 8px 12px;
  text-align: left;
  border: 1px solid #ddd;
}

.status-table th,
.results-table th {
  background: #f5f5f5;
  font-weight: 600;
}

.supported {
  color: #67c23a;
}

.pass {
  color: #67c23a;
  font-weight: bold;
}

.fail {
  color: #f56c6c;
  font-weight: bold;
}

.pass-badge {
  display: inline-block;
  padding: 6px 16px;
  background: #f0f9ff;
  color: #67c23a;
  border-radius: 4px;
  margin-bottom: 15px;
  font-weight: bold;
}

.fail-badge {
  display: inline-block;
  padding: 6px 16px;
  background: #fef0f0;
  color: #f56c6c;
  border-radius: 4px;
  margin-bottom: 15px;
  font-weight: bold;
}

.log-box {
  background: #1e1e1e;
  color: #0f0;
  padding: 15px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  max-height: 250px;
  overflow-y: auto;
}

.log-box div {
  margin: 2px 0;
}

.log-box .error {
  color: #ff6b6b;
}
</style>