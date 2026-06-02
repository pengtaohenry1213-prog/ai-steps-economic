<template>
  <div class="todo-graph">
    <el-empty
      v-if="todos.length === 0"
      description="暂无 todos"
      :image-size="60"
    />

    <div v-else class="todo-list">
      <el-card
        v-for="todo in sortedTodos"
        :key="todo.id"
        :class="['todo-item', getTodoClass(todo)]"
        shadow="hover"
      >
        <div class="todo-content">
          <el-avatar
            :size="40"
            :style="getAvatarStyle(todo.type)"
            class="todo-avatar"
          >
            {{ getInitials(todo.content) }}
          </el-avatar>

          <div class="todo-info">
            <div class="todo-main">
              <span class="todo-text">{{ todo.content }}</span>
              <el-tag size="small" :type="getTypeTagType(todo.type)">
                {{ todo.type }}
              </el-tag>
            </div>
            <div class="todo-meta">
              <span class="todo-id">{{ todo.id }}</span>
              <span v-if="todo.depends_on.length > 0" class="todo-deps">
                <el-icon><Link /></el-icon>
                依赖: {{ todo.depends_on.join(', ') }}
              </span>
            </div>
          </div>

          <div class="todo-status">
            <el-icon
              :size="20"
              :class="getStatusClass(todo.status)"
            >
              <Check v-if="todo.status === 'completed'" />
              <Loading v-else-if="todo.status === 'in_progress'" />
              <Close v-else-if="todo.status === 'failed'" />
              <Minus v-else />
            </el-icon>
          </div>
        </div>
      </el-card>

      <el-card shadow="never" class="execution-order-card">
        <template #header>
          <span class="order-title">
            <el-icon><List /></el-icon>
            执行顺序（拓扑排序）
          </span>
        </template>
        <el-tag
          v-for="(todo, idx) in sortedTodos"
          :key="todo.id"
          :type="getTypeTagType(todo.type)"
          class="order-tag"
        >
          {{ idx + 1 }}. {{ todo.id }}
        </el-tag>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Todo } from '../types'
import { Check, Loading, Close, Minus, Link, List } from '@element-plus/icons-vue'

const props = defineProps<{
  todos: Todo[]
}>()

function topologicalSort(todos: Todo[]): Todo[] {
  const inDegree = new Map<string, number>()
  const graph = new Map<string, string[]>()

  todos.forEach(todo => {
    inDegree.set(todo.id, todo.depends_on.length)
    graph.set(todo.id, [])
  })

  todos.forEach(todo => {
    todo.depends_on.forEach(dep => {
      if (graph.has(dep)) {
        graph.get(dep)!.push(todo.id)
      }
    })
  })

  const queue = todos.filter(t => inDegree.get(t.id) === 0)
  const sorted: Todo[] = []

  while (queue.length > 0) {
    const current = queue.shift()!
    sorted.push(current)

    graph.get(current.id)?.forEach(neighbor => {
      const newDegree = inDegree.get(neighbor)! - 1
      inDegree.set(neighbor, newDegree)
      if (newDegree === 0) {
        const neighborTodo = todos.find(t => t.id === neighbor)
        if (neighborTodo) queue.push(neighborTodo)
      }
    })
  }

  return sorted
}

const sortedTodos = computed(() => topologicalSort(props.todos))

function getInitials(content: string): string {
  return content.slice(0, 2).toUpperCase()
}

function getAvatarStyle(type: Todo['type']): Record<string, string> {
  const colors: Record<Todo['type'], string> = {
    frontend: 'background-color: #409eff',
    backend: 'background-color: #67c23a',
    test: 'background-color: #e6a23c',
    fix: 'background-color: #f56c6c'
  }
  return { color: 'white', ...{ backgroundColor: colors[type] } }
}

function getTypeTagType(type: Todo['type']): 'primary' | 'success' | 'warning' | 'danger' {
  const map: Record<Todo['type'], 'primary' | 'success' | 'warning' | 'danger'> = {
    frontend: 'primary',
    backend: 'success',
    test: 'warning',
    fix: 'danger'
  }
  return map[type]
}

function getTodoClass(todo: Todo): string {
  if (todo.status === 'completed') return 'todo-completed'
  if (todo.status === 'in_progress') return 'todo-in-progress'
  if (todo.status === 'failed') return 'todo-failed'
  return ''
}

function getStatusClass(status: Todo['status']): string {
  if (status === 'completed') return 'status-completed'
  if (status === 'in_progress') return 'status-in-progress'
  if (status === 'failed') return 'status-failed'
  return 'status-pending'
}
</script>

<style scoped>
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.todo-item:hover {
  transform: translateX(4px);
}

.todo-completed {
  border-left: 4px solid #67c23a;
  background: linear-gradient(90deg, #f0f9eb 0%, white 100%);
}

.todo-in-progress {
  border-left: 4px solid #409eff;
  background: linear-gradient(90deg, #ecf5ff 0%, white 100%);
}

.todo-failed {
  border-left: 4px solid #f56c6c;
  background: linear-gradient(90deg, #fef0f0 0%, white 100%);
}

.todo-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.todo-avatar {
  flex-shrink: 0;
}

.todo-info {
  flex: 1;
  min-width: 0;
}

.todo-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.todo-text {
  font-weight: 500;
  color: #303133;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.75rem;
  color: #909399;
}

.todo-id {
  font-family: monospace;
}

.todo-deps {
  display: flex;
  align-items: center;
  gap: 4px;
}

.todo-status {
  flex-shrink: 0;
}

.status-completed {
  color: #67c23a;
}

.status-in-progress {
  color: #409eff;
}

.status-failed {
  color: #f56c6c;
}

.status-pending {
  color: #909399;
}

.execution-order-card {
  margin-top: 16px;
  background: #f5f7fa;
}

.order-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.order-tag {
  margin: 4px;
}
</style>