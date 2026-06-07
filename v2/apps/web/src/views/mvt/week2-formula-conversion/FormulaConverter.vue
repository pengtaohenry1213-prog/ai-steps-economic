<script setup lang="ts">
/**
 * FormulaConverter.vue - v1 公式转换为 HyperFormula 格式
 *
 * Week2 Task 1: 实现公式转换核心逻辑
 */

import { ref, computed, onMounted } from 'vue'
import { HyperFormula } from 'hyperformula'
import { formulaSamples, convertV1Formula, buildCodeToCellMapping, type FormulaSample } from './samples'

// 日志
const logs = ref<string[]>([])

// 验证结果
interface VerificationResult {
  sample: FormulaSample
  hfFormula: string
  hfResult: number | null
  v1Result: number
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

// 代码到单元格的映射
const codeToCell = ref<Record<string, string>>({})

// 初始化 HyperFormula
function initHyperFormula() {
  hf = HyperFormula.buildEmpty({ licenseKey: 'gpl-v3' })
  hf.addSheet('Sheet1')
  sheetId = hf.getSheetId('Sheet1')!
  addLog(`HyperFormula 初始化完成, sheetId: ${sheetId}`)
}

// 构建映射并设置测试数据
function setupTestData() {
  // 为所有样本构建联合映射
  const allSamples = formulaSamples
  codeToCell.value = buildCodeToCellMapping(allSamples)

  addLog('指标Code → 单元格地址 映射表:')
  Object.entries(codeToCell.value).forEach(([code, cell]) => {
    addLog(`  ${code} → ${cell}`)
  })

  // 设置 HyperFormula 初始值
  let rowIndex = 0
  const sortedCells = Object.entries(codeToCell.value).sort((a, b) =>
    a[1].localeCompare(b[1])
  )

  for (const [code, cellAddr] of sortedCells) {
    // 找到所有样本中这个 code 的值
    let value = 0
    for (const sample of formulaSamples) {
      if (sample.testValues[code] !== undefined) {
        value = sample.testValues[code]
        break
      }
    }

    // 设置到 HyperFormula
    const col = cellAddr.charCodeAt(0) - 65
    hf.setCellContents({ sheet: sheetId, col, row: rowIndex }, value)
    addLog(`设置 ${cellAddr}=${value}`)
  }
}

// 验证单个公式
function verifySample(sample: FormulaSample): VerificationResult {
  const result: VerificationResult = {
    sample,
    hfFormula: '',
    hfResult: null,
    v1Result: sample.expectedResult,
    pass: false,
  }

  try {
    // 转换公式
    result.hfFormula = convertV1Formula(sample.v1Formula, codeToCell.value)
    addLog(`\n验证: ${sample.formulaName}`)
    addLog(`  v1公式: ${sample.v1Formula}`)
    addLog(`  HF公式: =${result.hfFormula}`)

    // 在 HyperFormula 中设置公式 (需要 "=" 前缀才能计算)
    hf.setCellContents({ sheet: sheetId, col: 0, row: 10 }, '=' + result.hfFormula)

    // 获取计算结果
    const cellValue = hf.getCellValue({ sheet: sheetId, col: 0, row: 10 })
    result.hfResult = typeof cellValue === 'object' ? cellValue.value : cellValue

    // 比较结果 (浮点数容差 0.0001)
    const tolerance = 0.0001
    const hfResultNum = result.hfResult ?? 0
    result.pass = Math.abs(hfResultNum - result.v1Result) < tolerance

    addLog(`  期望值: ${result.v1Result}`)
    addLog(`  HF结果: ${result.hfResult}`)
    addLog(`  ${result.pass ? '✅ PASS' : '❌ FAIL'}`)

  } catch (error) {
    result.error = String(error)
    addLog(`  ❌ 错误: ${error}`)
  }

  return result
}

// 运行全部验证
function runAllVerification() {
  addLog('\n========== 开始公式转换验证 ==========')

  verificationResults.value = []

  for (const sample of formulaSamples) {
    const result = verifySample(sample)
    verificationResults.value.push(result)
  }

  const passCount = verificationResults.value.filter(r => r.pass).length
  const totalCount = verificationResults.value.length

  addLog(`\n========== 验证完成: ${passCount}/${totalCount} 通过 ==========`)

  if (passCount === totalCount) {
    addLog('✅ 所有公式转换验证通过!')
  } else {
    addLog(`❌ ${totalCount - passCount} 个公式转换失败`)
  }
}

// 计算统计
const stats = computed(() => {
  const total = verificationResults.value.length
  const passed = verificationResults.value.filter(r => r.pass).length
  return { total, passed, failed: total - passed }
})

onMounted(() => {
  try {
    initHyperFormula()
    setupTestData()
    runAllVerification()
  } catch (error) {
    addLog(`初始化错误: ${error}`)
    console.error(error)
  }
})
</script>

<template>
  <div class="formula-converter">
    <h2>Week2 - v1 公式转换为 HyperFormula 格式</h2>
    <p class="desc">
      验证目标：将 v1 的 <code>${metricCode}</code> 格式转换为 HyperFormula 的 <code>A1</code> 单元格引用格式
    </p>

    <!-- 映射表展示 -->
    <div class="mapping-section">
      <h3>指标Code → 单元格地址 映射表</h3>
      <table class="mapping-table">
        <thead>
          <tr>
            <th>指标Code</th>
            <th>单元格地址</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(cell, code) in codeToCell" :key="code">
            <td><code>{{ code }}</code></td>
            <td><code>{{ cell }}</code></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 验证结果 -->
    <div class="results-section">
      <h3>验证结果 ({{ stats.passed }}/{{ stats.total }})</h3>
      <div class="pass-badge" v-if="stats.failed === 0">✅ 全部通过</div>
      <div class="fail-badge" v-else>❌ {{ stats.failed }} 个失败</div>

      <table class="results-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>公式名称</th>
            <th>v1公式</th>
            <th>HF公式</th>
            <th>期望值</th>
            <th>HF结果</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(result, index) in verificationResults" :key="result.sample.id">
            <td>{{ index + 1 }}</td>
            <td>{{ result.sample.formulaName }}</td>
            <td class="formula-cell"><code>{{ result.sample.v1Formula }}</code></td>
            <td class="formula-cell"><code>{{ result.hfFormula }}</code></td>
            <td>{{ result.v1Result }}</td>
            <td>{{ result.hfResult ?? 'N/A' }}</td>
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
        <div v-for="(log, index) in logs" :key="index" :class="{ error: log.includes('❌') && !log.includes('部分') }">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.formula-converter {
  padding: 20px;
}

h2 {
  margin-bottom: 10px;
  color: #333;
}

h3 {
  margin: 20px 0 10px 0;
  color: #333;
}

.desc {
  color: #666;
  margin-bottom: 20px;
}

.desc code {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
}

.mapping-section,
.results-section,
.logs-section {
  margin-bottom: 20px;
}

.mapping-table,
.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.mapping-table th,
.mapping-table td,
.results-table th,
.results-table td {
  padding: 8px 12px;
  text-align: left;
  border: 1px solid #ddd;
}

.mapping-table th,
.results-table th {
  background: #f5f5f5;
  font-weight: 600;
}

.formula-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.formula-cell code {
  font-size: 11px;
  background: #f0f0f0;
  padding: 2px 4px;
  border-radius: 2px;
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
  max-height: 300px;
  overflow-y: auto;
}

.log-box div {
  margin: 2px 0;
}

.log-box .error {
  color: #ff6b6b;
}
</style>