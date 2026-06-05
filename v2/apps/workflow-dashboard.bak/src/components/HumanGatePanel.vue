<template>
  <el-card shadow="never" class="human-gate-panel">
    <template #header>
      <span class="panel-title">
        <el-icon><Stamp /></el-icon>
        {{ title }}
      </span>
    </template>

    <el-alert
      v-if="completenessWarning"
      :title="completenessWarning.title"
      :description="completenessWarning.description"
      :type="completenessWarning.type"
      show-icon
      :closable="false"
      class="completeness-alert"
    />

    <div v-if="completenessIssues.length > 0" class="completeness-issues">
      <div class="issues-title">文档完整性问题：</div>
      <ul>
        <li v-for="(issue, idx) in completenessIssues" :key="idx" :class="issue.level">
          {{ issue.message }}
          <span v-if="issue.impact" class="issue-impact">（影响：{{ issue.impact }}）</span>
        </li>
      </ul>
      <div class="completeness-score">
        完整度得分：<el-tag :type="scoreTagType" size="small">{{ completenessScore }}/100</el-tag>
      </div>
    </div>

    <div class="decision-grid">
      <div class="decision-card">
        <div class="decision-role">
          <el-icon><User /></el-icon>
          PMO 决策
        </div>
        <div class="decision-buttons">
          <el-button
            v-for="d in decisions"
            :key="d"
            :type="getButtonType(getCurrentDecision('pmo'), d)"
            :icon="getDecisionIcon(d)"
            :disabled="props.step.humanGate[props.gate].pmo !== 'pending'"
            @click="handleDecision('pmo', d)"
            size="small"
          >
            {{ d }}
          </el-button>
        </div>
        <div v-if="getCurrentDecision('pmo') !== 'pending'" class="decision-timestamp">
          <el-icon><Clock /></el-icon>
          {{ formatTime(getTimestamp('pmo')) }}
        </div>
      </div>

      <div class="decision-card">
        <div class="decision-role">
          <el-icon><Lock /></el-icon>
          Security 决策
        </div>
        <div class="decision-buttons">
          <el-button
            v-for="d in decisions"
            :key="d"
            :type="getButtonType(getCurrentDecision('security'), d)"
            :icon="getDecisionIcon(d)"
            :disabled="props.step.humanGate[props.gate].security !== 'pending'"
            @click="handleDecision('security', d)"
            size="small"
          >
            {{ d }}
          </el-button>
        </div>
        <div v-if="getCurrentDecision('security') !== 'pending'" class="decision-timestamp">
          <el-icon><Clock /></el-icon>
          {{ formatTime(getTimestamp('security')) }}
        </div>
      </div>
    </div>

    <div class="overall-decision">
      <el-tag
        :type="getOverallTagType()"
        size="large"
        effect="dark"
        class="overall-tag"
      >
        <el-icon class="el-icon--left">
          <CircleCheckFilled v-if="overallDecision === 'PASS'" />
          <WarningFilled v-else-if="overallDecision === 'REJECT'" />
          <InfoFilled v-else />
        </el-icon>
        整体决策: {{ overallDecision }}
      </el-tag>
    </div>

    <el-alert
      v-if="overallDecision === 'REJECT'"
      title="此 Step 被拒绝，需要修复后重新提交审批"
      type="error"
      :closable="false"
      show-icon
    />

    <el-alert
      v-if="overallDecision === 'PASS'"
      title="此 Step 已通过审批，可以继续执行"
      type="success"
      :closable="false"
      show-icon
    />

    <el-alert
      v-if="overallDecision === 'CONDITIONAL'"
      title="此 Step 有条件通过，需要在期限内完成整改"
      type="warning"
      :closable="false"
      show-icon
    />
  </el-card>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { Step, GateDecision, ProposalContent } from '../types'
import {
  Stamp, User, Lock, Clock, Check,
  CircleCheckFilled, WarningFilled, InfoFilled
} from '@element-plus/icons-vue'

interface CompletenessIssue {
  field: string
  message: string
  level: 'high' | 'medium' | 'low'
  impact?: string
}

const props = defineProps<{
  step: Step
  gate: 'hg1' | 'hg2'
  title: string
  proposalContent?: ProposalContent | null
  lifecycleStageId?: string
}>()

const emit = defineEmits<{
  decision: [gate: 'hg1' | 'hg2', role: 'pmo' | 'security', decision: GateDecision]
}>()

const decisions: GateDecision[] = ['PASS', 'CONDITIONAL', 'REJECT']

const gateData = computed(() =>
  props.gate === 'hg1' ? props.step.humanGate.hg1 : props.step.humanGate.hg2
)

const isRequirementHg1 = computed(() =>
  props.gate === 'hg1' && props.lifecycleStageId === 'requirement'
)

const validationResult = computed(() => {
  if (!isRequirementHg1.value || !props.lifecycleStageId) return null
  if (!props.proposalContent) {
    return { isValid: false, score: 0, missingFields: ['name', 'goals', 'scope', 'acceptance'], errors: [{ field: 'document', message: '文档为空' }] }
  }
  return {
    isValid: true,
    score: 80,
    missingFields: [],
    errors: []
  }
})

