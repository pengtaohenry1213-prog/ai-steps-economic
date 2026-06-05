<script setup lang="ts">
import { computed } from 'vue'
import { useStrategyStore } from '../stores/strategyStore'
import { ElCard, ElButton, ElDialog, ElTag, ElDescriptions, ElDescriptionsItem, ElEmpty, ElMessage } from 'element-plus'
import type { EnhancedStrategyResult } from '@ai-toolkit/strategy-core'

const store = useStrategyStore()

const current = computed(() => store.getCurrentStrategy())

const dialogVisible = defineModel<boolean>('dialogVisible', { default: false })
const selectedStrategy = defineModel<EnhancedStrategyResult | null>('selectedStrategy', { default: null })

function openDetail(strategy: EnhancedStrategyResult) {
  selectedStrategy.value = strategy
  dialogVisible.value = true
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN')
}

function getConfidenceColor(confidence: number): 'success' | 'warning' | 'info' {
  if (confidence >= 0.9) return 'success'
  if (confidence >= 0.8) return 'warning'
  return 'info'
}

function exportAsJson() {
  if (!selectedStrategy.value) return
  const data = JSON.stringify(selectedStrategy.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `strategy-${selectedStrategy.value.basicResult.strategy.id}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出 JSON 成功')
}

function exportAsMarkdown() {
  if (!selectedStrategy.value) return
  const s = selectedStrategy.value
  const md = `# ${s.enhancedStrategy.title}

## 基本信息
- **策略**: ${s.basicResult.strategy.id} - ${s.basicResult.strategy.name}
- **行业**: ${s.basicResult.industry.id} - ${s.basicResult.industry.name}
- **置信度**: ${(s.basicResult.confidence * 100).toFixed(0)}%

## 匹配推理
- **推理**: ${s.basicResult.reasoning}
- **判断依据**: ${s.basicResult.judgmentBasis}

## 策略定义
${s.enhancedStrategy.definition}

## 适用场景
${s.enhancedStrategy.applicableScenarios.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## 不适用场景
${s.enhancedStrategy.notApplicableScenarios.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## 核心特点
${s.enhancedStrategy.coreCharacteristics.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## 核心矛盾
${s.enhancedStrategy.coreConflict}

## 分阶段开发
${s.enhancedStrategy.phases.map(p => `### ${p.name}
- 目标: ${p.goal}
- 开发模式: ${p.devMode}
- Spec详细程度: ${p.specLevel}
- Vibe比例: ${p.vibeRatio}
- Human Gate: ${p.humanGate}
- 核心交付物: ${p.deliverables}
- 成功标准: ${p.successCriteria}
`).join('\n')}

## 模块开发模式
${s.enhancedStrategy.moduleDevModes.map(m => `- **${m.moduleType}**: ${m.devMode} (${m.humanGate})`).join('\n')}

## 关键注意事项
${s.enhancedStrategy.keyNotes.map((k, i) => `${i + 1}. ${k}`).join('\n')}

## 推荐工具链
${s.enhancedStrategy.recommendedToolChain.map(t => `- **${t.phase}**: ${t.tools} - ${t.note}`).join('\n')}

## 典型风险
${s.enhancedStrategy.typicalRisks.map(r => `### ${r.riskType}
- **具体风险**: ${r.specificRisk}
- **应对措施**: ${r.mitigation}
`).join('\n')}

## 成功指标
${s.enhancedStrategy.successCriteria.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## 行业适配
${s.enhancedStrategy.industryAdaptation}
`
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `strategy-${s.basicResult.strategy.id}-${Date.now()}.md`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出 Markdown 成功')
}

function copyToClipboard() {
  if (!selectedStrategy.value) return
  const data = JSON.stringify(selectedStrategy.value, null, 2)
  navigator.clipboard.writeText(data).then(() => {
    ElMessage.success('已复制到剪贴板')
  })
}
</script>

<template>
  <div class="strategy-viewer">
    <div class="header">
      <h3>开发策略列表</h3>
      <span class="count">共 {{ store.strategies.length }} 条记录</span>
    </div>

    <ElEmpty v-if="store.strategies.length === 0" description="暂无策略记录" />

    <div v-else class="strategy-list">
      <ElCard
        v-for="(item, index) in store.strategies"
        :key="index"
        class="strategy-card"
        :class="{ active: index === store.currentIndex }"
        @click="store.setCurrentStrategy(index)"
      >
        <template #header>
          <div class="card-header">
            <span class="title">
              {{ item.basicResult.strategy.id }} - {{ item.basicResult.strategy.name }}
            </span>
            <ElTag :type="getConfidenceColor(item.basicResult.confidence)" size="small">
              {{ (item.basicResult.confidence * 100).toFixed(0) }}%
            </ElTag>
          </div>
        </template>

        <div class="card-body">
          <div class="info-row">
            <span class="label">行业:</span>
            <span>{{ item.basicResult.industry.id }} - {{ item.basicResult.industry.name }}</span>
          </div>
          <div class="info-row">
            <span class="label">需求:</span>
            <span class="user-input">{{ item.userInput }}</span>
          </div>
          <div class="info-row">
            <span class="label">生成时间:</span>
            <span>{{ formatDate(Date.now() - index * 60000) }}</span>
          </div>
        </div>

        <template #footer>
          <div class="card-footer">
            <ElButton size="small" @click.stop="openDetail(item)">查看详情</ElButton>
            <ElButton size="small" type="danger" @click.stop="store.removeStrategy(index)">删除</ElButton>
          </div>
        </template>
      </ElCard>
    </div>

    <ElDialog
      v-model="dialogVisible"
      :title="selectedStrategy ? `${selectedStrategy.basicResult.strategy.id} - 策略详情` : '策略详情'"
      width="900px"
      destroy-on-close
    >
      <div class="dialog-header">
        <span>策略详情</span>
        <div class="dialog-actions">
          <ElButton size="small" @click="copyToClipboard">复制</ElButton>
          <ElButton size="small" type="primary" @click="exportAsJson">导出 JSON</ElButton>
          <ElButton size="small" type="success" @click="exportAsMarkdown">导出 MD</ElButton>
        </div>
      </div>
      <div v-if="selectedStrategy" class="strategy-detail">
        <ElDescriptions title="基本信息" :column="2" border>
          <ElDescriptionsItem label="策略">
            {{ selectedStrategy.basicResult.strategy.id }} - {{ selectedStrategy.basicResult.strategy.name }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="行业">
            {{ selectedStrategy.basicResult.industry.id }} - {{ selectedStrategy.basicResult.industry.name }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="置信度">
            <ElTag :type="getConfidenceColor(selectedStrategy.basicResult.confidence)">
              {{ (selectedStrategy.basicResult.confidence * 100).toFixed(0) }}%
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>

        <ElDescriptions title="匹配推理" :column="1" border style="margin-top: 20px">
          <ElDescriptionsItem label="推理">
            {{ selectedStrategy.basicResult.reasoning }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="判断依据">
            {{ selectedStrategy.basicResult.judgmentBasis }}
          </ElDescriptionsItem>
        </ElDescriptions>

        <div class="enhanced-section">
          <h4>{{ selectedStrategy.enhancedStrategy.title }}</h4>
          <p class="definition">{{ selectedStrategy.enhancedStrategy.definition }}</p>

          <h5>适用场景</h5>
          <ul>
            <li v-for="(s, i) in selectedStrategy.enhancedStrategy.applicableScenarios" :key="i">
              {{ s }}
            </li>
          </ul>

          <h5>核心特点</h5>
          <ul>
            <li v-for="(c, i) in selectedStrategy.enhancedStrategy.coreCharacteristics" :key="i">
              {{ c }}
            </li>
          </ul>

          <h5>分阶段开发</h5>
          <ElDescriptions :column="1" border>
            <ElDescriptionsItem
              v-for="(p, i) in selectedStrategy.enhancedStrategy.phases.slice(0, 3)"
              :key="i"
              :label="p.name"
            >
              <div>目标: {{ p.goal }}</div>
              <div>开发模式: {{ p.devMode }}</div>
              <div>Human Gate: {{ p.humanGate }}</div>
            </ElDescriptionsItem>
          </ElDescriptions>

          <h5>推荐工具链</h5>
          <ul>
            <li v-for="(t, i) in selectedStrategy.enhancedStrategy.recommendedToolChain.slice(0, 5)" :key="i">
              {{ t.phase }}: {{ t.tools }}
            </li>
          </ul>

          <h5>典型风险</h5>
          <ul>
            <li v-for="(r, i) in selectedStrategy.enhancedStrategy.typicalRisks.slice(0, 3)" :key="i">
              <strong>{{ r.riskType }}:</strong> {{ r.specificRisk }}
              <br>
              <em>应对: {{ r.mitigation }}</em>
            </li>
          </ul>

          <h5>成功指标</h5>
          <ul>
            <li v-for="(s, i) in selectedStrategy.enhancedStrategy.successCriteria.slice(0, 5)" :key="i">
              {{ s }}
            </li>
          </ul>

          <h5>行业适配</h5>
          <p class="industry-adaptation">{{ selectedStrategy.enhancedStrategy.industryAdaptation }}</p>
        </div>
      </div>
    </ElDialog>
  </div>
</template>

<style scoped>
.strategy-viewer {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h3 {
  margin: 0;
}

.count {
  color: #909399;
  font-size: 14px;
}

.strategy-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.strategy-card {
  cursor: pointer;
  transition: all 0.3s;
}

.strategy-card:hover {
  transform: translateX(4px);
}

.strategy-card.active {
  border-left: 3px solid #409eff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-weight: bold;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.label {
  color: #909399;
  min-width: 70px;
}

.user-input {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.strategy-detail {
  max-height: 60vh;
  overflow-y: auto;
}

.enhanced-section {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.enhanced-section h4 {
  margin: 0 0 10px 0;
  color: #409eff;
}

.enhanced-section h5 {
  margin: 20px 0 10px 0;
  color: #303133;
}

.definition {
  color: #606266;
  line-height: 1.6;
}

.industry-adaptation {
  line-height: 1.6;
  color: #606266;
}

ul {
  padding-left: 20px;
  margin: 8px 0;
}

li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-right: 20px;
}

.dialog-actions {
  display: flex;
  gap: 8px;
}
</style>