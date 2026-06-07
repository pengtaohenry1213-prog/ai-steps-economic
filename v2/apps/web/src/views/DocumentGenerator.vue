<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElButton, ElInput, ElTabs, ElTabPane, ElMessage, ElEmpty, ElUpload, ElTag } from 'element-plus'
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
import DocumentEditorSimple from '@/components/DocumentEditorSimple.vue'

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

// 用户编辑的 Markdown 覆盖层（优先于 computed markdown 显示）
const userEditedMarkdown = reactive<Record<string, string>>({})

// 编辑弹窗状态
const showEditor = ref(false)
const editingStage = ref('')
const editingContent = ref('')

//兼容性 getter（供 computed 使用）
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
  // 恢复用户编辑内容
  try {
    const edited = localStorage.getItem('doc_user_edited')
    if (edited) {
      const parsed = JSON.parse(edited)
      Object.assign(userEditedMarkdown, parsed)
    }
  } catch (e) {
    console.warn('[Cache] Failed to load user edited markdown:', e)
  }
  await nextTick()
  console.log('[Cache] onMounted: Cache loading complete')
  console.log('[Cache] strategyState after load:', strategyState.status, strategyState.result ? 'has result' : 'no result')
})

// 计算各阶段显示内容（优先用户编辑）
const displayMarkdown = computed(() => ({
  strategy: userEditedMarkdown['strategy'] || strategyMarkdown.value,
  proposal: userEditedMarkdown['proposal'] || proposalMarkdown.value,
  requirements: userEditedMarkdown['requirements'] || requirementsMarkdown.value,
  architecture: userEditedMarkdown['architecture'] || architectureMarkdown.value,
  steps: userEditedMarkdown['steps'] || stepsMarkdown.value,
  stepsDev: userEditedMarkdown['stepsDev'] || stepsDevMarkdown.value,
}))

// 检查阶段是否被用户编辑过
function isEdited(stage: string) {
  return !!userEditedMarkdown[stage]
}

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
    ElMessage.error(`读取文件 ${uploadFile.name} 失败`)
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

function saveUserEditedMarkdown() {
  try {
    localStorage.setItem('doc_user_edited', JSON.stringify(userEditedMarkdown))
  } catch (e) {
    console.warn('[Cache] Failed to save user edited markdown:', e)
  }
}

// =====================
// 单步生成函数
// =====================

function getMergedInputForStage(): string {
  return getMergedInput()
}

async function generateStrategy() {
  const mergedInput = getMergedInputForStage()
  if (!mergedInput.trim()) {
    ElMessage.warning('请输入需求描述或上传文件')
    return
  }

  loading.value = true
  try {
    const aiService = createAIService()
    strategyState.status = 'generating'

    const matchResult = await matchStrategyWithAIService(aiService, { userInput: mergedInput })
    if (!matchResult.success || !matchResult.data) {
      ElMessage.error('策略匹配失败: ' + (matchResult.error || '未知错误'))
      strategyState.status = 'error'
      return
    }

    const enhancedResult = await enhanceStrategyWithAIService(aiService, matchResult.data, mergedInput)
    if (!enhancedResult) {
      ElMessage.error('策略增强失败')
      strategyState.status = 'error'
      return
    }

    strategyState.result = enhancedResult
    strategyState.status = 'generated'
    saveDocState('strategy', strategyState)
    ElMessage.success('策略生成成功')
    activeTab.value = 'strategy'
  } catch (error: any) {
    ElMessage.error('策略生成失败: ' + (error.message || '未知错误'))
    strategyState.status = 'error'
  } finally {
    loading.value = false
  }
}

