<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="80%"
    top="5vh"
    :close-on-click-modal="true"
    class="gap-analysis-viewer-dialog"
  >
    <div class="viewer-toolbar">
      <el-button-group>
        <el-button size="small" @click="setViewMode('preview')" :type="viewMode === 'preview' ? 'primary' : ''">
          预览
        </el-button>
        <el-button size="small" @click="setViewMode('edit')" :type="viewMode === 'edit' ? 'primary' : ''">
          编辑
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

    <div class="content-area">
      <div v-if="isStreamingOutput" class="streaming-container">
        <div class="streaming-header">
          <el-icon class="is-loading" :size="16"><Loading /></el-icon>
          <span>AI 分析中...</span>
        </div>
        <div v-if="streamingThinkingContent" class="streaming-thinking">
          <div class="thinking-label">
            <el-icon class="is-loading" :size="12"><Loading /></el-icon>
            <span>思考中</span>
          </div>
          <div class="thinking-text" v-html="renderThinkingContent(streamingThinkingContent)"></div>
        </div>
        <div class="streaming-content markdown-body" v-html="renderMarkdown(streamingMarkdownContent)"></div>
      </div>

      <div v-else-if="isLoading" class="loading-container">
        <div class="loading-animation">
          <el-icon class="is-loading" :size="48"><Loading /></el-icon>
        </div>
        <div class="loading-text">
          <h3>AI 分析中...</h3>
          <p>正在对比立项书与行业标准，请稍候</p>
        </div>
      </div>

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

      <div v-else-if="viewMode === 'edit'" class="edit-mode">
        <el-input
          v-model="editContent"
          type="textarea"
          :rows="20"
          placeholder="编辑分析报告内容..."
          class="edit-textarea"
        />
      </div>
    </div>

    <div class="dialog-footer">
      <el-button
        v-if="!props.analysisResult && !isLoading"
        type="primary"
        :loading="isLoading"
        @click="handleStartAnalysis"
      >
        <el-icon class="el-icon--left"><Connection /></el-icon>
        开始分析
      </el-button>

      <el-button
        v-if="isLoading"
        type="warning"
        @click="handleCancel"
      >
        取消分析
      </el-button>

      <template v-if="props.analysisResult && !isLoading">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="props.isStreaming || !props.analysisResult">
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
import { Download, ArrowDown, Loading, Connection, Check } from '@element-plus/icons-vue'
import type { GapAnalysisResult } from '../types'

interface Props {
  modelValue: boolean
  analysisResult: GapAnalysisResult | null
  isStreaming?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', value: GapAnalysisResult): void
  (e: 'startAnalysis'): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const viewMode = ref<'preview' | 'edit'>('preview')
const streamingThinkingContent = ref('')
const editContent = ref('')

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const dialogTitle = computed(() => '需求差距分析报告')

const isLoading = computed(() => props.modelValue && !props.analysisResult && !props.isStreaming)

const isStreamingOutput = computed(() => {
  if (props.modelValue && props.isStreaming && props.analysisResult?.fullText !== undefined) {
    const fullText = props.analysisResult.fullText
    const thinkMatches = fullText.match(/<think>[\s\S]*?<\/think>/gi)
    if (thinkMatches) {
      const processed = thinkMatches.join('\n')
        .replace(/<\/think>/gi, '')
        .replace(/<think>/gi, '')
      const lines = processed.split('\n').filter(l => l.trim())
      streamingThinkingContent.value = lines.slice(-3).join('\n')
    }
    return true
  }
  return false
})

const streamingMarkdownContent = computed(() => {
  if (!props.analysisResult?.fullText) return ''
  return props.analysisResult.fullText
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
})

const renderedContent = computed(() => {
  if (!props.analysisResult) return ''
  return renderAnalysisResult(props.analysisResult)
})

function setViewMode(mode: 'preview' | 'edit') {
  viewMode.value = mode
  if (mode === 'edit' && props.analysisResult?.fullText) {
    editContent.value = props.analysisResult.fullText
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<think>/gi, '')
      .replace(/<\/think>/gi, '')
  }
}

