<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { createLifecycleCore, createAIService, matchStrategyWithAIService, getAllStrategies, getAllIndustries, enhanceStrategyWithAIService } from '../../../packages'
import StrategyViewer from './views/StrategyViewer.vue'
import { useStrategyStore } from './stores/strategyStore'

const lifecycle = createLifecycleCore({ storageKey: 'web-lifecycle' })
const aiService = createAIService({
  provider: 'openai',
  baseUrl: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.minimaxi.com/v1',
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  defaultModel: 'MiniMax-M2.7'
})
const strategyStore = useStrategyStore()

const strategies = getAllStrategies()
const industries = getAllIndustries()
const state = ref(lifecycle.getState())
const matchResult = ref<any>(null)
const testInput = ref('我们是个三甲医院，要开发一个门诊管理系统')
const showViewer = ref(false)
const mergeTestLoading = ref(false)
const mergeTestResult = ref<any>(null)
const mergeInputPreview = ref('')

const requirementFiles = [
  { name: 'v2_product_roadmap.md', extract: extractProjectVision },
  { name: 'v1_v2_upgrade_requirements.md', extract: extractUpgradeGoals },
  { name: 'v2_init_plan.md', extract: extractTechStack },
  { name: 'v1_v2_analysis.md', extract: extractReusableAssets }
]

onMounted(() => {
  console.log('=== Web SDK 测试 ===')
  console.log('Lifecycle State:', state.value)
  console.log('Strategies:', strategies.length)
  console.log('Industries:', industries.length)
})

async function testMatch() {
  const result = await matchStrategyWithAIService(aiService, { userInput: testInput.value }, 'MiniMax-M2.7')
  matchResult.value = result

  if (result.success && result.data) {
    const enhanced = await enhanceStrategyWithAIService(aiService, result.data, testInput.value, 'MiniMax-M2.7')
    if (enhanced) {
      strategyStore.saveStrategy(enhanced)
    }
  }
}

function extractProjectVision(content: string): string {
  const match = content.match(/## 一、项目愿景[\s\S]*?(?=---)/)
  return match ? `【项目愿景】\n${match[0]}` : ''
}

function extractUpgradeGoals(content: string): string {
  const match = content.match(/### 1\.2 升级目标[\s\S]*?(?=\|)/)
  return match ? `【升级目标】\n${match[0]}` : ''
}

function extractTechStack(content: string): string {
  const match = content.match(/### 1\.3 技术栈[\s\S]*?(?=---)/)
  return match ? `【技术栈】\n${match[0]}` : ''
}

function extractReusableAssets(content: string): string {
  const match = content.match(/### 2\.1 数据库设计[\s\S]*?(?=\*\*复用方式)/)
  return match ? `【复用资产】\n${match[0]}` : ''
}

async function loadAndMergeRequirements(): Promise<string> {
  const mergedParts: string[] = []

  for (const file of requirementFiles) {
    try {
      const response = await fetch(`/requirements/${file.name}`)
      if (response.ok) {
        const content = await response.text()
        const extracted = file.extract(content)
        if (extracted) {
          mergedParts.push(extracted)
        }
      }
    } catch (e) {
      console.warn(`警告: 无法读取文件 ${file.name}`)
    }
  }

  return mergedParts.join('\n\n')
}

async function testMergeMatch() {
  mergeTestLoading.value = true
  mergeTestResult.value = null

  try {
    const mergedInput = await loadAndMergeRequirements()
    mergeInputPreview.value = mergedInput.substring(0, 500) + (mergedInput.length > 500 ? '...' : '')

    const result = await matchStrategyWithAIService(aiService, { userInput: mergedInput }, 'MiniMax-M2.7')
    mergeTestResult.value = result

    if (result.success && result.data) {
      const enhanced = await enhanceStrategyWithAIService(aiService, result.data, mergedInput, 'MiniMax-M2.7')
      if (enhanced) {
        strategyStore.saveStrategy(enhanced)
      }
    }
  } finally {
    mergeTestLoading.value = false
  }
}
</script>

<template>
  <div class="app">
    <h1>AI Toolkits SDK - Web Assembly</h1>

    <section>
      <h2>Lifecycle Core</h2>
      <p>当前阶段: {{ state.currentStageId }}</p>
      <p>阶段数量: {{ state.stages.length }}</p>
    </section>

    <section>
      <h2>Strategy Core</h2>
      <p>策略数量: {{ strategies.length }}</p>
      <p>行业数量: {{ industries.length }}</p>
    </section>

    <section>
      <h2>Strategy Matching Test</h2>
      <input v-model="testInput" placeholder="输入需求描述" />
      <button @click="testMatch">测试匹配</button>
      <button @click="showViewer = !showViewer">
        {{ showViewer ? '隐藏策略' : '查看策略列表' }}
      </button>
      <pre v-if="matchResult">{{ JSON.stringify(matchResult, null, 2) }}</pre>
    </section>

    <section>
      <h2>多文件合并测试</h2>
      <p class="desc">从 4 个需求文档中提取关键信息，合并后进行策略匹配</p>
      <button @click="testMergeMatch" :disabled="mergeTestLoading">
        {{ mergeTestLoading ? '加载中...' : '执行多文件合并测试' }}
      </button>
      <div v-if="mergeInputPreview" class="preview">
        <h4>合并后的输入预览：</h4>
        <pre>{{ mergeInputPreview }}</pre>
      </div>
      <div v-if="mergeTestResult" class="result">
        <h4>匹配结果：</h4>
        <pre>{{ JSON.stringify(mergeTestResult, null, 2) }}</pre>
      </div>
    </section>

    <section v-if="showViewer">
      <StrategyViewer />
    </section>
  </div>
</template>

<style scoped>
.app {
  padding: 20px;
}
section {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
}
input {
  width: 100%;
  padding: 8px;
  margin-right: 10px;
}
button {
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
pre {
  background: #f5f5f5;
  padding: 10px;
  overflow: auto;
}
.desc {
  color: #666;
  font-size: 14px;
  margin: 10px 0;
}
.preview, .result {
  margin-top: 15px;
}
.preview h4, .result h4 {
  margin: 10px 0 5px 0;
  color: #303133;
}
.preview pre, .result pre {
  max-height: 300px;
}
</style>