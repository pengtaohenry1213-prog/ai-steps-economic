/**
 * 文档数据规范化服务
 * 统一处理 Ollama 输出的不同数据结构，确保 DocumentEditor 读取数据的准确性
 */

import type { PromptType } from '@/config/aiPrompts'

/**
 * 统一的文档内容结构（用于 DocumentEditor 渲染）
 */
export interface UnifiedDocument {
  /** 文档类型 */
  type: PromptType
  /** 文档标题/名称 */
  title: string
  /** 文档元信息 */
  meta: {
    createdAt?: string
    updatedAt?: string
    author?: string
    version?: string
  }
  /** 章节列表（统一结构） */
  sections: DocumentSection[]
  /** 原始完整文本（Markdown 格式，用于预览） */
  fullText?: string
  /** 原始 JSON 数据（用于源码模式） */
  rawJson?: Record<string, unknown>
}

export interface DocumentSection {
  /** 章节 ID */
  id: string
  /** 章节标题 */
  title: string
  /** 章节层级 */
  level: 1 | 2 | 3
  /** 章节类型 */
  type: 'info' | 'list' | 'table' | 'code' | 'custom'
  /** 章节内容 */
  content: SectionContent
  /** 子章节 */
  children?: DocumentSection[]
}

export type SectionContent = 
  | TextContent
  | ListContent
  | TableContent
  | KeyValueContent
  | CustomContent

export interface TextContent {
  type: 'text'
  value: string
}

export interface ListContent {
  type: 'list'
  ordered?: boolean
  items: string[]
}

export interface TableContent {
  type: 'table'
  headers: string[]
  rows: string[][]
}

export interface KeyValueContent {
  type: 'keyValue'
  items: Record<string, string | string[]>
}

export interface CustomContent {
  type: 'custom'
  data: unknown
}

/**
 * 各类型文档的字段映射
 */
const FIELD_MAPPINGS: Record<PromptType, {
  titleField: string
  sectionBuilders: SectionBuilder[]
}> = {
  proposal: {
    titleField: 'basicInfo.name',
    sectionBuilders: [
      buildBasicInfoSection,
      buildBackgroundSection,
      buildScopeSection,
      buildAcceptanceSection,
      buildMilestonesSection,
      buildRisksSection,
      buildHumanGateSection,
    ]
  },
  requirement: {
    titleField: 'overview',
    sectionBuilders: [
      buildOverviewSection,
      buildUserStoriesSection,
      buildFunctionalSection,
      buildNonFunctionalSection,
      buildAcceptanceCriteriaSection,
      buildPrioritySection,
    ]
  },
  architecture: {
    titleField: 'overview',
    sectionBuilders: [
      buildArchitectureOverviewSection,
      buildComponentsSection,
      buildDataModelSection,
      buildApiDesignSection,
      buildSecuritySection,
      buildDeploymentSection,
      buildTechStackSection,
    ]
  },
  prd: {
    titleField: 'productOverview',
    sectionBuilders: [
      buildProductOverviewSection,
      buildTargetUsersSection,
      buildCoreFeaturesSection,
      buildFeatureDetailsSection,
      buildUserFlowsSection,
      buildMetricsSection,
    ]
  },
  test_plan: {
    titleField: 'testScope',
    sectionBuilders: [
      buildTestScopeSection,
      buildTestStrategySection,
      buildTestTypesSection,
      buildTestEnvironmentSection,
      buildTestScheduleSection,
      buildTestDeliverablesSection,
      buildTestCasesSection,
    ]
  },
  acceptance: {
    titleField: 'summary',
    sectionBuilders: [
      buildAcceptanceSummarySection,
      buildScopeVerificationSection,
      buildCriteriaVerificationSection,
      buildDefectsSection,
      buildSignOffSection,
    ]
  },
  deployment: {
    titleField: 'environments',
    sectionBuilders: [
      buildEnvironmentsSection,
      buildDeploymentStepsSection,
      buildRollbackSection,
      buildMonitoringSection,
      buildSecurityConfigSection,
    ]
  },
  requirement_analysis: {
    titleField: 'summary',
    sectionBuilders: [
      buildAnalysisCoveredSection,
      buildAnalysisMissingSection,
      buildBestPracticesSection,
      buildAnalysisSummarySection,
    ]
  }
}

type SectionBuilder = (data: Record<string, unknown>) => DocumentSection | null

// ============ 辅助函数 ============

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

