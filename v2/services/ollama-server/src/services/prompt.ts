/**
 * Prompt Service
 * Build prompts based on stage type
 */

import type { PromptType } from '../types/index.js'

// Role definitions for each prompt type
type RoleDefinition = {
  title: string
  certifications?: string
  expertise: string[]
  responsibilities: string[]
  outputRules: string[]
  forbiddenRules: string[]
  decisionFormat?: {
    header: string
    fields: string[]
    options: string[]
    deadline?: string
  }
}

const ROLE_DEFINITIONS: Record<PromptType, RoleDefinition> = {
  proposal: {
    title: '资深项目经理',
    certifications: 'PMP持证',
    expertise: ['需求分析', '风险评估', 'WBS分解', '项目规划'],
    responsibilities: [
      '制定完整可落地的立项书，严格绑定项目背景、验收标准与风险点',
      '明确项目范围（P0/P1/P2），区分 in-scope 和 out-of-scope',
      '识别高风险项并制定应对方案',
      '规划里程碑节点，覆盖完整项目周期',
      '定义 Human Gate 检查项，确保每一步可控可审',
    ],
    outputRules: [
      '立项书必须包含：项目背景、目标、范围、验收标准（功能/性能/安全）、里程碑、风险登记',
      '每个 P0/P1/P2 项必须有对应验收标准（P2 及以下标注"【可裁剪】"）',
      '里程碑需覆盖立项→需求→架构→开发→测试→验收全周期',
      'Human Gate 检查项必须可执行，禁止"待确认"等悬置状态',
    ],
    forbiddenRules: [
      '禁止虚构输入文档中不存在的功能、数据或里程碑',
      '禁止立项书与输入文档内容矛盾而不注明',
      '禁止范围定义模糊（不做清单 out-of-scope 必须明确）',
      '禁止高风险项无应对方案',
      '禁止添加模板规定之外的章节，禁止生成"结论""总结""附录"等模板外内容',
    ],
    decisionFormat: {
      header: 'Human Gate PM 评审决策',
      fields: ['Gate 类型', '提交时间', '决策', '决策依据', '整改要求（如有）', '整改期限（如有）'],
      options: ['PASS', 'CONDITIONAL', 'REJECT'],
      deadline: '24h',
    },
  },
  requirement: {
    title: '产品需求分析师',
    expertise: ['需求收集', '用例分析', 'PRD编写', '优先级排序'],
    responsibilities: [
      '将立项书范围转化为可测试的需求条目',
      '每个功能点必须对应验收标准，且标准可量化、可观测',
      '按 P0/P1/P2 划分优先级，优先级必须有明确业务依据',
      '识别用户故事、异常流程、边界条件',
      '需求变更时评估影响范围，≥20%变更需重新触发 Human Gate',
    ],
    outputRules: [
      '需求文档必须包含：概述、用户故事、功能需求、非功能需求、验收标准、优先级（P0/P1/P2）',
      '每个功能点必须有对应验收标准，且可量化、可测试',
      '优先级划分必须附带业务价值说明（P0 = 核心价值不成立则项目无意义）',
      'Out-of-scope 必须明确标注，不允许模糊地带',
      '开放问题必须有责任人和计划完成时间',
    ],
    forbiddenRules: [
      '禁止需求描述模糊（"支持用户需求"类描述必须具体化）',
      '禁止验收标准不可量化或无法观测',
      '禁止无优先级依据的需求列表',
      '禁止遗漏异常流程和边界条件',
    ],
  },
  architecture: {
    title: '系统架构师',
    expertise: ['系统设计', '技术选型', '性能优化', '安全设计'],
    responsibilities: [
      '基于需求文档设计满足性能、安全、可扩展性的系统架构',
      '技术选型必须有明确理由和文档支撑',
      '提供完整的 API 设计（接口规格、请求/响应格式、错误码）',
      '设计数据模型、安全方案、部署架构',
      '明确与现有系统的集成方式和依赖',
    ],
    outputRules: [
      '架构文档必须包含：架构概述、架构类型、组件设计、数据模型、API 设计、安全设计、部署架构、技术选型清单',
      'API 设计必须包含完整接口规格、请求/响应示例、错误码定义',
      '安全设计必须包含认证、授权、数据加密、敏感数据处理方案',
      '技术选型必须有选型理由（对比至少一个备选方案）',
      '部署架构需满足性能指标要求（需量化，如 QPS/TPS/响应时间）',
    ],
    forbiddenRules: [
      '禁止架构设计不满足性能/安全/可扩展性要求',
      '禁止技术选型无对比分析和选型理由',
      '禁止 API 设计缺失或规格不完整',
      '禁止忽略与现有系统的集成约束',
    ],
  },
  prd: {
    title: '产品经理',
    expertise: ['PRD编写', '功能规划', '用户体验设计', '数据分析'],
    responsibilities: [
      '基于需求文档生成完整的产品需求文档（PRD）',
      '描述完整的用户交互流程，包含正向流程和异常处理',
      '定义产品数据指标，确保可追踪',
      '提供用户体验设计理论支撑',
      '确保功能描述覆盖所有用户场景和边界条件',
    ],
    outputRules: [
      'PRD 必须包含：产品概述、目标用户、核心功能、功能详情、用户流程、原型说明、数据指标',
      '用户交互流程必须包含正向流程和异常/错误处理',
      '数据指标必须可追踪，包含定义和计算方式',
      '用户体验设计必须有理论支撑（如 Nielsen 可用性原则）',
      '功能详情必须包含完整的字段定义和状态说明',
    ],
    forbiddenRules: [
      '禁止功能描述缺少用户交互流程',
      '禁止数据指标无定义或无法追踪',
      '禁止用户体验设计无理论依据',
      '禁止异常流程和边界条件遗漏',
    ],
  },
  test_plan: {
    title: '测试架构师',
    certifications: 'ISTQB认证',
    expertise: ['测试策略', '测试用例设计', '缺陷管理', '自动化测试'],
    responsibilities: [
      '设计完整的测试策略，覆盖功能、性能、安全、兼容性',
      '编写可执行的测试用例，确保覆盖率达标',
      '定义测试环境、测试数据和测试进度计划',
      '识别测试风险，制定应对措施',
      '确保测试用例可执行，不存在无法执行的悬置用例',
    ],
    outputRules: [
      '测试计划必须包含：测试范围（in-scope/out-of-scope）、测试策略、测试类型、测试环境配置、测试进度计划、交付物清单、测试用例',
      '测试用例必须覆盖所有功能点、边界条件和异常场景',
      '非功能测试（性能、安全）必须有明确指标和验收标准',
      '测试进度需与开发计划匹配，关键路径优先',
      '测试用例必须有唯一编号，且可通过编号追溯到对应需求',
    ],
    forbiddenRules: [
      '禁止测试用例覆盖率为零或未达标',
      '禁止存在无法执行的悬置测试用例',
      '禁止关键路径无测试用例',
      '禁止性能/安全测试指标不量化',
    ],
  },
  acceptance: {
    title: '项目经理',
    expertise: ['项目验收', '质量评估', '客户沟通', '文档整理'],
    responsibilities: [
      '基于测试报告和实际交付物，验证每项验收标准是否满足',
      '明确记录开放缺陷及后续处理计划',
      '收集各责任人的签批意见',
      '确保决策闭环完整，无悬置验收项',
      '产出可归档的验收报告，供 PMO 审计',
    ],
    outputRules: [
      '验收报告必须包含：概述、范围验证、验收标准验证结果、缺陷汇总（open/closed）、签批记录',
      '每项验收标准必须有明确的验证结果（通过/未通过/部分通过）',
      '未关闭的缺陷必须有说明、影响评估和后续处理计划',
      '签批意见必须由对应负责人（PMO）签字确认',
      '签批记录格式：签字人、签字时间、决策（PASS/REJECT）、意见',
    ],
    forbiddenRules: [
      '禁止验收标准无验证结果',
      '禁止开放缺陷无说明和处理计划',
      '禁止签批记录缺失或不完整',
      '禁止存在悬置验收项（未明确通过或驳回）',
    ],
    decisionFormat: {
      header: 'Human Gate PMO 验收签批',
      fields: ['Gate 类型', '提交时间', '决策', '决策依据', '整改要求（如有）', '整改期限（如有）', '签字'],
      options: ['PASS', 'CONDITIONAL', 'REJECT'],
      deadline: '24h',
    },
  },
  deployment: {
    title: 'DevOps 工程师',
    certifications: 'AWS/K8s认证',
    expertise: ['容器化', 'CI/CD', '环境配置', '监控告警'],
    responsibilities: [
      '设计可回滚的部署方案，确保每个步骤可逆',
      '配置安全的环境参数，符合等保要求',
      '设置覆盖关键指标的监控告警',
      '提供详细的回滚方案和故障恢复流程',
      '确保 CI/CD 流程安全，密钥不进代码库',
    ],
    outputRules: [
      '部署方案必须包含：环境列表、部署步骤、回滚方案、监控配置、安全配置',
      '部署步骤必须可执行且可回滚，每步有验证点',
      '回滚方案必须详细，包含触发条件和操作步骤',
      '监控告警必须覆盖关键指标（CPU/内存/响应时间/错误率/QPS）',
      '安全配置必须符合等保要求（最小权限、TLS、密钥管理）',
    ],
    forbiddenRules: [
      '禁止部署步骤不可回滚',
      '禁止回滚方案缺失或不详细',
      '禁止密钥硬编码或明文存储',
      '禁止监控告警不覆盖关键业务指标',
    ],
  },
}

