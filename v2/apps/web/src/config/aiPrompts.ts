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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
  }
  /** 约束条件 */
  constraints: string[]
  /** 质量检查项 */
  qualityChecks: string[]
  /** 关联的工程化规范文档 */
  relatedSpecs?: RelatedSpec[]
}

export const AI_PROMPTS: Record<PromptType, PromptConfig> = {
  /**
   * 立项书生成
   * 根据输入文档，判断项目类型，生成对应类型的正式立项书
   */
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
      '根据输入文档内容，自主判断立项书类型（内部研发/客户项目/产品策划/技术预研/敏捷迭代），并在项目基本信息中注明类型及判断依据',
      '【判定规则】项目类型判定：含有"客户交付"、"合同"、"甲方"→客户项目；含有"产品升级"、"v1"、"v2"、"迭代"→产品策划；含有"内部"、"自用"→内部研发；含有"技术预研"、"POC"→技术预研；含有"敏捷"、"Sprint"、"迭代"→敏捷迭代',
      '【判定规则】P0/P1/P2 划分标准：P0=核心功能（无此功能项目无法运行）、P1=重要功能（提升效率但可workaround）、P2=优化功能（可有可无）',
      '【判定规则】高风险项判定：涉及外部依赖（第三方API、外包团队）、安全合规（等保、隐私）、技术选型创新（使用未经验证的技术）→高风险',
      '【判定规则】里程碑工期估算：P0功能点≤3个→总工期≤4周；P0功能点>3个→总工期≤6周；含复杂技术（CRDT、微服务）→额外+2周',
      '【输出格式】basicInfo.type 必须为：内部研发 | 客户项目 | 产品策划 | 技术预研 | 敏捷迭代 其一',
      '【输出格式】scope.inScope.P0/P1/P2 必须为数组，每个元素格式："功能描述 - v1复用量%"',
      '【输出格式】milestones 每个元素格式："M{n}: {阶段名}（Day {天数}）"',
      '【输出格式】risks 每个元素必须包含：level（高/中/低）、item（风险项）、mitigation（缓解措施）'
    ],
    qualityChecks: [
      '【检查】background 字段长度≥50字，且包含"现状问题"和"升级目标"两部分',
      '【检查】scope.inScope.P0 数组长度≥1，P1 数组长度≥1，P2 可为空数组',
      '【检查】scope.inScope.P0 每个元素包含功能描述和 v1复用量百分比（如"40%"）',
      '【检查】acceptance.functionality 包含≥3个可测试项，每项格式为"动词+结果"（如"显示3个模型"）',
      '【检查】acceptance.performance 为对象，key 为指标名，value 为量化标准（含具体数值）',
      '【检查】milestones 数组覆盖 M0-M5，且 Day 天数递增（M0=1, M1=5, M2=10, M3=15, M4=18, M5=23）',
      '【检查】risks 数组包含≥1个高风险项，格式完整（有 level/item/mitigation）',
      '【检查】humanGate.pmo 和 humanGate.security 各包含≥2个检查项',
      '【检查】输出 JSON 的所有数组字段长度>0（允许空的数组：outScope、risks除外）',
      '【检查】markdownTemplate 中每个章节都有实际内容，无"..."或"此处填写"等占位符'
    ]
  },
  /**
   * 需求补充文档生成
   * 基于立项书范围，补充详细的用户故事和功能需求，生成需求补充文档
   * Requirement（需求）：是更宽泛的概念，包含业务需求、用户需求、功能需求、非功能需求（性能、安全、兼容性等），是 “需要做什么” 的原始诉求；
   * PRD（产品需求文档）：是需求的结构化、标准化交付物，是将零散的 requirement 整理成规范的文档，包含需求背景、目标、功能清单、交互逻辑、验收标准、优先级等，是研发、测试、产品对齐的核心文档；
   */
  requirement: {
    type: 'requirement',
    name: '需求补充文档生成',
    role: {
      title: '产品需求分析师',
      expertise: ['需求收集', '用例分析', 'PRD编写', '优先级排序', '迭代规划']
    },
    task: '基于立项书范围，补充详细的用户故事和功能需求，生成需求补充文档。迭代场景需加载现有 Step 文档，生成新的/更新的 Step 文档。',
    inputDescription: '【自动加载】立项书（已自动传入）\n【用户上传】竞品分析报告、用户调研/访谈记录、业务需求描述文档、原型设计稿、用户反馈等（最多2个文件）\n【迭代场景额外输入】现有 Step 文档（step1.md ~ stepN.md），从 v2/dev/{projectName}/docs/steps/ 目录加载',
    outputFormat: {
      jsonSchema: {
        overview: '',
        userStories: [],
        functionalRequirements: [],
        nonFunctionalRequirements: {},
        acceptanceCriteria: [],
        priority: { P0: [], P1: [], P2: [] },
        iterationSteps: [{ action: 'new', stepId: 'step6', title: '功能名称', reason: '新增原因' }]
      },
      markdownTemplate: `# 需求补充文档

## 1. 需求概述（基于立项书范围）
## 2. 用户故事（从调研资料提取）
## 3. 功能需求详细说明
## 4. 非功能需求
## 5. 验收标准（细化立项书标准）
## 6. 优先级定义（P0/P1/P2）
## 7. 迭代计划（如为迭代场景）`
    },
    constraints: [
      '严格在立项书定义的范围内补充需求，不得超出范围',
      '需求描述必须具体、可测试',
      '每个功能点需对应验收标准',
      '优先级划分需有明确依据',
      '从上传文档中提取具体的用户故事和功能点，不要虚构',
      '【判定规则】用户故事格式："作为[角色]，我希望[功能]，以便[收益]"，缺少任一部分视为不合格',
      '【判定规则】功能需求描述格式："[功能名称]：[具体描述]，[验收标准]"',
      '【判定规则】验收标准格式："Given[前置条件] When[操作] Then[结果]"，必须包含可验证的数值',
      '【判定规则】P0=核心业务流程、P1=重要但可暂缓、P2=优化体验',
      '【判定规则】迭代场景必须分析现有 Step 文档，确定：新增功能→new，更改现有→update，废弃功能→delete',
      '【判定规则】迭代场景需考虑现有 v1 复用率影响，更改现有 Step 可能降低 v1 复用率',
      '【判定规则】迭代场景的新增 Step 编号接续现有最大编号（如现有 step1~step5，新增 step6）',
      '【输出格式】functionalRequirements 数组每个元素必须包含：功能名称、描述、验收标准、优先级',
      '【输出格式】nonFunctionalRequirements 必须包含：性能（响应时间）、安全（等保级别）、兼容性（浏览器/OS）',
      '【输出格式】priority.P0/P1/P2 必须与 functionalRequirements 中的 priority 字段一致',
      '【输出格式】iterationSteps 数组：action 为 new/update/delete，stepId 为目标 Step 编号，title 为功能名称，reason 为变更原因'
    ],
    qualityChecks: [
      '【检查】overview 字段长度≥30字，概括项目核心价值',
      '【检查】userStories 数组长度≥2，每条包含"作为...我希望...以便..."三个部分',
      '【检查】functionalRequirements 每个元素包含：功能名称（≥4字）、描述（≥20字）、验收标准（Given-When-Then格式）',
      '【检查】验收标准包含具体数值（如"响应时间<200ms"、"支持100并发"）',
      '【检查】nonFunctionalRequirements 包含：性能、安全、兼容性三个维度',
      '【检查】priority.P0 数组长度≥1，priority.P1 数组长度≥1',
      '【检查】functionalRequirements 中的每条需求都有对应的验收标准',
      '【检查】优先级与业务价值匹配：核心用户痛点→P0，效率提升→P1，体验优化→P2',
      '【检查】markdown 各章节内容完整，无占位符',
      '【迭代检查】iterationSteps 数组覆盖所有变更需求，每项包含 action/stepId/title/reason',
      '【迭代检查】新增 Step 编号连续，无跳号（如 step6, step7）',
      '【迭代检查】update 类型的 iterationSteps 需说明对现有 v1 复用率的影响'
    ]
  },
  /**
   * 需求差距分析
   * 基于立项书范围和行业标准模板，分析需求差距并给出补充建议
   */
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
      '优先关注 P0 级需求缺失',
      '【判定规则】hasCovered 判定：立项书中已有的功能点，与行业标准对比后确认覆盖的条目',
      '【判定规则】missingSuggestions 判定：立项书中缺失但行业标准要求的条目，按优先级排序',
      '【判定规则】bestPractices 需引用具体行业标准（如ISO 25000、CMMI），不能空泛推荐',
      '【输出格式】missingSuggestions 数组每个元素：category（分类）、item（缺失项）、reason（补充理由）、priority（P0/P1/P2）',
      '【输出格式】bestPractices 数组每个元素：[标准名称] - [具体实践] - [预期收益]'
    ],
    qualityChecks: [
      '【检查】hasCovered 数组长度≥立项书 scope.inScope 的 50%',
      '【检查】missingSuggestions 每项包含：category（非空）、item（非空）、reason（≥20字）',
      '【检查】missingSuggestions 按 priority 排序，P0 在前',
      '【检查】bestPractices 每项引用具体标准，不能泛指"业界最佳"',
      '【检查】summary 字段≥50字，概括差距分析和改进建议',
      '【检查】markdown 各章节内容完整，hasCovered/missingSuggestions/bestPractices 数组长度>0'
    ]
  },
  /**
   * 架构设计文档生成
   * 基于需求文档，设计满足非功能需求（NFR）的系统架构方案，并生成开发任务步骤文档
   */
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
        steps: [{
          id: 'step1',
          title: '具体任务名称',
          v1Reuse: 'v1复用量百分比，如"40%"',
          milestone: '里程碑映射，如"M1: 表格渲染（Day 5）"',
          target: '详细描述这个step需要完成的具体功能，包括要实现的核心功能、用户交互流程、数据流转过程',
          constraints: ['遵循前端工程化 SOP（Vue3 + TypeScript）', '遵循后端工程化 SOP（如果涉及后端）', '遵循数据库设计规范（如果涉及数据操作）', '遵循安全工程规范'],
          acceptance: ['具体的可测试验收条件', '如：用户可以通过邮箱注册新账号', '单元测试覆盖率达到70%', '无SQL注入和XSS漏洞'],
          files: ['src/views/具体文件名.vue', 'src/api/具体文件名.ts', 'src/stores/具体文件名.ts（如果需要）'],
          risk: '风险提示，如"【高】HyperFormula与v1公式语法不兼容：逐一验证，编写兼容层"',
          dependsOn: 'step{N-1}.md（如果有依赖）'
        }]
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

