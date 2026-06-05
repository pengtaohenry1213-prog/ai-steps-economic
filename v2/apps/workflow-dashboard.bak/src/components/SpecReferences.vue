<template>
  <el-card shadow="never" class="spec-references-panel">
    <template #header>
      <span class="panel-title">
        <el-icon><Document /></el-icon>
        关联规范文档
      </span>
      <el-tag size="small" type="info">{{ specs.length }} 个</el-tag>
    </template>

    <div v-if="specs.length === 0" class="empty-state">
      <el-icon size="32"><Document /></el-icon>
      <span>暂无关联规范</span>
    </div>

    <div v-else class="spec-list">
      <div
        v-for="spec in specs"
        :key="spec.path"
        class="spec-item"
        @click="openSpec(spec)"
      >
        <div class="spec-icon">
          <el-icon>
            <component :is="getCategoryIcon(spec.category)" />
          </el-icon>
        </div>
        <div class="spec-info">
          <div class="spec-title">{{ spec.title }}</div>
          <div v-if="spec.description" class="spec-description">{{ spec.description }}</div>
          <div class="spec-path">{{ spec.path }}</div>
        </div>
        <div class="spec-action">
          <el-tag :type="getCategoryTagType(spec.category)" size="small">
            {{ getCategoryLabel(spec.category) }}
          </el-tag>
          <el-icon class="open-icon"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <div v-if="specs.length > 0" class="spec-footer">
      <el-button type="primary" link @click="openAllSpecs">
        <el-icon><FolderOpened /></el-icon>
        在文件管理器中打开规范目录
      </el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import {
  Document,
  FolderOpened,
  ArrowRight,
  Notebook,
  Lock,
  Setting,
  Tools,
  Link,
  Bell,
  Folder
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { StageSpec } from '../types'

defineProps<{
  specs: StageSpec[]
}>()

function getCategoryIcon(category: StageSpec['category']) {
  const iconMap = {
    frontend: Notebook,
    backend: Setting,
    database: Folder,
    security: Lock,
    testing: Tools,
    git: Link,
    prompt: Document,
    process: Bell,
    cursor: Notebook
  }
  return iconMap[category] || Document
}

function getCategoryTagType(category: StageSpec['category']): '' | 'success' | 'warning' | 'danger' | 'info' {
  const tagMap: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    frontend: '',
    backend: 'success',
    database: 'info',
    security: 'danger',
    testing: 'warning',
    git: 'info',
    prompt: '',
    process: 'warning'
  }
  return tagMap[category] ?? ''
}

function getCategoryLabel(category: StageSpec['category']): string {
  const labelMap = {
    frontend: '前端',
    backend: '后端',
    database: '数据库',
    security: '安全',
    testing: '测试',
    git: 'Git',
    prompt: 'Prompt',
    process: '流程',
    cursor: 'Cursor'
  }
  return labelMap[category] || category
}

function openSpec(spec: StageSpec) {
  const fullPath = `/Users/taopeng/workspace/AI_2026/ai-steps-economic/${spec.path}`
  const uri = `file://${fullPath}`

  // Try open — most browsers block file:// for security
  const opened = window.open(uri, '_blank')

  if (!opened || opened.closed) {
    // Fallback: copy path to clipboard
    navigator.clipboard.writeText(uri).then(() => {
      ElMessage.success({ message: `路径已复制: ${spec.title}`, duration: 3000 })
    }).catch(() => {
      ElMessage.warning({
        message: `浏览器限制无法直接打开，请在文件管理器中打开:\n${uri}`,
        duration: 5000
      })
    })
  }
}

function openAllSpecs() {
  const basePath = '/Users/taopeng/workspace/AI_2026/ai-steps-economic/docs/AI工程化开发手册'
  const uri = `file://${basePath}`

  const opened = window.open(uri, '_blank')

  if (!opened || opened.closed) {
    navigator.clipboard.writeText(uri).then(() => {
      ElMessage.success({ message: '目录路径已复制，请在文件管理器中打开', duration: 3000 })
    }).catch(() => {
      ElMessage.warning({
        message: `浏览器限制无法直接打开，请在文件管理器中打开:\n${uri}`,
        duration: 5000
      })
    })
  }
}
</script>

<style scoped>
.spec-references-panel {
  margin-bottom: 16px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #909399;
  gap: 8px;
}

.spec-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.spec-item:hover {
  background: #ecf5ff;
  transform: translateX(4px);
}

.spec-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #fff;
  border-radius: 8px;
  color: #409eff;
  font-size: 20px;
}

.spec-info {
  flex: 1;
  min-width: 0;
}

.spec-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 2px;
}

.spec-description {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.spec-path {
  font-size: 11px;
  color: #c0c4cc;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spec-action {
  display: flex;
  align-items: center;
  gap: 8px;
}

.open-icon {
  color: #c0c4cc;
  transition: color 0.2s;
}

.spec-item:hover .open-icon {
  color: #409eff;
}

.spec-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  text-align: center;
}
</style>
