<template>
  <div class="lifecycle-dashboard">
    <el-card shadow="hover" class="lifecycle-header-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><List /></el-icon>
            全生命周期进度
          </span>
          <div class="header-actions">
            <ModelSelector ref="modelSelectorRef" />
            <el-button size="small" @click="confirmReset" :disabled="isGenerating">
              <el-icon class="el-icon--left"><Refresh /></el-icon>
              重置
            </el-button>
          </div>
        </div>
      </template>

      <div class="lifecycle-progress">
        <!-- 全生命周期进度 -->
        <el-steps :active="currentStageIndex" align-center finish-status="success">
          <el-step
            v-for="stage in store.stages"
            :key="stage.id"
            :title="stage.name"
            :description="stage.label"
            :status="getStepStatus(stage.status)"
          />
        </el-steps>
      </div>

      <div v-if="hasFeedbackLoop" class="feedback-alert">
        <el-alert
          type="warning"
          title="反馈循环已触发"
          description="测试/验收/打包/部署阶段发现问题，已回到开发阶段重新修复"
          :closable="false"
          show-icon
        />
      </div>
    </el-card>

    <el-row :gutter="20" class="stages-row">
      <!-- 各阶段进度 -->
      <el-col
        v-for="(stage, index) in store.stages"
        :key="stage.id"
        :xs="24"
        :sm="12"
        :md="8"
        :lg="6"
        :xl="4"
        style="padding-bottom:10px"
      >
        <div
          :class="['stage-card-wrapper', { 'current-stage': stage.id === store.currentStageId }]"
        >
          <el-card
            :class="['stage-card', `stage-${stage.status}`, { 'feedback-active': stage.feedbackLoop }]"
            shadow="hover"
          >
            <template #header>
              <div class="stage-header">
                <el-tag :type="getStageTagType(stage.status)" size="small">
                  {{ stage.name }}
                </el-tag>
                <el-tag
                  v-if="stage.feedbackLoop"
                  type="warning"
                  size="small"
                  effect="plain"
                >
                  <el-icon><Warning /></el-icon>
                  回流
                </el-tag>
              </div>
            </template>

            <div class="stage-body">
              <div class="stage-label">{{ stage.label }}</div>

              <div class="stage-status-display">
                <el-icon
                  v-if="stage.isGenerating"
                  :size="32"
                  class="status-icon status-generating"
                >
                  <Loading />
                </el-icon>
                <el-icon
                  v-else
                  :size="32"
                  :class="getStatusIconClass(stage.status)"
                >
                  <Check v-if="stage.status === 'completed'" />
                  <Loading v-else-if="stage.status === 'in_progress'" />
                  <Close v-else-if="stage.status === 'failed'" />
                  <Minus v-else />
                </el-icon>
                <span class="status-text">
                  {{ stage.isGenerating ? '生成中...' : getStatusText(stage.status) }}
                </span>
              </div>

              <div v-if="stage.startTime" class="stage-time">
                <el-icon><Clock /></el-icon>
                {{ formatTime(stage.startTime) }}
              </div>

              <div class="stage-steps" v-if="stage.steps.length > 0">
                <el-tag size="small" type="info">
                  {{ stage.steps.length }} 个 Step
                </el-tag>
              </div>
            </div>

            <template #footer>
              <div class="stage-actions">
                <el-button
                  v-if="stage.proposalContent"
                  size="small"
                  @click="viewDocument(stage)"
                  :disabled="isGenerating"
                >
                  <el-icon><Document /></el-icon>
                  查看
                </el-button>
                <el-button
                  v-if="stage.status === 'pending'"
                  size="small"
                  type="primary"
                  @click="startStage(stage.id)"
                  :disabled="isGenerating"
                >
                  开始
                </el-button>
                <el-button
                  v-if="stage.status !== 'pending'"
                  size="small"
                  type="warning"
                  @click="restartStage(stage.id)"
                  :disabled="isGenerating"
                >
                  重新{{ stage.name }}
                </el-button>
                <el-button
                  v-if="stage.status === 'in_progress'"
                  size="small"
                  type="success"
                  @click="completeStage(stage.id)"
                  :disabled="isGenerating"
                >
                  完成
                </el-button>
                <el-button
                  v-if="stage.status === 'in_progress'"
                  size="small"
                  type="danger"
                  @click="failStage(stage.id)"
                  :disabled="isGenerating"
                >
                  失败
                </el-button>
                <el-button
                  v-if="stage.id === 'requirement' && stage.status === 'in_progress'"
                  size="small"
                  type="warning"
                  @click="startAIAnalysis"
                  :disabled="isGenerating || !hasProposalContent('init')"
                >
                  <el-icon><Connection /></el-icon>
                  AI分析
                </el-button>
                <el-button
                  v-if="stage.id === 'architecture' && stage.status === 'in_progress' && !stage.proposalContent"
                  size="small"
                  type="primary"
                  @click="startArchitectureGeneration(stage.id)"
                  :disabled="isGenerating || !hasProposalContent('requirement')"
                >
                  <el-icon><Connection /></el-icon>
                  生成架构文档
                </el-button>
                <el-button
                  v-if="stage.id === 'architecture' && stage.status === 'in_progress' && stage.proposalContent"
                  size="small"
                  type="info"
                  @click="regenerateArchitecture(stage.id)"
                  :disabled="isGenerating"
                >
                  <el-icon><Refresh /></el-icon>
                  重新生成
                </el-button>
              </div>
            </template>
          </el-card>

          <div v-if="hasConnector(index)" class="stage-connector">
            <el-icon><Right /></el-icon>
          </div>

          <div
            v-if="isFeedbackTarget(stage.id)"
            class="feedback-indicator"
          >
            <el-icon><Bottom /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="feedback-section">
      <template #header>
        <span class="card-title">
          <el-icon><Connection /></el-icon>
          反馈循环机制
        </span>
      </template>

      <div class="feedback-diagram">
        <div class="feedback-flow">
          <div
            v-for="(stage, index) in feedbackStages"
            :key="stage.id"
            class="feedback-node"
          >
            <el-tag :type="getStageTagType(stage.status)" effect="dark">
              {{ stage.name }}
            </el-tag>
            <div v-if="index < feedbackStages.length - 1" class="feedback-arrow">
              <el-icon><Right /></el-icon>
            </div>
          </div>
        </div>

        <div class="feedback-loop-info">
          <el-alert
            type="info"
            :title="feedbackInfoTitle"
            :description="feedbackInfoDesc"
            show-icon
            :closable="false"
          />
        </div>
      </div>

      <div class="feedback-control">
        <el-button
          type="warning"
          @click="simulateFeedbackLoop"
          :disabled="!canTriggerFeedback"
        >
          <el-icon class="el-icon--left"><Warning /></el-icon>
          模拟反馈循环
        </el-button>
      </div>
    </el-card>

    <!-- 文档编辑器弹窗（统一组件） -->
    <DocumentEditor
      v-model="showDocumentEditor"
      :document="editorDocument"
      :stage-name="editorStageName"
      :stage-title="editorTitle"
      :read-only="editorReadOnly"
      :is-loading="isGenerating"
      :loading-text="editorLoadingText"
      :is-saving="isGenerating"
      @update:content="handleEditorUpdate"
      @reset="handleEditorReset"
      @delete="handleEditorDelete"
      @complete="handleEditorComplete"
    />

    <!-- AI 分析结果弹窗 -->
    <GapAnalysisViewer
      v-model="showAnalysisResult"
      :analysis-result="analysisResult"
      @confirm="handleAnalysisConfirm"
      @start-analysis="doAIAnalysis"
      @cancel="handleAnalysisCancel"
    />

    <el-dialog
      v-model="showUploadDialog"
      :title="currentUploadTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="upload-instructions">
        <p>{{ currentUploadInstructions }}</p>
        <p class="upload-tip">支持格式：.md, .txt, .pdf, .docx</p>
      </div>

      <el-upload
        ref="uploadRef"
        drag
        multiple
        :auto-upload="false"
        :limit="currentUploadLimit"
        :on-exceed="handleExceed"
        :on-change="handleFileChange"
        v-model:file-list="uploadFileList"
        class="upload-component"
        :disabled="isGenerating"
      >
        <el-icon class="el-icon--left"><Upload /></el-icon>
        <span>拖拽文件到此处，或 <em>点击上传</em></span>
        <template #tip>
          <div class="el-upload__tip">{{ currentUploadTip }}</div>
        </template>
      </el-upload>

      <div v-if="uploadFileList.length > 0" class="file-list-section">
        <div class="file-list-header">已上传文件：</div>
        <el-tag
          v-for="(file, index) in uploadFileList"
          :key="index"
          closable
          @close="removeFile(index)"
          class="file-tag"
        >
          {{ file.name }}
        </el-tag>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelUpload">取消</el-button>
        <el-button
          type="primary"
          :disabled="uploadFileList.length === 0 || isGenerating"
          :loading="isGenerating"
          @click="startAIGeneration"
        >
            <el-icon v-if="!isGenerating" class="el-icon--left"><Connection /></el-icon>
            {{ isGenerating ? 'AI 分析中...' : (currentStageId === 'init' ? '确定并生成立项书' : '确定并生成需求文档') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useLifecycleStore } from '../stores/lifecycleStore'
import { useWorkflowStore } from '../stores/workflowStore'
import { generateContentByStage, testOllamaConnection } from '../services/ollamaService'
import { processFiles, getFileWarnings } from '../services/fileProcessor'
import { extractJsonFromMarkdown } from '../services/documentNormalizer'
import GapAnalysisViewer from '../components/GapAnalysisViewer.vue'
import DocumentEditor from '../components/DocumentEditor.vue'
import ModelSelector from '../components/ModelSelector.vue'
import { getDefaultTemplate } from '../config/industryTemplates'
import type { ProposalContent, GapAnalysisResult } from '../types'
import {
  Check, Loading, Close, Minus, Right, Clock, Warning,
  List, Refresh, Connection, Bottom, Upload, Document
} from '@element-plus/icons-vue'

const store = useLifecycleStore()
const workflowStore = useWorkflowStore()
const modelSelectorRef = ref<InstanceType<typeof ModelSelector> | null>(null)

onMounted(async () => {
  // 优先从快照恢复（包含完整的 lifecycle + workflow 状态）
  const snapshot = await store.loadFromSnapshot()
  if (snapshot.lifecycleState) {
    store.stages = snapshot.lifecycleState.stages
    store.currentStageId = snapshot.lifecycleState.currentStageId
    if (snapshot.workflowSteps && snapshot.workflowSteps.length > 0) {
      workflowStore.initializeFromSnapshot(snapshot.workflowSteps)
    }
    store.saveToStorage()
    return
  }
  // 如果没有快照，回退到原来的 proposals 表加载
  await store.initializeFromDatabase()
})

const FEEDBACK_TRIGGER_STAGES = ['testing', 'acceptance', 'packaging', 'deployment']

const showUploadDialog = ref(false)
const uploadFileList = ref<any[]>([])
const isGenerating = ref(false)
const abortController = ref<AbortController | null>(null)
const currentProposalStage = ref<any>(null)
const proposalContent = ref<ProposalContent | null>(null)
const originalProposalContent = ref<ProposalContent | null>(null)
const currentUploadStageId = ref<string>('init')

// 统一的文档编辑器状态
const showDocumentEditor = ref(false)
const editorDocument = ref<ProposalContent | null>(null)
const editorStageName = ref('')
const editorTitle = ref('')
const editorReadOnly = ref(false)
const editorLoadingText = ref('加载中...')
const showAnalysisResult = ref(false)
const analysisResult = ref<GapAnalysisResult | null>(null)

// 获取当前选择的模型
function getCurrentModel() {
  return modelSelectorRef.value?.selectedModel
}

const feedbackStages = computed(() => {
  return store.stages.filter(s => FEEDBACK_TRIGGER_STAGES.includes(s.id))
})

const hasFeedbackLoop = computed(() => {
  return store.stages.some(s => s.feedbackLoop)
})

const canTriggerFeedback = computed(() => {
  return FEEDBACK_TRIGGER_STAGES.some(id => {
    const stage = store.stages.find(s => s.id === id)
    return stage && stage.status === 'failed'
  })
})

const currentStageIndex = computed(() => {
  const index = store.stages.findIndex(s => s.id === store.currentStageId)
  return index === -1 ? 0 : index
})

const feedbackInfoTitle = computed(() => {
  if (hasFeedbackLoop.value) {
    return '反馈循环已激活'
  }
  return '反馈循环待触发'
})

const feedbackInfoDesc = computed(() => {
  if (hasFeedbackLoop.value) {
    return '测试/验收/打包/部署任一阶段失败，将自动回到开发阶段重新修复'
  }
  return '当测试、验收、打包或部署阶段发现问题时，将触发反馈循环回到开发阶段'
})

const currentStageId = computed(() => store.currentStageId)

const currentUploadTitle = computed(() => {
  if (currentUploadStageId.value === 'init') return '上传立项资料'
  return '上传需求补充文档'
})

const currentUploadInstructions = computed(() => {
  if (currentUploadStageId.value === 'init') return '请上传与本阶段相关的文档资料'
  return '请上传：竞品分析报告、用户调研记录、业务需求描述、原型设计稿等'
})

const currentUploadLimit = computed(() => {
  if (currentUploadStageId.value === 'init') return 20
  return 2  // 需求阶段最多2个文件
})

const currentUploadTip = computed(() => {
  if (currentUploadStageId.value === 'init') return '每个文件不超过 10MB'
  return '每个文件不超过 5MB（适配本地 Ollama 7B 模型）'
})

function getStepStatus(status: string): '' | 'success' | 'wait' | 'error' | 'process' {
  const map: Record<string, '' | 'success' | 'wait' | 'error' | 'process'> = {
    completed: 'success',
    in_progress: 'process',
    failed: 'error',
    pending: 'wait'
  }
  return map[status] || 'wait'
}

function getStageTagType(status: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
    completed: 'success',
    in_progress: 'primary',
    failed: 'danger',
    pending: 'info'
  }
  return map[status] || 'info'
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    completed: '已完成',
    in_progress: '进行中',
    failed: '失败',
    pending: '待开始'
  }
  return map[status] || '未知'
}