function renderAnalysisResult(result: GapAnalysisResult): string {
  let html = ''

  if (result.summary) {
    html += `<div class="analysis-summary">
      <el-alert type="success" :title="result.summary" :closable="false" show-icon />
    </div>`
  }

  if (result.hasCovered && result.hasCovered.length > 0) {
    html += `<div class="analysis-section has-covered">
      <h2>一、已有需求（立项书已覆盖）</h2>
      <ul>`
    result.hasCovered.forEach(item => {
      html += `<li>${item}</li>`
    })
    html += `</ul></div>`
  }

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

  if (result.bestPractices && result.bestPractices.length > 0) {
    html += `<div class="analysis-section best-practices">
      <h2>三、行业最佳实践</h2>
      <ul>`
    result.bestPractices.forEach(item => {
      html += `<li>${item}</li>`
    })
    html += `</ul></div>`
  }

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

  const cleaned = trimmed
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>/gi, '')
    .replace(/<\/think>/gi, '')

  if (!cleaned) return ''

  const isMarkdown = /^#{1,6}\s+\S/.test(cleaned)
  const isNumberedList = /^\d+\.\s+\S/.test(cleaned)

  if (!isMarkdown && !isNumberedList) {
    return `<pre class="raw-text">${escapeHtml(cleaned)}</pre>`
  }

  let html = cleaned

  html = html.replace(/^(\d+)\.\s+(.*$)/gm, '<h2>$2</h2>')

  html = html
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')

  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')

  html = html
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    .replace(/^(\d+)\.\s+(.*$)/gm, '<li>$2</li>')

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

function renderThinkingContent(text: string): string {
  if (!text) return ''
  return text
    .replace(/\n/g, '<br/>')
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039'
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

watch(visible, (newVal) => {
  if (!newVal && isLoading) {
    emit('cancel')
  }
})

function convertToMarkdown(result: GapAnalysisResult): string {
  let md = '# 需求差距分析报告\n\n'

  if (result.summary) {
    md += `> **总结：** ${result.summary}\n\n`
  }

  if (result.hasCovered && result.hasCovered.length > 0) {
    md += `## 一、已有需求（已覆盖）\n\n`
    result.hasCovered.forEach(item => {
      md += `- ${item}\n`
    })
    md += '\n'
  }

  if (result.missingSuggestions && result.missingSuggestions.length > 0) {
    md += `## 二、缺失建议（需补充）\n\n`
    result.missingSuggestions.forEach(item => {
      md += `### ${item.category || '通用'}：${item.item}\n\n`
      md += `- **原因：** ${item.reason}\n\n`
    })
  }

  if (result.bestPractices && result.bestPractices.length > 0) {
    md += `## 三、行业最佳实践\n\n`
    result.bestPractices.forEach(item => {
      md += `- ${item}\n`
    })
    md += '\n'
  }

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

watch(() => props.analysisResult, (result) => {
  if (result?.fullText && viewMode.value === 'edit') {
    editContent.value = result.fullText
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<think>/gi, '')
      .replace(/<\/think>/gi, '')
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

.streaming-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: #f0f9eb;
  border: 2px solid #67c23a;
  border-radius: 8px;
  min-height: 300px;
  max-height: 60vh;
  overflow-y: auto;
}

.streaming-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #67c23a;
  font-weight: 600;
  font-size: 14px;
}

.streaming-content {
  padding: 16px;
  background: #fff;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
}

.streaming-content :deep(h1) { font-size: 1.4rem; margin: 0 0 1rem; }
.streaming-content :deep(h2) { font-size: 1.2rem; margin: 1rem 0 0.75rem; }
.streaming-content :deep(h3) { font-size: 1.1rem; margin: 0.75rem 0 0.5rem; }
.streaming-content :deep(p) { margin: 0.5rem 0; }
.streaming-content :deep(li) { margin: 0.3rem 0; }
.streaming-content :deep(strong) { font-weight: 600; }

.streaming-thinking {
  padding: 10px 14px;
  background: #2d2d2d;
  border-radius: 6px;
  margin-bottom: 12px;
}

.thinking-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #e6a23c;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
}

.thinking-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  line-height: 1.4;
  color: #a8d8a8;
  white-space: pre-wrap;
  overflow-y: auto;
  max-height: 100px;
}

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

.preview-content {
  padding: 24px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow-y: auto;
  max-height: calc(80vh - 200px);
}

.edit-mode {
  display: flex;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  flex: 1;
  min-height: 0;
}

.edit-textarea {
  flex: 1;
  min-height: 0;
}

.edit-textarea :deep(.el-textarea) {
  height: 100%;
}

.edit-textarea :deep(.el-textarea__inner) {
  height: 100%;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  background: #1e1e1e;
  color: #d4d4d4;
  border: 1px solid #3c3c3c;
  resize: none;
}

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

.analysis-section.has-covered h2 {
  border-bottom-color: #409eff;
}

.analysis-section.missing-suggestions h2 {
  border-bottom-color: #e6a23c;
}

.analysis-section.best-practices h2 {
  border-bottom-color: #909399;
}

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

.best-practices li {
  background: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
}

.full-text-content {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 6px;
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