### Step 1: {P0[0] 表格编辑}

## 任务目标
{从 scope.inScope.P0[0] 提取具体功能描述，如"vxe-table封装，支持双击编辑、虚拟滚动"}

## 详细说明
- v1复用量：{从 P0[0] 提取百分比，如"40%"}
- 核心功能：{具体功能描述}
- 用户交互：{用户如何使用}
- 数据流转：{数据如何处理}

## 里程碑映射
- M1: 表格渲染（Day 5）

## 约束条件
- 遵循前端工程化 SOP（docs/AI工程化开发手册/前端工程化 SOP（Vue3 + TS + Vben Admin）.md）
- 遵循后端工程化 SOP（docs/AI工程化开发手册/后端工程化 SOP（Node.js + NestJS）.md）
- 遵循数据库设计规范（docs/AI工程化开发手册/数据库设计规范（AI 工程化版）.md）
- 遵循安全工程规范（docs/AI工程化开发手册/安全工程规范（AI 工程化版）.md）

## 验收标准
### 功能验收
- [ ] vxe-table表格渲染正确，支持树形展示
- [ ] Mock数据正确加载，显示3个模型+3个版本

### 性能验收
| 指标 | 标准 |
|------|------|
| 表格加载 | <2s（1000行数据） |
| 公式计算 | <100ms（100个公式） |

