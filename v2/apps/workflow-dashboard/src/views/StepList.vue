<template>
  <el-card shadow="hover" class="step-list-card">
    <template #header>
      <div class="card-header">
        <span class="card-title">
          <el-icon><List /></el-icon>
          步骤列表
        </span>
        <!-- <div class="header-actions">
          <el-button type="primary" size="small" @click="showAddDialog = true">
            <el-icon class="el-icon--left"><Plus /></el-icon>
            新建
          </el-button>
          <el-button type="danger" size="small" @click="confirmClearAll" :disabled="store.steps.length === 0">
            <el-icon class="el-icon--left"><Delete /></el-icon>
            清空全部
          </el-button>
        </div> -->
      </div>
    </template>

    <div class="filter-section">
      <el-radio-group v-model="activeFilter" size="small">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="pending">待开始</el-radio-button>
        <el-radio-button value="in_progress">进行中</el-radio-button>
        <el-radio-button value="completed">已完成</el-radio-button>
        <el-radio-button value="failed">失败</el-radio-button>
      </el-radio-group>
    </div>

    <el-scrollbar height="400px" class="step-scrollbar">
      <div class="step-items">
        <el-card
          v-for="step in filteredSteps"
          :key="step.id"
          :class="['step-item', getStepClass(step)]"
          shadow="hover"
          @click="$emit('select', step.id)"
        >
          <div class="step-content">
            <div class="step-info">
              <div class="step-header">
                <el-tag size="small" :type="getStageTagType(step.stage)">
                  {{ step.stage }}
                </el-tag>
                <span class="step-name">{{ step.id }}</span>
              </div>
              <div class="step-desc">{{ step.name }}</div>
              <div class="step-meta">
                <span>
                  <el-icon class="meta-icon"><Clock /></el-icon>
                  {{ formatDate(step.createdAt) }}
                </span>
                <span>
                  <el-icon class="meta-icon"><DocumentChecked /></el-icon>
                  {{ step.todos.filter(t => t.status === 'completed').length }}/{{ step.todos.length }} Todo
                </span>
              </div>
            </div>
            <div class="step-status">
              <el-tag :type="getStatusType(step.status)" effect="dark">
                <el-icon class="el-icon--left">
                  <Check v-if="step.status === 'completed'" />
                  <Loading v-else-if="step.status === 'in_progress'" />
                  <Close v-else-if="step.status === 'failed'" />
                  <Minus v-else />
                </el-icon>
                {{ getStatusLabel(step.status) }}
              </el-tag>
            </div>
          </div>

          <div class="gate-info">
            <div class="gate-item">
              <span class="gate-label">HG1</span>
              <el-tag size="small" :type="getDecisionType(step.humanGate.hg1.pmo)">
                {{ step.humanGate.hg1.pmo }}
              </el-tag>
            </div>
            <div class="gate-item">
              <span class="gate-label">HG2</span>
              <el-tag size="small" :type="getDecisionType(step.humanGate.hg2.pmo)">
                {{ step.humanGate.hg2.pmo }}
              </el-tag>
            </div>
          </div>

          <div class="step-actions" @click.stop>
            <el-button
              v-if="step.status === 'failed'"
              size="small"
              type="warning"
              @click="handleRetry(step.id)"
            >
              <el-icon><RefreshRight /></el-icon>
              重试
            </el-button>
            <el-button
              v-if="step.status !== 'pending'"
              size="small"
              @click="handleReset(step.id)"
            >
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="confirmDelete(step.id)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </el-card>
      </div>

      <el-empty
        v-if="filteredSteps.length === 0"
        :description="activeFilter === 'all' ? '暂无步骤' : `没有 ${getStatusLabel(activeFilter)} 的步骤`"
        :image-size="80"
      />
    </el-scrollbar>
  </el-card>

  <el-dialog
    v-model="showAddDialog"
    title="新建 Step"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form :model="newStep" label-width="80px">
      <el-form-item label="Step ID">
        <el-input v-model="newStep.id" placeholder="e.g. step-test" />
      </el-form-item>
      <el-form-item label="名称">
        <el-input v-model="newStep.name" placeholder="e.g. 欢迎页面功能" />
      </el-form-item>
      <el-form-item label="Stage">
        <el-select v-model="newStep.stage" placeholder="选择 Stage" style="width: 100%">
          <el-option label="Stage 1 - 开发" value="Stage1" />
          <el-option label="Stage 2 - 测试" value="Stage2" />
          <el-option label="Stage 3 - 验收" value="Stage3" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showAddDialog = false">取消</el-button>
      <el-button type="primary" @click="addStep">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWorkflowStore } from '../stores/workflowStore'
import { useLifecycleStore } from '../stores/lifecycleStore'
import type { Step } from '../types'
import {
  List, Plus, Clock, DocumentChecked,
  Check, Loading, Close, Minus, Delete, RefreshRight, RefreshLeft
} from '@element-plus/icons-vue'