function isNonEmpty(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'string') return value.trim().length > 0
  if (value && typeof value === 'object') return Object.keys(value).length > 0
  return false
}

// ============ 立项书 Section Builders ============

function buildBasicInfoSection(data: Record<string, unknown>): DocumentSection | null {
  const basicInfo = data.basicInfo as Record<string, unknown> | undefined
  if (!basicInfo) return null
  
  const items: Record<string, string | string[]> = {}
  if (basicInfo.name) items['项目名称'] = String(basicInfo.name)
  if (basicInfo.type) items['项目类型'] = String(basicInfo.type)
  if (basicInfo.decisionMakers && Array.isArray(basicInfo.decisionMakers)) {
    items['决策人'] = basicInfo.decisionMakers.map(String)
  }
  
  if (Object.keys(items).length === 0) return null
  
  return {
    id: 'basic-info',
    title: '项目基本信息',
    level: 1,
    type: 'keyValue',
    content: { type: 'keyValue', items }
  }
}

function buildBackgroundSection(data: Record<string, unknown>): DocumentSection | null {
  const background = data.background
  if (!background) return null
  
  return {
    id: 'background',
    title: '项目背景',
    level: 1,
    type: 'info',
    content: { type: 'text', value: String(background) }
  }
}

function buildScopeSection(data: Record<string, unknown>): DocumentSection | null {
  const scope = data.scope as Record<string, unknown> | undefined
  if (!scope) return null
  
  const children: DocumentSection[] = []
  
  if (scope.inScope) {
    const inScope = scope.inScope
    if (typeof inScope === 'object' && !Array.isArray(inScope)) {
      const priorityItems: string[] = []
      for (const [priority, items] of Object.entries(inScope)) {
        if (Array.isArray(items) && items.length > 0) {
          priorityItems.push(`**${priority}**: ${(items as string[]).join('、')}`)
        }
      }
      if (priorityItems.length > 0) {
        children.push({
          id: 'in-scope',
          title: 'In Scope',
          level: 2,
          type: 'info',
          content: { type: 'text', value: priorityItems.join('\n\n') }
        })
      }
    } else if (Array.isArray(inScope)) {
      children.push({
        id: 'in-scope',
        title: 'In Scope',
        level: 2,
        type: 'list',
        content: { type: 'list', items: inScope.map(String) }
      })
    }
  }
  
  if (scope.outScope && Array.isArray(scope.outScope) && scope.outScope.length > 0) {
    children.push({
      id: 'out-scope',
      title: 'Out of Scope',
      level: 2,
      type: 'list',
      content: { type: 'list', items: scope.outScope.map(String) }
    })
  }
  
  if (children.length === 0) return null
  
  return {
    id: 'scope',
    title: '项目范围',
    level: 1,
    type: 'info',
    content: { type: 'custom', data: null },
    children
  }
}

function buildAcceptanceSection(data: Record<string, unknown>): DocumentSection | null {
  const acceptance = data.acceptance
  if (!acceptance) return null
  
  if (typeof acceptance === 'string') {
    return {
      id: 'acceptance',
      title: '验收标准',
      level: 1,
      type: 'info',
      content: { type: 'text', value: acceptance }
    }
  }
  
  if (typeof acceptance === 'object') {
    const acc = acceptance as Record<string, unknown>
    const children: DocumentSection[] = []
    
    if (acc.functionality && Array.isArray(acc.functionality) && acc.functionality.length > 0) {
      children.push({
        id: 'acceptance-functionality',
        title: '功能验收',
        level: 2,
        type: 'list',
        content: { type: 'list', items: acc.functionality.map(String) }
      })
    }
    
    if (acc.performance && typeof acc.performance === 'object') {
      const perf = acc.performance as Record<string, string>
      const items: string[] = []
      for (const [key, value] of Object.entries(perf)) {
        items.push(`**${key}**: ${value}`)
      }
      if (items.length > 0) {
        children.push({
          id: 'acceptance-performance',
          title: '性能验收',
          level: 2,
          type: 'info',
          content: { type: 'text', value: items.join('\n') }
        })
      }
    }
    
    if (acc.security && Array.isArray(acc.security) && acc.security.length > 0) {
      children.push({
        id: 'acceptance-security',
        title: '安全验收',
        level: 2,
        type: 'list',
        content: { type: 'list', items: acc.security.map(String) }
      })
    }
    
    if (children.length === 0) return null
    
    return {
      id: 'acceptance',
      title: '验收标准',
      level: 1,
      type: 'info',
      content: { type: 'custom', data: null },
      children
    }
  }
  
  return null
}

