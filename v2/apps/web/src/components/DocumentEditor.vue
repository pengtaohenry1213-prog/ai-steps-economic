<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    :width="dialogWidth"
    top="5vh"
    :close-on-click-modal="false"
    style="height: 80vh"
    class="document-editor-dialog"
  >
    <div v-if="!isLoading" class="editor-toolbar">
      <el-button-group>
        <el-button size="small" @click="setViewMode('preview')" :type="viewMode === 'preview' ? 'primary' : ''">
          预览
        </el-button>
        <el-button v-if="!readOnly" size="small" @click="setViewMode('edit')" :type="viewMode === 'edit' ? 'primary' : ''">
          编辑
        </el-button>
        <el-button v-if="!readOnly" size="small" @click="setViewMode('source')" :type="viewMode === 'source' ? 'primary' : ''">
          源码
        </el-button>
      </el-button-group>
      <div class="toolbar-right">
        <el-tag v-if="saveStatus" :type="saveStatus === 'saved' ? 'success' : 'warning'">
          {{ saveStatus === 'saved' ? '已保存' : '保存中...' }}
        </el-tag>
        <el-button size="small" @click="copyContent">
          <el-icon class="el-icon--left"><CopyDocument /></el-icon>
          复制
        </el-button>
        <el-button v-if="!readOnly" size="small" @click="handleExport">
          <el-icon class="el-icon--left"><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <span>{{ loadingText }}</span>
    </div>

    <div v-else class="content-area">
      <template v-if="viewMode === 'preview'">
        <div class="preview-content markdown-body">
          <div v-html="renderedContent"></div>
        </div>
        <div v-if="!content || (!content.fullText && !content.name && !content.goals && !content.background)" class="empty-state">
          <el-empty description="暂无内容" />
        </div>
      </template>

      <template v-else-if="viewMode === 'edit'">
        <div class="edit-mode-content">
          <el-form label-position="top" size="default">
            <el-divider content-position="left">基本信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="项目名称">
                  <el-input v-model="editContent.name" placeholder="请输入项目名称" @input="handleFieldChange('name', editContent.name)" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="项目类型">
                  <el-input v-model="editContent.type" placeholder="如：系统升级、新功能开发" @input="handleFieldChange('type', editContent.type)" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="决策人">
              <el-select v-model="editContent.decisionMakers" multiple placeholder="请选择决策人" style="width: 100%" @change="handleFieldChange('decisionMakers', editContent.decisionMakers)">
                <el-option
                  v-for="member in DECISION_MAKERS"
                  :key="member.id"
                  :label="`${member.name} (${member.role})`"
                  :value="member.name"
                />
              </el-select>
            </el-form-item>

            <el-divider content-position="left">项目背景与目标</el-divider>
            <el-form-item label="项目背景">
              <el-input v-model="editContent.background" type="textarea" :rows="3" placeholder="请描述项目背景..." @input="handleFieldChange('background', editContent.background)" />
            </el-form-item>
            <el-form-item label="当前问题">
              <el-input v-model="currentIssuesText" type="textarea" :rows="2" placeholder="每行一个问题" @input="handleIssuesChange" />
            </el-form-item>
            <el-form-item label="项目目标">
              <el-input v-model="goalsText" type="textarea" :rows="2" placeholder="每行一个目标" @input="handleGoalsChange" />
            </el-form-item>

            <el-divider content-position="left">项目范围</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="In Scope (P0)">
                  <el-input v-model="p0ItemsText" type="textarea" :rows="3" placeholder="每行一项 P0 任务" @input="handleScopeChange" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="In Scope (P1)">
                  <el-input v-model="p1ItemsText" type="textarea" :rows="3" placeholder="每行一项 P1 任务" @input="handleScopeChange" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="Out of Scope">
              <el-input v-model="outScopeText" type="textarea" :rows="2" placeholder="每行一项" @input="handleScopeChange" />
            </el-form-item>

            <el-divider content-position="left">验收标准</el-divider>
            <el-form-item label="验收标准">
              <el-input v-model="acceptanceText" type="textarea" :rows="3" placeholder="每行一条验收标准" @input="handleFieldChange('acceptance', acceptanceText)" />
            </el-form-item>

            <el-divider content-position="left">里程碑计划</el-divider>
            <el-form-item label="里程碑">
              <el-input v-model="milestonesText" type="textarea" :rows="3" placeholder="每行一个里程碑" @input="handleFieldChange('milestones', milestonesText)" />
            </el-form-item>

            <el-divider content-position="left">风险评估</el-divider>
            <el-form-item label="风险">
              <el-input v-model="risksText" type="textarea" :rows="3" placeholder="每行一个风险描述" @input="handleFieldChange('risks', risksText)" />
            </el-form-item>
          </el-form>
        </div>
      </template>

      <div v-else class="json-source">
        <pre><code>{{ JSON.stringify(content, null, 2) }}</code></pre>
      </div>
    </div>

    <template #footer v-if="!readOnly && !isLoading && content">
      <div class="editor-footer">
        <el-button @click="handleReset" :icon="Refresh" :disabled="isSaving">重置</el-button>
        <el-button type="danger" @click="handleDelete" :icon="Delete" :disabled="isSaving">删除</el-button>
        <el-button type="primary" @click="handleComplete" :icon="Check" :disabled="isSaving">完成</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, CopyDocument, Refresh, Check, Loading, Delete } from '@element-plus/icons-vue'