function getStatusIconClass(status: string): string {
  return `status-icon status-${status}`
}

function hasConnector(index: number): boolean {
  return index < store.stages.length - 1
}

function isFeedbackTarget(stageId: string): boolean {
  return stageId === 'development' && hasFeedbackLoop.value
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function startStage(stageId: string) {
  const stage = store.stages.find(s => s.id === stageId)
  if (!stage) return

  // 立项目和需求阶段：打开上传对话框
  if (stageId === 'init' || stageId === 'requirement') {
    currentProposalStage.value = stage
    currentUploadStageId.value = stageId
    showUploadDialog.value = true
    uploadFileList.value = []
    proposalContent.value = null
    // 如果状态还是 pending，先更新为 in_progress
    if (stage.status === 'pending') {
      store.updateStageStatus(stageId, 'in_progress')
    }
  } else if (stage.status === 'pending') {
    store.startStage(stageId, workflowStore)
  }
}

function confirmReset() {
  ElMessageBox.confirm(
    '重置将清空所有生命周期进度、阶段状态、Step 工作台数据，且无法恢复。确定要重置吗？',
    '危险操作确认',
    {
      confirmButtonText: '确定重置',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(() => {
    store.resetLifecycle(workflowStore)
    ElMessage.success('已重置所有数据')
  }).catch(() => {})
}

function restartStage(stageId: string) {
  const stage = store.stages.find(s => s.id === stageId)
  if (!stage) return

  if (stageId === 'init' || stageId === 'requirement') {
    currentProposalStage.value = stage
    currentUploadStageId.value = stageId
    showUploadDialog.value = true
    uploadFileList.value = []
    proposalContent.value = null
    // 重置阶段状态为进行中
    if (stage.status !== 'in_progress') {
      store.updateStageStatus(stageId, 'in_progress')
    }
  }
}

function completeStage(stageId: string) {
  store.updateStageStatus(stageId, 'completed', { steps: workflowStore.steps, updateStepStatus: workflowStore.updateStepStatus })
  store.nextStage()
  store.saveFullSnapshot(workflowStore.steps)
}

function failStage(stageId: string) {
  store.updateStageStatus(stageId, 'failed', { steps: workflowStore.steps, updateStepStatus: workflowStore.updateStepStatus })
  if (FEEDBACK_TRIGGER_STAGES.includes(stageId)) {
    store.triggerFeedbackLoop(stageId)
  }
}

function simulateFeedbackLoop() {
  const testingStage = store.stages.find(s => s.id === 'testing')
  if (testingStage && testingStage.status !== 'completed') {
    store.updateStageStatus('testing', 'failed', { steps: workflowStore.steps, updateStepStatus: workflowStore.updateStepStatus })
    store.triggerFeedbackLoop('testing')
  }
}

function handleExceed() {
  const limit = currentUploadStageId.value === 'init' ? 5 : 2
  ElMessage.warning(`最多只能上传 ${limit} 个文件`)
}

function handleFileChange(file: any, files: any[]) {
  // 检查文件大小
  const maxSize = currentUploadStageId.value === 'init' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
  if (file.raw?.size > maxSize) {
    ElMessage.warning(`单个文件不超过 ${maxSize / 1024 / 1024}MB`)
    const index = files.indexOf(file)
    if (index > -1) {
      removeFile(index)
    }
  }
}

function removeFile(index: number) {
  uploadFileList.value.splice(index, 1)
}

function cancelUpload() {
  console.log('[DEBUG cancelUpload] called, abortController:', abortController.value)
  // 如果有正在进行的请求，取消它
  if (abortController.value) {
    console.log('[DEBUG cancelUpload] aborting...')
    abortController.value.abort()
    abortController.value = null
  }
  showUploadDialog.value = false
  currentProposalStage.value = null
  uploadFileList.value = []
}

async function startAIGeneration() {
  const stageId = currentUploadStageId.value
  if (uploadFileList.value.length === 0 && stageId === 'init') {
    ElMessage.warning('请至少上传一个文件')
    return
  }

  isGenerating.value = true
  store.setStageGenerating(stageId, true)
  abortController.value = new AbortController()

  try {
    const connected = await testOllamaConnection()
    if (!connected) {
      ElMessage.error('无法连接到 Ollama 服务，请确保 Ollama 已启动')
      isGenerating.value = false
      store.setStageGenerating(stageId, false)
      abortController.value = null
      return
    }

    const files: { name: string; content: string }[] = []

    // 需求阶段：自动加载立项书内容
    if (stageId === 'requirement') {
      const initStage = store.stages.find(s => s.id === 'init')
      const proposalText = initStage?.proposalContent?.fullText
      if (proposalText) {
        files.push({ name: '立项书.md', content: proposalText })
      } else {
        ElMessage.warning('未找到立项书，请先完成立项目阶段')
        isGenerating.value = false
        store.setStageGenerating(stageId, false)
        abortController.value = null
        return
      }
    }

    // 添加用户上传的文件
    for (const file of uploadFileList.value) {
      const content = await readFileContent(file.raw)
      files.push({ name: file.name, content })
    }

    // 压缩和截断文件内容，避免超出上下文限制
    const processed = processFiles(files)
    const warnings = getFileWarnings(processed)
    for (const warning of warnings) {
      ElMessage.warning(warning)
    }

    // 根据阶段类型生成内容（会自动选择对应的 Prompt 模板）
    const currentModel = getCurrentModel()
    const aiResult = await generateContentByStage(stageId, processed.files, currentModel || 'deepseek-r1', abortController.value.signal)

    proposalContent.value = parseAIResponse(aiResult.rawText, stageId, aiResult.structured)
    originalProposalContent.value = JSON.parse(JSON.stringify(proposalContent.value))

    // 保存到 Pinia store
    store.saveProposalContent(stageId, proposalContent.value)

    // 创建 step 并添加到 workflowStore
    const stage = store.stages.find(s => s.id === stageId)
    if (stage) {
      const stepId = `step-${stageId}`
      const todos = stageId === 'init'
        ? [
            { id: 'init-1', type: 'backend' as const, content: '市场可行性分析', status: 'pending' as const, depends_on: [] },
            { id: 'init-2', type: 'backend' as const, content: '竞品调研', status: 'pending' as const, depends_on: [] },
            { id: 'init-3', type: 'backend' as const, content: '收益评估', status: 'pending' as const, depends_on: [] }
          ]
        : [
            { id: 'requirement-1', type: 'backend' as const, content: 'PRD 生成', status: 'pending' as const, depends_on: [] },
            { id: 'requirement-2', type: 'frontend' as const, content: '需求整理与格式化', status: 'pending' as const, depends_on: ['requirement-1'] },
            { id: 'requirement-3', type: 'frontend' as const, content: '业务方确认', status: 'pending' as const, depends_on: ['requirement-2'] }
          ]

      const newStep = {
        id: stepId,
        name: '立项阶段',
        stage: stage.label,
        lifecycleStageId: stage.id,
        status: 'in_progress' as const,
        todos,
        humanGate: {
          hg1: { type: 'HG1' as const, pmo: 'pending' as const, security: 'pending' as const },
          hg2: { type: 'HG2' as const, pmo: 'pending' as const, security: 'pending' as const }
        },
        createdAt: new Date().toISOString()
      }

      workflowStore.addStep(newStep)
      stage.steps.push(stepId)
    }

    showUploadDialog.value = false
    // 打开统一的文档编辑器
    editorDocument.value = proposalContent.value
    editorStageName.value = stageId
    editorTitle.value = `${currentProposalStage.value?.name || '立项'} - ${stageId === 'init' ? '立项书编辑器' : '需求文档编辑器'}`
    editorReadOnly.value = false
    editorLoadingText.value = 'AI 分析中，请稍候...'
    showDocumentEditor.value = true
    ElMessage.success(stageId === 'init' ? '立项书已生成' : '需求文档已生成')

    // 保存完整快照（包含 lifecycle + workflow 状态）
    await store.saveFullSnapshot(workflowStore.steps)

  } catch (error) {
    console.log('[DEBUG cancelUpload] caught error:', error, 'name:', (error as Error)?.name)
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('AI generation cancelled')
      ElMessage.info('已取消生成')
    } else {
      console.error('AI generation error:', error)
      ElMessage.error('AI 分析失败，请检查 Ollama 服务和文件内容')
    }
  } finally {
    console.log('[DEBUG] finally: setting isGenerating=false, stageId=', stageId)
    isGenerating.value = false
    store.setStageGenerating(stageId, false)
    abortController.value = null
  }
}

async function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

/**
 * 解析 AI 响应为统一的 ProposalContent 格式
 * 使用 documentNormalizer 服务确保数据结构一致性
 * @param response 原始文本响应
 * @param stageId 阶段 ID
 * @param structuredData 可选的结构化数据（API 返回的 structured 字段）
 */
function parseAIResponse(response: string, stageId: string = 'init', structuredData?: Record<string, unknown>): ProposalContent {
  // 根据阶段 ID 确定 Prompt 类型
  const stageToPromptType: Record<string, string> = {
    'init': 'proposal',
    'requirement': 'requirement',
    'architecture': 'architecture',
    'initialization': 'prd',
    'development': 'prd',
    'testing': 'test_plan',
    'acceptance': 'acceptance',
    'packaging': 'deployment',
    'deployment': 'deployment',
    'operation': 'deployment',
    'iteration': 'requirement'
  }

  const promptType = (stageToPromptType[stageId] || 'proposal') as any

  // 优先使用传入的结构化数据，其次从响应中提取 JSON
  let jsonData: Record<string, any> | null = structuredData || null
  if (!jsonData) {
    jsonData = extractJsonFromMarkdown(response) as Record<string, any> | null
  }

  if (jsonData && Object.keys(jsonData).length > 0) {
    // 构建 ProposalContent，只使用结构化字段（不用 fullText，避免混乱）
    const result: ProposalContent = {}

    // 根据不同类型提取相应字段
    switch (promptType) {
      case 'proposal':
        if (jsonData.basicInfo) {
          if (typeof jsonData.basicInfo === 'object') {
            result.name = jsonData.basicInfo.name || ''
            result.type = jsonData.basicInfo.type || ''
            // decisionMakers 可能是 [{role, name}] 对象数组，需要提取 name
            if (Array.isArray(jsonData.basicInfo.decisionMakers)) {
              result.decisionMakers = jsonData.basicInfo.decisionMakers.map((d: any) =>
                d.name || d.role || String(d)
              )
            } else {
              result.decisionMakers = jsonData.basicInfo.decisionMakers || []
            }
          } else {
            result.name = jsonData.basicInfo
          }
        }
        result.background = jsonData.background || ''
        result.currentIssues = Array.isArray(jsonData.currentIssues) ? jsonData.currentIssues : []
        result.goals = Array.isArray(jsonData.goals) ? jsonData.goals : []
        result.scope = normalizeScope(jsonData.scope)
        result.acceptance = normalizeAcceptance(jsonData.acceptance)
        result.milestones = normalizeMilestones(jsonData.milestones)
        result.risks = normalizeRisks(jsonData.risks)
        result.humanGate = normalizeHumanGate(jsonData.humanGate)
        break

      case 'requirement':
        result.basicInfo = jsonData.overview || ''
        result.scope = normalizeScope({ inScope: jsonData.priority })
        result.acceptance = Array.isArray(jsonData.acceptanceCriteria)
          ? jsonData.acceptanceCriteria.join('\n')
          : (jsonData.acceptanceCriteria || '')
        break

      default:
        // 其他类型：尝试提取 basicInfo 作为名称
        if (jsonData.basicInfo?.name) result.name = jsonData.basicInfo.name
        if (jsonData.overview) result.basicInfo = jsonData.overview
        if (jsonData.background) result.background = jsonData.background
        if (jsonData.goals) result.goals = Array.isArray(jsonData.goals) ? jsonData.goals : [jsonData.goals]
    }

    return result
  }

  // 如果没有 JSON，回退到 Markdown 解析（也只用结构化字段，不用 fullText）
  return parseMarkdownResponse(response, stageId)
}

/**
 * 从 Markdown 中解析内容（向后兼容的备选方案）
 */
function parseMarkdownResponse(response: string, stageId: string): ProposalContent {
  // 尝试从 Markdown 中提取结构化数据
  const nameMatch = response.match(/#\s+(.+)/)
  const background = extractSection(response, '2. 项目背景与目标') || ''
  const scopeInScope = extractListItems(response, 'In Scope')
  const scopeOutScope = extractListItems(response, 'Out of Scope')
  const acceptance = extractSection(response, '4. 验收标准') || ''
  const milestonesStr = extractSection(response, '5. 里程碑计划') || ''
  const risks = extractSection(response, '6. 风险评估') || ''
  const humanGate = extractSection(response, '7. Human Gate') || ''

  // 解析里程碑（按行分割）
  const milestones = milestonesStr
    .split('\n')
    .map(line => line.replace(/^\d+[\.\、]\s*/, '').trim())
    .filter(line => line.length > 0)

  return {
    name: nameMatch ? nameMatch[1].trim() : '',
    background,
    scope: {
      inScope: scopeInScope,
      outScope: scopeOutScope
    },
    acceptance,
    milestones,
    risks: risks ? [{ description: risks, type: '中' }] : [],
    humanGate
  }
}

/**
 * 规范化范围数据
 * 兼容多种格式：
 * - string[]
 * - { P0: string[], P1: string[] }
 * - { P0: [{item, description, ...}], P1: [...] } (AI 返回的复杂对象格式)
 * - { inScope: {...}, outScope: [...] }
 */
function normalizeScope(scope: any): ProposalContent['scope'] {
  if (!scope) return undefined

  if (typeof scope === 'string') {
    return { inScope: scope.split('\n').filter(Boolean), outScope: [] }
  }

  // 获取 inScope 数据（兼容不同嵌套结构）
  const inScopeData = scope.inScope !== undefined ? scope.inScope : scope

  // 处理数组格式
  if (Array.isArray(inScopeData)) {
    return { inScope: inScopeData, outScope: scope.outScope || [] }
  }

  // 处理对象格式 { P0: [...], P1: [...] } 或 { P0: [{item, ...}], P1: [...] }
  if (typeof inScopeData === 'object') {
    const result: { P0: string[]; P1: string[]; P2?: string[] } = { P0: [], P1: [] }

    for (const [key, value] of Object.entries(inScopeData)) {
      if (Array.isArray(value)) {
        const items: string[] = []
        for (const v of value) {
          if (typeof v === 'string') {
            items.push(v)
          } else if (typeof v === 'object' && v !== null) {
            // 提取 item/itemName/name/description 字段
            const extracted = v.item || v.itemName || v.name || v.description || ''
            if (extracted) {
              items.push(extracted)
            } else {
              items.push(JSON.stringify(v))
            }
          } else {
            items.push(String(v))
          }
        }
        result[key as keyof typeof result] = items
      }
    }

    return { inScope: result, outScope: scope.outScope || [] }
  }

  return { inScope: { P0: [], P1: [] }, outScope: scope.outScope || [] }
}

/**
 * 规范化验收标准数据
 */
function normalizeAcceptance(acceptance: any): ProposalContent['acceptance'] {
  if (!acceptance) return undefined
  if (typeof acceptance === 'string') return acceptance
  return acceptance as ProposalContent['acceptance']
}

/**
 * 规范化风险数据
 * 兼容多种字段名：
 * - AI 返回: { level, description, impact, probability, mitigation }
 * - 前端期望: { type, description, impact, countermeasure }
 */
function normalizeRisks(risks: any): ProposalContent['risks'] {
  if (!risks) return undefined
  if (Array.isArray(risks)) {
    return risks.map((r: any) => {
      if (typeof r === 'string') {
        return { description: r, type: '中' }
      }
      // AI 返回格式：{level, description, impact, probability, mitigation}
      // 前端期望格式：{type, description, impact, countermeasure}
      return {
        type: r.level || r.severity || r.type || '中',
        description: r.description || r.name || '',
        impact: r.impact || r.affected || '',
        countermeasure: r.mitigation || r.countermeasure || r.solution || ''
      }
    })
  }
  if (typeof risks === 'string') return risks
  return undefined
}

/**
 * 规范化里程碑数据
 */
function normalizeMilestones(milestones: any): string[] | undefined {
  if (!milestones) return undefined
  if (Array.isArray(milestones)) {
    return milestones.map(m => typeof m === 'string' ? m : JSON.stringify(m))
  }
  if (typeof milestones === 'string') {
    return milestones.split('\n').map(m => m.replace(/^\d+[\.\、]\s*/, '').trim()).filter(Boolean)
  }
  return undefined
}

/**
 * 规范化 Human Gate 数据
 */
function normalizeHumanGate(hg: any): ProposalContent['humanGate'] {
  if (!hg) return undefined
  if (typeof hg === 'string') return hg
  if (typeof hg === 'object') {
    return {
      pmo: hg.pmo || [],
      security: hg.security || []
    }
  }
  return undefined
}

function extractSection(content: string, sectionTitle: string): string {
  const lines = content.split('\n')
  const result: string[] = []
  let inSection = false

  for (const line of lines) {
    if (line.includes(sectionTitle)) {
      inSection = true
      result.push(line)
    } else if (inSection) {
      if (line.match(/^##\s+\d+\./) || line.match(/^#+\s+[一二三四五六七]/)) {
        break
      }
      result.push(line)
    }
  }

  return result.join('\n').trim()
}

function extractListItems(content: string, listName: string): string[] {
  const items: string[] = []
  const lines = content.split('\n')
  let inList = false

  for (const line of lines) {
    if (line.includes(listName)) {
      inList = true
      continue
    }
    if (inList) {
      if (line.match(/^##\s+\d+\./) || line.match(/^#+\s+[一二三四五六七]/)) {
        break
      }
      const match = line.match(/^[-*]\s*(.+)/) || line.match(/^\d+\.\s*(.+)/)
      if (match) {
        items.push(match[1])
      }
    }
  }

  return items
}

function handleEditorUpdate(content: ProposalContent) {
  proposalContent.value = content
  const stageId = currentProposalStage.value?.id || currentUploadStageId.value
  store.saveProposalContent(stageId, content)
}

function handleEditorReset() {
  if (originalProposalContent.value) {
    proposalContent.value = JSON.parse(JSON.stringify(originalProposalContent.value))
    const stageId = currentProposalStage.value?.id || currentUploadStageId.value
    store.saveProposalContent(stageId, proposalContent.value)
    editorDocument.value = proposalContent.value
    ElMessage.info('已重置为 AI 生成的内容')
  }
}

function handleEditorDelete() {
  ElMessageBox.confirm('确定要删除此文档吗？删除后需要重新生成。', '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const stageId = currentProposalStage.value?.id || currentUploadStageId.value
    proposalContent.value = null
    originalProposalContent.value = null
    editorDocument.value = null
    store.deleteProposalContent(stageId)
    showDocumentEditor.value = false
    ElMessage.success('文档已删除')
  }).catch(() => {})
}

function handleEditorComplete() {
  const stageId = currentProposalStage.value?.id || currentUploadStageId.value
  ElMessageBox.confirm('确定完成此文档吗？', '确认完成', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success'
  }).then(async () => {
    showDocumentEditor.value = false
    const success = await store.completeProposalContent(stageId, proposalContent.value)
    if (!success) {
      ElMessage.error('保存到数据库失败，请检查网络连接')
      return
    }
    store.updateStageStatus(stageId, 'completed', { steps: workflowStore.steps, updateStepStatus: workflowStore.updateStepStatus })
    // 保存完整快照（包含 lifecycle + workflow 状态）
    await store.saveFullSnapshot(workflowStore.steps)
    ElMessage.success('文档已完成')

    // 立项书完成后，自动启动下一阶段（需求阶段），这样 AI分析 按钮才会出现
    if (stageId === 'init') {
      store.autoAdvanceToNextStage(workflowStore)
      await store.saveFullSnapshot(workflowStore.steps)
    }
  }).catch(() => {})
}

function viewDocument(stage: any) {
  if (stage.proposalContent) {
    editorDocument.value = stage.proposalContent
    editorStageName.value = stage.id
    editorTitle.value = ''
    editorReadOnly.value = true
    editorLoadingText.value = '加载文档...'
    showDocumentEditor.value = true
  }
}

function hasProposalContent(stageId: string): boolean {
  const stage = store.stages.find(s => s.id === stageId)
  // 检查 fullText 或其他主要字段是否有内容
  return !!(stage?.proposalContent && (
    stage.proposalContent.fullText ||
    stage.proposalContent.background ||
    stage.proposalContent.name
  ))
}

let architectureAbortController: AbortController | null = null

interface ArchitectureDrivers {
  projectName: string
  functionalScope: { P0: string[]; P1: string[]; P2: string[] }
  performance: Record<string, string>
  security: string[]
  risks: Array<{ type: string; description: string; mitigation?: string }>
  milestones: string[]
}

function extractArchitectureDrivers(requirementContent: any): ArchitectureDrivers {
  const rc = requirementContent || {}

  const functionalScope = { P0: [] as string[], P1: [] as string[], P2: [] as string[] }

  if (rc.scope?.inScope) {
    if (Array.isArray(rc.scope.inScope)) {
      functionalScope.P0 = rc.scope.inScope
    } else if (typeof rc.scope.inScope === 'object') {
      if (rc.scope.inScope.P0) functionalScope.P0 = rc.scope.inScope.P0
      if (rc.scope.inScope.P1) functionalScope.P1 = rc.scope.inScope.P1
      if (rc.scope.inScope.P2) functionalScope.P2 = rc.scope.inScope.P2
    }
  }

  let performance: Record<string, string> = {}
  if (rc.acceptance?.performance) {
    if (typeof rc.acceptance.performance === 'object') {
      performance = rc.acceptance.performance
    } else if (typeof rc.acceptance.performance === 'string') {
      performance = { '性能要求': rc.acceptance.performance }
    }
  }

  let security: string[] = []
  if (rc.acceptance?.security) {
    if (Array.isArray(rc.acceptance.security)) {
      security = rc.acceptance.security
    } else if (typeof rc.acceptance.security === 'string') {
      security = [rc.acceptance.security]
    }
  }

  let risks: Array<{ type: string; description: string; mitigation?: string }> = []
  if (Array.isArray(rc.risks)) {
    risks = rc.risks.map((r: any) => ({
      type: r.type || '中',
      description: r.description || '',
      mitigation: r.mitigation || r.countermeasure || ''
    }))
  }

  return {
    projectName: rc.name || rc.overview || '未命名项目',
    functionalScope,
    performance,
    security,
    risks,
    milestones: Array.isArray(rc.milestones) ? rc.milestones : []
  }
}

function formatArchitectureContext(drivers: ArchitectureDrivers): string {
  const lines: string[] = []

  lines.push('# 架构驱动因素（从需求文档提取）\n')

  lines.push('## 1. 项目信息')
  lines.push(`- 项目名称：${drivers.projectName}`)
  lines.push('')

  lines.push('## 2. 功能范围（P0/P1/P2）')
  if (drivers.functionalScope.P0.length > 0) {
    lines.push('### P0（核心价值）')
    drivers.functionalScope.P0.forEach(item => lines.push(`- ${item}`))
    lines.push('')
  }
  if (drivers.functionalScope.P1.length > 0) {
    lines.push('### P1（重要）')
    drivers.functionalScope.P1.forEach(item => lines.push(`- ${item}`))
    lines.push('')
  }
  if (drivers.functionalScope.P2.length > 0) {
    lines.push('### P2（可裁剪）')
    drivers.functionalScope.P2.forEach(item => lines.push(`- ${item}`))
    lines.push('')
  }

  lines.push('## 3. 非功能需求')
  lines.push('### 3.1 性能要求')
  if (Object.keys(drivers.performance).length > 0) {
    for (const [key, value] of Object.entries(drivers.performance)) {
      lines.push(`- ${key}：${value}`)
    }
  } else {
    lines.push('- 【待补充】')
  }
  lines.push('')

  lines.push('### 3.2 安全要求')
  if (drivers.security.length > 0) {
    drivers.security.forEach(item => lines.push(`- ${item}`))
  } else {
    lines.push('- 【待补充】')
  }
  lines.push('')

  lines.push('## 4. 风险约束')
  if (drivers.risks.length > 0) {
    drivers.risks.forEach(risk => {
      lines.push(`- 【${risk.type}】${risk.description}`)
      if (risk.mitigation) {
        lines.push(`  - 应对：${risk.mitigation}`)
      }
    })
  } else {
    lines.push('- 【暂无】')
  }
  lines.push('')

  lines.push('## 5. 里程碑')
  if (drivers.milestones.length > 0) {
    drivers.milestones.forEach(m => lines.push(`- ${m}`))
  } else {
    lines.push('- 【待补充】')
  }
  lines.push('')

  return lines.join('\n')
}

async function startArchitectureGeneration(stageId: string) {
  const requirementStage = store.stages.find(s => s.id === 'requirement')
  if (!requirementStage?.proposalContent) {
    ElMessage.warning('未找到需求文档，请先完成需求阶段')
    return
  }

  const connected = await testOllamaConnection()
  if (!connected) {
    ElMessage.error('无法连接到 Ollama 服务，请确保 Ollama 已启动')
    return
  }

  isGenerating.value = true
  store.setStageGenerating(stageId, true)
  architectureAbortController = new AbortController()

  try {
    const requirementContent = requirementStage.proposalContent
    const fullText = requirementContent.fullText || ''

    const drivers = extractArchitectureDrivers(requirementContent)
    const driversContext = formatArchitectureContext(drivers)

    const initStage = store.stages.find(s => s.id === 'init')
    const initContent = initStage?.proposalContent

    let projectOverview = ''
    if (initContent) {
      if (initContent.background) {
        projectOverview = initContent.background.replace(/^##?.*?\n/, '').trim()
      } else if (initContent.basicInfo) {
        projectOverview = typeof initContent.basicInfo === 'string'
          ? initContent.basicInfo
          : initContent.basicInfo.name || ''
      }
    }

    const architecturePrompt = `
# 项目背景
${projectOverview || '（从立项书提取）'}

${driversContext}

---

请基于上述架构驱动因素，设计满足以下要求的系统架构：
1. 性能要求必须有具体的实现策略（如：缓存、CDN、异步处理等）
2. 安全要求必须有具体的安全措施（如：认证、授权、审计日志等）
3. 每个架构决策必须有对应的需求依据
4. 必须包含 ADR（架构决策记录）记录关键选型理由`

    const files = [
      { name: '需求文档.md', content: fullText || JSON.stringify(requirementContent, null, 2) },
      { name: '架构驱动因素.md', content: architecturePrompt }
    ]

    const processed = processFiles(files)
    const currentModel = getCurrentModel()
    const aiResult = await generateContentByStage('architecture', processed.files, currentModel || 'deepseek-r1', architectureAbortController.signal)

    const architectureDoc = parseAIResponse(aiResult.rawText, 'architecture')
    store.saveProposalContent(stageId, architectureDoc)

    editorDocument.value = architectureDoc
    editorStageName.value = stageId
    editorTitle.value = '架构文档编辑器'
    editorReadOnly.value = false
    showDocumentEditor.value = true

    ElMessage.success('架构文档已生成')
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Architecture generation cancelled')
      return
    }
    console.error('Architecture generation error:', error)
    ElMessage.error('架构文档生成失败，请检查 Ollama 服务')
  } finally {
    isGenerating.value = false
    store.setStageGenerating(stageId, false)
    architectureAbortController = null
  }
}

async function regenerateArchitecture(stageId: string) {
  ElMessageBox.confirm('重新生成将覆盖当前的架构文档，确定继续吗？', '确认重新生成', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await startArchitectureGeneration(stageId)
  }).catch(() => {})
}

function cancelArchitectureGeneration() {
  if (architectureAbortController) {
    architectureAbortController.abort()
    architectureAbortController = null
  }
  isGenerating.value = false
}

// 取消分析的 AbortController
let analysisAbortController: AbortController | null = null

function startAIAnalysis() {
  const initStage = store.stages.find(s => s.id === 'init')
  const proposalText = initStage?.proposalContent?.fullText ||
    initStage?.proposalContent?.background ||
    initStage?.proposalContent?.name
  if (!proposalText) {
    ElMessage.warning('未找到立项书内容')
    return
  }

  // 打开弹窗并直接开始分析
  analysisResult.value = null
  showAnalysisResult.value = true
  // 延迟一点让弹窗先渲染，然后开始分析
  setTimeout(() => {
    doAIAnalysis()
  }, 100)
}

async function doAIAnalysis() {
  const initStage = store.stages.find(s => s.id === 'init')
  const proposalText = initStage?.proposalContent?.fullText ||
    initStage?.proposalContent?.background ||
    initStage?.proposalContent?.name
  if (!proposalText) {
    ElMessage.warning('未找到立项书内容')
    return
  }

  // 创建 AbortController 用于取消请求
  analysisAbortController = new AbortController()

  try {
    const connected = await testOllamaConnection()
    if (!connected) {
      ElMessage.error('无法连接到 Ollama 服务，请确保 Ollama 已启动')
      return
    }

    const template = getDefaultTemplate()
    const industryContext = `
【行业标准】软件开发行业需求检查清单：

功能需求检查项：
${template.functionalChecklist.map(item => `- ${item}`).join('\n')}

非功能需求：
- 性能：${template.nonFunctionalRequirements.performance.join('；')}
- 安全：${template.nonFunctionalRequirements.security.join('；')}
- 可靠性：${template.nonFunctionalRequirements.reliability.join('；')}
- 可用性：${template.nonFunctionalRequirements.usability.join('；')}

常见风险：
${template.commonRisks.map(item => `- ${item}`).join('\n')}
`

    const files = [
      { name: '立项书.md', content: proposalText },
      { name: '行业标准.md', content: industryContext }
    ]

    const processed = processFiles(files)
    const currentModel = getCurrentModel()
    const aiResult = await generateContentByStage('requirement_analysis', processed.files, currentModel || 'deepseek-r1', analysisAbortController.signal)

    // 尝试解析 AI 返回的 JSON 数据
    const parsed = parseAIAnalysisResponse(aiResult.rawText)

    analysisResult.value = {
      fullText: aiResult.rawText,
      hasCovered: parsed.hasCovered || [],
      missingSuggestions: parsed.missingSuggestions || [],
      bestPractices: parsed.bestPractices || [],
      summary: parsed.summary || ''
    }
  } catch (error) {
    // 如果是取消请求，不显示错误
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('AI analysis cancelled')
      return
    }
    console.error('AI analysis error:', error)
    ElMessage.error('AI 分析失败，请检查 Ollama 服务')
  } finally {
    analysisAbortController = null
  }
}

function handleAnalysisCancel() {
  // 取消正在进行的请求
  if (analysisAbortController) {
    analysisAbortController.abort()
    analysisAbortController = null
  }
  analysisResult.value = null
  showAnalysisResult.value = false
  ElMessage.info('已取消 AI 分析')
}

function parseAIAnalysisResponse(response: string): Partial<GapAnalysisResult> {
  const result: Partial<GapAnalysisResult> = {}

  // 尝试提取 JSON 块
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/i)

  if (jsonMatch) {
    try {
      const json = JSON.parse(jsonMatch[1])

      // 处理 basicInfo 结构（有些模型把数据放在 basicInfo 里）
      const data = json.basicInfo || json.analysis || json

      if (data.hasCovered && Array.isArray(data.hasCovered)) {
        result.hasCovered = data.hasCovered
      }
      if (data.missingSuggestions && Array.isArray(data.missingSuggestions)) {
        result.missingSuggestions = data.missingSuggestions.map((m: any) => ({
          category: m.category || '通用',
          item: m.item || m.suggestion || '',
          reason: m.reason || m.description || ''
        }))
      }
      if (data.bestPractices && Array.isArray(data.bestPractices)) {
        result.bestPractices = data.bestPractices
      }
      if (data.summary) {
        result.summary = data.summary
      }

      // 如果有完整的 Markdown 内容，用它覆盖 fullText
      // 查找 JSON 块之后的内容（通常是 Markdown）
      const markdownPart = response.slice(jsonMatch[0].length).trim()
      if (markdownPart && markdownPart.startsWith('#')) {
        result.fullText = markdownPart
      }

      return result
    } catch (e) {
      // JSON 解析失败，尝试其他方式
    }
  }

  // 如果没有 JSON，尝试从 Markdown 中提取结构化数据
  const lines = response.split('\n')
  let currentSection = ''

  for (const line of lines) {
    const trimmed = line.trim()

    // 检测章节
    if (trimmed.startsWith('## 一、') || trimmed.startsWith('## 已覆盖') || trimmed.includes('已覆盖')) {
      currentSection = 'hasCovered'
      if (!result.hasCovered) result.hasCovered = []
      continue
    }
    if (trimmed.startsWith('## 二、') || trimmed.startsWith('## 缺失') || trimmed.includes('缺失')) {
      currentSection = 'missing'
      if (!result.missingSuggestions) result.missingSuggestions = []
      continue
    }
    if (trimmed.startsWith('## 三、') || trimmed.startsWith('## 最佳实践') || trimmed.includes('最佳实践')) {
      currentSection = 'bestPractices'
      if (!result.bestPractices) result.bestPractices = []
      continue
    }
    if (trimmed.startsWith('## 总结') || trimmed.startsWith('> ')) {
      currentSection = 'summary'
      if (!result.summary) result.summary = ''
      if (trimmed.startsWith('> ')) {
        result.summary += trimmed.replace(/^>\s*/, '')
      }
      continue
    }

    // 提取列表项
    if (currentSection === 'hasCovered' && (trimmed.startsWith('- ') || /^\d+\./.test(trimmed))) {
      const item = trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '')
      if (item) result.hasCovered!.push(item)
    }
    if (currentSection === 'bestPractices' && (trimmed.startsWith('- ') || /^\d+\./.test(trimmed))) {
      const item = trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '')
      if (item) result.bestPractices!.push(item)
    }
    if (currentSection === 'summary' && trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
      result.summary += ' ' + trimmed
    }
  }

  result.summary = result.summary?.trim() || ''

  return result
}