function buildMilestonesSection(data: Record<string, unknown>): DocumentSection | null {
  const milestones = data.milestones
  if (!milestones) return null
  
  if (Array.isArray(milestones) && milestones.length > 0) {
    return {
      id: 'milestones',
      title: '里程碑计划',
      level: 1,
      type: 'list',
      content: { type: 'list', ordered: true, items: milestones.map(String) }
    }
  }
  
  if (typeof milestones === 'string' && milestones.trim()) {
    return {
      id: 'milestones',
      title: '里程碑计划',
      level: 1,
      type: 'info',
      content: { type: 'text', value: milestones }
    }
  }
  
  return null
}

function buildRisksSection(data: Record<string, unknown>): DocumentSection | null {
  const risks = data.risks
  if (!risks) return null
  
  if (Array.isArray(risks) && risks.length > 0) {
    const children: DocumentSection[] = []
    const byLevel: Record<string, string[]> = { '高': [], '中': [], '低': [] }
    
    for (const risk of risks) {
      if (typeof risk === 'object' && risk !== null) {
        const r = risk as Record<string, unknown>
        const level = String(r.type || '中')
        const desc = String(r.description || '')
        const impact = String(r.impact || '')
        const counter = String(r.countermeasure || '')
        const text = `**${desc}**\n影响: ${impact}\n应对: ${counter}`
        if (byLevel[level]) {
          byLevel[level].push(text)
        }
      }
    }
    
    for (const [level, items] of Object.entries(byLevel)) {
      if (items.length > 0) {
        children.push({
          id: `risk-${level}`,
          title: `${level}风险`,
          level: 2,
          type: 'info',
          content: { type: 'text', value: items.join('\n\n') }
        })
      }
    }
    
    if (children.length === 0) return null
    
    return {
      id: 'risks',
      title: '风险评估',
      level: 1,
      type: 'info',
      content: { type: 'custom', data: null },
      children
    }
  }
  
  return null
}

function buildHumanGateSection(data: Record<string, unknown>): DocumentSection | null {
  const humanGate = data.humanGate
  if (!humanGate) return null
  
  if (typeof humanGate === 'object') {
    const hg = humanGate as Record<string, unknown>
    const children: DocumentSection[] = []
    
    if (hg.pmo && Array.isArray(hg.pmo) && hg.pmo.length > 0) {
      children.push({
        id: 'hg-pmo',
        title: 'PMO 检查项',
        level: 2,
        type: 'list',
        content: { type: 'list', items: hg.pmo.map(String) }
      })
    }
    
    if (hg.security && Array.isArray(hg.security) && hg.security.length > 0) {
      children.push({
        id: 'hg-security',
        title: '安全检查项',
        level: 2,
        type: 'list',
        content: { type: 'list', items: hg.security.map(String) }
      })
    }
    
    if (children.length === 0) return null
    
    return {
      id: 'human-gate',
      title: 'Human Gate',
      level: 1,
      type: 'info',
      content: { type: 'custom', data: null },
      children
    }
  }
  
  return null
}

// ============ 需求文档 Section Builders ============

function buildOverviewSection(data: Record<string, unknown>): DocumentSection | null {
  const overview = data.overview
  if (!overview) return null
  return {
    id: 'overview',
    title: '需求概述',
    level: 1,
    type: 'info',
    content: { type: 'text', value: String(overview) }
  }
}

function buildUserStoriesSection(data: Record<string, unknown>): DocumentSection | null {
  const userStories = data.userStories
  if (!userStories || !Array.isArray(userStories) || userStories.length === 0) return null
  return {
    id: 'user-stories',
    title: '用户故事',
    level: 1,
    type: 'list',
    content: { type: 'list', items: userStories.map(String) }
  }
}

function buildFunctionalSection(data: Record<string, unknown>): DocumentSection | null {
  const functionalRequirements = data.functionalRequirements
  if (!functionalRequirements || !Array.isArray(functionalRequirements) || functionalRequirements.length === 0) return null
  return {
    id: 'functional',
    title: '功能需求',
    level: 1,
    type: 'list',
    content: { type: 'list', items: functionalRequirements.map(String) }
  }
}

