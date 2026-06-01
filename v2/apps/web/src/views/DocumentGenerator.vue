<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElButton, ElInput, ElTabs, ElTabPane, ElMessage, ElEmpty, ElUpload } from 'element-plus'
import type { UploadFile } from 'element-plus'
import {
  matchStrategyWithAIService,
  enhanceStrategyWithAIService,
  generateAllDeliverablesWithAIService,
  generateStepDocumentsFromArchitecture,
  generateStepsDevDocument,
  formatProposalAsMarkdown,
  formatRequirementsAsMarkdown,
  formatArchitectureAsMarkdown,
  formatStepAsMarkdown,
  formatStepsDevAsMarkdown,
  splitStepsIntoFiles
} from '@ai-toolkit/strategy-core'

interface AIServiceLike {
  chat(messages: Array<{ role: string; content: string }>, options?: { model?: string }): Promise<{ success: boolean; data?: { content: string; model: string }; error?: string }>
}

type DocStatus = 'none' | 'generated' | 'generating' | 'error'

interface DocState<T> {
  result: T | null
  status: DocStatus
}

const userInput = ref('')
const loading = ref(false)
const activeTab = ref('strategy')
const fileList = ref<Array<{ name: string; content: string }>>([])

const strategyState = reactive<DocState<any>>({ result: null, status: 'none' })
const proposalState = reactive<DocState<any>>({ result: null, status: 'none' })
const requirementsState = reactive<DocState<any>>({ result: null, status: 'none' })
const architectureState = reactive<DocState<any>>({ result: null, status: 'none' })
const stepsState = reactive<DocState<any[]>>({ result: [], status: 'none' })
const stepsDevState = reactive<DocState<any>>({ result: null, status: 'none' })

// 兼容性 getter（供 computed 使用）
const strategyResult = computed(() => strategyState.result)
const proposalResult = computed(() => proposalState.result)
const requirementsResult = computed(() => requirementsState.result)
const architectureResult = computed(() => architectureState.result)
const stepsResult = computed(() => stepsState.result)
const stepsDevResult = computed(() => stepsDevState.result)

// 从 localStorage 恢复缓存的文档状态
onMounted(async () => {
  console.log('[Cache] onMounted: Starting to load cached documents')
  loadDocState('strategy', strategyState)
  loadDocState('proposal', proposalState)
  loadDocState('requirements', requirementsState)
  loadDocState('architecture', architectureState)
  loadDocState('steps', stepsState)
  loadDocState('stepsDev', stepsDevState)
  await nextTick()
  console.log('[Cache] onMounted: Cache loading complete')
  console.log('[Cache] strategyState after load:', strategyState.status, strategyState.result ? 'has result' : 'no result')
})

const strategyMarkdown = computed(() => {
  if (!strategyResult.value?.enhancedStrategy) return ''
  const s = strategyResult.value
  return `# ${s.enhancedStrategy.title || 'Untitled'}

## 基本信息
- **策略**: ${s.basicResult?.strategy?.id || 'N/A'} - ${s.basicResult?.strategy?.name || 'N/A'}
- **行业**: ${s.basicResult?.industry?.id || 'N/A'} - ${s.basicResult?.industry?.name || 'N/A'}
- **置信度**: ${((s.basicResult?.confidence || 0) * 100).toFixed(0)}%

## 匹配推理
- **推理**: ${s.basicResult?.reasoning || 'N/A'}
- **判断依据**: ${s.basicResult?.judgmentBasis || 'N/A'}

## 策略定义
${s.enhancedStrategy.definition || ''}

## 适用场景
${(s.enhancedStrategy.applicableScenarios || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

## 不适用场景
${(s.enhancedStrategy.notApplicableScenarios || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

## 核心特点
${(s.enhancedStrategy.coreCharacteristics || []).map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}

## 核心矛盾
${s.enhancedStrategy.coreConflict || ''}

## 分阶段开发
${(s.enhancedStrategy.phases || []).map((p: any) => `### ${p.name || 'N/A'}
- 目标: ${p.goal || ''}
- 开发模式: ${p.devMode || ''}
- Human Gate: ${p.humanGate || ''}
- 核心交付物: ${p.deliverables || ''}
- 成功标准: ${p.successCriteria || ''}
`).join('\n')}

## 关键注意事项
${(s.enhancedStrategy.keyNotes || []).map((k: string, i: number) => `${i + 1}. ${k}`).join('\n')}

## 推荐工具链
${(s.enhancedStrategy.recommendedToolChain || []).map((t: any) => `- **${t.phase || 'N/A'}**: ${t.tools || ''} - ${t.note || ''}`).join('\n')}

## 典型风险
${(s.enhancedStrategy.typicalRisks || []).map((r: any) => `### ${r.riskType || 'N/A'}
- **具体风险**: ${r.specificRisk || ''}
- **应对措施**: ${r.mitigation || ''}
`).join('\n')}

## 成功指标
${(s.enhancedStrategy.successCriteria || []).map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

## 行业适配
${s.enhancedStrategy.industryAdaptation || ''}
`
})