function handleAnalysisConfirm(result: GapAnalysisResult) {
  const requirementDoc: ProposalContent = {
    name: '需求文档 (PRD)',
    fullText: result.fullText || '',
    background: `需求分析报告\n\n${result.summary || ''}`,
    scope: {
      inScope: result.hasCovered || [],
      outScope: []
    },
    acceptance: result.missingSuggestions.map(m => `[AI建议] ${m.category}: ${m.item}`).join('\n')
  }

  store.saveProposalContent('requirement', requirementDoc)

  const stage = store.stages.find(s => s.id === 'requirement')
  if (stage) {
    const stepId = 'step-requirement'
    const newStep = {
      id: stepId,
      name: '需求阶段',
      stage: stage.label,
      lifecycleStageId: stage.id,
      status: 'in_progress' as const,
      todos: [
        { id: 'requirement-1', type: 'backend' as const, content: 'PRD 生成', status: 'pending' as const, depends_on: [] },
        { id: 'requirement-2', type: 'frontend' as const, content: '需求整理与格式化', status: 'pending' as const, depends_on: ['requirement-1'] },
        { id: 'requirement-3', type: 'frontend' as const, content: '业务方确认', status: 'pending' as const, depends_on: ['requirement-2'] }
      ],
      humanGate: {
        hg1: { type: 'HG1' as const, pmo: 'pending' as const, security: 'pending' as const },
        hg2: { type: 'HG2' as const, pmo: 'pending' as const, security: 'pending' as const }
      },
      createdAt: new Date().toISOString()
    }

    if (!workflowStore.steps.find(s => s.id === stepId)) {
      workflowStore.addStep(newStep)
      stage.steps.push(stepId)
    }
  }

  ElMessage.success('已保存为需求文档，请进行 Human Gate 审批')
}
</script>