### 安全验收
- [ ] 敏感数据字段脱敏
- [ ] 操作日志记录

## 涉及文件
- src/views/vxe-table(catalog).vue
- src/api/model.ts
- src/stores/modelStore.ts

## 前置依赖
- 无

## 风险提示
- 【高】HyperFormula与v1公式语法不兼容：逐一验证，编写兼容层

## 关联规范
- 前端工程化 SOP → 组件规范
- 后端工程化 SOP → API规范
- 安全工程规范 → 安全要求

### Step 2: {P0[1] 公式引擎}

## 任务目标
{从 scope.inScope.P0[1] 提取具体功能描述，如"HyperFormula+财务函数XNPV/NPV/IRR混合方案"}

## 详细说明
- v1复用量：{从 P0[1] 提取百分比，如"30%"}
- 核心功能：{具体功能描述}
- 用户交互：{用户如何使用}
- 数据流转：{数据如何处理}

## 里程碑映射
- M2: 编辑功能（Day 10）

## 约束条件
（同上）

## 验收标准
### 功能验收
- [ ] 公式计算正确（SUM/XIRR/XNPV/NPV/IRR等）

### 性能验收
| 指标 | 标准 |
|------|------|
| 公式计算 | <100ms（100个公式） |

## 涉及文件
- src/components/formula/FormulaEngine.vue
- src/components/formula/FinancialFunctions.ts

