/**
 * Vue3 Composables - useAIResponse
 */

import { ref, computed } from 'vue'
import type { UseAIResponseReturn } from '../types'
import { normalize } from '../adapters'

/**
 * Vue3 通用 AI 响应格式化 Hook
 *
 * @example
 * ```vue
 * <script setup>
 * import { useAIResponse } from '@ai-steps/ai-adapter'
 *
 * const { content, structured, loading, error, normalize } = useAIResponse()
 *
 * async function fetchData() {
 *   const response = await fetch('/api/ai', { method: 'POST' })
 *   const raw = await response.json()
 *   normalize(raw, 'MiniMax-M2.7')
 * }
 * </script>
 *
 * <template>
 *   <div v-if="loading">加载中...</div>
 *   <div v-else-if="error">{{ error }}</div>
 *   <div v-else>{{ content }}</div>
 * </template>
 * ```
 */
export function useAIResponse<T = unknown>(): UseAIResponseReturn<T> {
  // 状态
  const data = ref<ReturnType<typeof normalize<T>> | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const content = computed(() => data.value?.data?.content || '')
  const structured = computed<T | null>(() => (data.value?.data?.structured as T) || null)
  const model = computed(() => data.value?.data?.model || '')
  const duration = computed(() => data.value?.data?.duration || 0)
  const isSuccess = computed(() => data.value?.success ?? false)

  /**
   * 格式化响应
   */
  function normalizeResponse(raw: unknown, modelName: string, dur?: number) {
    loading.value = true
    error.value = null

    try {
      const duration = dur || 0
      data.value = normalize<T>(raw, modelName, duration)

      if (!data.value.success) {
        error.value = data.value.error || 'Unknown error'
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      data.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    content,
    structured,
    model,
    duration,
    isSuccess,
    normalize: normalizeResponse
  }
}