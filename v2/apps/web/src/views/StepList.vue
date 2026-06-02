<template>
  <el-card shadow="hover" class="step-list-card">
    <template #header>
      <div class="card-header">
        <span class="card-title">
          <el-icon><List /></el-icon>
          步骤列表
        </span>
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWorkflowStore } from '../stores/workflowStore'
import { useLifecycleStore } from '../stores/lifecycleStore'
import type { Step } from '../types'
import {
  List, Clock, DocumentChecked,
  Check, Loading, Close, Minus, Delete, RefreshRight, RefreshLeft
} from '@element-plus/icons-vue'

defineEmits<{
  select: [stepId: string]
}>()

const store = useWorkflowStore()
const lifecycleStore = useLifecycleStore()

const activeFilter = ref<string>('all')

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