function buildNonFunctionalSection(data: Record<string, unknown>): DocumentSection | null {
  const nonFunctionalRequirements = data.nonFunctionalRequirements
  if (!nonFunctionalRequirements || typeof nonFunctionalRequirements !== 'object') return null
  
  const items: Record<string, string> = {}
  for (const [key, value] of Object.entries(nonFunctionalRequirements)) {
    items[key] = String(value)
  }
  
  if (Object.keys(items).length === 0) return null
  return {
    id: 'non-functional',
    title: '非功能需求',
    level: 1,
    type: 'keyValue',
    content: { type: 'keyValue', items }
  }
}

function buildAcceptanceCriteriaSection(data: Record<string, unknown>): DocumentSection | null {
  const acceptanceCriteria = data.acceptanceCriteria
  if (!acceptanceCriteria || !Array.isArray(acceptanceCriteria) || acceptanceCriteria.length === 0) return null
  return {
    id: 'criteria',
    title: '验收标准',
    level: 1,
    type: 'list',
    content: { type: 'list', items: acceptanceCriteria.map(String) }
  }
}

function buildPrioritySection(data: Record<string, unknown>): DocumentSection | null {
  const priority = data.priority
  if (!priority || typeof priority !== 'object') return null
  
  const p = priority as Record<string, string[]>
  const children: DocumentSection[] = []
  
  for (const [level, items] of Object.entries(p)) {
    if (Array.isArray(items) && items.length > 0) {
      children.push({
        id: `priority-${level}`,
        title: level,
        level: 2,
        type: 'list',
        content: { type: 'list', items }
      })
    }
  }
  
  if (children.length === 0) return null
  return {
    id: 'priority',
    title: '优先级',
    level: 1,
    type: 'info',
    content: { type: 'custom', data: null },
    children
  }
}

// ============ 架构文档 Section Builders ============

function buildArchitectureOverviewSection(data: Record<string, unknown>): DocumentSection | null {
  const overview = data.overview
  const architectureType = data.architectureType
  if (!overview && !architectureType) return null
  
  const content = [overview, architectureType].filter(Boolean).join('\n\n')
  return {
    id: 'architecture-overview',
    title: '架构概述',
    level: 1,
    type: 'info',
    content: { type: 'text', value: content }
  }
}

function buildComponentsSection(data: Record<string, unknown>): DocumentSection | null {
  const components = data.components
  if (!components || !Array.isArray(components) || components.length === 0) return null
  return {
    id: 'components',
    title: '组件设计',
    level: 1,
    type: 'list',
    content: { type: 'list', items: components.map(String) }
  }
}

function buildDataModelSection(data: Record<string, unknown>): DocumentSection | null {
  const dataModel = data.dataModel
  if (!dataModel || typeof dataModel !== 'object') return null
  return {
    id: 'data-model',
    title: '数据模型',
    level: 1,
    type: 'code',
    content: { type: 'custom', data: dataModel }
  }
}

function buildApiDesignSection(data: Record<string, unknown>): DocumentSection | null {
  const apiDesign = data.apiDesign
  if (!apiDesign || !Array.isArray(apiDesign) || apiDesign.length === 0) return null
  return {
    id: 'api-design',
    title: 'API 设计',
    level: 1,
    type: 'code',
    content: { type: 'custom', data: apiDesign }
  }
}

function buildSecuritySection(data: Record<string, unknown>): DocumentSection | null {
  const securityDesign = data.securityDesign
  if (!securityDesign || typeof securityDesign !== 'object') return null
  return {
    id: 'security',
    title: '安全设计',
    level: 1,
    type: 'keyValue',
    content: { type: 'keyValue', items: securityDesign as Record<string, string> }
  }
}

function buildDeploymentSection(data: Record<string, unknown>): DocumentSection | null {
  const deploymentArchitecture = data.deploymentArchitecture
  if (!deploymentArchitecture) return null
  return {
    id: 'deployment',
    title: '部署架构',
    level: 1,
    type: 'info',
    content: { type: 'text', value: String(deploymentArchitecture) }
  }
}

function buildTechStackSection(data: Record<string, unknown>): DocumentSection | null {
  const techStack = data.techStack
  if (!techStack || !Array.isArray(techStack) || techStack.length === 0) return null
  return {
    id: 'tech-stack',
    title: '技术选型',
    level: 1,
    type: 'list',
    content: { type: 'list', items: techStack.map(String) }
  }
}

