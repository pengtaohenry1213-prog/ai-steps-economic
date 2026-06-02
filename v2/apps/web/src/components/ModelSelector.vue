<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElButton, ElTooltip, ElTag } from 'element-plus'
import { AI_MODELS, getDefaultModel, type AIModel } from '../config/aiModels'

const STORAGE_KEY = 'selected-model-id'

const selectedModelId = ref<string>(getDefaultModel().id)
const connectionStatus = ref<Record<string, boolean>>({})
const isChecking = ref(false)

const selectedModel = computed<AIModel | undefined>(
  () => AI_MODELS.find(m => m.id === selectedModelId.value)
)

const internalModel = computed(() => AI_MODELS.find(m => m.provider === 'ollama'))
const externalModel = computed(() => AI_MODELS.find(m => m.provider === 'openai'))

const isUsingExternal = computed(() => selectedModel.value?.provider === 'openai')

function selectModel(modelId: string) {
  selectedModelId.value = modelId
  localStorage.setItem(STORAGE_KEY, modelId)
}

function toggleModel() {
  if (isUsingExternal.value && internalModel.value) {
    selectModel(internalModel.value.id)
  } else if (!isUsingExternal.value && externalModel.value) {
    selectModel(externalModel.value.id)
  }
}

async function checkAllConnections() {
  isChecking.value = true
  for (const model of AI_MODELS) {
    // Placeholder - actual connection check would use aiService.testModelConnection
    connectionStatus.value[model.id] = true
  }
  isChecking.value = false
}

function getStatusType(modelId: string): 'success' | 'danger' | 'warning' {
  const connected = connectionStatus.value[modelId]
  if (connected === undefined) return 'warning'
  return connected ? 'success' : 'danger'
}

function getStatusText(modelId: string): string {
  const connected = connectionStatus.value[modelId]
  if (connected === undefined) return '未检测'
  return connected ? '已连接' : '未连接'
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && AI_MODELS.find(m => m.id === saved)) {
    selectedModelId.value = saved
  }
  checkAllConnections()
})

defineExpose({
  selectedModel,
  selectedModelId
})
</script>

<template>
  <div class="model-selector">
    <ElTooltip content="切换 AI 模型" placement="bottom">
      <div class="model-toggle">
        <ElButton
          size="small"
          :type="!isUsingExternal ? 'primary' : 'default'"
          :disabled="!internalModel || !connectionStatus[internalModel?.id]"
          @click="selectModel(internalModel?.id || '')"
          class="toggle-btn"
        >
          <span class="btn-icon">🏠</span>
          <span class="btn-text">本地</span>
          <ElTag
            :type="getStatusType(internalModel?.id || '')"
            size="small"
            class="status-tag"
            :loading="isChecking"
          >
            {{ getStatusText(internalModel?.id || '') }}
          </ElTag>
        </ElButton>
        <ElButton
          size="small"
          :type="isUsingExternal ? 'primary' : 'default'"
          :disabled="!externalModel || !connectionStatus[externalModel?.id]"
          @click="selectModel(externalModel?.id || '')"
          class="toggle-btn"
        >
          <span class="btn-icon">🌐</span>
          <span class="btn-text">外网</span>
          <ElTag
            :type="getStatusType(externalModel?.id || '')"
            size="small"
            class="status-tag"
            :loading="isChecking"
          >
            {{ getStatusText(externalModel?.id || '') }}
          </ElTag>
        </ElButton>
      </div>
    </ElTooltip>
  </div>
</template>

<style scoped>
.model-selector {
  display: inline-flex;
  align-items: center;
}

.model-toggle {
  display: flex;
  gap: 4px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-icon {
  font-size: 14px;
}

.btn-text {
  font-size: 13px;
}

.status-tag {
  font-size: 10px;
  margin-left: 4px;
}
</style>