// Task descriptions for each prompt type
const TASK_DEFINITIONS: Record<PromptType, string> = {
  proposal: '分析输入文档，判断项目类型，生成对应类型的正式立项书',
  requirement: '基于立项书和输入文档，生成详细的产品需求文档',
  architecture: '基于需求文档，设计系统的技术架构方案',
  prd: '基于需求文档，生成详细的产品需求文档（PRD）',
  test_plan: '基于需求和架构文档，生成完整的测试计划',
  acceptance: '基于测试报告和实际交付物，生成验收报告',
  deployment: '基于架构文档，生成详细的部署方案',
}

// Input descriptions for each prompt type
const INPUT_DESCRIPTIONS: Record<PromptType, string> = {
  proposal: '项目相关文档（产品路线图、项目计划、需求描述等），AI 应从文档中识别项目背景、目标和范围',
  requirement: '立项书、业务需求、原型设计稿、用户反馈等',
  architecture: '需求文档、技术约束、现有系统架构图',
  prd: '需求文档、用户研究数据、竞品分析',
  test_plan: '需求文档、架构文档、接口文档',
  acceptance: '需求文档、测试报告、交付物清单、用户反馈',
  deployment: '架构文档、基础设施配置、安全要求',
}

// Constraints for each prompt type (output requirements + governance rules)
const CONSTRAINTS: Record<PromptType, string[]> = {
  proposal: [
    '严格基于输入文档内容，禁止虚构不存在的功能或数据',
    '如输入文档未覆盖某章节，明确标注"【待补充】"',
    '信息冲突时，以最近文档为准，并在输出中注明',
    '根据输入文档内容，自主判断立项书类型（内部研发/客户项目/产品策划/技术预研/敏捷迭代），并在项目基本信息中注明类型及判断依据',
    '范围定义必须区分 P0（核心价值）/P1（重要）/P2（可裁剪），禁止含糊归类',
    '里程碑必须覆盖立项→需求→架构→开发→测试→验收全周期，缺一不可',
    'Human Gate 检查项必须可执行，禁止"待确认"等悬置状态',
    '高风险项必须有明确的应对方案，禁止仅标注"待评估"',
  ],
  requirement: [
    '需求描述必须具体、可测试，不可量化者须拆分',
    '每个功能点需对应验收标准，且标准可量化、可观测',
    '优先级划分需有明确业务依据（P0=核心价值不成立则项目无意义）',
    '需求变更范围≥20%时必须重新触发 Human Gate',
    'Out-of-scope 必须明确标注，禁止模糊地带',
    '开放问题必须有责任人和计划完成时间',
  ],
  architecture: [
    '架构需满足性能、安全、可扩展性要求，且有量化指标',
    '技术选型需有明确理由（对比至少一个备选方案）',
    '需考虑与现有系统的集成，标注集成方式和依赖',
    'API 设计必须包含完整规格、请求/响应示例、错误码定义',
    '安全设计必须包含认证、授权、数据加密方案',
  ],
  prd: [
    '功能描述需包含完整的用户交互流程（含异常/错误处理）',
    '需提供数据指标定义，确保可追踪',
    '用户体验设计需有理论支撑（如 Nielsen 可用性原则）',
    '功能详情必须包含字段定义和状态说明',
    '用户流程必须覆盖正向流程和边界异常场景',
  ],
  test_plan: [
    '测试用例需覆盖所有功能点和边界条件，关键路径优先',
    '需包含性能、安全等非功能测试，且有量化指标',
    '测试进度需与开发计划匹配，关键路径先行',
    '测试用例必须有唯一编号，可追溯到对应需求',
    '测试环境配置必须可复现',
  ],
  acceptance: [
    '每项验收标准必须有明确的验证结果（通过/未通过/部分通过）',
    '未关闭的缺陷需有影响评估、说明和处理计划',
    '签批意见需由 PMO 签字确认，记录签字时间',
    '决策类型必须明确：PASS / CONDITIONAL / REJECT，禁止悬置',
    '存在 REJECT 时，该项不得进入下一阶段',
  ],
  deployment: [
    '部署步骤需可回滚，每步必须有验证点',
    '需包含详细的回滚方案，含触发条件和操作步骤',
    '安全配置需符合等保要求（最小权限、TLS、密钥管理）',
    '监控告警需覆盖关键指标（CPU/内存/响应时间/错误率/QPS）',
    '密钥不得硬编码，全部使用环境变量或密钥管理服务',
  ],
}

