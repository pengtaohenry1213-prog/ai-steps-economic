<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    :width="'90%'"
    top="3vh"
    :close-on-click-modal="false"
    class="document-editor-simple-dialog"
    @closed="handleClosed"
  >
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <el-button-group>
        <el-button size="small" @click="setViewMode('edit')" :type="viewMode === 'edit' ? 'primary' : ''">
          编辑
        </el-button>
        <el-button size="small" @click="setViewMode('preview')" :type="viewMode === 'preview' ? 'primary' : ''">
          预览
        </el-button>
        <el-button size="small" @click="setViewMode('split')" :type="viewMode === 'split' ? 'primary' : ''">
          分屏
        </el-button>
      </el-button-group>

      <div class="toolbar-center">
        <el-tag v-if="isStreaming" type="success" effect="plain">
          <el-icon class="is-loading"><Loading /></el-icon>
          AI 生成中...
        </el-tag>
        <el-tag v-if="isDirty" type="warning" effect="plain">已修改</el-tag>
      </div>

      <div class="toolbar-right">
        <el-button size="small" @click="copyContent">
          <el-icon class="el-icon--left"><CopyDocument /></el-icon>
          复制
        </el-button>
        <el-button size="small" @click="insertTemplate">
          <el-icon class="el-icon--left"><DocumentAdd /></el-icon>
          插入模板
        </el-button>
        <el-button size="small" @click="handleExport">
          <el-icon class="el-icon--left"><Download /></el-icon>
          导出
        </el-button>
        <el-button v-if="!readOnly" type="primary" size="small" @click="handleSave">
          保存
        </el-button>
      </div>
    </div>

    <!-- 编辑器区域 -->
    <div class="editor-container" :class="`view-${viewMode}`">
      <!-- 左侧编辑区 -->
      <div v-show="viewMode !== 'preview'" class="editor-pane">
        <el-input
          ref="textareaRef"
          v-model="markdownContent"
          type="textarea"
          :rows="editorRows"
          placeholder="输入 Markdown 内容，或点击「插入模板」开始..."
          class="markdown-textarea"
          @input="handleContentChange"
          @scroll="syncScroll"
        />
      </div>

      <!-- 右侧预览区 -->
      <div v-show="viewMode !== 'edit'" class="preview-pane" ref="previewPaneRef" @scroll="handlePreviewScroll">
        <div class="preview-content markdown-body" v-html="renderedMarkdown"></div>
        <div v-if="!markdownContent.trim()" class="empty-preview">
          <el-empty description="预览内容为空" />
        </div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="editor-statusbar">
      <span class="status-item">
        {{ charCount }} 字符
      </span>
      <span class="status-item">
        {{ lineCount }} 行
      </span>
      <span class="status-item">
        {{ wordCount }} 词
      </span>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  CopyDocument,
  Download,
  DocumentAdd,
  Loading
} from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
  content?: string
  stageName?: string
  stageTitle?: string
  readOnly?: boolean
  isStreaming?: boolean
  defaultTemplate?: 'proposal' | 'requirement' | 'architecture' | 'test_plan' | 'acceptance' | 'deployment'
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:content', content: string): void
  (e: 'save', content: string): void
  (e: 'closed'): void
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  isStreaming: false,
  defaultTemplate: 'proposal'
})

const emit = defineEmits<Emits>()

const textareaRef = ref()
const previewPaneRef = ref()
const viewMode = ref<'edit' | 'preview' | 'split'>('split')
const markdownContent = ref('')
const isDirty = ref(false)
const originalContent = ref('')

const TEMPLATES: Record<string, string> = {
  proposal: `## 项目名称


## 项目基本信息
- **项目类型**：
- **决策人**：
- **负责人**：
- **团队规模**：

## 项目背景


## 当前问题
1.

## 项目目标
1.

## 项目范围
### In Scope (P0)

### In Scope (P1)

### Out of Scope


## 验收标准
### 功能验收

### 性能验收

### 安全验收

## 里程碑计划
| 阶段 | 里程碑 | 日期 | 交付物 |
|------|--------|------|--------|

## 风险评估
### 高风险

### 中风险

### 低风险

## Human Gate
### PMO 检查项

### 安全检查项

`,
  requirement: `## 需求文档标题


## 概述


## 功能需求
### 核心功能

### 重要功能

### 可选功能

## 非功能需求
### 性能要求

### 安全要求

## 用户故事


## 用例描述


## 接口需求


## 数据需求


## 验收标准

`,
  architecture: `## 架构设计文档


## 概述


## 技术选型
### 技术栈

### 备选方案对比

## 系统架构
### 整体架构

### 模块设计

## 数据库设计


## API 设计


## 安全设计


## 部署方案


## ADR (架构决策记录)

`
}

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const dialogTitle = computed(() => {
  if (props.stageTitle) return props.stageTitle
  const names: Record<string, string> = {
    init: '立项书编辑器',
    requirement: '需求文档编辑器',
    architecture: '架构文档编辑器',
    development: '开发文档编辑器',
    testing: '测试文档编辑器',
    acceptance: '验收文档编辑器',
    deployment: '部署文档编辑器'
  }
  return names[props.stageName || ''] || '文档编辑器'
})

const editorRows = computed(() => {
  return viewMode.value === 'split' ? 20 : 30
})

const charCount = computed(() => {
  return markdownContent.value.length
})