// ============ PRD Section Builders ============

function buildProductOverviewSection(data: Record<string, unknown>): DocumentSection | null {
  const productOverview = data.productOverview
  if (!productOverview) return null
  return {
    id: 'product-overview',
    title: '产品概述',
    level: 1,
    type: 'info',
    content: { type: 'text', value: String(productOverview) }
  }
}

function buildTargetUsersSection(data: Record<string, unknown>): DocumentSection | null {
  const targetUsers = data.targetUsers
  if (!targetUsers || !Array.isArray(targetUsers) || targetUsers.length === 0) return null
  return {
    id: 'target-users',
    title: '目标用户',
    level: 1,
    type: 'list',
    content: { type: 'list', items: targetUsers.map(String) }
  }
}

function buildCoreFeaturesSection(data: Record<string, unknown>): DocumentSection | null {
  const coreFeatures = data.coreFeatures
  if (!coreFeatures || !Array.isArray(coreFeatures) || coreFeatures.length === 0) return null
  return {
    id: 'core-features',
    title: '核心功能',
    level: 1,
    type: 'list',
    content: { type: 'list', items: coreFeatures.map(String) }
  }
}

function buildFeatureDetailsSection(data: Record<string, unknown>): DocumentSection | null {
  const featureDetails = data.featureDetails
  if (!featureDetails || !Array.isArray(featureDetails) || featureDetails.length === 0) return null
  return {
    id: 'feature-details',
    title: '功能详情',
    level: 1,
    type: 'list',
    content: { type: 'list', items: featureDetails.map(String) }
  }
}

function buildUserFlowsSection(data: Record<string, unknown>): DocumentSection | null {
  const userFlows = data.userFlows
  if (!userFlows || !Array.isArray(userFlows) || userFlows.length === 0) return null
  return {
    id: 'user-flows',
    title: '用户流程',
    level: 1,
    type: 'list',
    content: { type: 'list', items: userFlows.map(String) }
  }
}

function buildMetricsSection(data: Record<string, unknown>): DocumentSection | null {
  const metrics = data.metrics
  if (!metrics || !Array.isArray(metrics) || metrics.length === 0) return null
  return {
    id: 'metrics',
    title: '数据指标',
    level: 1,
    type: 'list',
    content: { type: 'list', items: metrics.map(String) }
  }
}

// ============ 测试计划 Section Builders ============

function buildTestScopeSection(data: Record<string, unknown>): DocumentSection | null {
  const testScope = data.testScope as Record<string, unknown> | undefined
  if (!testScope) return null
  
  const children: DocumentSection[] = []
  
  if (testScope.inScope && Array.isArray(testScope.inScope) && testScope.inScope.length > 0) {
    children.push({
      id: 'test-in-scope',
      title: 'In Scope',
      level: 2,
      type: 'list',
      content: { type: 'list', items: testScope.inScope.map(String) }
    })
  }
  
  if (testScope.outScope && Array.isArray(testScope.outScope) && testScope.outScope.length > 0) {
    children.push({
      id: 'test-out-scope',
      title: 'Out of Scope',
      level: 2,
      type: 'list',
      content: { type: 'list', items: testScope.outScope.map(String) }
    })
  }
  
  if (children.length === 0) return null
  return {
    id: 'test-scope',
    title: '测试范围',
    level: 1,
    type: 'info',
    content: { type: 'custom', data: null },
    children
  }
}

function buildTestStrategySection(data: Record<string, unknown>): DocumentSection | null {
  const testStrategy = data.testStrategy
  if (!testStrategy) return null
  return {
    id: 'test-strategy',
    title: '测试策略',
    level: 1,
    type: 'info',
    content: { type: 'text', value: String(testStrategy) }
  }
}

function buildTestTypesSection(data: Record<string, unknown>): DocumentSection | null {
  const testTypes = data.testTypes
  if (!testTypes || !Array.isArray(testTypes) || testTypes.length === 0) return null
  return {
    id: 'test-types',
    title: '测试类型',
    level: 1,
    type: 'list',
    content: { type: 'list', items: testTypes.map(String) }
  }
}

function buildTestEnvironmentSection(data: Record<string, unknown>): DocumentSection | null {
  const testEnvironment = data.testEnvironment
  if (!testEnvironment || typeof testEnvironment !== 'object') return null
  return {
    id: 'test-environment',
    title: '测试环境',
    level: 1,
    type: 'keyValue',
    content: { type: 'keyValue', items: testEnvironment as Record<string, string> }
  }
}