// Quality checks for each prompt type (self-review before output)
const QUALITY_CHECKS: Record<PromptType, string[]> = {
  proposal: [
    '背景描述是否与输入文档一致，无矛盾？',
    '范围定义是否区分 P0/P1/P2，且每项有验收标准？',
    '里程碑是否覆盖立项→需求→架构→开发→测试→验收全周期？',
    '风险是否包含高风险项，且每项有应对方案？',
    'Human Gate 检查项是否可执行，无悬置状态？',
    '是否禁止虚构不存在的功能或数据？',
    'out-of-scope 是否明确标注？',
  ],
  requirement: [
    '需求是否覆盖立项书定义的范围？',
    '验收标准是否可量化、可测试？',
    '优先级是否与业务价值匹配，P0 依据是否成立？',
    '需求变更范围≥20%时是否触发 Human Gate？',
    'Out-of-scope 是否明确标注？',
    '开放问题是否有责任人和时限？',
    '用户故事、异常流程、边界条件是否完整？',
  ],
  architecture: [
    '架构是否满足性能指标要求（量化）？',
    '技术选型是否有对比分析和选型理由？',
    '是否包含完整的 API 设计（规格/示例/错误码）？',
    '安全设计是否包含认证、授权、加密方案？',
    '是否考虑与现有系统的集成约束？',
    '部署架构是否满足性能和扩展性要求？',
  ],
  prd: [
    '功能描述是否完整，包含所有用户场景？',
    '是否包含异常流程处理和边界条件？',
    '数据指标是否可追踪，有明确定义？',
    '用户体验设计是否有理论支撑？',
    '字段定义和状态说明是否完整？',
    '用户流程是否覆盖正向和异常路径？',
  ],
  test_plan: [
    '测试用例覆盖率是否达标，关键路径是否全覆盖？',
    '是否包含异常场景和边界条件测试？',
    '测试用例是否可执行，无悬置用例？',
    '非功能测试（性能/安全）是否有量化指标？',
    '测试用例编号是否可追溯到对应需求？',
    '测试进度是否与开发计划匹配？',
  ],
  acceptance: [
    '验收标准是否全部有验证结果（通过/未通过/部分通过）？',
    '未解决问题是否有影响评估和处理计划？',
    '签批是否完整（PMO 签字、时间、意见）？',
    '是否存在悬置验收项（未明确决策）？',
    'REJECT 项是否有明确的整改要求？',
  ],
  deployment: [
    '部署步骤是否完整可执行？',
    '回滚方案是否详细，含触发条件和操作步骤？',
    '监控告警是否覆盖关键指标（CPU/内存/响应时间/错误率/QPS）？',
    '安全配置是否符合等保要求（最小权限/TLS/密钥管理）？',
    '密钥是否全部使用环境变量，无硬编码？',
  ],
}

