/**
 * AI Prompt 配置中心
 * 统一管理所有 AI 生成的 Prompt 模板
 * 每个阶段/类型对应独立的 Prompt 配置
 */

export type PromptType =
  | 'proposal'              // 立项书
  | 'requirement'           // 需求补充文档
  | 'requirement_analysis'  // 需求差距分析
  | 'architecture'          // 架构设计
  | 'initialization'        // 项目初始化
  | 'prd'                   // 产品需求文档
  | 'test_plan'             // 测试计划
  | 'acceptance'            // 验收报告
  | 'deployment'            // 部署方案

export interface RelatedSpec {
  /** 规范文档标题 */
  title: string
  /** 规范文档路径 */
  path: string
  /** 规范类型 */
  category: 'frontend' | 'backend' | 'database' | 'security' | 'testing' | 'git' | 'prompt' | 'process'
}

export interface PromptConfig {
  /** Prompt 类型标识 */
  type: PromptType
  /** Prompt 名称（中文） */
  name: string
  /** 角色定义 */
  role: {
    title: string
    certifications?: string
    expertise: string[]
  }
  /** 任务描述 */
  task: string
  /** 输入文档说明 */
  inputDescription: string
  /** 输出格式配置 */
  outputFormat: {
    jsonSchema: object
    markdownTemplate: string
  }
  /** 约束条件 */
  constraints: string[]
  /** 质量检查项 */
  qualityChecks: string[]
  /** 关联的工程化规范文档 */
  relatedSpecs?: RelatedSpec[]
}