const proposalMarkdown = computed(() => {
  if (!proposalResult.value) return ''
  try {
    return formatProposalAsMarkdown(proposalResult.value)
  } catch (e) {
    console.error('formatProposalAsMarkdown error:', e)
    return '# 立项书格式错误'
  }
})

const requirementsMarkdown = computed(() => {
  if (!requirementsResult.value) return ''
  try {
    return formatRequirementsAsMarkdown(requirementsResult.value)
  } catch (e) {
    console.error('formatRequirementsAsMarkdown error:', e)
    return '# 需求文档格式错误'
  }
})

const architectureMarkdown = computed(() => {
  if (!architectureResult.value) return ''
  try {
    return formatArchitectureAsMarkdown(architectureResult.value)
  } catch (e) {
    console.error('formatArchitectureAsMarkdown error:', e)
    return '# 架构文档格式错误'
  }
})

const stepsMarkdown = computed(() => {
  if (!stepsResult.value?.length) return ''
  try {
    return stepsResult.value.map(step => formatStepAsMarkdown(step)).join('\n---\n')
  } catch (e) {
    console.error('formatStepsAsMarkdown error:', e)
    return '# Steps 格式错误'
  }
})

const stepsDevMarkdown = computed(() => {
  if (!stepsDevResult.value) return ''
  try {
    return formatStepsDevAsMarkdown(stepsDevResult.value)
  } catch (e) {
    console.error('formatStepsDevAsMarkdown error:', e)
    return '# 开发路线格式错误'
  }
})