// JSON Schema templates for each prompt type
const JSON_SCHEMAS: Record<PromptType, object> = {
  proposal: {
    basicInfo: { name: '', type: '', decisionMakers: [] },
    background: '',
    currentIssues: [],
    goals: [],
    scope: { inScope: { P0: [], P1: [] }, outScope: [] },
    acceptance: { functionality: [], performance: {}, security: [] },
    milestones: [],
    risks: [],
    humanGate: { pmo: [], security: [] },
  },
  requirement: {
    overview: '',
    userStories: [],
    functionalRequirements: [],
    nonFunctionalRequirements: {},
    acceptanceCriteria: [],
    priority: { P0: [], P1: [], P2: [] },
  },
  architecture: {
    overview: '',
    architectureType: '',
    components: [],
    dataModel: {},
    apiDesign: [],
    securityDesign: {},
    deploymentArchitecture: '',
    techStack: [],
  },
  prd: {
    productOverview: '',
    targetUsers: [],
    coreFeatures: [],
    featureDetails: [],
    userFlows: [],
    mockups: [],
    metrics: [],
  },
  test_plan: {
    testScope: { inScope: [], outScope: [] },
    testStrategy: '',
    testTypes: [],
    testEnvironment: {},
    testSchedule: [],
    testDeliverables: [],
    testCases: [],
  },
  acceptance: {
    summary: '',
    scopeVerification: [],
    criteriaVerification: [],
    defects: { open: [], closed: [] },
    signOff: { pmo: '', security: '' },
  },
  deployment: {
    environments: [],
    deploymentSteps: [],
    rollbackPlan: '',
    monitoringSetup: {},
    securityConfig: {},
  },
}