<style scoped>
.lifecycle-dashboard {
  padding: 0;
}

.lifecycle-header-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.lifecycle-progress {
  padding: 20px 0;
}

.feedback-alert {
  margin-top: 16px;
}

.stages-row {
  margin-bottom: 20px;
}

.stage-card-wrapper {
  position: relative;
  height: 100%;
  margin-bottom: 16px;
}

.stage-card-wrapper.current-stage::before {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  border: 2px solid #409eff;
  border-radius: 16px;
  z-index: 1;
  pointer-events: none;
}

.stage-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  height: 100%;
}

.stage-card:hover {
  transform: translateY(-4px);
}

.stage-pending {
  border-left: 4px solid #909399;
}

.stage-in_progress {
  border-left: 4px solid #409eff;
  background: linear-gradient(90deg, #ecf5ff 0%, white 100%);
}

.stage-completed {
  border-left: 4px solid #67c23a;
  background: linear-gradient(90deg, #f0f9eb 0%, white 100%);
}

.stage-failed {
  border-left: 4px solid #f56c6c;
  background: linear-gradient(90deg, #fef0f0 0%, white 100%);
}

.feedback-active {
  box-shadow: 0 0 12px rgba(230, 162, 60, 0.5);
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stage-body {
  padding: 16px 0;
  text-align: center;
}

.stage-label {
  font-size: 0.75rem;
  color: #909399;
  margin-bottom: 12px;
}

.stage-status-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.status-icon {
  transition: all 0.3s ease;
}

.status-pending {
  color: #909399;
}

.status-in_progress {
  color: #409eff;
}

.status-completed {
  color: #67c23a;
}

.status-failed {
  color: #f56c6c;
}

.status-generating {
  color: #409eff;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  font-size: 0.875rem;
  color: #606266;
}

.stage-time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #909399;
  margin-bottom: 8px;
}

.stage-steps {
  margin-top: 8px;
}

.stage-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
}

.stage-connector {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
  color: #409eff;
}

.feedback-indicator {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  color: #e6a23c;
}

.feedback-section {
  border-radius: 12px;
}

.feedback-diagram {
  margin-bottom: 20px;
}

.feedback-flow {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 20px 0;
}

.feedback-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feedback-arrow {
  color: #409eff;
}

.feedback-loop-info {
  max-width: 600px;
  margin: 0 auto;
}

.feedback-control {
  margin-top: 16px;
  text-align: center;
}

.proposal-section {
  margin-top: 20px;
  border-radius: 12px;
}

.ai-generating {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  color: #909399;
  font-size: 1rem;
}

.ai-generating .el-icon {
  font-size: 24px;
  color: #409eff;
}

.upload-instructions {
  margin-bottom: 20px;
  color: #606266;
}

.upload-instructions p {
  margin: 0 0 8px 0;
}

.upload-tip {
  font-size: 0.875rem;
  color: #909399;
}

.upload-component {
  margin-bottom: 20px;
}

.file-list-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.file-list-header {
  font-size: 0.875rem;
  color: #606266;
  margin-bottom: 12px;
}

.file-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>