## 前置依赖
- step1.md

## 风险提示
- 【高】循环依赖算法复杂度：Floyd算法验证+Excel迭代计算兜底

### Step 3: {P0[2] 版本管理}

## 任务目标
{从 scope.inScope.P0[2] 提取具体功能描述，如"模型版本CRUD+状态机"}

## 详细说明
- v1复用量：{从 P0[2] 提取百分比，如"80%"}
- 核心功能：{具体功能描述}
- 用户交互：{用户如何使用}
- 数据流转：{数据如何处理}

## 里程碑映射
- M3: 版本管理（Day 15）

## 约束条件
（同上）

## 验收标准
### 功能验收
- [ ] 版本状态机流转正确（草稿→已提交→已锁定）
- [ ] 锁定版本不可编辑

### 安全验收
- [ ] 权限矩阵生效

## 涉及文件
- src/views/versionManagement.vue
- src/stores/versionStore.ts

## 前置依赖
- step2.md

## 风险提示
- 【中】等保合规要求：预研spec-09，架构设计预留

### Step 4: {P1[0] 导入导出}

## 任务目标
{从 scope.inScope.P1[0] 提取具体功能描述，如"Excel模板导入/导出"}

## 详细说明
- v1复用量：{从 P1[0] 提取百分比，如"50%"}
- 核心功能：{具体功能描述}
- 用户交互：{用户如何使用}
- 数据流转：{数据如何处理}

## 里程碑映射
- M4: 导入导出（Day 18）

## 约束条件
（同上）

## 验收标准
### 功能验收
- [ ] Excel模板导入正常
- [ ] Excel导出正常
- [ ] 数据格式化正确（千分位、百分比）

## 涉及文件
- src/components/excel/ImportExport.vue

## 前置依赖
- step3.md

## 风险提示
- 【低】技术栈差异：使用熟悉的Vue 3 + vxe-table`,
      stepsTemplate: `# Step {N}: {具体任务名称}

## 任务目标
{详细描述这个 step 需要完成的具体功能，包括：
- 要实现的核心功能
- 用户交互流程
- 数据流转过程
}

## 技术要求
- 遵循前端工程化 SOP（docs/AI工程化开发手册/前端工程化 SOP（Vue3 + TS + Vben Admin）.md）
- 遵循后端工程化 SOP（docs/AI工程化开发手册/后端工程化 SOP（Node.js + NestJS）.md）
- 遵循数据库设计规范（docs/AI工程化开发手册/数据库设计规范（AI 工程化版）.md）
- 遵循安全工程规范（docs/AI工程化开发手册/安全工程规范（AI 工程化版）.md）

## 验收标准
### 功能验收
{从 acceptance.functionality 中筛选与当前 step 相关的条目，逐条列出}