async function generateProposal() {
  if (strategyState.status !== 'generated') {
    ElMessage.warning('请先生成策略')
    return
  }

  loading.value = true
  try {
    const aiService = createAIService()
    proposalState.status = 'generating'

    const deliverablesResult = await generateAllDeliverablesWithAIService(
      aiService,
      strategyState.result.basicResult,
      getMergedInputForStage(),
      undefined,
      strategyState.result.enhancedStrategy
    )

    if (deliverablesResult) {
      proposalState.result = deliverablesResult.proposal
      proposalState.status = 'generated'
      saveDocState('proposal', proposalState)
      ElMessage.success('立项书生成成功')
      activeTab.value = 'proposal'
    } else {
      proposalState.status = 'error'
      ElMessage.error('立项书生成失败')
    }
  } catch (error: any) {
    ElMessage.error('立项书生成失败: ' + (error.message || '未知错误'))
    proposalState.status = 'error'
  } finally {
    loading.value = false
  }
}

async function generateRequirements() {
  if (strategyState.status !== 'generated') {
    ElMessage.warning('请先生成策略')
    return
  }

  loading.value = true
  try {
    const aiService = createAIService()
    requirementsState.status = 'generating'

    const deliverablesResult = await generateAllDeliverablesWithAIService(
      aiService,
      strategyState.result.basicResult,
      getMergedInputForStage(),
      undefined,
      strategyState.result.enhancedStrategy
    )

    if (deliverablesResult) {
      requirementsState.result = deliverablesResult.requirements
      requirementsState.status = 'generated'
      saveDocState('requirements', requirementsState)
      ElMessage.success('需求文档生成成功')
      activeTab.value = 'requirements'
    } else {
      requirementsState.status = 'error'
      ElMessage.error('需求文档生成失败')
    }
  } catch (error: any) {
    ElMessage.error('需求文档生成失败: ' + (error.message || '未知错误'))
    requirementsState.status = 'error'
  } finally {
    loading.value = false
  }
}

async function generateArchitecture() {
  if (strategyState.status !== 'generated') {
    ElMessage.warning('请先生成策略')
    return
  }

  loading.value = true
  try {
    const aiService = createAIService()
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
        getMergedInputForStage(),
        undefined,
        strategyState.result.enhancedStrategy
      )
      retries++
    }

    if (deliverablesResult) {
      architectureState.result = deliverablesResult.architecture
      architectureState.status = 'generated'
      saveDocState('architecture', architectureState)
      ElMessage.success('架构设计文档生成成功')
      activeTab.value = 'architecture'
    } else {
      architectureState.status = 'error'
      ElMessage.error('架构设计文档生成失败')
    }
  } catch (error: any) {
    ElMessage.error('架构设计文档生成失败: ' + (error.message || '未知错误'))
    architectureState.status = 'error'
  } finally {
    loading.value = false
  }
}

