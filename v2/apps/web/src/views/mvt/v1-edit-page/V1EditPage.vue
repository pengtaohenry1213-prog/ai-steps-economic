<script setup lang="ts">
/**
 * V1EditPage.vue - v1 完整页面迁移到 v2
 *
 * 来源: MVT/v1/pages/edit/index.vue
 * 状态: 完善中 - 集成 hooks、utils、表格编辑功能
 */

import { ref, computed, onMounted } from 'vue'
import { useModelStore } from './modelStore'
import { useData, useFormula } from './hooks'
import { initColumns } from './utils/column'
import { download } from './utils/util'
import calculate from './utils/calculate'

const modelStore = useModelStore()

// ==================== Hooks ====================
const { setData, clone, updateData, getData, setVisibleRows, clearData } = useData()
const { setFormula, setFormulaDetail, clear: clearFormula, formula, getFormula } = useFormula()

// ==================== 状态 ====================
const loading = ref(false)
const error = ref<string | null>(null)
const calculating = ref(false)

// ==================== 页面数据 ====================
const pageData = ref({
  versionCode: 'V2024Q1',
  versionName: '2024年第一季度',
  forecastTimeType: 'quarter' as 'month' | 'quarter' | 'year',
  forecastTimeRange: '2024-1,2024-4',
  rowCount: 0,
  formulaCount: 0,
})

// ==================== 表格数据 ====================
// 完整的表格数据（含公式）
const tableData = ref<any[]>([
  {
    id: 1,
    metricCode: 'C10000A0321100003',
    metricName: '半干面生鲜面粉增值税合计',
    '2024-1': 100,
    '2024-2': 110,
    '2024-3': 120,
    '2024-4': 130,
    isFixed: 0,
    unitCode: 'yuan',
  },
  {
    id: 2,
    metricCode: 'C10000A0322100003',
    metricName: '半干面生鲜面粉可变生产成本合计',
    '2024-1': 200,
    '2024-2': 220,
    '2024-3': 240,
    '2024-4': 260,
    isFixed: 0,
    unitCode: 'yuan',
  },
  {
    id: 3,
    metricCode: 'C10000A0323100003',
    metricName: '半干面生鲜面粉固定生产成本合计',
    '2024-1': 300,
    '2024-2': 330,
    '2024-3': 360,
    '2024-4': 390,
    isFixed: 0,
    unitCode: 'yuan',
  },
  {
    id: 4,
    metricCode: 'C10000A0320100003',
    metricName: '半干面生鲜面粉生产成本合计（含税）',
    '2024-1': null,
    '2024-2': null,
    '2024-3': null,
    '2024-4': null,
    formula: '${C10000A0321100003}+${C10000A0322100003}+${C10000A0323100003}',
    isFixed: 1,
    unitCode: 'yuan',
  },
])

// 日期字段
const dateFields = ['2024-1', '2024-2', '2024-3', '2024-4']

// ==================== 表格列配置 ====================
const tableColumns = computed(() => {
  // 固定列
  const fixedCols = [
    { type: 'seq' as const, width: 50, title: '序号' },
    { field: 'metricCode', title: '指标编码', width: 150 },
    { field: 'metricName', title: '指标名称', minWidth: 200, showOverflow: true },
  ]

  // 动态日期列
  const dateCols = dateFields.map((field) => ({
    field,
    title: field,
    width: 100,
    align: 'right' as const,
    showOverflow: true,
  }))

  // 操作列
  const actionCols = [
    { field: 'unitCode', title: '单位', width: 80 },
  ]

  return [...fixedCols, ...dateCols, ...actionCols]
})

// ==================== 生命周期 ====================
onMounted(async () => {
  try {
    // 初始化 store
    await modelStore.fetchAllList()

    // 初始化公式到 useFormula store
    for (const row of tableData.value) {
      if (row.formula) {
        setFormula(row.metricCode, row.formula)
        setFormulaDetail(row.metricCode, {
          formulaName: row.metricName,
          metricCategory: row.isFixed === 0 ? 0 : 1,
        })
      }
    }

    // 克隆原始数据
    clone()

    // 更新统计
    pageData.value.rowCount = tableData.value.length
    pageData.value.formulaCount = Object.keys(formula.value || {}).length

    console.log('[V1EditPage] 页面加载完成')
    console.log('[V1EditPage] 公式数量:', pageData.value.formulaCount)
  } catch (e) {
    error.value = String(e)
    console.error('[V1EditPage] 加载错误:', e)
  }
})

// ==================== 单元格编辑 ====================
function handleCellEdit({ row, column, cellValue }: any) {
  const { field } = column
  if (!field || field === 'metricCode' || field === 'metricName') return

  console.log(`[V1EditPage] 编辑单元格: ${row.metricCode}.${field} = ${cellValue}`)

  // 更新数据池
  updateData(row.metricCode, field, cellValue)

  // 如果有公式，需要标记需要重算
  if (row.formula) {
    console.log(`[V1EditPage] 触发公式重算: ${row.formula}`)
  }
}