defineEmits<{
  select: [stepId: string]
}>()

const store = useWorkflowStore()
const lifecycleStore = useLifecycleStore()

const filters = [
  { label: '全部', value: 'all' },
  { label: '待开始', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' }
]

const activeFilter = ref<string>('all')
const showAddDialog = ref(false)
const newStep = ref({ id: '', name: '', stage: 'Stage1' })

const filteredSteps = computed(() => {
  if (activeFilter.value === 'all') return store.steps
  return store.steps.filter(s => s.status === activeFilter.value)
})

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('zh-CN')
}

function getStepClass(step: Step): string {
  if (step.status === 'completed') return 'step-completed'
  if (step.status === 'in_progress') return 'step-in-progress'
  if (step.status === 'failed') return 'step-failed'
  return ''
}

function getStageTagType(stage: string): '' | 'success' | 'warning' | 'info' | 'danger' | 'primary' {
  if (stage.includes('1')) return 'primary'
  if (stage.includes('2')) return 'warning'
  if (stage.includes('3')) return 'success'
  return 'info'
}

function getStatusType(status: Step['status']): 'success' | 'primary' | 'danger' | 'info' {
  if (status === 'completed') return 'success'
  if (status === 'in_progress') return 'primary'
  if (status === 'failed') return 'danger'
  return 'info'
}

function getStatusLabel(status: string): string {
  if (status === 'completed') return '完成'
  if (status === 'in_progress') return '进行中'
  if (status === 'failed') return '失败'
  return '待开始'
}

function getDecisionType(decision: string): 'success' | 'danger' | 'warning' | 'info' {
  if (decision === 'PASS') return 'success'
  if (decision === 'REJECT') return 'danger'
  if (decision === 'CONDITIONAL') return 'warning'
  return 'info'
}

function addStep() {
  if (!newStep.value.id || !newStep.value.name) return

  store.addStep({
    id: newStep.value.id,
    name: newStep.value.name,
    stage: newStep.value.stage || 'Stage1',
    status: 'pending',
    todos: [],
    humanGate: {
      hg1: { type: 'HG1', pmo: 'pending', security: 'pending' },
      hg2: { type: 'HG2', pmo: 'pending', security: 'pending' }
    },
    createdAt: new Date().toISOString()
  })

  showAddDialog.value = false
  newStep.value = { id: '', name: '', stage: 'Stage1' }
}

function confirmDelete(stepId: string) {
  ElMessageBox.confirm(
    '确定要删除这个 Step 吗？此操作不可撤销。',
    '删除确认',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(() => {
    // 先找到 step 对应的 lifecycle stage
    const step = store.steps.find(s => s.id === stepId)
    if (step?.lifecycleStageId) {
      lifecycleStore.removeStepFromStage(step.lifecycleStageId, stepId)
    }
    store.deleteStep(stepId)
    ElMessage.success('Step 已删除')
  }).catch(() => {})
}

function handleReset(stepId: string) {
  ElMessageBox.confirm(
    '确定要重置这个 Step 吗？所有进度将被清除。',
    '重置确认',
    {
      confirmButtonText: '重置',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    store.resetStep(stepId)
    ElMessage.success('Step 已重置')
  }).catch(() => {})
}

function handleRetry(stepId: string) {
  store.retryStep(stepId)
  ElMessage.success('Step 已重新开始')
}

function confirmClearAll() {
  ElMessageBox.confirm(
    '确定要清空所有 Step 吗？此操作不可撤销。',
    '清空确认',
    {
      confirmButtonText: '清空全部',
      cancelButtonText: '取消',
      type: 'error',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(() => {
    store.clearAllSteps()
    ElMessage.success('已清空全部 Step')
  }).catch(() => {})
}
</script>

<style scoped>
.step-list-card {
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

.filter-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.step-scrollbar {
  margin-top: 8px;
}

.step-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-item {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.step-item:hover {
  transform: translateX(4px);
}

.step-completed {
  border-left: 4px solid #67c23a;
  background: linear-gradient(90deg, #f0f9eb 0%, white 100%);
}

.step-in-progress {
  border-left: 4px solid #409eff;
  background: linear-gradient(90deg, #ecf5ff 0%, white 100%);
}

.step-failed {
  border-left: 4px solid #f56c6c;
  background: linear-gradient(90deg, #fef0f0 0%, white 100%);
}

.step-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.step-info {
  flex: 1;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.step-name {
  font-weight: 600;
  color: #303133;
}

.step-desc {
  color: #606266;
  font-size: 0.875rem;
  margin-bottom: 8px;
}

.step-meta {
  display: flex;
  gap: 16px;
  color: #909399;
  font-size: 0.75rem;
}

.meta-icon {
  margin-right: 4px;
}

.step-status {
  flex-shrink: 0;
}

.gate-info {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #ebeef5;
}

.step-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #ebeef5;
  justify-content: flex-end;
}
</style>