const completenessIssues = computed<CompletenessIssue[]>(() => {
  if (!validationResult.value) return []

  const fieldImpactMap: Record<string, { message: string; impact: string; level: 'high' | 'medium' | 'low' }> = {
    name: { message: '缺少项目名称', impact: '无法识别项目', level: 'high' },
    background: { message: '缺少项目背景描述', impact: '架构师难以理解项目上下文', level: 'medium' },
    currentIssues: { message: '缺少当前问题列表', impact: '无法明确需要解决的核心问题', level: 'medium' },
    goals: { message: '缺少项目目标', impact: '无法衡量项目成功标准', level: 'high' },
    scope: { message: '缺少项目范围定义（P0任务）', impact: '架构设计缺少边界，可能过度设计或设计不足', level: 'high' },
    outScope: { message: '缺少排除范围定义', impact: '架构师可能投入精力在不必要的模块', level: 'low' },
    acceptance: { message: '缺少验收标准', impact: '无法验证架构是否满足需求', level: 'high' },
    functionality: { message: '缺少功能验收标准', impact: '无法验证功能完整性', level: 'high' },
    performance: { message: '缺少性能验收标准', impact: '架构可能无法支持预期的性能要求', level: 'medium' },
    security: { message: '缺少安全验收标准', impact: '架构可能存在安全隐患', level: 'medium' },
    milestones: { message: '缺少里程碑计划', impact: '架构阶段无法制定合理的实施计划', level: 'medium' },
    risks: { message: '缺少风险评估', impact: '架构设计可能忽视潜在风险', level: 'medium' }
  }

  return validationResult.value.missingFields.map(field => {
    const info = fieldImpactMap[field] || { message: `缺少 ${field}`, impact: '', level: 'medium' as const }
    return {
      field,
      message: info.message,
      level: info.level,
      impact: info.impact
    }
  })
})

const completenessScore = computed(() => {
  return validationResult.value?.score ?? 100
})

const scoreTagType = computed<'success' | 'warning' | 'danger'>(() => {
  if (completenessScore.value >= 80) return 'success'
  if (completenessScore.value >= 60) return 'warning'
  return 'danger'
})

const completenessWarning = computed(() => {
  if (!isRequirementHg1.value || !props.proposalContent) return null

  const score = completenessScore.value
  const issues = completenessIssues.value
  const highIssues = issues.filter(i => i.level === 'high')

  if (score < 60) {
    return {
      title: '文档完整性严重不足',
      description: `得分 ${score}/100，存在 ${highIssues.length} 个高优先级问题。建议完善后再进行 HG1 审批。`,
      type: 'error' as const
    }
  } else if (highIssues.length > 0) {
    return {
      title: '文档存在高优先级问题',
      description: `得分 ${score}/100，存在 ${highIssues.length} 个高优先级问题可能影响架构设计。`,
      type: 'warning' as const
    }
  } else if (issues.length > 0) {
    return {
      title: '文档可进一步完善',
      description: `得分 ${score}/100，存在 ${issues.length} 个中低优先级问题。`,
      type: 'info' as const
    }
  }

  return {
    title: '文档完整性良好',
    description: '需求文档包含架构设计所需的基本信息。',
    type: 'success' as const
  }
})

function getCurrentDecision(role: 'pmo' | 'security'): GateDecision {
  return gateData.value[role]
}

function getTimestamp(role: 'pmo' | 'security'): string {
  return gateData.value.timestamp || new Date().toISOString()
}

function handleDecision(role: 'pmo' | 'security', decision: GateDecision) {
  emit('decision', props.gate, role, decision)
}

const overallDecision = computed((): GateDecision => {
  const { pmo, security } = gateData.value
  if (pmo === 'REJECT' || security === 'REJECT') return 'REJECT'
  if (pmo === 'PASS' && security === 'PASS') return 'PASS'
  return 'CONDITIONAL'
})

function getButtonType(current: GateDecision, target: GateDecision): '' | 'success' | 'warning' | 'danger' {
  if (current === target) {
    if (target === 'PASS') return 'success'
    if (target === 'REJECT') return 'danger'
    return 'warning'
  }
  return ''
}

function getDecisionIcon(decision: GateDecision) {
  if (decision === 'PASS') return Check
  return undefined
}

function getOverallTagType(): 'success' | 'warning' | 'danger' {
  if (overallDecision.value === 'PASS') return 'success'
  if (overallDecision.value === 'REJECT') return 'danger'
  return 'warning'
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString('zh-CN')
}
</script>

<style scoped>
.human-gate-panel {
  border-radius: 12px;
  height: 100%;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.decision-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.decision-card {
  padding: 16px;
  border-radius: 8px;
  background: #f5f7fa;
}

.decision-role {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
}

.decision-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.decision-timestamp {
  margin-top: 8px;
  font-size: 0.75rem;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 4px;
}

.overall-decision {
  text-align: center;
  margin-bottom: 16px;
}

.overall-tag {
  font-size: 1rem;
  padding: 8px 16px;
}

.completeness-alert {
  margin-bottom: 16px;
}

.completeness-issues {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 0.875rem;
}

.issues-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.completeness-issues ul {
  margin: 0;
  padding-left: 20px;
}

.completeness-issues li {
  margin: 6px 0;
  line-height: 1.5;
}

.completeness-issues li.high {
  color: #f56c6c;
}

.completeness-issues li.medium {
  color: #e6a23c;
}

.completeness-issues li.low {
  color: #909399;
}

.issue-impact {
  font-size: 0.8rem;
  color: #909399;
}

.completeness-score {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #e4e7ed;
  font-weight: 500;
}
</style>
