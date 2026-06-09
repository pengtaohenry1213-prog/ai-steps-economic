<template>
  <div class="luckysheet-wrapper">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleImport">
        <el-icon><Upload /></el-icon>
        导入
      </el-button>
      <el-button type="success" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出
      </el-button>
      <el-button type="warning" @click="handleLoadTestData">
        测试数据
      </el-button>

      <el-divider direction="vertical" />

      <!-- 协作控制 -->
      <el-button
        v-if="!collabConnected"
        type="info"
        :disabled="!luckysheetReady"
        @click="connectCollab"
      >
        发起协作
      </el-button>
      <el-button
        v-else
        type="danger"
        @click="disconnectCollab"
      >
        断开协作
      </el-button>

      <!-- 协作用户列表 -->
      <div v-if="collabUsers.length > 0" class="user-list">
        <span class="user-label">在线用户:</span>
        <span
          v-for="user in collabUsers"
          :key="user.id"
          class="user-dot"
          :style="{ background: user.color }"
          :title="user.name"
        />
      </div>

      <el-divider direction="vertical" />

      <el-input
        v-model="fileName"
        placeholder="文件名"
        style="width: 160px"
      />

      <el-tag :type="collabConnected ? 'success' : 'info'" size="small" style="margin-left: 8px">
        {{ collabConnected ? '协作中' : '单机' }}
      </el-tag>
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
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Upload, Download } from '@element-plus/icons-vue'
import { importExcel } from '@/services/excelImport'
import { exportExcel } from '@/services/excelExport'
import { loadMockSheetData } from '@/services/mockLoader'
import { getCollabService, type YjsCollabService } from '@/services/yjsCollab'
import { ElMessage } from 'element-plus'

// DOM refs
const fileInputRef = ref<HTMLInputElement | null>(null)

// State
const fileName = ref('表格数据')
const collabConnected = ref(false)
const collabUsers = ref<Array<{ id: string; name: string; color: string }>>([])
const luckysheetReady = ref(false)

let collabService: YjsCollabService | null = null

// 初始化 Luckysheet
onMounted(async () => {
  await nextTick()
  await new Promise((r) => requestAnimationFrame(() => r(true)))
  initLuckysheet()
})

onBeforeUnmount(() => {
  disconnectCollab()
})

function initLuckysheet() {
  if (!window.luckysheet) return
  window.luckysheet.destroy()
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
          { r: 0, c: 1, v: { v: 100, m: '100', f: null } },
          { r: 1, c: 0, v: { v: 200, m: '200', f: null } },
          { r: 1, c: 1, v: { v: '=A1+B1', m: '=A1+B1', f: '=A1+B1' } }
        ],
        row: 100,
        column: 20
      }
    ]
  })

  // 等待 Luckysheet 渲染完成（.luckysheet-cell-main 出现）
  const observer = new MutationObserver(() => {
    if (document.querySelector('.luckysheet-cell-main')) {
      luckysheetReady.value = true
      observer.disconnect()
    }
  })
  observer.observe(document.getElementById('luckysheet-container')!, {
    childList: true,
    subtree: true
  })
}

// 协作连接
function connectCollab() {
  collabService = getCollabService()
  collabService.connect('用户-' + Math.random().toString(36).slice(2, 6))

  // 监听连接状态 — 等 collabService.connected 为 true 再绑定同步
  const checkConnect = setInterval(() => {
    if (collabService?.connected) {
      clearInterval(checkConnect)
      collabConnected.value = true
      setupCollabSync()
      ElMessage.success('协作已连接，其他用户可编辑同一表格')
    }
  }, 200)

  // 监听用户变化
  collabService.onUsersChange((users) => {
    collabUsers.value = users
  })
}

// 协作断开
function disconnectCollab() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  prevCellValues.clear()
  if (collabService) {
    collabService.disconnect()
    collabService = null
    collabConnected.value = false
    collabUsers.value = []
    ElMessage.info('已断开协作')
  }
}

// 监听 Luckysheet 单元格变化 → 同步到 Yjs
let pollTimer: ReturnType<typeof setInterval> | null = null
let prevCellValues: Map<string, any> = new Map()

