<template>
  <div class="workflow-dashboard">
    <el-card class="progress-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Operation /></el-icon>
            整体流程进度
          </span>
        </div>
      </template>
      <div class="phase-container">
        <el-steps :active="currentPhaseIndex" align-center finish-status="success">
          <el-step
            v-for="phase in phases"
            :key="phase.id"
            :title="phase.label"
            :description="phase.desc"
          />
        </el-steps>
      </div>
      <div class="progress-section">
        <span class="progress-label">工作台总体进度</span>
        <el-progress
          :percentage="Math.round(workflowProgress)"
          :stroke-width="20"
          :color="progressColor"
        >
          <span class="progress-text">{{ completedSteps }} / {{ totalSteps }} 步骤已完成</span>
        </el-progress>
      </div>
    </el-card>

    <el-row :gutter="20" class="content-row">
      <el-col :xs="24" :lg="8">
        <StepList @select="selectStep" />
      </el-col>

      <el-col :xs="24" :lg="16">
        <StepDetail
          v-if="currentStepId"
          :step-id="currentStepId"
          @back="currentStepId = null"
        />
        <el-empty
          v-else
          description="请从左侧选择一个步骤开始"
          class="empty-state"
        >
          <el-button type="primary" @click="store.loadFromDocument">
            <el-icon class="el-icon--left"><Document /></el-icon>
            从文档加载
          </el-button>
        </el-empty>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkflowStore } from '../stores/workflowStore'
import StepList from './StepList.vue'
import StepDetail from './StepDetail.vue'
import { Operation, Document } from '@element-plus/icons-vue'

const store = useWorkflowStore()
const currentStepId = ref<string | null>(null)

function selectStep(stepId: string) {
  currentStepId.value = stepId
}

const phases = [
  { id: 'development', label: '开发', desc: 'Coding' },
  { id: 'testing', label: '测试', desc: 'Testing' },
  { id: 'acceptance', label: '验收', desc: 'Acceptance' },
  { id: 'packaging', label: '打包', desc: 'Packaging' },
  { id: 'deployment', label: '部署', desc: 'Deployment' }
]

const workflowProgress = computed(() => {
  const steps = store.steps
  if (steps.length === 0) return 0
  const completedSteps = steps.filter(s => s.status === 'completed').length
  return (completedSteps / steps.length) * 100
})

const completedSteps = computed(() => store.steps.filter(s => s.status === 'completed').length)
const totalSteps = computed(() => store.steps.length)

const currentPhaseIndex = computed(() => {
  const progress = workflowProgress.value
  if (progress >= 100) return phases.length
  return Math.floor(progress / (100 / phases.length))
})

const progressColor = computed(() => {
  const progress = workflowProgress.value
  if (progress >= 80) return '#67c23a'
  if (progress >= 50) return '#409eff'
  if (progress >= 20) return '#e6a23c'
  return '#909399'
})
</script>

<style scoped>
.progress-card {
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
  font-size: 1rem;
  font-weight: 600;
  color: #303133;
}

.phase-container {
  padding: 20px 0;
}

.progress-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.progress-label {
  display: block;
  margin-bottom: 12px;
  font-size: 0.875rem;
  color: #606266;
  font-weight: 500;
}

.progress-text {
  font-weight: 600;
  color: #409eff;
}

.content-row {
  min-height: 400px;
}

.empty-state {
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
</style>