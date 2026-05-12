<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="80%"
    top="5vh"
    :close-on-click-modal="true"
    class="gap-analysis-viewer-dialog"
  >
    <!-- 工具栏 -->
    <div class="viewer-toolbar">
      <el-button-group>
        <el-button size="small" @click="setViewMode('preview')" :type="viewMode === 'preview' ? 'primary' : ''">
          预览
        </el-button>
        <el-button size="small" @click="setViewMode('json')" :type="viewMode === 'json' ? 'primary' : ''">
          源码
        </el-button>
      </el-button-group>
      <div v-if="props.analysisResult" class="toolbar-right">
        <el-dropdown trigger="click" @command="handleExport">
          <el-button size="small" :icon="Download">
            导出
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="json">导出为 JSON</el-dropdown-item>
              <el-dropdown-item command="markdown">导出为 Markdown</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-area" :class="{ 'source-mode': viewMode === 'json' }">
      <!-- 加载中状态 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-animation">
          <el-icon class="is-loading" :size="48"><Loading /></el-icon>
        </div>
        <div class="loading-text">
          <h3>AI 分析中...</h3>
          <p>正在对比立项书与行业标准，请稍候</p>
          <div class="loading-steps">
            <div class="loading-step">
              <el-icon><Document /></el-icon>
              <span>加载立项书内容</span>
            </div>
            <div class="loading-arrow"><el-icon><Right /></el-icon></div>
            <div class="loading-step">
              <el-icon><List /></el-icon>
              <span>加载行业标准</span>
            </div>
            <div class="loading-arrow"><el-icon><Right /></el-icon></div>
            <div class="loading-step">
              <el-icon><Connection /></el-icon>
              <span>AI 智能分析</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 预览模式 -->
      <div v-else-if="viewMode === 'preview'" class="preview-content markdown-body">
        <div class="analysis-legend">
          <span class="legend-item legend-original">
            <span class="legend-dot"></span>立项书内容（已有）
          </span>
          <span class="legend-item legend-ai">
            <span class="legend-dot"></span>AI 补充建议
          </span>
          <span class="legend-item legend-best">
            <span class="legend-dot"></span>行业最佳实践
          </span>
        </div>
        <div v-html="renderedContent"></div>
      </div>

      <!-- 源码模式 (JSON) -->
      <div v-else class="json-source">
        <pre><code>{{ rawContent }}</code></pre>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="dialog-footer">
      <!-- 开始分析按钮 -->
      <el-button
        v-if="!analysisResult && !isLoading"
        type="primary"
        :loading="isLoading"
        @click="handleStartAnalysis"
      >
        <el-icon class="el-icon--left"><Connection /></el-icon>
        开始分析
      </el-button>

      <!-- 取消分析按钮（分析中） -->
      <el-button
        v-if="isLoading"
        type="warning"
        @click="handleCancel"
      >
        取消分析
      </el-button>

      <!-- 已完成时的操作 -->
      <template v-if="analysisResult && !isLoading">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">
          <el-icon class="el-icon--left"><Check /></el-icon>
          确认并保存为需求文档
        </el-button>
      </template>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, ArrowDown, Loading, Document, List, Right, Connection, Check } from '@element-plus/icons-vue'
import type { GapAnalysisResult } from '../types'