import type { ProposalContent, TeamMember } from '../types'
import { TEAM_MEMBERS } from '../types'

const DECISION_MAKERS = TEAM_MEMBERS.filter(m => ['PMO', 'PM', 'TechLead'].includes(m.role))

export type DocumentEditorMode = 'view' | 'edit'
export type ViewMode = 'preview' | 'edit' | 'source'

interface Props {
  modelValue: boolean
  document: ProposalContent | null
  stageName: string
  stageTitle?: string
  readOnly?: boolean
  isLoading?: boolean
  loadingText?: string
  isSaving?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:content', content: ProposalContent): void
  (e: 'reset'): void
  (e: 'delete'): void
  (e: 'complete'): void
}

const props = withDefaults(defineProps<Props>(), {
  readOnly: false,
  isLoading: false,
  loadingText: '加载中...',
  isSaving: false
})

const emit = defineEmits<Emits>()

const viewMode = ref<ViewMode>('preview')
const activeTab = ref('edit')
const saveStatus = ref<'saving' | 'saved' | null>(null)
const editContent = ref<any>(null)

const currentIssuesText = ref('')
const goalsText = ref('')
const p0ItemsText = ref('')
const p1ItemsText = ref('')
const outScopeText = ref('')
const acceptanceText = ref('')
const milestonesText = ref('')
const risksText = ref('')

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const content = computed(() => props.document)

const dialogTitle = computed(() => {
  if (props.stageTitle) return props.stageTitle
  const stageNames: Record<string, string> = {
    init: '立项书',
    requirement: '需求文档 (PRD)',
    design: '架构文档',
    development: '开发文档',
    testing: '测试文档',
    acceptance: '验收文档',
    packaging: '打包文档',
    deployment: '部署文档'
  }
  return stageNames[props.stageName] || '文档'
})

const dialogWidth = computed(() => props.readOnly ? '80%' : '900px')

const renderedContent = computed(() => {
  if (!content.value) return ''
  return renderJsonContent(content.value)
})

watch(() => props.document, (newContent) => {
  if (newContent) {
    editContent.value = JSON.parse(JSON.stringify(newContent))
    syncJsonToText()
  } else {
    editContent.value = null
    clearTextFields()
  }
}, { immediate: true, deep: true })

function syncJsonToText() {
  if (!editContent.value) return

  currentIssuesText.value = Array.isArray(editContent.value.currentIssues)
    ? editContent.value.currentIssues.join('\n') : ''
  goalsText.value = Array.isArray(editContent.value.goals)
    ? editContent.value.goals.join('\n') : ''

  const scope = editContent.value.scope || {}
  if (scope.inScope && typeof scope.inScope === 'object') {
    p0ItemsText.value = Array.isArray(scope.inScope.P0) ? scope.inScope.P0.join('\n') : ''
    p1ItemsText.value = Array.isArray(scope.inScope.P1) ? scope.inScope.P1.join('\n') : ''
  } else if (Array.isArray(scope.inScope)) {
    p0ItemsText.value = scope.inScope.join('\n')
    p1ItemsText.value = ''
  } else {
    p0ItemsText.value = ''
    p1ItemsText.value = ''
  }
  outScopeText.value = Array.isArray(scope.outScope) ? scope.outScope.join('\n') : ''

  acceptanceText.value = typeof editContent.value.acceptance === 'string'
    ? editContent.value.acceptance : ''
  milestonesText.value = Array.isArray(editContent.value.milestones)
    ? editContent.value.milestones.join('\n') : ''
  risksText.value = Array.isArray(editContent.value.risks)
    ? editContent.value.risks.map((r: any) => r.description || r).join('\n') : ''
}

function clearTextFields() {
  currentIssuesText.value = ''
  goalsText.value = ''
  p0ItemsText.value = ''
  p1ItemsText.value = ''
  outScopeText.value = ''
  acceptanceText.value = ''
  milestonesText.value = ''
  risksText.value = ''
}

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    viewMode.value = props.readOnly ? 'preview' : 'edit'
    activeTab.value = 'edit'
  }
})