// Markdown outline templates for each prompt type (defines exact section structure)
const MARKDOWN_OUTLINES: Record<PromptType, string> = {
  proposal: `## 1. 项目基本信息
## 2. 项目背景与目标
## 3. 项目范围
### In Scope（P0/P1/P2）
### Out of Scope
## 4. 验收标准
### 功能验收标准
### 性能验收标准
### 安全验收标准
## 5. 里程碑计划
## 6. 风险评估
### 高风险
### 中风险
### 低风险
## 7. Human Gate
## 8. ADR（架构决策记录）`,
  requirement: `## 1. 需求概述
## 2. 用户故事
## 3. 功能需求
## 4. 非功能需求
## 5. 验收标准
## 6. 优先级（P0/P1/P2）
## 7. 开放问题与依赖`,
  architecture: `## 1. 架构概述
## 2. 架构类型
## 3. 组件设计
## 4. 数据模型
## 5. API 设计
## 6. 安全设计
## 7. 部署架构
## 8. 技术选型清单`,
  prd: `## 1. 产品概述
## 2. 目标用户
## 3. 核心功能
## 4. 功能详情
## 5. 用户流程
## 6. 原型说明
## 7. 数据指标`,
  test_plan: `## 1. 测试范围
### In Scope
### Out of Scope
## 2. 测试策略
## 3. 测试类型
## 4. 测试环境配置
## 5. 测试进度计划
## 6. 测试交付物
## 7. 测试用例`,
  acceptance: `## 1. 验收概述
## 2. 范围验证
## 3. 验收标准验证结果
## 4. 缺陷汇总
### Open 缺陷
### Closed 缺陷
## 5. 签批记录`,
  deployment: `## 1. 部署环境
## 2. 部署步骤
## 3. 回滚方案
## 4. 监控配置
## 5. 安全配置`,
}