function buildTestScheduleSection(data: Record<string, unknown>): DocumentSection | null {
  const testSchedule = data.testSchedule
  if (!testSchedule || !Array.isArray(testSchedule) || testSchedule.length === 0) return null
  return {
    id: 'test-schedule',
    title: '测试进度',
    level: 1,
    type: 'list',
    content: { type: 'list', ordered: true, items: testSchedule.map(String) }
  }
}

function buildTestDeliverablesSection(data: Record<string, unknown>): DocumentSection | null {
  const testDeliverables = data.testDeliverables
  if (!testDeliverables || !Array.isArray(testDeliverables) || testDeliverables.length === 0) return null
  return {
    id: 'test-deliverables',
    title: '测试交付物',
    level: 1,
    type: 'list',
    content: { type: 'list', items: testDeliverables.map(String) }
  }
}

function buildTestCasesSection(data: Record<string, unknown>): DocumentSection | null {
  const testCases = data.testCases
  if (!testCases || !Array.isArray(testCases) || testCases.length === 0) return null
  return {
    id: 'test-cases',
    title: '测试用例',
    level: 1,
    type: 'code',
    content: { type: 'custom', data: testCases }
  }
}

// ============ 验收报告 Section Builders ============

function buildAcceptanceSummarySection(data: Record<string, unknown>): DocumentSection | null {
  const summary = data.summary
  if (!summary) return null
  return {
    id: 'acceptance-summary',
    title: '验收概述',
    level: 1,
    type: 'info',
    content: { type: 'text', value: String(summary) }
  }
}

function buildScopeVerificationSection(data: Record<string, unknown>): DocumentSection | null {
  const scopeVerification = data.scopeVerification
  if (!scopeVerification || !Array.isArray(scopeVerification) || scopeVerification.length === 0) return null
  return {
    id: 'scope-verification',
    title: '范围验证',
    level: 1,
    type: 'list',
    content: { type: 'list', items: scopeVerification.map(String) }
  }
}

function buildCriteriaVerificationSection(data: Record<string, unknown>): DocumentSection | null {
  const criteriaVerification = data.criteriaVerification
  if (!criteriaVerification || !Array.isArray(criteriaVerification) || criteriaVerification.length === 0) return null
  return {
    id: 'criteria-verification',
    title: '验收标准验证',
    level: 1,
    type: 'list',
    content: { type: 'list', items: criteriaVerification.map(String) }
  }
}

function buildDefectsSection(data: Record<string, unknown>): DocumentSection | null {
  const defects = data.defects as Record<string, unknown> | undefined
  if (!defects) return null
  
  const children: DocumentSection[] = []
  
  if (defects.open && Array.isArray(defects.open) && defects.open.length > 0) {
    children.push({
      id: 'defects-open',
      title: 'Open 缺陷',
      level: 2,
      type: 'list',
      content: { type: 'list', items: defects.open.map(String) }
    })
  }
  
  if (defects.closed && Array.isArray(defects.closed) && defects.closed.length > 0) {
    children.push({
      id: 'defects-closed',
      title: 'Closed 缺陷',
      level: 2,
      type: 'list',
      content: { type: 'list', items: defects.closed.map(String) }
    })
  }
  
  if (children.length === 0) return null
  return {
    id: 'defects',
    title: '缺陷汇总',
    level: 1,
    type: 'info',
    content: { type: 'custom', data: null },
    children
  }
}

function buildSignOffSection(data: Record<string, unknown>): DocumentSection | null {
  const signOff = data.signOff
  if (!signOff || typeof signOff !== 'object') return null
  return {
    id: 'sign-off',
    title: '签批记录',
    level: 1,
    type: 'keyValue',
    content: { type: 'keyValue', items: signOff as Record<string, string> }
  }
}

// ============ 部署方案 Section Builders ============

function buildEnvironmentsSection(data: Record<string, unknown>): DocumentSection | null {
  const environments = data.environments
  if (!environments || !Array.isArray(environments) || environments.length === 0) return null
  return {
    id: 'environments',
    title: '部署环境',
    level: 1,
    type: 'list',
    content: { type: 'list', items: environments.map(String) }
  }
}

