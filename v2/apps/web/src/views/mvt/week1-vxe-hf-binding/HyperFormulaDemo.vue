<script setup lang="ts">
/**
 * HyperFormulaDemo.vue - HyperFormula 初始化与基础计算 Demo
 *
 * Week1 Task 2: 验证 HyperFormula 初始化和基础公式计算
 */

import { HyperFormula } from 'hyperformula'
import { ref, onMounted } from 'vue'

// 日志
const logs = ref<string[]>([])

// 动态 sheet ID (使用数字索引)
let sheetId = 0

function addLog(msg: string) {
  logs.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCellValue(address: string, hf: any, sId: number): number {
  const col = address.charCodeAt(0) - 65
  const row = parseInt(address.slice(1)) - 1
  const simple = { sheet: sId, col, row }
  const value = hf.getCellValue(simple)
  if (typeof value === 'object' && value !== null && 'type' in value) {
    return value.value as number
  }
  return value as number
}

// 验证结果
const results = ref<{
  basicSum: { formula: string; result: number | null; expected: number; pass: boolean }
  cellRef: { formula: string; result: number | null; expected: number; pass: boolean }
  nested: { formula: string; result: number | null; expected: number; pass: boolean }
}>({
  basicSum: { formula: '=SUM(1,2,3)', result: null, expected: 6, pass: false },
  cellRef: { formula: '=SUM(A1:A3)', result: null, expected: 6, pass: false },
  nested: { formula: '=SUM(A1:A3)*2', result: null, expected: 12, pass: false }
})

onMounted(() => {
  try {
    addLog('开始 HyperFormula 初始化...')

    // 1. 创建 HyperFormula 实例
    const hf = HyperFormula.buildEmpty({
      licenseKey: 'gpl-v3'
    })
    addLog('✅ HyperFormula 实例创建成功')

    // 2. 创建默认 sheet (addSheet 返回 sheet name)
    hf.addSheet('Sheet1')
    sheetId = hf.getSheetId('Sheet1')!
    addLog(`✅ 创建默认 sheet, ID: ${sheetId}`)

    // 3. 设置单元格值
    hf.setCellContents({ sheet: sheetId, col: 0, row: 0 }, 1)  // A1
    hf.setCellContents({ sheet: sheetId, col: 0, row: 1 }, 2)  // A2
    hf.setCellContents({ sheet: sheetId, col: 0, row: 2 }, 3)  // A3
    addLog('✅ 设置单元格值 A1=1, A2=2, A3=3')

    // 4. 验证基础 SUM
    const basicSumResult = hf.calculateFormula('=SUM(1,2,3)', sheetId)
    results.value.basicSum.result = basicSumResult as number
    results.value.basicSum.pass = basicSumResult === 6
    addLog(`公式1: ${results.value.basicSum.formula} = ${basicSumResult} (期望: 6) ${results.value.basicSum.pass ? '✅' : '❌'}`)

    // 5. 验证单元格引用 SUM
    hf.setCellContents({ sheet: sheetId, col: 1, row: 0 }, '=SUM(A1:A3)')  // B1
    const cellRefFormulaResult = getCellValue('B1', hf, sheetId)
    results.value.cellRef.result = cellRefFormulaResult
    results.value.cellRef.pass = cellRefFormulaResult === 6
    addLog(`公式2: ${results.value.cellRef.formula} = ${cellRefFormulaResult} (期望: 6) ${results.value.cellRef.pass ? '✅' : '❌'}`)

    // 6. 验证嵌套公式
    hf.setCellContents({ sheet: sheetId, col: 1, row: 1 }, '=SUM(A1:A3)*2')  // B2
    const nestedResult = getCellValue('B2', hf, sheetId)
    results.value.nested.result = nestedResult
    results.value.nested.pass = nestedResult === 12
    addLog(`公式3: ${results.value.nested.formula} = ${nestedResult} (期望: 12) ${results.value.nested.pass ? '✅' : '❌'}`)

    // 7. 获取所有单元格值
    addLog('所有单元格值:')
    addLog(`  A1 = ${getCellValue('A1', hf, sheetId)}`)
    addLog(`  A2 = ${getCellValue('A2', hf, sheetId)}`)
    addLog(`  A3 = ${getCellValue('A3', hf, sheetId)}`)
    addLog(`  B1 = ${getCellValue('B1', hf, sheetId)}`)
    addLog(`  B2 = ${getCellValue('B2', hf, sheetId)}`)

    // 8. 获取公式
    addLog('所有公式:')
    addLog(`  B1 = ${hf.getCellFormula({ sheet: sheetId, col: 1, row: 0 })}`)
    addLog(`  B2 = ${hf.getCellFormula({ sheet: sheetId, col: 1, row: 1 })}`)

    // 总结
    const allPass = results.value.basicSum.pass &&
                    results.value.cellRef.pass &&
                    results.value.nested.pass
    addLog(allPass ? '✅ 所有验证通过!' : '❌ 部分验证失败')

  } catch (error) {
    addLog(`❌ 错误: ${error}`)
    console.error(error)
  }
})
</script>

<template>
  <div class="hyperformula-demo">
    <h2>HyperFormula 初始化与基础计算 Demo</h2>
    <p class="desc">
      验证目标：HyperFormula 实例创建、基础公式计算、结果获取
    </p>

    <div class="results">
      <h3>验证结果</h3>
      <table>
        <thead>
          <tr>
            <th>公式</th>
            <th>计算结果</th>
            <th>期望值</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(result, key) in results" :key="key">
            <td>{{ result.formula }}</td>
            <td>{{ result.result }}</td>
            <td>{{ result.expected }}</td>
            <td :class="result.pass ? 'pass' : 'fail'">
              {{ result.pass ? '✅ PASS' : '❌ FAIL' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="logs">
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
.hyperformula-demo {
  padding: 20px;
}

h2 {
  margin-bottom: 10px;
  color: #333;
}

.desc {
  color: #666;
  margin-bottom: 20px;
}

.results {
  margin-bottom: 20px;
}

.results table {
  width: 100%;
  border-collapse: collapse;
}

.results th,
.results td {
  padding: 10px;
  text-align: left;
  border: 1px solid #ddd;
}

.results th {
  background: #f5f5f5;
}

.pass {
  color: green;
}

.fail {
  color: red;
}

.logs h3 {
  margin-bottom: 10px;
}

.log-box {
  background: #1e1e1e;
  color: #0f0;
  padding: 15px;
  border-radius: 4px;
  font-family: monospace;
  max-height: 300px;
  overflow-y: auto;
}

.log-box div {
  margin: 2px 0;
}

.error {
  color: #ff6b6b;
}
</style>