function setupCollabSync() {
  if (!collabService || !window.luckysheet) return

  // Yjs 变化时同步回 Luckysheet（立即绑定，不能晚于 CRDT 状态同步）
  // remote CRDT update → onCellChange →写 Luckysheet
  // prevCellValues 同步更新，避免本地轮询时误判为变更
  collabService.onCellChange((r, c, value) => {
    console.log('[Sync] onCellChange:', r, c, value)
    if (!window.luckysheet) return
    // @ts-ignore
    window.luckysheet.setCellValue(r, c, { v: value })
    const key = `${r},${c}`
    prevCellValues.set(key, value)
  })

   // B 加入后，等待 Yjs 状态同步完成（provider.synced 事件），再开始轮询
  // 避免本地上下文（初始值）和 Yjs 状态不一致时发送错误更新
  collabService.onSynced(() => {
    if (!collabService || !window.luckysheet) return
    console.log('[Sync] Yjs synced, seeding prevCellValues, yCells size:', collabService.getAllCellValues().size)

    // 同步开始前，以 Yjs 状态校正 prevCellValues
    // 注意：只种子（校正基准），不主动写入 Luckysheet，避免覆盖本地已有写入
    // onCellChange 会处理远程变更写入 Luckysheet
    collabService.getAllCellValues().forEach((value, key) => {
      // 只有 prevCellValues 中不存在的 key 才种子（避免覆盖本地新写入）
      if (!prevCellValues.has(key)) {
        prevCellValues.set(key, value)
      }
    })

    // 延迟300ms 后再开始轮询，给 onCellChange 足够的处理时间
    // 避免在 remote 状态还未应用时就用旧 Luckysheet 值覆盖 yCells
    setTimeout(() => {
      startPolling()
    }, 300)
  })

  // 超时兜底：signaling server 不可用时 onSynced 永远不触发，
  // 500ms 后强制全量同步 yCells 到 Luckysheet
  // 前提：yCells size > 0（有远程数据时才同步，避免把自己空的初始状态写回 Luckysheet）
  setTimeout(() => {
    if (!collabService || !window.luckysheet) return
    const yCellsSize = collabService.getAllCellValues().size
    console.log('[Sync] syncAllCells fallback, yCells size:', yCellsSize)
    if (yCellsSize === 0) {
      console.log('[Sync] syncAllCells skipped: yCells is empty')
      startPolling()
      return
    }
    collabService.syncAllCells((r, c, value) => {
      if (!window.luckysheet) return
      // @ts-ignore
      window.luckysheet.setCellValue(r, c, { v: value })
      const key = `${r},${c}`
      prevCellValues.set(key, value)
    })
    startPolling()
  }, 500)

  // 启动轮询（单独提取，方便延迟调用）
  function startPolling() {
    if (!collabService || !window.luckysheet) return
    if (pollTimer) return // 防止重复启动
    console.log('[Sync] starting poll')

    pollTimer = setInterval(() => {
      if (!window.luckysheet) return
      try {
        // @ts-ignore
        const sheets = window.luckysheet.getAllSheets()
        if (!sheets?.length) return
        const sheet = sheets[0]
        let data = sheet.data

        // data 为空时（初始化后未渲染），从 celldata 回退读取并展开为 Map
        if (!data?.length && sheet.celldata?.length) {
          for (const cell of sheet.celldata) {
            const key = `${cell.r},${cell.c}`
            const val = cell.v?.v ?? null
            if (prevCellValues.get(key) !== val) {
              prevCellValues.set(key, val)
              collabService!.setCellValue(cell.r, cell.c, val)
            }
          }
          return
        }

        if (!data?.length) return

        for (let r = 0; r < data.length; r++) {
          const row = data[r]
          if (!row) continue
          for (let c = 0; c < row.length; c++) {
            const cell = row[c]
            if (!cell) continue
            const key = `${r},${c}`
            const val = cell.v ?? cell.m ?? null
            if (prevCellValues.get(key) !== val) {
              prevCellValues.set(key, val)
              collabService!.setCellValue(r, c, val)
            }
          }
        }
      } catch {
        // ignore
      }
    }, 500)
  }
}

// 导入 Excel
function handleImport() {
  fileInputRef.value?.click()
}

async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    const sheetData = await importExcel(file)
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
      // 导入文件后绑定协作同步
      if (collabService) setupCollabSync()
    }
    ElMessage.success('导入成功')
  } catch (err) {
    ElMessage.error('导入失败：' + (err as Error).message)
  }

  target.value = ''
}

// 导出 Excel
async function handleExport() {
  if (!window.luckysheet) return
  try {
    const sheets = window.luckysheet.getAllSheets()
    const data = sheets.map((sheet: any) => ({
      name: sheet.name,
      data: sheet.data
    }))
    await exportExcel(data, fileName.value || '表格数据')
    ElMessage.success('导出成功')
  } catch (err) {
    ElMessage.error('导出失败：' + (err as Error).message)
  }
}

// 加载测试数据
function handleLoadTestData() {
  if (!window.luckysheet) return
  const sheetData = loadMockSheetData()
  window.luckysheet.destroy()
  window.luckysheet.create({
    container: 'luckysheet-container',
    lang: 'zh',
    showtoolbar: true,
    showinfobar: true,
    showsheetbar: true,
    showstatisticBar: true,
    data: [sheetData]
  })
  ElMessage.success('测试数据已加载')

  // 如果已连接协作，同步到 Yjs
  if (collabService) {
    setupCollabSync()
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
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  gap: 8px;
  flex-wrap: wrap;
}

.luckysheet-container {
  flex: 1;
  width: 100%;
  min-height: 0;
}

.user-list {
  display: flex;
  align-items: center;
  gap: 4px;
}

.user-label {
  font-size: 12px;
  color: #999;
}

.user-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #fff;
  font-size: 10px;
  line-height: 20px;
  text-align: center;
  color: #fff;
  font-weight: bold;
  cursor: default;
}
</style>