function buildDeploymentStepsSection(data: Record<string, unknown>): DocumentSection | null {
  const deploymentSteps = data.deploymentSteps
  if (!deploymentSteps || !Array.isArray(deploymentSteps) || deploymentSteps.length === 0) return null
  return {
    id: 'deployment-steps',
    title: '部署步骤',
    level: 1,
    type: 'list',
    content: { type: 'list', ordered: true, items: deploymentSteps.map(String) }
  }
}

function buildRollbackSection(data: Record<string, unknown>): DocumentSection | null {
  const rollbackPlan = data.rollbackPlan
  if (!rollbackPlan) return null
  return {
    id: 'rollback',
    title: '回滚方案',
    level: 1,
    type: 'info',
    content: { type: 'text', value: String(rollbackPlan) }
  }
}

function buildMonitoringSection(data: Record<string, unknown>): DocumentSection | null {
  const monitoringSetup = data.monitoringSetup
  if (!monitoringSetup || typeof monitoringSetup !== 'object') return null
  return {
    id: 'monitoring',
    title: '监控配置',
    level: 1,
    type: 'keyValue',
    content: { type: 'keyValue', items: monitoringSetup as Record<string, string> }
  }
}

function buildSecurityConfigSection(data: Record<string, unknown>): DocumentSection | null {
  const securityConfig = data.securityConfig
  if (!securityConfig || typeof securityConfig !== 'object') return null
  return {
    id: 'security-config',
    title: '安全配置',
    level: 1,
    type: 'keyValue',
    content: { type: 'keyValue', items: securityConfig as Record<string, string> }
  }
}

// ============ 需求差距分析 Section Builders ============

function buildAnalysisCoveredSection(data: Record<string, unknown>): DocumentSection | null {
  const hasCovered = data.hasCovered
  if (!hasCovered || !Array.isArray(hasCovered) || hasCovered.length === 0) return null
  return {
    id: 'has-covered',
    title: '已有需求（已覆盖）',
    level: 1,
    type: 'list',
    content: { type: 'list', items: hasCovered.map(String) }
  }
}

function buildAnalysisMissingSection(data: Record<string, unknown>): DocumentSection | null {
  const missingSuggestions = data.missingSuggestions
  if (!missingSuggestions || !Array.isArray(missingSuggestions) || missingSuggestions.length === 0) return null
  
  const items = missingSuggestions.map((item: unknown) => {
    if (typeof item === 'object' && item !== null) {
      const i = item as Record<string, unknown>
      return `**${i.category || '通用'} - ${i.item || ''}**\n原因: ${i.reason || ''}`
    }
    return String(item)
  })
  
  return {
    id: 'missing',
    title: '缺失建议（需补充）',
    level: 1,
    type: 'info',
    content: { type: 'text', value: items.join('\n\n') }
  }
}

function buildBestPracticesSection(data: Record<string, unknown>): DocumentSection | null {
  const bestPractices = data.bestPractices
  if (!bestPractices || !Array.isArray(bestPractices) || bestPractices.length === 0) return null
  return {
    id: 'best-practices',
    title: '行业最佳实践',
    level: 1,
    type: 'list',
    content: { type: 'list', items: bestPractices.map(String) }
  }
}

function buildAnalysisSummarySection(data: Record<string, unknown>): DocumentSection | null {
  const summary = data.summary
  if (!summary) return null
  return {
    id: 'analysis-summary',
    title: '总结',
    level: 1,
    type: 'info',
    content: { type: 'text', value: String(summary) }
  }
}

// ============ 主函数 ============

/**
 * 从 Markdown 文本中提取 JSON 结构
 */
export function extractJsonFromMarkdown(markdown: string): Record<string, unknown> | null {
  const jsonBlockMatch = markdown.match(/```json\s*([\s\S]*?)\s*```/i)
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[1])
    } catch {
      // JSON 解析失败，尝试其他方式
    }
  }
  
  // 尝试直接解析整个响应（如果是纯 JSON）
  try {
    const parsed = JSON.parse(markdown)
    if (typeof parsed === 'object') {
      return parsed
    }
  } catch {
    // 不是纯 JSON
  }
  
  return null
}

/**
 * 规范化 Ollama 输出为统一文档结构
 */
