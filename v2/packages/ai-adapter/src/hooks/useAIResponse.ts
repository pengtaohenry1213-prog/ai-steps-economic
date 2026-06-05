/**
 * Vue3 Composables - useAIResponse
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

import { shallowRef, ref, computed } from 'vue'
import type { UseAIResponseReturn, StandardResponse } from '../types'
import { normalize } from '../adapters'

export function useAIResponse<T = unknown>(): UseAIResponseReturn<T> {
  const data = shallowRef<StandardResponse<T> | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const content = computed(() => {
    const value = data.value
    return value?.data?.content || ''
  })
  const structured = computed<T | null>(() => {
    const value = data.value
    return (value?.data?.structured as T) ?? null
  })
  const model = computed(() => {
    const value = data.value
    return value?.data?.model || ''
  })
  const duration = computed(() => {
    const value = data.value
    return value?.data?.duration || 0
  })
  const isSuccess = computed(() => {
    const value = data.value
    return value?.success ?? false
  })

  function normalizeResponse(raw: unknown, modelName: string, dur?: number) {
    loading.value = true
    error.value = null

    try {
      const duration = dur || 0
      const result = normalize<T>(raw, modelName, duration)
      data.value = result as StandardResponse<T>

      const response = data.value
      if (response && !response.success) {
        error.value = response.error || 'Unknown error'
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