### 性能验收
| 指标 | 标准 |
|------|------|
{从 acceptance.performance 中筛选与当前 step 相关的条目，格式化为表格}

### 安全验收
{从 acceptance.security 中筛选与当前 step 相关的条目}

## 涉及文件
{具体文件路径，格式：}
- src/views/{组件名}.vue
- src/api/{api名}.ts
- src/stores/{store名}.ts（如需要）
- src/types/{类型名}.ts（如需要）

## 前置依赖
{step{N-1}.md 如有，否则：无}

## 风险提示
{从 risks 数组中筛选 level=high/medium 且与当前 step 相关的风险项，格式：}
- 【{风险等级}】{风险项}：{缓解措施}

## 关联规范
- 前端工程化 SOP → {相关章节}
- 后端工程化 SOP → {相关章节}
- 安全工程规范 → {相关章节}`
    },
    constraints: [
      '架构必须由需求驱动：每个架构决策必须有对应的需求依据',
      '性能要求必须映射到具体的架构策略（如：响应时间<100ms → 缓存策略）',
      '安全要求必须映射到具体的安全措施（如：等保二级 → 审计日志）',
      '技术选型必须有明确的优缺点对比',
      '必须包含架构决策记录（ADR），记录关键选型理由',
      '严格遵循 docs/AI工程化开发手册/ 中的前端/后端/数据库/安全规范',
      '必须根据 scope.inScope.P0 和 P1 生成对应的 step 文档，粒度：一个 P0/P1 项 = 一个 step',
      '每个 step 文档必须包含详细的任务目标（来自 scope）、可测试的验收标准（来自 acceptance）、里程碑映射（来自 milestones）',
      'step 之间如果有依赖关系必须明确标注',
      '每个 step 的涉及文件必须具体到文件名，不能只写目录',
      '【重要】markdownTemplate 中的 ## 10. 开发任务步骤（Step 文档）部分必须包含完整的 Step N: 章节，格式严格遵循 stepsTemplate',
      '【重要】每个 Step N: 章节必须从 scope.inScope 提取对应的功能描述和 v1 复用量',
      '【重要】每个 Step N: 章节的验收标准必须从 acceptance.functionality/performance/security 提取，不能为空或笼统描述',
      '【重要】每个 Step N: 章节的里程碑映射必须与 proposal.milestones 对齐（如 M1: Day 5, M2: Day 10）',
      '【重要】每个 Step N: 章节的风险提示必须从 proposal.risks 中提取相关项，格式为"【高/中/低】风险项：缓解措施"',
      '【判定规则】组件拆分粒度：一个组件 = 一个 step，优先按业务边界拆分（而非技术层次）',
      '【判定规则】ADR 必填项：技术选型（为何选A不选B）、数据模型（表结构设计依据）、安全方案（等保要求映射）',
      '【判定规则】v1Reuse 百分比必须从 scope.inScope.P0/P1 数组元素中提取（如"40%"来自"vxe-table封装 - 40%"）',
      '【输出格式】steps 数组长度 = P0.length + P1.length，每个元素包含：id、title、v1Reuse、milestone、target、constraints、acceptance、files、risk、dependsOn',
      '【输出格式】techStack 数组每个元素为具体技术名称+版本（如"Vue3.5"而非"Vue"）',
      '【输出格式】markdown ## 10. 每个 Step N: 章节的 v1复用量 字段不能为"待确定"，必须从 P0/P1 元素中提取'
    ],
    qualityChecks: [
      '【检查】每个架构决策（组件划分、技术选型、部署方案）都有对应的需求依据',
      '【检查】performance 要求映射到具体实现策略：响应时间→缓存、数据量→分页、并发→负载均衡',
      '【检查】security 要求映射到具体措施：等保二级→审计日志、敏感数据→脱敏、权限→RBAC',
      '【检查】techStack 包含具体版本号（如 Vue3.5.13，不是 Vue3）',
      '【检查】components 数组每个元素对应一个独立部署单元',
      '【检查】ADR 数组长度≥3，记录技术选型、数据模型、安全方案三个决策',
      '【检查】steps 数组：P0 每个功能对应一个 step，step 间依赖关系正确（无循环依赖）',
      '【检查】每个 step 的 v1Reuse 为具体百分比（如"40%"），不能是"待确定"',
      '【检查】每个 step 的 milestone 与 milestones 对齐（如 step1→M1: Day 5, step2→M2: Day 10）',
      '【检查】每个 step 的 acceptance 包含量化指标（如"<2s"、"≥70%"）',
      '【检查】每个 step 的 files 具体到文件名，如"src/views/ModelList.vue"而非"src/views/"',
      '【检查】每个 step 的 risk 包含风险等级和缓解措施（如"【高】XXX：YYY"）',
      '【检查】markdown ## 10. 开发任务步骤 包含≥4个 Step N: 章节（对应 P0+P1）',
      '【检查】markdown ## 10. 每个 Step N: 章节的 v1复用量、核心功能、里程碑映射、风险提示 字段都有具体内容，无"待确定"或"待补充"',
      '【检查】markdown 各章节内容完整，无"..."、"待补充"等占位符'
    ],
    relatedSpecs: [
      { title: '前端工程化 SOP', path: 'docs/AI工程化开发手册/前端工程化 SOP（Vue3 + TS + Vben Admin）.md', category: 'frontend' },
      { title: '后端工程化 SOP', path: 'docs/AI工程化开发手册/后端工程化 SOP（Node.js + NestJS）.md', category: 'backend' },
      { title: '数据库设计规范', path: 'docs/AI工程化开发手册/数据库设计规范（AI 工程化版）.md', category: 'database' },
      { title: '安全工程规范', path: 'docs/AI工程化开发手册/安全工程规范（AI 工程化版）.md', category: 'security' }
    ]
  },
  /**
   * PRD 文档生成
   * 基于需求文档，生成详细的产品需求文档（PRD）
   */
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
  /**
   * 测试计划生成
   * 基于需求和架构文档，生成完整的测试计划，包含测试范围、策略、类型、环境、进度、交付物和测试用例
   */
  test_plan: {
    type: 'test_plan',
    name: '测试计划生成',
    role: {
      title: '测试架构师',
      certifications: 'ISTQB认证',
      expertise: ['测试策略', '测试用例设计', '缺陷管理', '自动化测试', '性能测试', '安全测试']
    },
    task: '基于需求和架构文档，生成完整的测试计划，包含测试范围、策略、类型、环境、进度、交付物和测试用例',
    inputDescription: '【自动加载】需求文档（proposalContent）、架构文档（architectureContent）\n【关联文档】接口文档、数据库设计文档',
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
      '严格基于需求文档和架构文档生成测试计划，不得虚构功能点',
      '测试用例必须与需求文档中的验收标准一一对应',
      '测试进度需与架构文档中的里程碑计划匹配',
      '【判定规则】测试范围 inScope：必须包含 P0 功能点的 100% 覆盖，P1 功能点的 80% 覆盖',
      '【判定规则】测试类型必须包含：功能测试、性能测试、安全测试（等保要求）、兼容性测试',
      '【判定规则】测试用例格式：Given[前置条件] When[操作] Then[预期结果]，必须可自动化执行',
      '【判定规则】测试环境配置：开发环境、测试环境、生产环境，必须与部署方案一致',
      '【判定规则】缺陷等级：Blocker（阻断）、Critical（严重）、Major（重要）、Minor（一般）、Suggestion（建议）',
      '【输出格式】testScope.inScope 数组每个元素格式：\"功能点 - 对应需求章节\"',
      '【输出格式】testTypes 数组必填项：单元测试、集成测试、系统测试、回归测试',
      '【输出格式】testCases 数组每个元素：id、module、title、priority、precondition、steps、expectedResult',
      '【输出格式】testSchedule 数组格式：\"M{n}: {测试活动}（Day {天数}）\"'
    ],
    qualityChecks: [
      '【检查】testScope.inScope 覆盖所有 P0 功能点，无遗漏',
      '【检查】testStrategy 包含测试方法（黑盒/白盒/灰盒）、测试重点、风险应对策略',
      '【检查】testTypes 包含≥4种测试类型：功能、性能、安全、兼容',
      '【检查】testEnvironment 包含：操作系统、浏览器、数据库、API工具、监控工具',
      '【检查】testCases 每条包含：module（非空）、title（≥10字）、priority（P0/P1/P2）、precondition、steps（≥2步）、expectedResult',
      '【检查】testCases 中 P0 功能用例数≥10 条，P1 功能用例数≥5 条',
      '【检查】testCases 包含异常场景用例（空值、边界值、错误输入），占比≥20%',
      '【检查】testSchedule 与 milestones 对齐：M0=测试准备、M2=首轮测试、M4=回归测试、M5=验收测试',
      '【检查】testDeliverables 包含：测试计划、测试用例、缺陷报告、测试报告',
      '【检查】性能测试指标来自 acceptance.performance，必须量化（如响应时间<200ms）'
    ],
    relatedSpecs: [
      { title: '前端工程化 SOP', path: 'docs/AI工程化开发手册/前端工程化 SOP（Vue3 + TS + Vben Admin）.md', category: 'frontend' },
      { title: '安全工程规范', path: 'docs/AI工程化开发手册/安全工程规范（AI 工程化版）.md', category: 'security' }
    ]
  },
  /**
   * 验收报告生成
   * 基于测试报告和实际交付物，生成验收报告，确认项目是否满足立项书和需求文档中的所有要求
   */
  acceptance: {
    type: 'acceptance',
    name: '验收报告生成',
    role: {
      title: '项目经理',
      certifications: 'PMP认证',
      expertise: ['项目验收', '质量评估', '客户沟通', '文档整理', '风险评估']
    },
    task: '基于测试报告和实际交付物，生成验收报告，确认项目是否满足立项书和需求文档中的所有要求',
    inputDescription: '【自动加载】立项书（proposalContent）、需求文档（requirementContent）、测试报告（test_report）\n【用户上传】交付物清单、用户反馈、操作手册',
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
      '严格基于立项书范围、需求文档验收标准和测试报告进行验收，不得降低标准',
      '每项验收标准必须对应具体的验证证据（测试报告、演示截图、用户确认）',
      '未关闭的缺陷必须评估对业务的影响，并提供后续处理计划',
      '【判定规则】验收通过条件：P0 标准 100% 通过，P1 标准≥90% 通过，P2 标准≥80% 通过',
      '【判定规则】缺陷验收标准：Blocker/Critical 缺陷必须 100% 关闭，Major 缺陷≥90% 关闭',
      '【判定规则】签批权限：PMO 负责人签字 + 安全负责人签字，缺一不可',
      '【判定规则】范围变更：如有范围变更，必须提供变更记录和变更影响分析',
      '【输出格式】scopeVerification 数组每个元素：\"功能点 - 验证方式 - 验证结果（通过/不通过）\"',
      '【输出格式】criteriaVerification 数组每个元素：\"标准描述 - 对应测试用例 - 测试结果 - 遗留问题\"',
      '【输出格式】defects.open 必须包含：id、description、severity、impact、后续计划',
      '【输出格式】signOff 为对象：{pmo: \"签字+日期\"，security: \"签字+日期\"}'
    ],
    qualityChecks: [
      '【检查】summary 字段≥50字，概括项目背景、验收范围、总体结论',
      '【检查】scopeVerification 覆盖立项书中所有 P0 和 P1 功能点，无遗漏',
      '【检查】criteriaVerification 每项包含：标准描述、对应的验收标准编号、测试结果、遗留问题（如有）',
      '【检查】所有 P0 验收标准必须全部通过（P0 通过率=100%）',
      '【检查】defects.open 中无 Blocker 或 Critical 级别缺陷',
      '【检查】defects.open 中 Major 缺陷有明确的解决时间表',
      '【检查】signOff.pmo 和 signOff.security 均有签字+日期',
      '【检查】如有范围变更，提供变更记录并说明对进度/成本的影响',
      '【检查】交付物清单完整：源代码、文档、部署包、测试报告、操作手册',
      '【检查】验收报告格式规范，无占位符或\"待补充\"内容'
    ],
    relatedSpecs: [
      { title: '前端工程化 SOP', path: 'docs/AI工程化开发手册/前端工程化 SOP（Vue3 + TS + Vben Admin）.md', category: 'frontend' },
      { title: '安全工程规范', path: 'docs/AI工程化开发手册/安全工程规范（AI 工程化版）.md', category: 'security' }
    ]
  },
  /**
   * 部署方案生成
   * 基于架构文档，生成详细的部署方案，包含环境配置、部署步骤、回滚方案、监控告警和安全配置
   */
  deployment: {
    type: 'deployment',
    name: '部署方案生成',
    role: {
      title: 'DevOps 工程师',
      certifications: 'AWS/K8s认证',
      expertise: ['容器化', 'CI/CD', '环境配置', '监控告警', '安全加固', '灾备方案']
    },
    task: '基于架构文档，生成详细的部署方案，包含环境配置、部署步骤、回滚方案、监控告警和安全配置',
    inputDescription: '【自动加载】架构文档（architectureContent），包含部署架构、技术栈、组件依赖\n【关联文档】安全工程规范（等保要求）',
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
      '部署方案必须基于架构文档的部署架构和技术栈生成',
      '每个部署步骤必须可回滚，不得包含不可逆操作',
      '安全配置必须符合等保要求（根据项目安全级别确定）',
      '【判定规则】环境定义：开发环境（dev）、测试环境（test）、预发布环境（staging）、生产环境（prod）',
      '【判定规则】部署模式：单机部署（小型项目）、集群部署（中型）、微服务部署（大型/高可用）',
      '【判定规则】回滚时间：单次回滚操作必须在 15 分钟内完成',
      '【判定规则】监控指标：必须包含基础资源（CPU/内存/磁盘）、应用健康、业务指标',
      '【判定规则】告警级别：Critical（紧急）、Warning（警告）、Info（通知）',
      '【输出格式】environments 数组每个元素：{name, url, replicas, resources, dependencies}',
      '【输出格式】deploymentSteps 数组每个元素：{order, action, command, rollback, timeout}',
      '【输出格式】monitoringSetup 包含：metrics（指标）、logs（日志）、traces（链路追踪）、alerts（告警规则）',
      '【输出格式】securityConfig 包含：防火墙规则、密钥管理、SSL证书、访问控制'
    ],
    qualityChecks: [
      '【检查】environments 包含所有 4 个环境（dev/test/staging/prod），配置差异明确',
      '【检查】deploymentSteps 每步包含：操作命令、回滚命令、超时时间、预期结果',
      '【检查】部署顺序正确：基础设施 → 中间件 → 应用服务 → 验证',
      '【检查】回滚方案覆盖所有关键步骤：代码回滚、配置回滚、数据回滚',
      '【检查】回滚方案可执行，有具体的命令和操作顺序',
      '【检查】monitoringSetup 包含：CPU使用率、内存使用率、响应时间、错误率、活跃连接数',
      '【检查】告警规则包含阈值和通知方式（如：CPU>80% → 邮件+短信）',
      '【检查】securityConfig 符合等保要求：端口最小化、密钥轮换、SSL/TLS加密',
      '【检查】包含数据备份策略：全量备份周期、增量备份周期、备份保留时间',
      '【检查】部署文档格式规范，无占位符，可直接执行'
    ],
    relatedSpecs: [
      { title: 'Vercel 部署规范', path: 'docs/AI工程化开发手册/Vercel 部署规范（AI 工程化开发版）.md', category: 'process' },
      { title: '安全工程规范', path: 'docs/AI工程化开发手册/安全工程规范（AI 工程化版）.md', category: 'security' }
    ]
  },
  /**
   * 项目初始化
   * 基于架构文档和 Cursor Rules，生成项目脚手架代码（配置 + 目录结构 + 基础源码），为 Cursor 开发阶段做准备。生成的代码保存到 v2/dev/{projectName}/ 目录。
   */
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
      { title: 'AI工程化接入指南', path: 'docs/AI工程化开发手册/AI工程化接入指南.md', category: 'process' }
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