async function generateStepsAndExecution() {
  if (architectureState.status !== 'generated') {
    ElMessage.warning('请先生成架构文档')
    return
  }

  loading.value = true
  try {
    const aiService = createAIService()

    // 生成 Steps
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

        // 生成执行路线
        stepsDevState.status = 'generating'
        const stepsDevResultData = await generateStepsDevDocument(aiService, stepsResultData)
        if (stepsDevResultData) {
          stepsDevState.result = stepsDevResultData
          stepsDevState.status = 'generated'
          saveDocState('stepsDev', stepsDevState)
          ElMessage.success('Steps 和执行路线生成成功')
          activeTab.value = 'steps'
        } else {
          stepsDevState.status = 'error'
          ElMessage.error('执行路线生成失败')
        }
      } else {
        stepsState.status = 'error'
        ElMessage.error('Steps 生成失败')
      }
    } catch (e) {
      console.error('Steps generation error:', e)
      stepsState.status = 'error'
    }
  } catch (error: any) {
    ElMessage.error('Steps 和执行路线生成失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// =====================
// 旧的一键生成函数（保留用于批量操作）
// =====================

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

// =====================
// 编辑功能
// =====================

function editDoc(stage: string) {
  editingStage.value = stage
  editingContent.value = displayMarkdown.value[stage as keyof typeof displayMarkdown.value] || ''
  showEditor.value = true
}

function saveEditedContent(content: string) {
  userEditedMarkdown[editingStage.value] = content
  saveUserEditedMarkdown()

  // 触发下游失效逻辑
  invalidateDownstream(editingStage.value)

  showEditor.value = false
  ElMessage.success('保存成功')
}

function invalidateDownstream(stage: string) {
  switch (stage) {
    case 'strategy':
      // 策略修改：清空所有下游
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
      clearDocCacheFromStorage('proposal')
      clearDocCacheFromStorage('requirements')
      clearDocCacheFromStorage('architecture')
      clearDocCacheFromStorage('steps')
      clearDocCacheFromStorage('stepsDev')
      // 清除下游的用户编辑覆盖
      delete userEditedMarkdown['proposal']
      delete userEditedMarkdown['requirements']
      delete userEditedMarkdown['architecture']
      delete userEditedMarkdown['steps']
      delete userEditedMarkdown['stepsDev']
      saveUserEditedMarkdown()
      ElMessage.warning('策略已修改，所有下游文档已清空，需重新生成')
      break

    case 'architecture':
      // 架构修改：清空 Steps 和执行路线
      stepsState.result = []
      stepsState.status = 'none'
      stepsDevState.result = null
      stepsDevState.status = 'none'
      clearDocCacheFromStorage('steps')
      clearDocCacheFromStorage('stepsDev')
      delete userEditedMarkdown['steps']
      delete userEditedMarkdown['stepsDev']
      saveUserEditedMarkdown()
      ElMessage.warning('架构文档已修改，Steps 和执行路线已清空，需重新生成')
      break

    case 'steps':
      // Steps 修改：清空执行路线
      stepsDevState.result = null
      stepsDevState.status = 'none'
      clearDocCacheFromStorage('stepsDev')
      delete userEditedMarkdown['stepsDev']
      saveUserEditedMarkdown()
      ElMessage.warning('Steps 已修改，执行路线已清空，需重新生成')
      break

    default:
      // 立项书、需求、执行路线：无需清空下游
      break
  }
}

// =====================
// 辅助功能
// =====================

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
    Object.keys(userEditedMarkdown).forEach(k => delete userEditedMarkdown[k])
    clearDocCacheFromStorage('all')
    localStorage.removeItem('doc_user_edited')
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
      delete userEditedMarkdown[docType]
      saveUserEditedMarkdown()
      ElMessage.success(`已清除 ${docType} 缓存`)
    }
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

  if (displayMarkdown.value.strategy) zip.file(`strategy-${Date.now()}.md`, displayMarkdown.value.strategy)
  if (displayMarkdown.value.proposal) zip.file(`proposal-${Date.now()}.md`, displayMarkdown.value.proposal)
  if (displayMarkdown.value.requirements) zip.file(`requirements-${Date.now()}.md`, displayMarkdown.value.requirements)
  if (displayMarkdown.value.architecture) zip.file(`architecture-${Date.now()}.md`, displayMarkdown.value.architecture)
  if (displayMarkdown.value.steps) zip.file(`steps-${Date.now()}.md`, displayMarkdown.value.steps)
  if (displayMarkdown.value.stepsDev) zip.file(`steps-dev-${Date.now()}.md`, displayMarkdown.value.stepsDev)

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

// 阶段生成状态映射（用于按钮禁用判断）
const canGenerateProposal = computed(() => strategyState.status === 'generated')
const canGenerateRequirements = computed(() => strategyState.status === 'generated')
const canGenerateArchitecture = computed(() => strategyState.status === 'generated')
const canGenerateSteps = computed(() => architectureState.status === 'generated')

// 阶段状态标签类型
function getStatusTagType(status: DocStatus): 'success' | 'danger' | 'info' | 'warning' {
  switch (status) {
    case 'generated': return 'success'
    case 'error': return 'danger'
    case 'generating': return 'warning'
    default: return 'info'
  }
}

function getStatusLabel(status: DocStatus): string {
  switch (status) {
    case 'generated': return '✓'
    case 'error': return '✗'
    case 'generating': return '生成中'
    default: return '-'
  }
}

// 阶段标题映射
const stageTitles: Record<string, string> = {
  strategy: '策略',
  proposal: '立项书',
  requirements: '需求',
  architecture: '架构',
  steps: 'Steps',
  stepsDev: '执行路线'
}
</script>

<template>
  <div class="document-generator">
    <div class="header">
      <h2>项目文档生成器</h2>
      <p class="subtitle">输入需求，逐步生成策略/立项书/需求文档/架构书/Step/执行路线</p>
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
    </div>

    <!-- 单步生成按钮组 -->
    <div class="step-generate-section">
      <h3 class="section-title">📋 生成步骤</h3>
      <div class="step-buttons">
        <!-- Step 1: 策略 -->
        <div class="step-item">
          <div class="step-label">
            <span class="step-num">1</span>
            <span class="step-name">策略</span>
            <ElTag size="small" :type="getStatusTagType(strategyState.status)">{{ getStatusLabel(strategyState.status) }}</ElTag>
            <ElTag v-if="isEdited('strategy')" size="small" type="warning">已编辑</ElTag>
          </div>
          <ElButton
            size="small"
            type="primary"
            :loading="strategyState.status === 'generating'"
            :disabled="strategyState.status === 'generated' || strategyState.status === 'generating'"
            @click="generateStrategy"
          >
            {{ strategyState.status === 'generated' ? '已生成' : strategyState.status === 'generating' ? '生成中...' : '生成策略' }}
          </ElButton>
        </div>

        <!-- Step 2: 立项书 -->
        <div class="step-item">
          <div class="step-label">
            <span class="step-num">2</span>
            <span class="step-name">立项书</span>
            <ElTag size="small" :type="getStatusTagType(proposalState.status)">{{ getStatusLabel(proposalState.status) }}</ElTag>
            <ElTag v-if="isEdited('proposal')" size="small" type="warning">已编辑</ElTag>
          </div>
          <ElButton
            size="small"
            type="primary"
            :loading="proposalState.status === 'generating'"
            :disabled="!canGenerateProposal || proposalState.status === 'generated' || proposalState.status === 'generating'"
            @click="generateProposal"
          >
            {{ proposalState.status === 'generated' ? '已生成' : proposalState.status === 'generating' ? '生成中...' : '生成立项书' }}
          </ElButton>
        </div>

        <!-- Step 3: 需求 -->
        <div class="step-item">
          <div class="step-label">
            <span class="step-num">3</span>
            <span class="step-name">需求</span>
            <ElTag size="small" :type="getStatusTagType(requirementsState.status)">{{ getStatusLabel(requirementsState.status) }}</ElTag>
            <ElTag v-if="isEdited('requirements')" size="small" type="warning">已编辑</ElTag>
          </div>
          <ElButton
            size="small"
            type="primary"
            :loading="requirementsState.status === 'generating'"
            :disabled="!canGenerateRequirements || requirementsState.status === 'generated' || requirementsState.status === 'generating'"
            @click="generateRequirements"
          >
            {{ requirementsState.status === 'generated' ? '已生成' : requirementsState.status === 'generating' ? '生成中...' : '生成需求' }}
          </ElButton>
        </div>

        <!-- Step 4: 架构 -->
        <div class="step-item">
          <div class="step-label">
            <span class="step-num">4</span>
            <span class="step-name">架构</span>
            <ElTag size="small" :type="getStatusTagType(architectureState.status)">{{ getStatusLabel(architectureState.status) }}</ElTag>
            <ElTag v-if="isEdited('architecture')" size="small" type="warning">已编辑</ElTag>
          </div>
          <ElButton
            size="small"
            type="primary"
            :loading="architectureState.status === 'generating'"
            :disabled="!canGenerateArchitecture || architectureState.status === 'generated' || architectureState.status === 'generating'"
            @click="generateArchitecture"
          >
            {{ architectureState.status === 'generated' ? '已生成' : architectureState.status === 'generating' ? '生成中...' : '生成架构' }}
          </ElButton>
        </div>

        <!-- Step 5: Steps + 执行路线 -->
        <div class="step-item">
          <div class="step-label">
            <span class="step-num">5</span>
            <span class="step-name">Steps + 执行路线</span>
            <ElTag size="small" :type="getStatusTagType(stepsState.status)">{{ getStatusLabel(stepsState.status) }}</ElTag>
            <ElTag size="small" :type="getStatusTagType(stepsDevState.status)">{{ getStatusLabel(stepsDevState.status) }}</ElTag>
            <ElTag v-if="isEdited('steps')" size="small" type="warning">Steps已编辑</ElTag>
            <ElTag v-if="isEdited('stepsDev')" size="small" type="warning">执行路线已编辑</ElTag>
          </div>
          <ElButton
            size="small"
            type="primary"
            :loading="stepsState.status === 'generating' || stepsDevState.status === 'generating'"
            :disabled="!canGenerateSteps || stepsState.status === 'generated' || stepsState.status === 'generating'"
            @click="generateStepsAndExecution"
          >
            {{ stepsState.status === 'generated' ? '已生成' : stepsState.status === 'generating' ? '生成中...' : '生成 Steps + 执行路线' }}
          </ElButton>
        </div>
      </div>
    </div>

    <!-- 文档展示区 -->
    <div v-if="strategyResult" class="result-section">
      <ElTabs v-model="activeTab" type="border-card">
        <ElTabPane label="策略" name="strategy">
          <div class="tab-header">
            <span>开发策略文档
              <el-tag size="small" :type="getStatusTagType(strategyState.status)">{{ getStatusLabel(strategyState.status) }}</el-tag>
              <el-tag v-if="isEdited('strategy')" size="small" type="warning">已编辑</el-tag>
            </span>
            <div class="actions">
              <ElButton size="small" type="warning" @click="clearCache('strategy')">清除</ElButton>
              <ElButton size="small" @click="copyToClipboard(displayMarkdown.strategy)">复制</ElButton>
              <ElButton size="small" type="primary" @click="editDoc('strategy')">编辑</ElButton>
              <ElButton size="small" type="success" @click="exportMarkdown(displayMarkdown.strategy, `strategy-${Date.now()}.md`)">导出 MD</ElButton>
            </div>
          </div>
          <div class="content" v-html="displayMarkdown.strategy?.replace(/\n/g, '<br>') || ''"></div>
        </ElTabPane>

        <ElTabPane label="立项书" name="proposal">
          <div class="tab-header">
            <span>立项书文档
              <el-tag size="small" :type="getStatusTagType(proposalState.status)">{{ getStatusLabel(proposalState.status) }}</el-tag>
              <el-tag v-if="isEdited('proposal')" size="small" type="warning">已编辑</el-tag>
            </span>
            <div class="actions">
              <ElButton size="small" type="warning" @click="clearCache('proposal')">清除</ElButton>
              <ElButton size="small" @click="copyToClipboard(displayMarkdown.proposal)">复制</ElButton>
              <ElButton size="small" type="primary" @click="editDoc('proposal')">编辑</ElButton>
              <ElButton size="small" type="success" @click="exportMarkdown(displayMarkdown.proposal, `proposal-${Date.now()}.md`)">导出 MD</ElButton>
            </div>
          </div>
          <pre class="content pre-content">{{ displayMarkdown.proposal }}</pre>
        </ElTabPane>

        <ElTabPane label="需求" name="requirements">
          <div class="tab-header">
            <span>需求文档（PRD）
              <el-tag size="small" :type="getStatusTagType(requirementsState.status)">{{ getStatusLabel(requirementsState.status) }}</el-tag>
              <el-tag v-if="isEdited('requirements')" size="small" type="warning">已编辑</el-tag>
            </span>
            <div class="actions">
              <ElButton size="small" type="warning" @click="clearCache('requirements')">清除</ElButton>
              <ElButton size="small" @click="copyToClipboard(displayMarkdown.requirements)">复制</ElButton>
              <ElButton size="small" type="primary" @click="editDoc('requirements')">编辑</ElButton>
              <ElButton size="small" type="success" @click="exportMarkdown(displayMarkdown.requirements, `requirements-${Date.now()}.md`)">导出 MD</ElButton>
            </div>
          </div>
          <pre class="content pre-content">{{ displayMarkdown.requirements }}</pre>
        </ElTabPane>

        <ElTabPane label="架构" name="architecture">
          <div class="tab-header">
            <span>架构设计文档
              <el-tag size="small" :type="getStatusTagType(architectureState.status)">{{ getStatusLabel(architectureState.status) }}</el-tag>
              <el-tag v-if="isEdited('architecture')" size="small" type="warning">已编辑</el-tag>
            </span>
            <div class="actions">
              <ElButton size="small" type="warning" @click="clearCache('architecture')">清除</ElButton>
              <ElButton size="small" @click="copyToClipboard(displayMarkdown.architecture)">复制</ElButton>
              <ElButton size="small" type="primary" @click="editDoc('architecture')">编辑</ElButton>
              <ElButton size="small" type="success" @click="exportMarkdown(displayMarkdown.architecture, `architecture-${Date.now()}.md`)">导出 MD</ElButton>
            </div>
          </div>
          <pre class="content pre-content">{{ displayMarkdown.architecture }}</pre>
        </ElTabPane>

        <ElTabPane label="Steps" name="steps">
          <div class="tab-header">
            <span>Step 任务文档（共 {{ stepsResult?.length || 0 }} 个）
              <el-tag size="small" :type="getStatusTagType(stepsState.status)">{{ getStatusLabel(stepsState.status) }}</el-tag>
              <el-tag v-if="isEdited('steps')" size="small" type="warning">已编辑</el-tag>
            </span>
            <div class="actions">
              <ElButton size="small" type="warning" @click="clearCache('steps')">清除</ElButton>
              <ElButton size="small" @click="copyToClipboard(displayMarkdown.steps)">复制</ElButton>
              <ElButton size="small" type="primary" @click="editDoc('steps')">编辑</ElButton>
              <ElButton size="small" type="success" @click="exportMarkdown(displayMarkdown.steps, `steps-${Date.now()}.md`)">导出 MD</ElButton>
            </div>
          </div>
          <pre class="content pre-content">{{ displayMarkdown.steps }}</pre>
        </ElTabPane>

        <ElTabPane label="执行路线" name="steps-dev">
          <div class="tab-header">
            <span>开发路线（steps-dev）
              <el-tag size="small" :type="getStatusTagType(stepsDevState.status)">{{ getStatusLabel(stepsDevState.status) }}</el-tag>
              <el-tag v-if="isEdited('stepsDev')" size="small" type="warning">已编辑</el-tag>
            </span>
            <div class="actions">
              <ElButton size="small" type="warning" @click="clearCache('stepsDev')">清除</ElButton>
              <ElButton size="small" @click="copyToClipboard(displayMarkdown.stepsDev)">复制</ElButton>
              <ElButton size="small" type="primary" @click="editDoc('stepsDev')">编辑</ElButton>
              <ElButton size="small" type="success" @click="exportMarkdown(displayMarkdown.stepsDev, `steps-dev-${Date.now()}.md`)">导出 MD</ElButton>
            </div>
          </div>
          <pre class="content pre-content">{{ displayMarkdown.stepsDev }}</pre>
        </ElTabPane>
      </ElTabs>
    </div>

    <ElEmpty v-else description="请输入需求描述，点击上方生成步骤开始生成项目文档包" />

    <!-- 编辑弹窗 -->
    <DocumentEditorSimple
      v-model="showEditor"
      :content="editingContent"
      :stage-name="editingStage"
      :stage-title="stageTitles[editingStage] || '文档编辑器'"
      :stage-status="strategyState.status"
      @save="saveEditedContent"
    />
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
  margin-bottom: 20px;
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

/* 单步生成区域 */
.step-generate-section {
  margin-bottom: 30px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
}

.step-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.step-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.step-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #409eff;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
}

.step-name {
  font-weight: 500;
  color: #303133;
  min-width: 100px;
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
  display: flex;
  align-items: center;
  gap: 8px;
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