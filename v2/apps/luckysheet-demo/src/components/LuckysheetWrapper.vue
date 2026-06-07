<template>
  <div class="luckysheet-wrapper">
    <!-- Luckysheet 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleImport">
        <el-icon><Upload /></el-icon>
        导入 Excel
      </el-button>
      <el-button type="success" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出 Excel
      </el-button>
      <el-input
        v-model="fileName"
        placeholder="请输入文件名"
        style="width: 200px; margin-left: 12px"
      />
     <span style="margin-left: 12px; color: #666; font-size: 12px">
        协作状态：
        <el-tag :type="collabStatus === 'connected' ? 'success' : 'info'" size="small">
          {{ collabStatus === 'connected' ? '已连接' : '未连接' }}
        </el-tag>
      </span>
    </div>

    <!-- Luckysheet 挂载点 -->
    <div id="luckysheet-container" class="luckysheet-container" />

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".xlsx,.xls"
      style="display: none"
      @change="onFileSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Upload, Download } from '@element-plus/icons-vue'
import { importExcel } from '@/services/excelImport'
import { exportExcel } from '@/services/excelExport'
import { ElMessage } from 'element-plus'

// DOM refs
const fileInputRef = ref<HTMLInputElement | null>(null)

// State
const fileName = ref('表格数据')
const collabStatus = ref<'connected' | 'disconnected'>('disconnected')

// 初始化 Luckysheet
onMounted(() => {
  if (!window.luckysheet) return

  window.luckysheet.create({
    container: 'luckysheet-container',
    lang: 'zh',
    showtoolbar: true,
    showinfobar: true,
    showsheetbar: true,
    showstatisticBar: true,
    data: [
      {
        id: 'sheet_1',
        name: 'Sheet1',
        celldata: [
          { r: 0, c: 0, v: { v: '欢迎使用 Luckysheet', f: null } },
          { r: 0, c: 1, v: { v: 100, f: null } },
          { r: 1, c: 0, v: { v: 200, f: null } },
          { r: 1, c: 1, v: { v: '=A1+B1', f: '=A1+B1' } }
        ],
        row: 100,
        column: 20
      }
    ]
  })
})

// 导入 Excel
const handleImport = () => {
  fileInputRef.value?.click()
}

const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    const sheetData = await importExcel(file)
    // 重置 Luckysheet 数据
    if (window.luckysheet) {
      window.luckysheet.destroy()
      window.luckysheet.create({
        container: 'luckysheet-container',
        lang: 'zh',
        showtoolbar: true,
        showinfobar: true,
        showsheetbar: true,
        showstatisticBar: true,
        data: sheetData
      })
    }
    ElMessage.success('Excel 导入成功')
  } catch (err) {
    ElMessage.error('导入失败：' + (err as Error).message)
  }

  // 清空 input 以便重复选择同一文件
  target.value = ''
}

// 导出 Excel
const handleExport = async () => {
  if (!window.luckysheet) return
  try {
    const sheets = window.luckysheet.getAllSheets()
    const data = sheets.map((sheet) => ({
      name: sheet.name,
      cells: sheet.data
    }))
    await exportExcel(data, fileName.value || '表格数据')
    ElMessage.success('导出成功')
  } catch (err) {
    ElMessage.error('导出失败：' + (err as Error).message)
  }
}
</script>

<style scoped>
.luckysheet-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #f5f5f5;
}

.toolbar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.luckysheet-container {
  flex: 1;
  width: 100%;
  min-height: 0;
}
</style>