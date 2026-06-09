<template>
  <div class="algorithm-test">
    <div class="header">
      <h2>🔬 算法测试页面 — 基于真实 formulaMap 数据</h2>
      <div class="header-actions">
        <el-button size="small" @click="testCycleDetection">🧪 测试循环检测</el-button>
        <el-button size="small" @click="goBack">返回 Luckysheet</el-button>
      </div>
    </div>

    <div class="panels">
      <!-- 左侧: formulaMap 原始数据 -->
      <div class="panel input-panel">
        <h3>📥 formulaMap 原始数据</h3>
        <p class="subtitle">共 {{ formulaNodes.length }} 个公式节点</p>
        <el-table :data="formulaNodes" size="small" border max-height="500">
          <el-table-column label="nodeId" min-width="200">
            <template #default="{ row }">
              <code class="node-id">{{ row.id }}</code>
            </template>
          </el-table-column>
          <el-table-column label="formula" min-width="240">
            <template #default="{ row }">
              <code class="formula">{{ row.formula }}</code>
            </template>
          </el-table-column>
        </el-table>

        <div class="actions">
          <el-button type="primary" @click="runTopoSort">① 运行拓扑排序</el-button>
          <el-button type="warning" @click="runCycleDetect">② 检测循环引用</el-button>
        </div>

        <!-- 循环测试用例说明 -->
        <div v-if="showCycleTestHint" class="cycle-test-hint">
          <el-alert type="warning" :closable="false" show-icon>
            <template #title>
              已注入测试环: A→B→C→A（指标索引 0,1,2 互相依赖）
            </template>
          </el-alert>
        </div>
      </div>

      <!-- 中间: D3 可视化图 -->
      <div class="panel graph-panel">
        <h3>🔗 DAG 可视化图</h3>
        <p class="subtitle">力导向布局，节点颜色表示含义见左上角图例</p>
        <div class="d3-container">
          <D3Graph
            :nodes="formulaNodes"
            :cycle-node-ids="cycleNodeIds"
            :sorted-node-ids="sortedNodeIds"
          />
        </div>
        <div class="graph-legend">
          <div class="legend-item"><span class="dot root"></span>根节点（无依赖）</div>
          <div class="legend-item"><span class="dot dep"></span>依赖节点</div>
          <div class="legend-item"><span class="dot sorted"></span>已排序</div>
          <div class="legend-item"><span class="dot cycle"></span>循环节点</div>
        </div>
      </div>

      <!-- 右侧: 算法输出 -->
      <div class="panel output-panel">
        <h3>📤 算法输出</h3>

        <!-- 拓扑排序 -->
        <div class="output-section">
          <h4>① Kahn 拓扑排序</h4>
          <div v-if="topoResult !== null">
            <el-tag :type="topoResult.length > 0 ? 'success' : 'danger'" size="small" style="margin-bottom: 8px">
              {{ topoResult.length > 0 ? `✅ 排序完成 (${topoResult.length}个节点)` : '❌ 无法排序（有环）' }}
            </el-tag>
            <div class="sort-list">
              <div v-for="(nodeId, idx) in topoResult" :key="nodeId" class="sort-item">
                <span class="sort-num">{{ idx + 1 }}</span>
                <span class="sort-id">{{ nodeId }}</span>
                <span class="sort-name">{{ getNodeName(nodeId) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty">点击"运行拓扑排序"查看结果</div>
        </div>

        <!-- 循环检测 -->
        <div class="output-section">
          <h4>② DFS 循环引用检测</h4>
          <div v-if="cycleResult !== null">
            <el-tag :type="cycleResult.length === 0 ? 'success' : 'danger'" size="small" style="margin-bottom: 8px">
              {{ cycleResult.length === 0 ? '✅ 无循环引用（DAG有效）' : `⚠️ 发现 ${cycleResult.length} 个环` }}
            </el-tag>
            <div v-for="(cycle, idx) in cycleResult" :key="idx" class="cycle-block">
              <div class="cycle-label">环 {{ idx + 1 }}:</div>
              <div class="cycle-path">
                <span v-for="(nodeId, i) in cycle" :key="i">
                  {{ nodeId }}<span v-if="i < cycle.length - 1"> → </span>
                </span>
              </div>
            </div>
          </div>
          <div v-else class="empty">点击"检测循环引用"查看结果</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { detectCyclesFromFormulaMap } from '@/algorithms/cyclicDetect'
import { topologicalSortFromFormulaMap, getFormulaMap, getModelMetrics } from '@/services/mockLoader'
import type { FormulaNode } from '@/services/mockLoader'
import D3Graph from '@/components/D3Graph.vue'

// formulaMap 原始数据
const formulaNodes = ref<FormulaNode[]>([])

// 中间结果
const topoResult = ref<string[] | null>(null)
const cycleResult = ref<string[][] | null>(null)
const showCycleTestHint = ref(false)
const cycleNodeIds = ref<string[]>([])
const sortedNodeIds = ref<string[]>([])

// 指标名称映射
const nodeNameMap = new Map<string, string>()

onMounted(() => {
  const formulaMap = getFormulaMap()
  formulaNodes.value = Object.values(formulaMap)

  // 构建名称映射
  const metrics = getModelMetrics()
  for (const m of metrics) {
    nodeNameMap.set(m.metricCode, m.metricName)
  }
})

function getNodeName(nodeId: string): string {
  const code = nodeId.split('-')[0]
  return nodeNameMap.get(code) ?? ''
}

// 运行拓扑排序
const runTopoSort = () => {
  const formulaMap = getFormulaMap()
  const sorted = topologicalSortFromFormulaMap(formulaMap)
  topoResult.value = sorted
  sortedNodeIds.value = sorted
}

// 检测循环引用
const runCycleDetect = () => {
  const formulaMap = getFormulaMap()
  const cycles = detectCyclesFromFormulaMap(formulaMap)
  cycleResult.value = cycles
  // 收集所有环中的节点
  const nodeIds = new Set<string>()
  cycles.forEach((c) => c.forEach((id) => nodeIds.add(id)))
  cycleNodeIds.value = Array.from(nodeIds)
}

// 测试循环检测：注入一个环 (指标索引 0→1→2→0)
const testCycleDetection = () => {
  // 创建一个有环的 formulaMap 副本
  const formulaMap = getFormulaMap()
  const testMap: Record<string, FormulaNode> = { ...formulaMap }

  const keys = Object.keys(testMap)
  if (keys.length >= 3) {
    // 让第一个节点的 calcMarks 指向第二个，第二个指向第三个，第三个指回第一个
    testMap[keys[0]] = {
      ...testMap[keys[0]],
      calcMarks: [keys[1]]
    }
    testMap[keys[1]] = {
      ...testMap[keys[1]],
      calcMarks: [keys[2]]
    }
    testMap[keys[2]] = {
      ...testMap[keys[2]],
      calcMarks: [keys[0]] // 形成环
    }
    formulaNodes.value = Object.values(testMap)
    showCycleTestHint.value = true
  }
}

// 返回主页
const goBack = () => {
  window.location.pathname = '/'
}
</script>

<style scoped>
.algorithm-test {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.header h2 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.panels {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 12px;
  padding: 12px;
}

.panel {
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  overflow: auto;
}

.panel h3 {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #333;
}

.panel h4 {
  margin: 12px 0 6px 0;
  font-size: 13px;
  color: #555;
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
}

.subtitle {
  margin: 0 0 10px 0;
  font-size: 11px;
  color: #999;
}

.input-panel {
  flex: 0 0 420px;
}

.graph-panel {
  flex: 0 0 380px;
}

.d3-container {
  flex: 1;
  min-height: 280px;
}

.graph-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid #f0f0f0;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #666;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.dot.root { background: #409eff; }
.dot.dep { background: #e6a23c; }
.dot.sorted { background: #67c23a; }
.dot.cycle { background: #f56c6c; }

.output-panel {
  flex: 1;
  min-width: 0;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.cycle-test-hint {
  margin-top: 10px;
}

.node-id {
  font-size: 11px;
  color: #409eff;
}

.formula {
  font-size: 11px;
  color: #666;
}

.graph-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.graph-item {
  padding: 6px 8px;
  background: #f9fafb;
  border-radius: 4px;
  font-size: 11px;
}

.graph-key-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.graph-key {
  color: #409eff;
  font-weight: 500;
}

.arrow {
  color: #999;
}

.graph-deps {
  margin-top: 2px;
  padding-left: 4px;
}

.dep-tag {
  display: inline-block;
  padding: 1px 4px;
  margin-right: 4px;
  background: #f0f0f0;
  color: #666;
  border-radius: 3px;
  font-size: 10px;
}

.dep-cyan {
  background: #e6f7ff;
  color: #1890ff;
}

.no-deps {
  color: #52c41a;
  font-size: 10px;
}

.empty {
  color: #999;
  font-size: 12px;
  font-style: italic;
}

.output-section {
  margin-bottom: 16px;
}

.sort-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.sort-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 6px;
  background: #ecf5ff;
  border-radius: 4px;
  font-size: 12px;
}

.sort-num {
  color: #999;
  font-size: 10px;
  min-width: 20px;
}

.sort-id {
  color: #409eff;
  font-weight: 500;
}

.sort-name {
  color: #666;
  font-size: 11px;
}

.cycle-block {
  padding: 6px 8px;
  background: #fef0f0;
  border-radius: 4px;
  margin-bottom: 6px;
}

.cycle-label {
  font-size: 11px;
  color: #f56c6c;
  font-weight: 500;
  margin-bottom: 2px;
}

.cycle-path {
  font-size: 11px;
  color: #c45656;
  word-break: break-all;
}
</style>