function setViewMode(mode: ViewMode) {
  viewMode.value = mode
}

function handleFieldChange(field: string, value: any) {
  if (editContent.value) {
    (editContent.value as any)[field] = value
    handleChange()
  }
}

function handleIssuesChange() {
  if (editContent.value) {
    editContent.value.currentIssues = currentIssuesText.value.split('\n').filter((s: string) => s.trim())
    handleChange()
  }
}

function handleGoalsChange() {
  if (editContent.value) {
    editContent.value.goals = goalsText.value.split('\n').filter((s: string) => s.trim())
    handleChange()
  }
}

function handleScopeChange() {
  if (editContent.value) {
    editContent.value.scope = {
      inScope: {
        P0: p0ItemsText.value.split('\n').filter((s: string) => s.trim()),
        P1: p1ItemsText.value.split('\n').filter((s: string) => s.trim())
      },
      outScope: outScopeText.value.split('\n').filter((s: string) => s.trim())
    }
    handleChange()
  }
}

function handleChange() {
  if (props.readOnly) return
  saveStatus.value = 'saving'
  emit('update:content', editContent.value)
  setTimeout(() => {
    saveStatus.value = 'saved'
    setTimeout(() => { saveStatus.value = null }, 2000)
  }, 500)
}

function copyContent() {
  if (!content.value) return
  const textToCopy = JSON.stringify(content.value, null, 2)
  navigator.clipboard.writeText(textToCopy).then(() => {
    ElMessage.success('内容已复制到剪贴板')
  })
}