interface Props {
  modelValue: boolean
  analysisResult: GapAnalysisResult | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', value: GapAnalysisResult): void
  (e: 'startAnalysis'): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const viewMode = ref<'preview' | 'json'>('preview')

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const dialogTitle = computed(() => '需求差距分析报告')

// 加载状态：弹窗打开但没有分析结果时显示加载动画
const isLoading = computed(() => props.modelValue && !props.analysisResult)

const rawContent = computed(() => {
  return JSON.stringify(props.analysisResult, null, 2)
})

const renderedContent = computed(() => {
  if (!props.analysisResult) return ''
  return renderAnalysisResult(props.analysisResult)
})

function setViewMode(mode: 'preview' | 'json') {
  viewMode.value = mode
}

function renderAnalysisResult(result: GapAnalysisResult): string {
  let html = ''

  // 总结
  if (result.summary) {
    html += `<div class="analysis-summary">
      <el-alert type="success" :title="result.summary" :closable="false" show-icon />
    </div>`
  }

  // 已有需求
  if (result.hasCovered && result.hasCovered.length > 0) {
    html += `<div class="analysis-section has-covered">
      <h2>一、已有需求（立项书已覆盖）</h2>
      <ul>`
    result.hasCovered.forEach(item => {
      html += `<li>${item}</li>`
    })
    html += `</ul></div>`
  }

  // 缺失建议
  if (result.missingSuggestions && result.missingSuggestions.length > 0) {
    html += `<div class="analysis-section missing-suggestions">
      <h2>二、缺失建议（AI 补充）</h2>
      <div class="suggestion-list">`
    result.missingSuggestions.forEach(item => {
      html += `<div class="suggestion-item">
        <div class="suggestion-category">${item.category || '通用'}</div>
        <div class="suggestion-content">
          <h4>${item.item}</h4>
          <p><strong>原因：</strong>${item.reason}</p>
        </div>
      </div>`
    })
    html += `</div></div>`
  }

  // 最佳实践
  if (result.bestPractices && result.bestPractices.length > 0) {
    html += `<div class="analysis-section best-practices">
      <h2>三、行业最佳实践</h2>
      <ul>`
    result.bestPractices.forEach(item => {
      html += `<li>${item}</li>`
    })
    html += `</ul></div>`
  }

  // 完整文本（如果有）
  if (result.fullText) {
    html += `<div class="analysis-section full-text">
      <h2>四、完整报告</h2>
      <div class="full-text-content">${renderMarkdown(result.fullText)}</div>
    </div>`
  }

  return html || '<p class="empty-hint">暂无分析结果</p>'
}

function renderMarkdown(text: string): string {
  if (!text) return ''

  const trimmed = text.trim()
  if (!trimmed) return ''

  // 检查是否是标准 Markdown 格式（以 # 开头）
  const isMarkdown = /^#{1,6}\s+\S/.test(trimmed)

  // 检查是否是有序列表开头的格式（如 "1. 项目基本信息"）
  const isNumberedList = /^\d+\.\s+\S/.test(trimmed)

  if (!isMarkdown && !isNumberedList) {
    // 非 Markdown 格式，显示为预格式化文本
    return `<pre class="raw-text">${escapeHtml(trimmed)}</pre>`
  }

  let html = trimmed

  // 处理有序列表标题（1. xxx 格式）
  html = html.replace(/^(\d+)\.\s+(.*$)/gm, '<h2>$2</h2>')

  // 处理标准 Markdown 标题
  html = html
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')

  // 处理加粗和斜体
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')

  // 处理列表
  html = html
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    .replace(/^(\d+)\.\s+(.*$)/gm, '<li>$2</li>')

  // 处理段落和换行
  html = html
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(?!<[hl])/gm, '<p>')
    .replace(/(?<![>])$/gm, '</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p>(<[hl])/g, '$1')
    .replace(/(<\/[hl][^>]*)>(<p>)/g, '$1')

  return html
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

function handleExport(command: 'json' | 'markdown') {
  if (!props.analysisResult) return

  let content = ''
  let filename = '需求差距分析报告'
  let mimeType = ''

  if (command === 'json') {
    content = JSON.stringify(props.analysisResult, null, 2)
    filename += '.json'
    mimeType = 'application/json;charset=utf-8'
  } else {
    content = convertToMarkdown(props.analysisResult)
    filename += '.md'
    mimeType = 'text/markdown;charset=utf-8'
  }

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${filename}`)
}

function handleConfirm() {
  if (props.analysisResult) {
    emit('confirm', props.analysisResult)
    visible.value = false
  }
}

function handleStartAnalysis() {
  emit('startAnalysis')
}

function handleCancel() {
  emit('cancel')
  visible.value = false
}

// 监听弹窗关闭，取消请求
watch(visible, (newVal) => {
  if (!newVal && isLoading) {
    emit('cancel')
  }
})

function convertToMarkdown(result: GapAnalysisResult): string {
  let md = '# 需求差距分析报告\n\n'

  // 总结
  if (result.summary) {
    md += `> **总结：** ${result.summary}\n\n`
  }

  // 已有需求
  if (result.hasCovered && result.hasCovered.length > 0) {
    md += `## 一、已有需求（已覆盖）\n\n`
    result.hasCovered.forEach(item => {
      md += `- ${item}\n`
    })
    md += '\n'
  }

  // 缺失建议
  if (result.missingSuggestions && result.missingSuggestions.length > 0) {
    md += `## 二、缺失建议（需补充）\n\n`
    result.missingSuggestions.forEach(item => {
      md += `### ${item.category || '通用'}：${item.item}\n\n`
      md += `- **原因：** ${item.reason}\n\n`
    })
  }

  // 最佳实践
  if (result.bestPractices && result.bestPractices.length > 0) {
    md += `## 三、行业最佳实践\n\n`
    result.bestPractices.forEach(item => {
      md += `- ${item}\n`
    })
    md += '\n'
  }

  // 完整文本
  if (result.fullText) {
    md += `## 四、完整报告\n\n${result.fullText}\n`
  }

  return md
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    viewMode.value = 'preview'
  }
})
</script>

<style scoped>
.viewer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.content-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border-radius: 8px;
}