export function normalizeDocument(
  rawOutput: string,
  type: PromptType,
  options?: { extractFullText?: boolean }
): UnifiedDocument {
  const { extractFullText = true } = options || {}
  
  // 尝试提取 JSON 数据
  const jsonData = extractJsonFromMarkdown(rawOutput) || {}
  
  // 获取配置
  const config = FIELD_MAPPINGS[type]
  
  // 提取标题
  let title = ''
  if (config) {
    const titleValue = getNestedValue(jsonData, config.titleField)
    if (titleValue) {
      title = String(titleValue)
    }
  }
  if (!title) {
    title = getDocumentTypeName(type)
  }
  
  // 构建章节
  const sections: DocumentSection[] = []
  if (config) {
    for (const builder of config.sectionBuilders) {
      const section = builder(jsonData)
      if (section) {
        sections.push(section)
      }
    }
  }
  
  // 如果没有构建出章节，但有原始数据，添加原始数据作为内容
  if (sections.length === 0 && Object.keys(jsonData).length > 0) {
    sections.push({
      id: 'raw-data',
      title: '文档内容',
      level: 1,
      type: 'info',
      content: { type: 'text', value: JSON.stringify(jsonData, null, 2) }
    })
  }
  
  return {
    type,
    title,
    meta: {
      createdAt: new Date().toISOString()
    },
    sections,
    fullText: extractFullText ? rawOutput : undefined,
    rawJson: Object.keys(jsonData).length > 0 ? jsonData : undefined
  }
}

/**
 * 获取文档类型的中文名称
 */
export function getDocumentTypeName(type: PromptType): string {
  const names: Record<PromptType, string> = {
    proposal: '立项书',
    requirement: '需求补充文档',
    requirement_analysis: '需求差距分析',
    architecture: '架构设计文档',
    prd: '产品需求文档',
    test_plan: '测试计划',
    acceptance: '验收报告',
    deployment: '部署方案'
  }
  return names[type] || '文档'
}

/**
 * 将统一文档结构转换为 ProposalContent（向后兼容）
 */
export function unifiedToProposalContent(unified: UnifiedDocument): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  
  for (const section of unified.sections) {
    // 只处理立项书相关的章节
    if (['basic-info', 'background', 'scope', 'acceptance', 'milestones', 'risks', 'human-gate'].includes(section.id)) {
      switch (section.id) {
        case 'basic-info':
          if (section.content.type === 'keyValue') {
            const kv = section.content.items
            if (kv['项目名称']) result.name = Array.isArray(kv['项目名称']) ? kv['项目名称'][0] : kv['项目名称']
            if (kv['项目类型']) result.type = kv['项目类型']
            if (kv['决策人']) result.decisionMakers = Array.isArray(kv['决策人']) ? kv['决策人'] : [kv['决策人']]
          }
          break
        case 'background':
          if (section.content.type === 'text') {
            result.background = section.content.value
          }
          break
        case 'scope':
          result.scope = { inScope: { P0: [], P1: [] }, outScope: [] }
          if (section.children) {
            for (const child of section.children) {
              if (child.id === 'in-scope' && child.content.type === 'text') {
                // 解析优先级内容
                const text = child.content.value
                const p0Match = text.match(/\*\*P0\*\*[:：]\s*([^\n]+)/)
                const p1Match = text.match(/\*\*P1\*\*[:：]\s*([^\n]+)/)
                if (p0Match) result.scope.inScope.P0 = p0Match[1].split(/[、，,]/).map(s => s.trim()).filter(Boolean)
                if (p1Match) result.scope.inScope.P1 = p1Match[1].split(/[、，,]/).map(s => s.trim()).filter(Boolean)
              }
            }
          }
          break
        case 'milestones':
          if (section.content.type === 'list') {
            result.milestones = section.content.items
          }
          break
        case 'risks':
          result.risks = []
          if (section.children) {
            for (const child of section.children) {
              if (child.content.type === 'text') {
                const lines = child.content.value.split('\n\n')
                for (const line of lines) {
                  const descMatch = line.match(/\*\*([^*]+)\*\*/)
                  const impactMatch = line.match(/影响[:：]\s*([^\n]+)/)
                  const counterMatch = line.match(/应对[:：]\s*([^\n]+)/)
                  if (descMatch) {
                    result.risks.push({
                      type: child.title.replace('风险', ''),
                      description: descMatch[1],
                      impact: impactMatch ? impactMatch[1] : '',
                      countermeasure: counterMatch ? counterMatch[1] : ''
                    })
                  }
                }
              }
            }
          }
          break
      }
    }
  }
  
  // 添加完整文本
  if (unified.fullText) {
    result.fullText = unified.fullText
  }
  
  return result
}
