<template>
  <div class="agent-log">
    <el-empty
      v-if="logs.length === 0"
      description="暂无日志"
      :image-size="60"
    />

    <el-timeline v-else class="log-timeline">
      <el-timeline-item
        v-for="log in reversedLogs"
        :key="log.id"
        :timestamp="formatTime(log.timestamp)"
        :type="getTimelineType(log.status)"
        hollow
      >
        <el-card shadow="never" class="log-card">
          <div class="log-header">
            <el-tag :type="getAgentTagType(log.agent)" size="small">
              {{ log.agent.toUpperCase() }}
            </el-tag>
            <span v-if="log.todoId" class="log-todo-id">
              <el-icon><Link /></el-icon>
              {{ log.todoId }}
            </span>
          </div>
          <div class="log-action">{{ log.action }}</div>
          <el-tag
            v-if="log.status"
            :type="getStatusTagType(log.status)"
            size="small"
            class="log-status-tag"
          >
            {{ getStatusLabel(log.status) }}
          </el-tag>
        </el-card>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AgentLog } from '../types'
import { Link } from '@element-plus/icons-vue'

const props = defineProps<{
  logs: AgentLog[]
}>()

const reversedLogs = computed(() => [...props.logs].reverse())

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function getAgentTagType(agent: AgentLog['agent']): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<AgentLog['agent'], 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    planner: 'primary',
    frontend: 'success',
    backend: 'success',
    test: 'warning',
    reviewer: 'info'
  }
  return map[agent]
}

function getStatusTagType(status: AgentLog['status']): 'success' | 'primary' | 'danger' {
  if (status === 'completed') return 'success'
  if (status === 'started') return 'primary'
  return 'danger'
}

function getStatusLabel(status: AgentLog['status']): string {
  if (status === 'completed') return '完成'
  if (status === 'started') return '开始'
  return '失败'
}

function getTimelineType(status: AgentLog['status']): 'primary' | 'success' | 'danger' {
  if (status === 'completed') return 'success'
  if (status === 'started') return 'primary'
  return 'danger'
}
</script>

<style scoped>
.agent-log {
  height: 100%;
}

.log-timeline {
  padding: 8px 0;
}

.log-card {
  border-radius: 8px;
  margin-bottom: 4px;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.log-todo-id {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #909399;
  font-family: monospace;
}

.log-action {
  color: #606266;
  font-size: 0.875rem;
  line-height: 1.5;
}

.log-status-tag {
  margin-top: 8px;
}
</style>