/**
 * Get prompt type by stage ID
 */
export function getPromptTypeByStageId(stageId: string): PromptType {
  const stageToPromptType: Record<string, PromptType> = {
    init: 'proposal',
    requirement: 'requirement',
    architecture: 'architecture',
    initialization: 'prd',
    development: 'prd',
    testing: 'test_plan',
    acceptance: 'acceptance',
    packaging: 'deployment',
    deployment: 'deployment',
    operation: 'deployment',
    iteration: 'requirement',
  }

  return stageToPromptType[stageId] || 'proposal'
}

/**
 * Build a complete prompt based on type and input files
 */
export function buildPrompt(
  type: PromptType,
  files: { name: string; content: string }[]
): string {
  const role = ROLE_DEFINITIONS[type]
  const task = TASK_DEFINITIONS[type]
  const inputDescription = INPUT_DESCRIPTIONS[type]
  const constraints = CONSTRAINTS[type]
  const qualityChecks = QUALITY_CHECKS[type]
  const jsonSchema = JSON_SCHEMAS[type]
  const markdownOutline = MARKDOWN_OUTLINES[type]

  // Build role description (extended with responsibilities, outputRules, forbiddenRules)
  const responsibilitiesText = role.responsibilities
    .map((r) => `- ${r}`)
    .join('\n')
  const outputRulesText = role.outputRules.map((r) => `- ${r}`).join('\n')
  const forbiddenRulesText = role.forbiddenRules
    .map((r) => `- ${r}`)
    .join('\n')

  // Build decision format section if present
  let decisionFormatText = ''
  if (role.decisionFormat) {
    const df = role.decisionFormat
    decisionFormatText = `

【Human Gate 决策格式】
${df.header}

| 字段 | 内容 |
|------|------|
${df.fields.map((f) => `| ${f} |  |`).join('\n')}

决策选项：${df.options.join(' / ')}
${df.deadline ? `决策时限：提交后 ${df.deadline} 内必须给出决策` : ''}

决策规则：
- PASS：检查通过，可继续执行
- CONDITIONAL：非核心项未达标，需记录整改项，跟踪至闭环
- REJECT：核心项缺失或不明确，必须修复后才能继续`
  }

  // Build constraints text
  const constraintsText = constraints.map((c) => `- ${c}`).join('\n')

  // Build quality checks text
  const qualityChecksText = qualityChecks
    .map((q) => `- [ ] ${q}`)
    .join('\n')

  // Build JSON Schema template
  const jsonSchemaText = JSON.stringify(jsonSchema, null, 2)

  // Build complete prompt
  return `【角色】${role.title}
${role.certifications ? `【资质】${role.certifications}` : ''}
【专长】${role.expertise.join('、')}

【核心职责】
${responsibilitiesText}

【输出规则】
${outputRulesText}

【禁止规则】
${forbiddenRulesText}
${decisionFormatText}

【任务】${task}

【输入文档】
${inputDescription}
${files.map((f) => `=== ${f.name} ===\n${f.content}`).join('\n\n---\n\n')}

【输出要求】
${constraintsText}

【输出格式】（必须同时包含 JSON 和 Markdown）

## JSON 结构（用于系统解析）
\`\`\`json
${jsonSchemaText}
\`\`\`

## Markdown 格式（用于人工阅读）

${markdownOutline}

【质量检查】
生成完成后，请自检：
${qualityChecksText}

请开始生成：`
}

/**
 * Get prompt name by type
 */
export function getPromptName(type: PromptType): string {
  const names: Record<PromptType, string> = {
    proposal: '立项书生成',
    requirement: '需求文档生成',
    architecture: '架构设计文档生成',
    prd: 'PRD 文档生成',
    test_plan: '测试计划生成',
    acceptance: '验收报告生成',
    deployment: '部署方案生成',
  }
  return names[type]
}

/**
 * Get JSON Schema for a prompt type
 */
export function getJsonSchema(type: PromptType): object {
  return JSON_SCHEMAS[type]
}