function createAIService(): AIServiceLike {
  return {
    async chat(messages: Array<{ role: string; content: string }>, options?: { model?: string }) {
      const model = options?.model || 'MiniMax-M2.7'
      try {
        const response = await fetch('/api/ai/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: messages.map(m => ({ role: m.role, content: m.content }))
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          return { success: false, error: `API error ${response.status}: ${errorText}` }
        }

        const data = await response.json()
        if (!data.choices || !data.choices[0]?.message?.content) {
          return { success: false, error: 'Invalid API response format' }
        }

        return {
          success: true,
          data: {
            content: data.choices[0].message.content,
            model: data.model || model
          }
        }
      } catch (error: any) {
        return { success: false, error: error.message || 'Request failed' }
      }
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

async function handleFileChange(uploadFile: UploadFile) {
  const rawFile = uploadFile.raw
  if (!rawFile) return

  try {
    const content = await rawFile.text()

    const extractors: Record<string, (content: string) => string> = {
      'v2_product_roadmap.md': extractProjectVision,
      'v1_v2_upgrade_requirements.md': extractUpgradeGoals,
      'v2_init_plan.md': extractTechStack,
      'v1_v2_analysis.md': extractReusableAssets
    }

    const extractor = extractors[rawFile.name]
    const extracted = extractor ? extractor(content) : content

    const existingIndex = fileList.value.findIndex(f => f.name === rawFile.name)
    if (existingIndex >= 0) {
      fileList.value[existingIndex] = { name: rawFile.name, content: extracted }
    } else {
      fileList.value.push({ name: rawFile.name, content: extracted })
    }
    ElMessage.success(`已加载文件: ${rawFile.name}`)
  } catch {
    ElMessage.error(`读取文件 ${rawFile.name} 失败`)
  }
}

function removeFile(fileName: string) {
  const index = fileList.value.findIndex(f => f.name === fileName)
  if (index >= 0) {
    fileList.value.splice(index, 1)
  }
}

function getMergedInput(): string {
  const parts: string[] = []

  if (userInput.value.trim()) {
    parts.push(`【用户输入】\n${userInput.value.trim()}`)
  }

  for (const file of fileList.value) {
    parts.push(`【文件: ${file.name}】\n${file.content}`)
  }

  return parts.join('\n\n')
}

const CACHE_KEYS = {
  strategy: 'doc_cache_strategy',
  proposal: 'doc_cache_proposal',
  requirements: 'doc_cache_requirements',
  architecture: 'doc_cache_architecture',
  steps: 'doc_cache_steps',
  stepsDev: 'doc_cache_stepsDev'
} as const

function saveDocState(docType: keyof typeof CACHE_KEYS, state: DocState<any>) {
  if (state.status === 'generated' && state.result) {
    try {
      const data = JSON.stringify({
        result: state.result,
        status: state.status
      })
      localStorage.setItem(CACHE_KEYS[docType], data)
      console.log(`[Cache] Saved ${docType}, size: ${data.length} bytes`)
    } catch (e) {
      console.error(`[Cache] Failed to save ${docType}:`, e)
    }
  }
}

function loadDocState(docType: keyof typeof CACHE_KEYS, target: DocState<any>) {
  const key = CACHE_KEYS[docType]
  const cached = localStorage.getItem(key)
  console.log(`[Cache] Loading ${docType} from localStorage, found: ${cached !== null}, key: ${key}`)
  if (cached) {
    try {
      const data = JSON.parse(cached)
      target.result = data.result
      target.status = data.status
      console.log(`[Cache] Loaded ${docType}, status: ${data.status}, result keys: ${Object.keys(data.result || {}).join(', ')}`)
    } catch (e) {
      console.warn(`[Cache] Failed to load ${docType}:`, e)
    }
  }
}

function clearDocCacheFromStorage(docType?: keyof typeof CACHE_KEYS | 'all') {
  if (!docType || docType === 'all') {
    Object.values(CACHE_KEYS).forEach(key => localStorage.removeItem(key))
  } else {
    localStorage.removeItem(CACHE_KEYS[docType])
  }
}

async function generateAllDocuments() {
  const mergedInput = getMergedInput()
  if (!mergedInput.trim()) {
    ElMessage.warning('请输入需求描述或上传文件')
    return
  }

  loading.value = true
  try {
    const aiService = createAIService()

    // 1. 策略匹配（始终需要）
    if (strategyState.status !== 'generated') {
      strategyState.status = 'generating'
      const matchResult = await matchStrategyWithAIService(aiService, { userInput: mergedInput })
      if (!matchResult.success || !matchResult.data) {
        ElMessage.error('策略匹配失败: ' + (matchResult.error || '未知错误'))
        strategyState.status = 'error'
        return
      }

      // 2. 策略增强（始终需要，因为是其他文档的输入）
      const enhancedResult = await enhanceStrategyWithAIService(aiService, matchResult.data, mergedInput)
      if (!enhancedResult) {
        ElMessage.error('策略增强失败')
        strategyState.status = 'error'
        return
      }

      strategyState.result = enhancedResult
      strategyState.status = 'generated'
      saveDocState('strategy', strategyState)
    }

    // 3. 立项书/需求/架构（已生成则跳过）
    if (proposalState.status !== 'generated') {
      proposalState.status = 'generating'
      const deliverablesResult = await generateAllDeliverablesWithAIService(
        aiService,
        strategyState.result.basicResult,
        mergedInput,
        undefined,
        strategyState.result.enhancedStrategy
      )
      if (deliverablesResult) {
        proposalState.result = deliverablesResult.proposal
        proposalState.status = 'generated'
        saveDocState('proposal', proposalState)
      } else {
        proposalState.status = 'error'
      }
    }

    if (requirementsState.status !== 'generated') {
      requirementsState.status = 'generating'
      const deliverablesResult = await generateAllDeliverablesWithAIService(
        aiService,
        strategyState.result.basicResult,
        mergedInput,
        undefined,
        strategyState.result.enhancedStrategy
      )
      if (deliverablesResult) {
        requirementsState.result = deliverablesResult.requirements
        requirementsState.status = 'generated'
        saveDocState('requirements', requirementsState)
      } else {
        requirementsState.status = 'error'
      }
    }

    if (architectureState.status !== 'generated') {
      architectureState.status = 'generating'
      let deliverablesResult = null
      let retries = 0
      const maxRetries = 2

      while (!deliverablesResult && retries <= maxRetries) {
        if (retries > 0) {
          console.warn(`[Architecture] 生成失败，重试 ${retries}/${maxRetries}`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        deliverablesResult = await generateAllDeliverablesWithAIService(
          aiService,
          strategyState.result.basicResult,
          mergedInput,
          undefined,
          strategyState.result.enhancedStrategy
        )
        retries++
      }

      if (deliverablesResult) {
        architectureState.result = deliverablesResult.architecture
        architectureState.status = 'generated'
        saveDocState('architecture', architectureState)
      } else {
        architectureState.status = 'error'
      }
    }

    // 4. Steps（依赖架构，已生成则跳过）
    if (stepsState.status !== 'generated' && architectureState.status === 'generated') {
      stepsState.status = 'generating'
      let stepsResultData = null
      let retries = 0
      const maxRetries = 2

      try {
        while (!stepsResultData && retries <= maxRetries) {
          if (retries > 0) {
            console.warn(`[Steps] 生成失败，重试 ${retries}/${maxRetries}`)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          const archMd = formatArchitectureAsMarkdown(architectureState.result)
          stepsResultData = await generateStepDocumentsFromArchitecture(aiService, archMd)
          retries++
        }

        if (stepsResultData && stepsResultData.length > 0) {
          stepsState.result = stepsResultData
          stepsState.status = 'generated'
          saveDocState('steps', stepsState)

          // 5. StepsDev（依赖 Steps，已生成则跳过）
          if (stepsDevState.status !== 'generated') {
            stepsDevState.status = 'generating'
            const stepsDevResultData = await generateStepsDevDocument(aiService, stepsResultData)
            if (stepsDevResultData) {
              stepsDevState.result = stepsDevResultData
              stepsDevState.status = 'generated'
              saveDocState('stepsDev', stepsDevState)
            } else {
              stepsDevState.status = 'error'
            }
          }
        } else {
          stepsState.status = 'error'
        }
      } catch (e) {
        console.error('Steps generation error:', e)
        stepsState.status = 'error'
      }
    }

    ElMessage.success('文档生成成功')
    activeTab.value = 'strategy'
  } catch (error: any) {
    ElMessage.error('生成失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

function exportMarkdown(content: string | undefined, filename: string) {
  if (!content) return
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

function clearCache(docType?: 'strategy' | 'proposal' | 'requirements' | 'architecture' | 'steps' | 'stepsDev' | 'all') {
  if (!docType || docType === 'all') {
    strategyState.result = null
    strategyState.status = 'none'
    proposalState.result = null
    proposalState.status = 'none'
    requirementsState.result = null
    requirementsState.status = 'none'
    architectureState.result = null
    architectureState.status = 'none'
    stepsState.result = []
    stepsState.status = 'none'
    stepsDevState.result = null
    stepsDevState.status = 'none'
    clearDocCacheFromStorage('all')
    ElMessage.success('已清除全部缓存')
  } else {
    const stateMap = {
      strategy: strategyState,
      proposal: proposalState,
      requirements: requirementsState,
      architecture: architectureState,
      steps: stepsState,
      stepsDev: stepsDevState
    }
    const target = stateMap[docType]
    if (target) {
      if (docType === 'steps' || docType === 'requirements') {
        target.result = docType === 'steps' ? [] : null
      }
      target.status = 'none'
      clearDocCacheFromStorage(docType)
      ElMessage.success(`已清除 ${docType} 缓存`)
    }
  }
}

function regenerateDoc(docType: 'strategy' | 'proposal' | 'requirements' | 'architecture' | 'steps' | 'stepsDev') {
  const stateMap = {
    strategy: strategyState,
    proposal: proposalState,
    requirements: requirementsState,
    architecture: architectureState,
    steps: stepsState,
    stepsDev: stepsDevState
  }
  const target = stateMap[docType]
  if (target) {
    target.result = docType === 'steps' ? [] : null
    target.status = 'none'
    generateAllDocuments()
  }
}

function copyToClipboard(content: string | undefined) {
  if (!content) return
  navigator.clipboard.writeText(content).then(() => {
    ElMessage.success('已复制到剪贴板')
  })
}

async function downloadAllAsZip() {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  if (strategyMarkdown.value) zip.file(`strategy-${Date.now()}.md`, strategyMarkdown.value)
  if (proposalMarkdown.value) zip.file(`proposal-${Date.now()}.md`, proposalMarkdown.value)
  if (requirementsMarkdown.value) zip.file(`requirements-${Date.now()}.md`, requirementsMarkdown.value)
  if (architectureMarkdown.value) zip.file(`architecture-${Date.now()}.md`, architectureMarkdown.value)
  if (stepsMarkdown.value) zip.file(`steps-${Date.now()}.md`, stepsMarkdown.value)
  if (stepsDevMarkdown.value) zip.file(`steps-dev-${Date.now()}.md`, stepsDevMarkdown.value)

  // Add individual step files
  if (stepsResult.value && stepsResult.value.length > 0) {
    const splitResult = splitStepsIntoFiles(stepsResult.value)
    for (const sf of splitResult.stepFiles) {
      const filePath = `doc/steps/${sf.fileName}`
      zip.file(filePath, sf.content)
    }
  }

  // Add cursor rules for development reference
  const essentialRules = ['frontend.mdc', 'backend.mdc', 'fullstack.mdc', 'DBA.mdc', 'TEST.mdc', 'UI.mdc', 'deploy-rules.mdc']
  for (const rule of essentialRules) {
    try {
      const response = await fetch(`/.cursor/rules/${rule}`)
      if (response.ok) {
        const content = await response.text()
        zip.file(`.cursor/rules/${rule}`, content)
      }
    } catch (e) {
      console.warn(`Failed to add rule ${rule}:`, e)
    }
  }

  // Add plan-template.md and run-step.md
  try {
    const planResponse = await fetch('/.cursor/prompts/plan-template.md')
    if (planResponse.ok) {
      zip.file('.cursor/prompts/plan-template.md', await planResponse.text())
    }
  } catch (e) {
    console.warn('Failed to add plan-template.md:', e)
  }

  try {
    const runStepResponse = await fetch('/.cursor/prompts/run-step.md')
    if (runStepResponse.ok) {
      zip.file('.cursor/prompts/run-step.md', await runStepResponse.text())
    }
  } catch (e) {
    console.warn('Failed to add run-step.md:', e)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `project-docs-${Date.now()}.zip`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('打包下载成功')
}
</script>

<template>
  <div class="document-generator">
    <div class="header">
      <h2>项目文档生成器</h2>
      <p class="subtitle">输入需求，自动生成策略/立项书/需求文档/架构书/Step/执行路线</p>
      <div class="header-actions">
        <ElButton v-if="strategyResult" type="warning" size="small" @click="clearCache('all')">清除全部缓存</ElButton>
        <ElButton v-if="strategyResult" type="success" @click="downloadAllAsZip">📦 一键下载全部文档</ElButton>
      </div>
    </div>

    <div class="input-section">
      <ElUpload
        class="upload-section"
        multiple
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="[]"
        accept=".md,.txt"
      >
        <ElButton type="info" plain>
          <span>📎 上传需求文件</span>
        </ElButton>
        <template #tip>
          <div class="upload-tip">支持 .md/.txt 文件，自动提取关键段落（项目愿景/升级目标/技术栈/复用资产）</div>
        </template>
      </ElUpload>

      <div v-if="fileList.length > 0" class="file-list">
        <div v-for="file in fileList" :key="file.name" class="file-item">
          <span class="file-name">📄 {{ file.name }}</span>
          <ElButton size="small" type="danger" link @click="removeFile(file.name)">删除</ElButton>
        </div>
      </div>

      <ElInput
        v-model="userInput"
        type="textarea"
        :rows="4"
        placeholder="请输入项目需求描述，如：基于v1经济模型，进行v2升级，采用Vue3+TS技术栈，目标构建新一代在线协作平台..."
        :disabled="loading"
        class="user-input"
      />
      <ElButton
        type="primary"
        :loading="loading"
        @click="generateAllDocuments"
        class="generate-btn"
      >
        {{ loading ? '生成中...' : '生成项目文档包' }}
      </ElButton>
    </div>

    <div v-if="strategyResult" class="result-section">
      <ElTabs v-model="activeTab" type="border-card">
        <ElTabPane label="策略" name="strategy">
          <div class="tab-header">
            <span>开发策略文档 <el-tag size="small" :type="strategyState.status === 'generated' ? 'success' : strategyState.status === 'error' ? 'danger' : 'info'">{{ strategyState.status === 'generated' ? '✓' : strategyState.status === 'error' ? '✗' : '-' }}</el-tag></span>
            <div class="actions">
              <ElButton size="small" type="warning" @click="clearCache('strategy')">清除</ElButton>
              <ElButton size="small" @click="copyToClipboard(strategyMarkdown)">复制</ElButton>
              <ElButton size="small" type="primary" @click="exportMarkdown(strategyMarkdown, `strategy-${Date.now()}.md`)">导出 MD</ElButton>
            </div>
          </div>
          <div class="content" v-html="strategyMarkdown?.replace(/\n/g, '<br>') || ''"></div>
        </ElTabPane>

        <ElTabPane label="立项书" name="proposal">
          <div class="tab-header">
            <span>立项书文档 <el-tag size="small" :type="proposalState.status === 'generated' ? 'success' : proposalState.status === 'error' ? 'danger' : 'info'">{{ proposalState.status === 'generated' ? '✓' : proposalState.status === 'error' ? '✗' : '-' }}</el-tag></span>
            <div class="actions">
              <ElButton size="small" type="warning" @click="clearCache('proposal')">清除</ElButton>
              <ElButton size="small" @click="copyToClipboard(proposalMarkdown)">复制</ElButton>
              <ElButton size="small" type="primary" @click="exportMarkdown(proposalMarkdown, `proposal-${Date.now()}.md`)">导出 MD</ElButton>
            </div>
          </div>
          <pre class="content pre-content">{{ proposalMarkdown }}</pre>
        </ElTabPane>

        <ElTabPane label="需求" name="requirements">
          <div class="tab-header">
            <span>需求文档（PRD） <el-tag size="small" :type="requirementsState.status === 'generated' ? 'success' : requirementsState.status === 'error' ? 'danger' : 'info'">{{ requirementsState.status === 'generated' ? '✓' : requirementsState.status === 'error' ? '✗' : '-' }}</el-tag></span>
            <div class="actions">
              <ElButton size="small" type="warning" @click="clearCache('requirements')">清除</ElButton>
              <ElButton size="small" @click="copyToClipboard(requirementsMarkdown)">复制</ElButton>
              <ElButton size="small" type="primary" @click="exportMarkdown(requirementsMarkdown, `requirements-${Date.now()}.md`)">导出 MD</ElButton>
            </div>
          </div>
          <pre class="content pre-content">{{ requirementsMarkdown }}</pre>
        </ElTabPane>

        <ElTabPane label="架构" name="architecture">
          <div class="tab-header">
            <span>架构设计文档 <el-tag size="small" :type="architectureState.status === 'generated' ? 'success' : architectureState.status === 'error' ? 'danger' : 'info'">{{ architectureState.status === 'generated' ? '✓' : architectureState.status === 'error' ? '✗' : '-' }}</el-tag></span>
            <div class="actions">
              <ElButton size="small" type="warning" @click="clearCache('architecture')">清除</ElButton>
              <ElButton size="small" @click="copyToClipboard(architectureMarkdown)">复制</ElButton>
              <ElButton size="small" type="primary" @click="exportMarkdown(architectureMarkdown, `architecture-${Date.now()}.md`)">导出 MD</ElButton>
            </div>
          </div>
          <pre class="content pre-content">{{ architectureMarkdown }}</pre>
        </ElTabPane>

        <ElTabPane label="Steps" name="steps">
          <div class="tab-header">
            <span>Step 任务文档（共 {{ stepsResult?.length || 0 }} 个） <el-tag size="small" :type="stepsState.status === 'generated' ? 'success' : stepsState.status === 'error' ? 'danger' : 'info'">{{ stepsState.status === 'generated' ? '✓' : stepsState.status === 'error' ? '✗' : '-' }}</el-tag></span>
            <div class="actions">
              <ElButton size="small" type="warning" @click="clearCache('steps')">清除</ElButton>
              <ElButton size="small" @click="copyToClipboard(stepsMarkdown)">复制</ElButton>
              <ElButton size="small" type="primary" @click="exportMarkdown(stepsMarkdown, `steps-${Date.now()}.md`)">导出 MD</ElButton>
            </div>
          </div>
          <pre class="content pre-content">{{ stepsMarkdown }}</pre>
        </ElTabPane>

        <ElTabPane label="执行路线" name="steps-dev">
          <div class="tab-header">
            <span>开发路线（steps-dev） <el-tag size="small" :type="stepsDevState.status === 'generated' ? 'success' : stepsDevState.status === 'error' ? 'danger' : 'info'">{{ stepsDevState.status === 'generated' ? '✓' : stepsDevState.status === 'error' ? '✗' : '-' }}</el-tag></span>
            <div class="actions">
              <ElButton size="small" type="warning" @click="clearCache('stepsDev')">清除</ElButton>
              <ElButton size="small" @click="copyToClipboard(stepsDevMarkdown)">复制</ElButton>
              <ElButton size="small" type="primary" @click="exportMarkdown(stepsDevMarkdown, `steps-dev-${Date.now()}.md`)">导出 MD</ElButton>
            </div>
          </div>
          <pre class="content pre-content">{{ stepsDevMarkdown }}</pre>
        </ElTabPane>
      </ElTabs>
    </div>

    <ElEmpty v-else description="请输入需求描述，点击生成项目文档包" />
  </div>
</template>

<style scoped>
.document-generator {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
}

.subtitle {
  color: #909399;
  margin: 0;
}

.input-section {
  margin-bottom: 30px;
}

.upload-section {
  margin-bottom: 15px;
}
.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
.file-list {
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 8px;
}
.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid #e4e7ed;
}
.file-item:last-child {
  border-bottom: none;
}
.file-name {
  color: #606266;
  font-size: 14px;
}
.user-input {
  margin-top: 15px;
}
.generate-btn {
  width: 100%;
}

.result-section {
  margin-top: 20px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 10px;
}

.tab-header span {
  font-weight: bold;
  color: #303133;
}

.actions {
  display: flex;
  gap: 8px;
}

.content {
  line-height: 1.6;
  color: #606266;
}

.pre-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
}
</style>