// ==================== 操作按钮 ====================

// 保存
async function handleSave() {
  console.log('[V1EditPage] 保存数据...')
  // TODO: 调用 API 保存
  alert('保存功能待实现')
}

// 计算 - 执行公式重算
async function handleCalculate() {
  if (calculating.value) return

  console.log('[V1EditPage] 开始计算...')
  calculating.value = true

  try {
    // 构建依赖图（简化版：所有有公式的指标）
    const graph = tableData.value
      .filter((row) => row.formula)
      .map((row) => {
        const dates = dateFields.map((d) => `${row.metricCode}-${d}`)
        return dates
      })
      .flat()

    // 执行计算
    await calculate(
      {
        dateFields,
        forecastTimeType: pageData.value.forecastTimeType,
        targetIndustry: '农粮',
        investmentType: '新建',
      },
      graph,
    )

    // 刷新表格数据
    for (const row of tableData.value) {
      for (const field of dateFields) {
        const newValue = getData(row.metricCode, field)
        if (newValue !== undefined) {
          row[field] = newValue
        }
      }
    }

    console.log('[V1EditPage] 计算完成')
  } catch (e) {
    console.error('[V1EditPage] 计算错误:', e)
  } finally {
    calculating.value = false
  }
}

// 导入 Excel
function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx,.xls'
  input.onchange = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('[V1EditPage] 导入文件:', file.name)
    // TODO: 使用 XLSX 解析文件并导入
    alert('导入功能待实现')
  }
  input.click()
}

// 导出 Excel
function handleExport() {
  console.log('[V1EditPage] 导出 Excel...')

  // 模拟导出数据
  const exportData = tableData.value.map((row) => {
    const item: any = {
      指标编码: row.metricCode,
      指标名称: row.metricName,
    }
    dateFields.forEach((d) => {
      item[d] = row[d]
    })
    return item
  })

  // 简单的 CSV 导出
  const headers = ['指标编码', '指标名称', ...dateFields]
  const csvContent = [
    headers.join(','),
    ...exportData.map((row) => headers.map((h) => row[h] ?? '').join(',')),
  ].join('\n')

  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8' })
  download(blob, `经济测算_${pageData.value.versionName}.csv`)

  console.log('[V1EditPage] 导出完成')
}

// 刷新页面
function handleReload() {
  window.location.reload()
}
</script>

<template>
  <div class="v1-edit-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1>经济测算模型 - 编辑页面</h1>
        <span class="version-badge">{{ pageData.versionName }}</span>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleSave">保存</el-button>
        <el-button type="warning" :loading="calculating" @click="handleCalculate">
          {{ calculating ? '计算中...' : '计算' }}
        </el-button>
        <el-button @click="handleImport">导入</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="label">版本:</span>
        <el-select v-model="pageData.versionCode" placeholder="请选择版本" style="width: 200px">
          <el-option label="2024年第一季度" value="V2024Q1" />
          <el-option label="2024年第二季度" value="V2024Q2" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <span class="stats">
          行数: {{ pageData.rowCount }} | 公式数: {{ pageData.formulaCount }}
        </span>
      </div>
    </div>

    <!-- 主内容区 - vxe-table 表格 -->
    <div class="main-content">
      <vxe-grid
        :data="tableData"
        :columns="tableColumns"
        border
        show-overflow
        height="auto"
        :edit-config="{ trigger: 'click', mode: 'cell' }"
        @cell-edit="handleCellEdit"
      />
    </div>

    <!-- 底部状态栏 -->
    <div class="status-bar">
      <span>状态: {{ calculating ? '计算中...' : '就绪' }}</span>
      <span>模型类型: {{ modelStore.modelType || '未设置' }}</span>
      <span>时间段: {{ modelStore.forecastTimeType || '未设置' }}</span>
    </div>
  </div>
</template>

<style scoped>
.v1-edit-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.version-badge {
  padding: 4px 12px;
  background: #409eff;
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

.header-right {
  display: flex;
  gap: 8px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-left .label {
  font-size: 14px;
  color: #606266;
}

.toolbar-right .stats {
  font-size: 13px;
  color: #909399;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.main-content :deep(.vxe-grid) {
  background: white;
  border-radius: 8px;
}

.formula-indicator {
  display: inline-block;
  padding: 0 4px;
  margin-right: 4px;
  background: #67c23a;
  color: white;
  font-size: 10px;
  border-radius: 2px;
  vertical-align: middle;
}

.status-bar {
  display: flex;
  gap: 24px;
  padding: 8px 20px;
  background: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  font-size: 12px;
  color: #909399;
}
</style>