export const AI_PROMPTS: Record<PromptType, PromptConfig> = {
  proposal: {
    type: 'proposal',
    name: '立项书生成',
    role: {
      title: '资深项目经理',
      certifications: 'PMP持证',
      expertise: ['需求分析', '风险评估', 'WBS分解', '项目规划']
    },
    task: '分析输入文档，判断项目类型，生成对应类型的正式立项书',
    inputDescription: '项目相关文档（产品路线图、项目计划、需求描述等），AI 应从文档中识别项目背景、目标和范围',
    outputFormat: {
      jsonSchema: {
        basicInfo: { name: '', type: '', decisionMakers: [] },
        background: '',
        currentIssues: [],
        goals: [],
        scope: { inScope: { P0: [], P1: [] }, outScope: [] },
        acceptance: { functionality: [], performance: {}, security: [] },
        milestones: [],
        risks: [],
        humanGate: { pmo: [], security: [] }
      },
      markdownTemplate: `# {项目名称}项目立项书（AI 根据输入文档判断项目类型）

## 1. 项目基本信息
## 2. 项目背景与目标
## 3. 范围定义
## 4. 验收标准
## 5. 里程碑计划
## 6. 风险评估
## 7. Human Gate 1 决策`
    },
    constraints: [
      '严格基于输入文档内容，禁止虚构不存在的功能或数据',
      '如输入文档未覆盖某章节，明确标注"【待补充】"',
      '信息冲突时，以最近文档为准，并在输出中注明',
      '根据输入文档内容，自主判断立项书类型（内部研发/客户项目/产品策划/技术预研/敏捷迭代），并在项目基本信息中注明类型及判断依据'
    ],
    qualityChecks: [
      '背景描述是否与输入文档一致？',
      '范围定义是否区分 P0/P1/P2？',
      '里程碑是否覆盖完整项目周期？',
      '风险是否包含高风险项？',
      'Human Gate 检查项是否可执行？'
    ]
  },

  requirement: {
    type: 'requirement',
    name: '需求补充文档生成',
    role: {
      title: '产品需求分析师',
      expertise: ['需求收集', '用例分析', 'PRD编写', '优先级排序']
    },
    task: '基于立项书范围，补充详细的用户故事和功能需求，生成需求补充文档',
    inputDescription: '【自动加载】立项书（已自动传入）\n【用户上传】竞品分析报告、用户调研/访谈记录、业务需求描述文档、原型设计稿、用户反馈等（最多2个文件）',
    outputFormat: {
      jsonSchema: {
        overview: '',
        userStories: [],
        functionalRequirements: [],
        nonFunctionalRequirements: {},
        acceptanceCriteria: [],
        priority: { P0: [], P1: [], P2: [] }
      },
      markdownTemplate: `# 需求补充文档

## 1. 需求概述（基于立项书范围）
## 2. 用户故事（从调研资料提取）
## 3. 功能需求详细说明
## 4. 非功能需求
## 5. 验收标准（细化立项书标准）
## 6. 优先级定义（P0/P1/P2）`
    },
    constraints: [
      '严格在立项书定义的范围内补充需求，不得超出范围',
      '需求描述必须具体、可测试',
      '每个功能点需对应验收标准',
      '优先级划分需有明确依据',
      '从上传文档中提取具体的用户故事和功能点，不要虚构'
    ],
    qualityChecks: [
      '需求是否在立项书定义的范围内？',
      '用户故事是否来自上传的调研资料？',
      '验收标准是否可量化、可测试？',
      '优先级是否与业务价值匹配？'
    ]
  },

  requirement_analysis: {
    type: 'requirement_analysis',
    name: '需求差距分析',
    role: {
      title: '需求分析专家',
      certifications: 'CBAP认证',
      expertise: ['需求分析', '差距分析', '行业最佳实践', '风险管理']
    },
    task: '基于立项书范围和行业标准模板，分析需求差距并给出补充建议',
    inputDescription: '【自动加载】立项书（已自动传入）\n【行业标准】软件开发行业通用需求检查清单',
    outputFormat: {
      jsonSchema: {
        hasCovered: [],
        missingSuggestions: [{ category: '', item: '', reason: '' }],
        bestPractices: [],
        summary: ''
      },
      markdownTemplate: `# 需求差距分析报告

## 一、已有需求（已覆盖）
## 二、缺失建议（需补充）
## 三、行业最佳实践
## 四、总结`
    },
    constraints: [
      '严格对比立项书定义的范围与行业标准',
      '缺失项必须有明确的补充理由',
      '不虚构需求，只基于行业标准提出建议',
      '优先关注 P0 级需求缺失'
    ],
    qualityChecks: [
      '是否覆盖了立项书的所有范围？',
      '缺失项是否与行业标准对齐？',
      '建议是否有实际价值而非堆砌？'
    ]
  },

  architecture: {
    type: 'architecture',
    name: '架构设计文档生成',
    role: {
      title: '系统架构师',
      expertise: ['系统设计', '技术选型', '性能优化', '安全设计', 'DDD', '微服务架构']
    },
    task: '基于需求文档，设计满足非功能需求（NFR）的系统架构方案，并生成开发任务步骤文档。架构必须由需求驱动：性能要求决定缓存策略，安全要求决定认证方案，规模要求决定部署模式。',
    inputDescription: `【自动加载】需求文档 proposalContent，包含：
- 项目概述（overview）
- 功能范围 P0/P1/P2（scope.inScope）
- 验收标准：功能、性能、安全（acceptance）
- 风险约束（risks）
- 里程碑（milestones）

请从需求中提取：
1. 性能驱动因素：响应时间、并发量、数据规模
2. 安全驱动因素：等保级别、敏感数据、审计要求
3. 功能驱动因素：核心业务逻辑、集成点、第三方依赖`,
    outputFormat: {
      jsonSchema: {
        overview: '',
        architectureType: '',
        components: [],
        dataModel: {},
        apiDesign: [],
        securityDesign: {},
        deploymentArchitecture: '',
        techStack: [],
        nonFunctionalRequirements: {},
        steps: [{ id: 'step1', title: '', target: '', constraints: [], acceptance: [], files: [], dependsOn: '' }]
      },
      markdownTemplate: `# 系统架构设计文档

## 1. 架构概述与驱动因素
### 1.1 项目概述
### 1.2 架构驱动因素（从需求提取）
- **性能驱动**：...
- **安全驱动**：...
- **规模驱动**：...

## 2. 架构选型
### 2.1 架构类型
### 2.2 选型理由
### 2.3 架构图

## 3. 核心组件设计
### 3.1 组件划分
### 3.2 组件职责
### 3.3 组件交互

## 4. 数据模型
### 4.1 核心实体
### 4.2 关系设计
### 4.3 存储选型

## 5. API 设计
### 5.1 API 列表
### 5.2 接口规范

## 6. 安全设计
### 6.1 认证授权
### 6.2 数据安全
### 6.3 审计日志

## 7. 部署架构
### 7.1 部署模式
### 7.2 基础设施

## 8. 技术选型
### 8.1 前端技术
### 8.2 后端技术
### 8.3 基础设施

## 9. ADR（架构决策记录）

## 10. 开发任务步骤（Step 文档）

### Step 1: {组件名称}
...

### Step 2: {组件名称}
...`,
      stepsTemplate: `# Step {N}: {任务名称}

## 任务目标
{具体功能描述}

## 约束条件
- 遵循前端工程化 SOP
- 遵循后端工程化 SOP
- 遵循数据库设计规范
- 遵循安全工程规范

## 验收标准
- [ ] 功能可正常运行
- [ ] 单元测试覆盖率 > 70%
- [ ] 无安全漏洞

## 涉及文件
- src/views/{Component}.vue
- src/api/{api}.ts

## 前置依赖
- step{N-1}.md (如有)`
    },
    constraints: [
      '架构必须由需求驱动：每个架构决策必须有对应的需求依据',
      '性能要求必须映射到具体的架构策略（如：响应时间<100ms → 缓存策略）',
      '安全要求必须映射到具体的安全措施（如：等保二级 → 审计日志）',
      '技术选型必须有明确的优缺点对比',
      '必须包含架构决策记录（ADR），记录关键选型理由',
      '严格遵循 docs/AI工程化开发手册/ 中的前端/后端/数据库/安全规范',
      '必须根据 components 数组生成对应的 step 文档，粒度：一个组件 = 一个 step',
      'step 文档必须包含：任务目标、约束条件、验收标准、涉及文件、前置依赖'
    ],
    qualityChecks: [
      '每个架构决策是否都有对应的需求依据？',
      '性能要求是否都有具体的实现策略？',
      '安全要求是否都有对应的安全措施？',
      '技术选型是否有明确的优缺点分析？',
      '是否包含 ADR 记录关键决策？',
      'components 是否都有对应的 step 文档？',
      'step 之间的依赖关系是否正确？',
      'step 验收标准是否可测试？'
    ],
    relatedSpecs: [
      { title: '前端工程化 SOP', path: 'docs/AI工程化开发手册/前端工程化 SOP（Vue3 + TS + Vben Admin）.md', category: 'frontend' },
      { title: '后端工程化 SOP', path: 'docs/AI工程化开发手册/后端工程化 SOP（Node.js + NestJS）.md', category: 'backend' },
      { title: '数据库设计规范', path: 'docs/AI工程化开发手册/数据库设计规范（AI 工程化版）.md', category: 'database' },
      { title: '安全工程规范', path: 'docs/AI工程化开发手册/安全工程规范（AI 工程化版）.md', category: 'security' }
    ]
  },

  prd: {
    type: 'prd',
    name: 'PRD 文档生成',
    role: {
      title: '产品经理',
      expertise: ['PRD编写', '功能规划', '用户体验设计', '数据分析']
    },
    task: '基于需求文档，生成详细的产品需求文档（PRD）',
    inputDescription: '需求文档、用户研究数据、竞品分析',
    outputFormat: {
      jsonSchema: {
        productOverview: '',
        targetUsers: [],
        coreFeatures: [],
        featureDetails: [],
        userFlows: [],
        mockups: [],
        metrics: []
      },
      markdownTemplate: `# 产品需求文档（PRD）

## 1. 产品概述
## 2. 目标用户
## 3. 核心功能
## 4. 功能详细说明
## 5. 用户流程
## 6. 原型设计
## 7. 数据指标`
    },
    constraints: [
      '功能描述需包含完整的用户交互流程',
      '需提供数据指标定义',
      '用户体验设计需有理论支撑'
    ],
    qualityChecks: [
      '功能描述是否完整？',
      '是否包含异常流程处理？',
      '数据指标是否可追踪？'
    ]
  },

  test_plan: {
    type: 'test_plan',
    name: '测试计划生成',
    role: {
      title: '测试架构师',
      certifications: 'ISTQB认证',
      expertise: ['测试策略', '测试用例设计', '缺陷管理', '自动化测试']
    },
    task: '基于需求和架构文档，生成完整的测试计划',
    inputDescription: '需求文档、架构文档、接口文档',
    outputFormat: {
      jsonSchema: {
        testScope: { inScope: [], outScope: [] },
        testStrategy: '',
        testTypes: [],
        testEnvironment: {},
        testSchedule: [],
        testDeliverables: [],
        testCases: []
      },
      markdownTemplate: `# 测试计划

## 1. 测试范围
## 2. 测试策略
## 3. 测试类型
## 4. 测试环境
## 5. 测试进度安排
## 6. 测试交付物
## 7. 测试用例`
    },
    constraints: [
      '测试用例需覆盖所有功能点和边界条件',
      '需包含性能、安全等非功能测试',
      '测试进度需与开发计划匹配'
    ],
    qualityChecks: [
      '测试用例覆盖率是否达标？',
      '是否包含异常场景测试？',
      '测试用例是否可执行？'
    ]
  },

  acceptance: {
    type: 'acceptance',
    name: '验收报告生成',
    role: {
      title: '项目经理',
      expertise: ['项目验收', '质量评估', '客户沟通', '文档整理']
    },
    task: '基于测试报告和实际交付物，生成验收报告',
    inputDescription: '需求文档、测试报告、交付物清单、用户反馈',
    outputFormat: {
      jsonSchema: {
        summary: '',
        scopeVerification: [],
        criteriaVerification: [],
        defects: { open: [], closed: [] },
        signOff: { pmo: '', security: '' }
      },
      markdownTemplate: `# 验收报告

## 1. 验收概述
## 2. 范围确认
## 3. 验收标准核对
## 4. 缺陷状态
## 5. 签批意见`
    },
    constraints: [
      '每项验收标准必须有明确的验证结果',
      '未关闭的缺陷需有说明',
      '签批意见需由对应负责人确认'
    ],
    qualityChecks: [
      '验收标准是否全部满足？',
      '未解决问题是否有后续计划？',
      '签批是否完整？'
    ]
  },

  deployment: {
    type: 'deployment',
    name: '部署方案生成',
    role: {
      title: 'DevOps 工程师',
      certifications: 'AWS/K8s认证',
      expertise: ['容器化', 'CI/CD', '环境配置', '监控告警']
    },
    task: '基于架构文档，生成详细的部署方案',
    inputDescription: '架构文档、基础设施配置、安全要求',
    outputFormat: {
      jsonSchema: {
        environments: [],
        deploymentSteps: [],
        rollbackPlan: '',
        monitoringSetup: {},
        securityConfig: {}
      },
      markdownTemplate: `# 部署方案

## 1. 环境概述
## 2. 部署步骤
## 3. 回滚方案
## 4. 监控配置
## 5. 安全配置`
    },
    constraints: [
      '部署步骤需可回滚',
      '需包含详细的回滚方案',
      '安全配置需符合等保要求'
    ],
    qualityChecks: [
      '部署步骤是否完整可执行？',
      '回滚方案是否可行？',
      '监控告警是否覆盖关键指标？'
    ],
    relatedSpecs: [
      { title: 'Vercel 部署规范', path: 'docs/AI工程化开发手册/Vercel 部署规范（AI 工程化开发版）.md', category: 'process' },
      { title: '安全工程规范', path: 'docs/AI工程化开发手册/安全工程规范（AI 工程化版）.md', category: 'security' }
    ]
  },

  initialization: {
    type: 'initialization',
    name: '项目初始化',
    role: {
      title: 'Tech Lead + 全栈工程师',
      certifications: '基于 .cursor/rules/ 技术规范 + docs/AI工程化开发手册/',
      expertise: [
        'Vue3 + TypeScript + Vite',
        'Monorepo 架构 (Turborepo + pnpm)',
        'vxe-table 企业级表格',
        'HyperFormula 公式引擎',
        'Pinia 状态管理',
        'TailwindCSS 样式方案',
        'Cursor Rules 配置',
        'Vitest 单元测试'
      ]
    },
    task: '基于架构文档和 Cursor Rules，生成项目脚手架代码（配置 + 目录结构 + 基础源码），为 Cursor 开发阶段做准备。生成的代码保存到 v2/dev/{projectName}/ 目录。',
    inputDescription: `【自动加载】
- 架构文档 proposalContent（包含 techStack, components, architectureType, steps）
- .cursor/rules/tech-lead.mdc（技术决策规范）
- .cursor/rules/frontend-vue3.mdc（前端规范）
- .cursor/rules/backend.mdc（后端规范）
- .cursor/rules/database.mdc（数据库规范）
- .cursor/rules/security-rules.md（安全规范）

【规范文档】
- docs/AI工程化开发手册/前端工程化 SOP（Vue3 + TS + Vben Admin）.md
- docs/AI工程化开发手册/后端工程化 SOP（Node.js + NestJS）.md
- docs/AI工程化开发手册/数据库设计规范（AI 工程化版）.md
- docs/AI工程化开发手册/安全工程规范（AI 工程化版）.md

【技术选型映射】
- 在线表格编辑 → vxe-table
- 公式计算 → HyperFormula
- 状态管理 → Pinia
- 构建工具 → Vite
- Monorepo → Turborepo + pnpm

【输出路径】
- 项目代码：v2/dev/{projectName}/src/
- Cursor Rules：v2/dev/{projectName}/.cursor/rules/
- Step 文档：v2/dev/{projectName}/docs/steps/`,
    outputFormat: {
      jsonSchema: {
        projectName: '项目名称',
        techStack: '技术栈数组',
        components: '组件数组',
        dependencies: { production: '生产依赖[]', development: '开发依赖[]' },
        files: [{ path: '文件路径', content: '文件内容' }]
      },
      markdownTemplate: `# 项目初始化

## 1. 技术选型
## 2. 项目结构
## 3. 依赖配置
## 4. Cursor Rules`
    },
    constraints: [
      '项目输出到 v2/dev/{projectName}/ 目录',
      '基于架构文档的 techStack 生成 package.json 依赖',
      '组件目录根据架构文档的 components 数组生成',
      '必须包含 vxe-table + HyperFormula 配置（如技术栈包含）',
      '必须包含 TailwindCSS + PostCSS 配置',
      '必须包含 ESLint + Prettier 配置',
      '必须包含 Vitest 测试配置',
      'Cursor Rules 从 .cursor/rules/ 复制相关文件到项目 v2/dev/{projectName}/.cursor/rules/',
      '生成的代码必须是可直接运行的脚手架',
      'Step 文档（step1.md, step2.md...）从 architecture 阶段的 steps 数组读取，保存到 v2/dev/{projectName}/docs/steps/',
      '严格遵循 docs/AI工程化开发手册/ 中的规范'
    ],
    qualityChecks: [
      'package.json 依赖是否完整？',
      'vite.config.ts 是否正确配置？',
      'src/main.ts 入口文件是否完整？',
      '是否包含 ESLint + Prettier 配置？',
      'Cursor Rules 是否复制到 v2/dev/{projectName}/.cursor/rules/？',
      '是否遵循前端/后端工程化 SOP 规范？',
      'Step 文档是否生成到 v2/dev/{projectName}/docs/steps/？'
    ],
    relatedSpecs: [
      { title: '前端工程化 SOP', path: 'docs/AI工程化开发手册/前端工程化 SOP（Vue3 + TS + Vben Admin）.md', category: 'frontend' },
      { title: '后端工程化 SOP', path: 'docs/AI工程化开发手册/后端工程化 SOP（Node.js + NestJS）.md', category: 'backend' },
      { title: '数据库设计规范', path: 'docs/AI工程化开发手册/数据库设计规范（AI 工程化版）.md', category: 'database' },
      { title: '安全工程规范', path: 'docs/AI工程化开发手册/安全工程规范（AI 工程化版）.md', category: 'security' },
      { title: 'AI工程化接入指南', path: 'docs/AI工程化开发手册/AI工程化接入指南.md', category: 'process' },
      { title: 'Cursor 使用指南', path: 'docs/AI工程化开发手册/Cursor 使用指南.md', category: 'cursor' }
    ]
  }
}

/**
 * 获取指定类型的 Prompt 配置
 */
export function getPromptConfig(type: PromptType): PromptConfig {
  const config = AI_PROMPTS[type]
  if (!config) {
    throw new Error(`未找到 Prompt 配置: ${type}`)
  }
  return config
}

/**
 * 检查是否支持指定的 Prompt 类型
 */
export function isPromptTypeSupported(type: string): type is PromptType {
  return type in AI_PROMPTS
}
