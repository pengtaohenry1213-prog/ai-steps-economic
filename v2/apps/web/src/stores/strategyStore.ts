import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { EnhancedStrategyResult } from '@ai-toolkit/strategy-core'

const STORAGE_KEY = 'strategy_results'

export const useStrategyStore = defineStore('strategy', () => {
  const strategies = ref<EnhancedStrategyResult[]>([])
  const currentIndex = ref<number | null>(null)

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        strategies.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('加载策略失败:', e)
      strategies.value = []
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(strategies.value))
    } catch (e) {
      console.error('保存策略失败:', e)
    }
  }

  function saveStrategy(result: EnhancedStrategyResult) {
    strategies.value.unshift(result)
    currentIndex.value = 0
    saveToStorage()
  }

  function getCurrentStrategy(): EnhancedStrategyResult | null {
    if (currentIndex.value !== null && strategies.value[currentIndex.value]) {
      return strategies.value[currentIndex.value]
    }
    return strategies.value[0] || null
  }

  function setCurrentStrategy(index: number) {
    if (index >= 0 && index < strategies.value.length) {
      currentIndex.value = index
    }
  }

  function clearStrategies() {
    strategies.value = []
    currentIndex.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  function removeStrategy(index: number) {
    if (index >= 0 && index < strategies.value.length) {
      strategies.value.splice(index, 1)
      if (currentIndex.value === index) {
        currentIndex.value = strategies.value.length > 0 ? 0 : null
      } else if (currentIndex.value !== null && currentIndex.value > index) {
        currentIndex.value--
      }
      saveToStorage()
    }
  }

  loadFromStorage()

  return {
    strategies,
    currentIndex,
    saveStrategy,
    getCurrentStrategy,
    setCurrentStrategy,
    clearStrategies,
    removeStrategy
  }
})