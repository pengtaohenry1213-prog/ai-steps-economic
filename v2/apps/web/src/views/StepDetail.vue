<template>
  <el-card shadow="hover" class="step-detail-card">
    <template #header>
      <div class="card-header">
        <el-button text @click="$emit('back')">
          <el-icon class="el-icon--left"><ArrowLeft /></el-icon>
          返回列表
        </el-button>
        <span class="card-title" v-if="currentStep">
          {{ currentStep.id }}: {{ currentStep.name }}
        </span>
      </div>
    </template>

    <el-empty
      v-if="!currentStep"
      description="请选择一个 Step"
    />

    <div v-else class="detail-content">
      <el-row :gutter="20" class="detail-row">
        <el-col :span="24">
          <div class="step-header-info">
            <el-tag size="large" :type="getStageTagType(currentStep.stage)">
              {{ currentStep.stage }}
            </el-tag>
            <el-tag
              v-if="currentStep.lifecycleStageId"
              size="large"
              type="warning"
              effect="plain"
            >
              {{ getLifecycleStageName(currentStep.lifecycleStageId) }}
            </el-tag>
            <el-tag :type="getStatusType(currentStep.status)" effect="dark" size="large">
              <el-icon class="el-icon--left">
                <Check v-if="currentStep.status === 'completed'" />
                <Loading v-else-if="currentStep.status === 'in_progress'" />
                <Close v-else-if="currentStep.status === 'failed'" />
                <Minus v-else />
              </el-icon>
              {{ getStatusLabel(currentStep.status) }}
            </el-tag>

            <div class="action-buttons">
              <el-button
                v-if="currentStep.status !== 'in_progress'"
                type="primary"
                @click="updateStatus('in_progress')"
              >
                <el-icon class="el-icon--left"><VideoPlay /></el-icon>
                开始执行
              </el-button>
              <el-button
                v-if="currentStep.status === 'in_progress'"
                type="success"
                @click="updateStatus('completed')"
              >
                <el-icon class="el-icon--left"><Check /></el-icon>
                完成 Step
              </el-button>
              <el-button
                v-if="currentStep.status === 'in_progress'"
                type="danger"
                @click="updateStatus('failed')"
              >
                <el-icon class="el-icon--left"><Close /></el-icon>
                标记失败
              </el-button>
              <el-button
                v-if="currentStep.status === 'failed'"
                type="warning"
                @click="handleRetry"
              >
                <el-icon class="el-icon--left"><RefreshRight /></el-icon>
                重试
              </el-button>
              <el-button @click="handleReset">
                <el-icon class="el-icon--left"><RefreshLeft /></el-icon>
                重置
              </el-button>
              <el-button type="danger" @click="handleDelete">
                <el-icon class="el-icon--left"><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="detail-row">
        <el-col :span="24">
          <SpecReferences :specs="currentSpecs" />
        </el-col>
      </el-row>

      <el-row :gutter="20" class="detail-row">
        <el-col :xs="24" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <span class="inner-card-title">
                <el-icon><Operation /></el-icon>
                Todo 图谱
              </span>
            </template>
            <TodoGraph :todos="currentStep.todos" />
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="12">
          <el-card shadow="never" class="inner-card">
            <template #header>
              <span class="inner-card-title">
                <el-icon><Document /></el-icon>
                Agent 日志
              </span>
            </template>
            <AgentLog :logs="agentLogs" />
          </el-card>
        </el-col>
      </el-row>

      <el-row v-if="humanGateRequired" :gutter="20" class="detail-row">
        <el-col :xs="24" :lg="12">
          <HumanGatePanel
            :step="currentStep"
            gate="hg1"
            title="Human Gate 1（执行前审查）"
            :proposal-content="currentProposalContent"
            :lifecycle-stage-id="currentStep.lifecycleStageId"
            @decision="handleDecision"
          />
        </el-col>

        <el-col :xs="24" :lg="12">
          <HumanGatePanel
            :step="currentStep"
            gate="hg2"
            title="Human Gate 2（执行后复审）"
            :proposal-content="currentProposalContent"
            :lifecycle-stage-id="currentStep.lifecycleStageId"
            @decision="handleDecision"
          />
        </el-col>
      </el-row>

      <el-row v-else :gutter="20" class="detail-row">
        <el-col :span="24">
          <el-alert
            title="此阶段不需要 Human Gate 审批"
            type="info"
            :closable="false"
            show-icon
          />
        </el-col>
      </el-row>

      <el-card shadow="never" class="todo-card">
        <template #header>
          <div class="inner-card-header">
            <span class="inner-card-title">
              <el-icon><List /></el-icon>
              Todo 管理
            </span>
            <el-button size="small" @click="addTodo">
              <el-icon class="el-icon--left"><Plus /></el-icon>
              添加 Todo
            </el-button>
          </div>
        </template>

        <el-table :data="currentStep.todos" stripe style="width: 100%">
          <el-table-column width="50">
            <template #default="{ row }">
              <el-checkbox
                :model-value="row.status === 'completed'"
                @change="toggleTodo(row.id)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="id" label="ID" width="150" />
          <el-table-column prop="content" label="内容" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="getTypeTagType(row.type)">
                {{ row.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag
                size="small"
                :type="row.status === 'completed' ? 'success' : 'info'"
              >
                {{ row.status === 'completed' ? '已完成' : '待完成' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <el-empty
          v-if="currentStep.todos.length === 0"
          description="暂无 todos"
          :image-size="60"
        />
      </el-card>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useWorkflowStore } from '../stores/workflowStore'
import { useLifecycleStore } from '../stores/lifecycleStore'
import TodoGraph from '../components/TodoGraph.vue'
import AgentLog from '../components/AgentLog.vue'
import HumanGatePanel from '../components/HumanGatePanel.vue'
import SpecReferences from '../components/SpecReferences.vue'
import { LIFECYCLE_STEP_TEMPLATES, STAGE_SPECS } from '../types'
import type { Todo, GateDecision } from '../types'
import {
  ArrowLeft, Check, Loading, Close, Minus,
  VideoPlay, Operation, Document, List, Plus,
  Delete, RefreshRight, RefreshLeft
} from '@element-plus/icons-vue'

const props = defineProps<{
  stepId: string | null
}>()

const emit = defineEmits<{
  back: []
}>()

const store = useWorkflowStore()
const lifecycleStore = useLifecycleStore()

const currentStep = computed(() =>
  store.steps.find(s => s.id === props.stepId)
)

const currentTemplate = computed(() => {
  if (!currentStep.value?.lifecycleStageId) return null
  return LIFECYCLE_STEP_TEMPLATES[currentStep.value.lifecycleStageId]
})

const humanGateRequired = computed(() => {
  return currentTemplate.value?.humanGateRequired ?? false
})

const currentProposalContent = computed(() => {
  if (!currentStep.value?.lifecycleStageId) return null
  const stage = lifecycleStore.stages.find(s => s.id === currentStep.value?.lifecycleStageId)
  return stage?.proposalContent ?? null
})

const currentSpecs = computed(() => {
  if (!currentStep.value?.lifecycleStageId) return []
  return STAGE_SPECS[currentStep.value.lifecycleStageId] || []
})

const agentLogs = computed(() =>
  store.agentLogs.filter(log =>
    currentStep.value?.todos.some(t => t.id === log.todoId) ||
    log.action.includes(props.stepId || '')
  )
)

function updateStatus(status: 'pending' | 'in_progress' | 'completed' | 'failed') {
  if (!props.stepId || !currentStep.value) return

  // 如果要完成 Step，检查 HumanGate 是否通过
  if (status === 'completed' && humanGateRequired.value) {
    const hg1 = currentStep.value.humanGate.hg1
    if (hg1.pmo !== 'PASS' || hg1.security !== 'PASS') {
      ElMessage.warning('Human Gate 1 审批未通过，无法完成 Step')
      return
    }
  }

  store.updateStepStatus(props.stepId, status)

  // 完成时，如果 humanGateRequired 为 true，同步更新 lifecycle stage 状态
  if (status === 'completed' && currentStep.value.lifecycleStageId) {
    lifecycleStore.updateStageStatus(
      currentStep.value.lifecycleStageId,
      'completed',
      { steps: store.steps, updateStepStatus: store.updateStepStatus }
    )
  }
}

function toggleTodo(todoId: string) {
  if (!props.stepId) return
  const todo = currentStep.value?.todos.find(t => t.id === todoId)
  if (!todo) return

  const newStatus = todo.status === 'completed' ? 'pending' : 'completed'
  store.updateTodoStatus(props.stepId, todoId, newStatus)
}

function addTodo() {
  if (!props.stepId || !currentStep.value) return

  const newTodo: Todo = {
    id: `todo-${Date.now()}`,
    type: 'frontend',
    content: '新 Todo',
    status: 'pending',
    depends_on: []
  }

  store.updateStep({
    ...currentStep.value,
    todos: [...currentStep.value.todos, newTodo]
  })
}

function handleDecision(gate: 'hg1' | 'hg2', role: 'pmo' | 'security', decision: GateDecision) {
  if (!props.stepId) return
  store.setHumanGateDecision(props.stepId, gate, role, decision)

  // HumanGate 通过后写入 Supabase
  const step = store.steps.find(s => s.id === props.stepId)
  if (step?.lifecycleStageId && decision === 'PASS') {
    const gateKey = gate
    const gateData = step.humanGate[gateKey]
    if (gateData.pmo === 'PASS' && gateData.security === 'PASS') {
      const proposalContent = lifecycleStore.stages.find(s => s.id === step.lifecycleStageId)?.proposalContent
      if (proposalContent) {
        lifecycleStore.completeProposalContent(step.lifecycleStageId, proposalContent)
        ElMessage.success('HumanGate 通过，已保存到数据库')
      }
    }
  }
}

function handleRetry() {
  if (!props.stepId) return
  store.retryStep(props.stepId)
  ElMessage.success('Step 已重新开始')
}

function handleReset() {
  if (!props.stepId) return
  ElMessageBox.confirm(
    '确定要重置这个 Step 吗？所有进度将被清除。',
    '重置确认',
    {
      confirmButtonText: '重置',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    store.resetStep(props.stepId!)
    ElMessage.success('Step 已重置')
  }).catch(() => {})
}

function handleDelete() {
  if (!props.stepId) return
  const step = store.steps.find(s => s.id === props.stepId)
  if (!step) return

  const stageId = step.lifecycleStageId

  if (stageId === 'init') {
    ElMessage.warning('立项目阶段的 Proposal 是后续所有阶段的数据基础，无法删除')
    return
  }

  const stageOrder = ['init', 'requirement', 'architecture', 'development', 'testing', 'acceptance']
  const currentStageIndex = stageOrder.indexOf(stageId || '')

  if (currentStageIndex > 0) {
    const prevStageId = stageOrder[currentStageIndex - 1]
    const prevStage = lifecycleStore.stages.find(s => s.id === prevStageId)
    if (prevStage && prevStage.steps.length > 0 && prevStage.status === 'completed') {
      ElMessage.warning(`${prevStage.name}阶段已完成并被后续阶段引用，无法删除`)
      return
    }
    if (prevStage && prevStage.steps.length > 0 && prevStage.status === 'in_progress') {
      ElMessage.warning(`${prevStage.name}阶段正在进行中，无法删除后续阶段`)
      return
    }
  }

  if (currentStageIndex < stageOrder.length - 1) {
    const nextStageId = stageOrder[currentStageIndex + 1]
    if (nextStageId) {
      const nextStage = lifecycleStore.stages.find(s => s.id === nextStageId)
      if (nextStage && nextStage.status === 'completed') {
        ElMessage.warning(`${nextStage.name}阶段已完成，不能删除前置阶段`)
        return
      }
      if (nextStage && nextStage.status === 'in_progress' && nextStage.steps.length > 0) {
        ElMessage.warning(`${nextStage.name}阶段正在进行中，无法删除`)
        return
      }
    }
  }

  ElMessageBox.confirm(
    '确定要删除这个 Step 吗？此操作不可撤销。',
    '删除确认',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    }
  ).then(async () => {
    if (stageId && props.stepId) {
      lifecycleStore.removeStepFromStage(stageId, props.stepId)
      await lifecycleStore.deleteProposalContent(stageId)
    }
    if (props.stepId) {
      store.deleteStep(props.stepId)
    }
    ElMessage.success('Step 已删除')
    emit('back')
  }).catch(() => {})
}

function getStageTagType(stage: string): '' | 'success' | 'warning' | 'info' | 'danger' | 'primary' {
  if (stage.includes('1')) return 'primary'
  if (stage.includes('2')) return 'warning'
  if (stage.includes('3')) return 'success'
  return 'info'
}

function getLifecycleStageName(lifecycleStageId: string): string {
  const stageNames: Record<string, string> = {
    init: '立项',
    requirement: '需求',
    architecture: '架构',
    initialization: '初始化',
    development: '开发',
    testing: '测试',
    acceptance: '验收',
    packaging: '打包',
    deployment: '部署',
    operation: '运维',
    iteration: '迭代'
  }
  return stageNames[lifecycleStageId] || lifecycleStageId
}

function getStatusType(status: string): 'success' | 'primary' | 'danger' | 'info' {
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

function getTypeTagType(type: Todo['type']): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<Todo['type'], 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    frontend: 'primary',
    backend: 'success',
    test: 'warning',
    fix: 'danger'
  }
  return map[type]
}
</script>

<style scoped>
.step-detail-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #303133;
}

.detail-content {
  padding: 0 4px;
}

.detail-row {
  margin-bottom: 20px;
}

.step-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.action-buttons {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.inner-card {
  height: 100%;
}

.inner-card :deep(.el-card__header) {
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px 8px 0 0;
}

.inner-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.inner-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.todo-card {
  margin-top: 20px;
}
</style>