/* 加载动画容器 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 60px 40px;
}

.loading-animation {
  margin-bottom: 32px;
}

.loading-animation .el-icon {
  color: #409eff;
  font-size: 48px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

.loading-text {
  text-align: center;
}

.loading-text h3 {
  margin: 0 0 12px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #303133;
}

.loading-text p {
  margin: 0 0 24px;
  font-size: 0.95rem;
  color: #909399;
}

.loading-steps {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.loading-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #f5f7fa;
  border-radius: 8px;
  color: #606266;
  font-size: 0.9rem;
}

.loading-step .el-icon {
  color: #409eff;
}

.loading-step.active {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}

.loading-arrow {
  color: #c0c4cc;
}

.loading-arrow .el-icon {
  font-size: 16px;
}

.preview-content {
  padding: 24px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

.json-source {
  padding: 16px;
  background: #1e1e1e;
  border-radius: 8px;
}

.json-source pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d4d4d4;
}

/* 分析结果样式 */
.analysis-summary {
  margin-bottom: 24px;
}

.analysis-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.analysis-section:last-child {
  border-bottom: none;
}

.analysis-section h2 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #303133;
  margin: 20px 0 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.analysis-section.covered h2 {
  border-bottom-color: #67c23a;
}

.analysis-section.missing h2 {
  border-bottom-color: #e6a23c;
}

.analysis-section.best-practices h2 {
  border-bottom-color: #909399;
}

.analysis-section h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #409eff;
  margin: 16px 0 8px;
}

.analysis-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #303133;
  margin: 12px 0 8px;
}

.analysis-section ul {
  margin: 8px 0;
  padding-left: 20px;
}

.analysis-section li {
  margin: 8px 0;
  line-height: 1.6;
  color: #606266;
}

.analysis-section p {
  margin: 8px 0;
  line-height: 1.7;
  color: #606266;
}

/* 建议列表 */
.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #fff8f0;
  border-left: 4px solid #e6a23c;
  border-radius: 6px;
}

.suggestion-category {
  flex-shrink: 0;
  padding: 4px 12px;
  background: #e6a23c;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  height: fit-content;
}

.suggestion-content {
  flex: 1;
}

.suggestion-content h4 {
  margin: 0 0 8px;
  color: #303133;
}

.suggestion-content p {
  margin: 0;
  font-size: 0.9rem;
}

/* 最佳实践 */
.best-practices li {
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
}

/* 完整文本 */
.full-text-content {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.full-text-content :deep(h1) {
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: #303133;
}

.full-text-content :deep(h2) {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem;
  color: #303133;
}

.full-text-content :deep(h3) {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1.25rem 0 0.5rem;
  color: #606266;
}

.full-text-content :deep(p) {
  margin: 0.75rem 0;
  line-height: 1.8;
}

.full-text-content :deep(li) {
  margin: 0.4rem 0;
  line-height: 1.7;
}

.full-text-content :deep(strong) {
  font-weight: 600;
  color: #303133;
}

.raw-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  background: #f5f7fa;
  padding: 16px;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
  max-height: 400px;
  overflow-y: auto;
}

/* 空内容提示 */
.empty-hint {
  text-align: center;
  color: #909399;
  padding: 40px;
  font-style: italic;
}

.gap-analysis-viewer-dialog :deep(.el-dialog__body) {
  padding: 20px;
  height: calc(80vh - 140px);
  display: flex;
  flex-direction: column;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  margin-top: 16px;
}

/* 图例样式 */
.analysis-legend {
  display: flex;
  gap: 24px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: #606266;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-original .legend-dot {
  background: #409eff;
}

.legend-ai .legend-dot {
  background: #e6a23c;
}

.legend-best .legend-dot {
  background: #909399;
}

/* 已有需求（原立项书内容） */
.analysis-section.has-covered {
  background: #ecf5ff;
  border-left: 4px solid #409eff;
  border-radius: 6px;
  padding: 16px;
}

.analysis-section.has-covered h2 {
  color: #409eff;
  border-bottom-color: #409eff;
  margin-top: 0;
}

/* 缺失建议（AI 补充内容） */
.analysis-section.missing-suggestions {
  background: #fdf6ec;
  border-left: 4px solid #e6a23c;
  border-radius: 6px;
  padding: 16px;
}

.analysis-section.missing-suggestions h2 {
  color: #e6a23c;
  border-bottom-color: #e6a23c;
  margin-top: 0;
}

.analysis-section.missing-suggestions .suggestion-item {
  background: #fff8f0;
  border-left: 3px solid #e6a23c;
  font-weight: 600;
}

/* 最佳实践 */
.analysis-section.best-practices {
  background: #f5f7fa;
  border-left: 4px solid #909399;
  border-radius: 6px;
  padding: 16px;
}

.analysis-section.best-practices h2 {
  color: #909399;
  border-bottom-color: #909399;
  margin-top: 0;
}
</style>