function handleExport() {
  if (!content.value) return

  const filename = `${dialogTitle.value}.json`
  const exportContent = JSON.stringify(content.value, null, 2)

  const blob = new Blob([exportContent], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${filename}`)
}

function handleReset() {
  emit('reset')
}

function handleDelete() {
  emit('delete')
}

function handleComplete() {
  emit('complete')
}

function renderJsonContent(doc: ProposalContent): string {
  let html = ''

  if (doc.name) {
    html += `<div class="json-section">
      <h1>${doc.name}</h1>
      <p><span class="label">项目类型：</span>${doc.type || '-'}</p>
      <p><span class="label">决策人：</span>${Array.isArray(doc.decisionMakers) ? doc.decisionMakers.join('、') : '-'}</p>
    </div>`
  }

  if (doc.background) {
    html += `<div class="json-section">
      <h2>项目背景</h2>
      <p>${doc.background}</p>
    </div>`
  }

  if (doc.currentIssues && Array.isArray(doc.currentIssues)) {
    html += `<div class="json-section">
      <h3>当前问题</h3>
      <ul>${doc.currentIssues.map(item => `<li>${item}</li>`).join('')}</ul>
    </div>`
  }

  if (doc.goals && Array.isArray(doc.goals)) {
    html += `<div class="json-section">
      <h2>项目目标</h2>
      <ul>${doc.goals.map(item => `<li>${item}</li>`).join('')}</ul>
    </div>`
  }

  if (doc.scope) {
    html += `<div class="json-section">
      <h2>项目范围</h2>`

    if (doc.scope.inScope) {
      html += `<h3>In Scope</h3>`
      const inScope = doc.scope.inScope as any
      if (Array.isArray(inScope)) {
        html += `<ul>${inScope.map((item: string) => `<li>${item}</li>`).join('')}</ul>`
      } else if (typeof inScope === 'object') {
        for (const [priority, items] of Object.entries(inScope)) {
          if (Array.isArray(items) && items.length > 0) {
            html += `<h4>${priority}</h4><ul>${items.map((item: string) => `<li>${item}</li>`).join('')}</ul>`
          }
        }
      }
    }

    if (doc.scope.outScope && Array.isArray(doc.scope.outScope)) {
      html += `<h3>Out of Scope</h3><ul>${doc.scope.outScope.map(item => `<li>${item}</li>`).join('')}</ul>`
    }

    html += `</div>`
  }

  if (doc.acceptance) {
    html += `<div class="json-section">
      <h2>验收标准</h2>`

    if (typeof doc.acceptance === 'object') {
      const acc = doc.acceptance as any
      if (acc.functionality && Array.isArray(acc.functionality)) {
        html += `<h3>功能验收</h3><ul>${acc.functionality.map((item: string) => `<li>${item}</li>`).join('')}</ul>`
      }

      if (acc.performance && typeof acc.performance === 'object') {
        html += `<h3>性能验收</h3><ul>`
        for (const [key, val] of Object.entries(acc.performance)) {
          html += `<li><strong>${key}：</strong>${val}</li>`
        }
        html += `</ul>`
      }

      if (acc.security && Array.isArray(acc.security)) {
        html += `<h3>安全验收</h3><ul>${acc.security.map((item: string) => `<li>${item}</li>`).join('')}</ul>`
      }
    } else {
      html += `<p>${doc.acceptance}</p>`
    }

    html += `</div>`
  }

  if (doc.milestones) {
    html += `<div class="json-section">
      <h2>里程碑计划</h2>`
    if (Array.isArray(doc.milestones)) {
      html += `<ul>${doc.milestones.map((item, idx) => `<li>${idx + 1}. ${item}</li>`).join('')}</ul>`
    } else {
      html += `<p>${doc.milestones}</p>`
    }
    html += `</div>`
  }

  if (doc.risks) {
    html += `<div class="json-section">
      <h2>风险评估</h2>`

    if (Array.isArray(doc.risks)) {
      const risks = doc.risks as any[]
      const riskByLevel: Record<string, string> = { '高': '', '中': '', '低': '' }

      for (const risk of risks) {
        const level = risk.type || '中'
        if (!riskByLevel[level]) riskByLevel[level] = ''
        riskByLevel[level] += `<div class="risk-item risk-${level.toLowerCase()}">
          <strong>${risk.description || ''}</strong>
          <p><span class="label">影响：</span>${risk.impact || '-'}</p>
          <p><span class="label">应对：</span>${risk.countermeasure || '-'}</p>
        </div>`
      }

      for (const [level, content] of Object.entries(riskByLevel)) {
        if (content) {
          html += `<h3>${level}风险</h3>${content}`
        }
      }
    } else {
      html += `<p>${doc.risks}</p>`
    }

    html += `</div>`
  }

  return html || '<p class="empty-hint">暂无内容</p>'
}

defineExpose({
  setViewMode,
  setContent: (newContent: ProposalContent) => {
    editContent.value = JSON.parse(JSON.stringify(newContent))
  }
})
</script>

<style scoped>
.document-editor-dialog :deep(.el-dialog__body) {
  padding: 20px;
  height: calc(80vh - 140px);
  display: flex;
  flex-direction: column;
}

.editor-toolbar {
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
  max-height: calc(100% - 60px);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #909399;
  gap: 16px;
}

.empty-state {
  padding: 20px;
}

.preview-content {
  padding: 24px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-sizing: border-box;
}

.edit-mode-content {
  min-height: 400px;
  box-sizing: border-box;
}

.content-area::-webkit-scrollbar {
  width: 8px;
}

.content-area::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.content-area::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.content-area::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

.json-source {
  max-height: calc(80vh - 200px);
  overflow-y: auto;
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

.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.json-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.json-section:last-child {
  border-bottom: none;
}

.json-section h1 {
  font-size: 1.6rem;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.json-section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #303133;
  margin: 20px 0 12px;
}

.json-section h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #409eff;
  margin: 16px 0 8px;
}

.json-section h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #67c23a;
  margin: 12px 0 8px;
  padding-left: 8px;
  border-left: 3px solid #67c23a;
}

.json-section p {
  margin: 8px 0;
  line-height: 1.7;
  color: #606266;
}

.json-section .label {
  font-weight: 500;
  color: #909399;
}

.json-section ul {
  margin: 8px 0;
  padding-left: 20px;
}

.json-section li {
  margin: 6px 0;
  line-height: 1.6;
  color: #606266;
}

.risk-item {
  padding: 12px;
  margin: 8px 0;
  border-radius: 6px;
  background: #f5f7fa;
}

.risk-high {
  border-left: 4px solid #f56c6c;
  background: #fef0f0;
}

.risk-medium {
  border-left: 4px solid #e6a23c;
  background: #fdf6ec;
}

.risk-low {
  border-left: 4px solid #67c23a;
  background: #f0f9eb;
}

.risk-item p {
  margin: 4px 0;
  font-size: 0.9rem;
}

.risk-item strong {
  color: #303133;
  font-size: 1rem;
}

.empty-hint {
  text-align: center;
  color: #909399;
  padding: 40px;
  font-style: italic;
}

.markdown-body :deep(h1) {
  font-size: 1.6rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: #303133;
  border-bottom: 2px solid #409eff;
  padding-bottom: 0.5rem;
}

.markdown-body :deep(h2) {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem;
  color: #303133;
}

.markdown-body :deep(h3) {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1.25rem 0 0.5rem;
  color: #606266;
}

.markdown-body :deep(p) {
  margin: 0.75rem 0;
  line-height: 1.8;
  color: #606266;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

.markdown-body :deep(li) {
  margin: 0.4rem 0;
  line-height: 1.7;
}

.markdown-body :deep(code) {
  background: #f0f0f0;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
}

.markdown-body :deep(pre) {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-body :deep(strong) {
  font-weight: 600;
  color: #303133;
}
</style>