const lineCount = computed(() => {
  return markdownContent.value.split('\n').length
})

const wordCount = computed(() => {
  const text = markdownContent.value.replace(/[#*`\[\]()]/g, ' ')
  const words = text.split(/\s+/).filter(w => w.length > 0)
  return words.length
})

const renderedMarkdown = computed(() => {
  return renderMarkdown(markdownContent.value)
})

function renderMarkdown(text: string): string {
  if (!text) return ''

  let html = text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
    .replace(/^\|(.+)\|$/gm, (match, content) => {
      const cells = content.split('|').map((c: string) => c.trim())
      return '<tr>' + cells.map((c: string) => `<td>${c}</td>`).join('') + '</tr>'
    })
    .replace(/^---$/gm, '<hr/>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')

  html = `<p>${html}</p>`
  html = html.replace(/<p><(h[1-6]|li|hr|tr)/g, '<$1')
  html = html.replace(/<\/(h[1-6]|li|hr|tr)><\/p>/g, '</$1>')
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/<p>(<h[1-6]>)/g, '$1')
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1')
  html = html.replace(/<p>(<li>)/g, '$1')
  html = html.replace(/(<\/li>)<\/p>/g, '$1')

  return html
}

function setViewMode(mode: 'edit' | 'preview' | 'split') {
  viewMode.value = mode
}

function handleContentChange() {
  isDirty.value = markdownContent.value !== originalContent.value
}

function handlePreviewScroll() {
  // 预览滚动时可以同步编辑区滚动
}

function syncScroll(e: Event) {
  // 如果是分屏模式，可以同步预览区滚动
}

function copyContent() {
  navigator.clipboard.writeText(markdownContent.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  })
}

function insertTemplate() {
  const template = TEMPLATES[props.defaultTemplate] || TEMPLATES.proposal
  if (!markdownContent.value.trim()) {
    markdownContent.value = template
  } else {
    markdownContent.value += '\n\n' + template
  }
  isDirty.value = true
}

function handleExport() {
  const blob = new Blob([markdownContent.value], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.stageName || 'document'}_${new Date().toISOString().slice(0, 10)}.md`
  a.click()
  URL.revokeObjectURL(url)
}

function handleSave() {
  emit('save', markdownContent.value)
  originalContent.value = markdownContent.value
  isDirty.value = false
  ElMessage.success('保存成功')
}

function handleClosed() {
  emit('closed')
}

function appendContent(chunk: string) {
  markdownContent.value += chunk
  isDirty.value = true
}

function clearContent() {
  markdownContent.value = ''
  originalContent.value = ''
  isDirty.value = false
}

watch(() => props.content, (newContent) => {
  if (newContent !== undefined && newContent !== null) {
    markdownContent.value = newContent
    originalContent.value = newContent
    isDirty.value = false
  }
}, { immediate: true })

watch(() => props.modelValue, (isOpen) => {
  if (isOpen && !markdownContent.value) {
    nextTick(() => {
      if (textareaRef.value?.focus) {
        textareaRef.value.focus()
      }
    })
  }
})

onMounted(() => {
  if (props.content) {
    markdownContent.value = props.content
    originalContent.value = props.content
  }
})

defineExpose({
  appendContent,
  clearContent,
  getContent: () => markdownContent.value
})
</script>

<style scoped>
.document-editor-simple-dialog :deep(.el-dialog__body) {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: calc(85vh - 60px);
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #e4e7ed;
  background: #f5f7fa;
}

.toolbar-center {
  display: flex;
  gap: 8px;
  align-items: center;
}

.toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.editor-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-container.view-edit .editor-pane,
.editor-container.view-edit .preview-pane {
  width: 100%;
}

.editor-container.view-preview .editor-pane {
  display: none;
}

.editor-container.view-preview .preview-pane {
  width: 100%;
}

.editor-container.view-split .editor-pane,
.editor-container.view-split .preview-pane {
  width: 50%;
}

.editor-pane {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e4e7ed;
}

.markdown-textarea {
  flex: 1;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.markdown-textarea :deep(.el-textarea__inner) {
  height: 100%;
  resize: none;
  border: none;
  border-radius: 0;
  padding: 12px;
  font-family: inherit;
  line-height: inherit;
}

.preview-pane {
  overflow-y: auto;
  background: #fff;
}

.preview-content {
  padding: 16px 24px;
  max-width: 900px;
}

.preview-content :deep(h1) {
  font-size: 1.8em;
  border-bottom: 2px solid #409eff;
  padding-bottom: 8px;
  margin-top: 24px;
}

.preview-content :deep(h2) {
  font-size: 1.5em;
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 6px;
  margin-top: 20px;
}

.preview-content :deep(h3) {
  font-size: 1.2em;
  margin-top: 16px;
}

.preview-content :deep(code) {
  background: #f1f1f1;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.preview-content :deep(li) {
  margin: 4px 0;
}

.preview-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.preview-content :deep(td),
.preview-content :deep(th) {
  border: 1px solid #e4e7ed;
  padding: 8px 12px;
  text-align: left;
}

.preview-content :deep(th) {
  background: #f5f7fa;
  font-weight: 600;
}

.empty-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.editor-statusbar {
  display: flex;
  gap: 16px;
  padding: 4px 12px;
  background: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  font-size: 12px;
  color: #909399;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
