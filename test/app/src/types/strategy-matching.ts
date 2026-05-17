/**
 * 策略匹配服务类型定义
 */

export interface StrategyInfo {
  id: string
  name: string
  description: string
}

export interface IndustryInfo {
  id: string
  name: string
  description: string
}

export interface MatchResult {
  strategy: StrategyInfo
  industry: IndustryInfo
  confidence: number
  reasoning: string
}

export interface MatchingRequest {
  userInput: string
}

export interface MatchingResponse {
  success: boolean
  data?: MatchResult
  error?: string
}

/**
 * 可用的开发策略列表
 */
export const STRATEGIES: StrategyInfo[] = [
  { id: 'T1', name: '从0到1创新型新项目', description: '业务需求高度不确定，没有现有代码基础，核心目标是快速验证PMF' },
  { id: 'T2', name: '从0到1稳定型新项目', description: '业务需求明确但采用新技术栈，核心目标是可控风险下准确实现需求' },
  { id: 'T3', name: '成熟型新项目', description: '业务需求明确，技术栈成熟，核心目标是高效标准化交付' },
  { id: 'T4', name: '核心系统大升级', description: '对核心生产系统进行架构重构，核心目标是零中断平稳升级' },
  { id: 'T5', name: '常规功能迭代', description: '在成熟系统上功能扩展，核心目标是快速交付不影响稳定性' },
  { id: 'T6', name: 'Bug修复', description: '修复现有系统的缺陷' },
  { id: 'T7', name: '技术债务清理/代码重构', description: '清理技术债务，提升代码质量' },
  { id: 'T8', name: '原型验证/概念演示', description: '快速生成可运行的原型验证想法' },
  { id: 'T9', name: '线上紧急故障处理', description: '处理生产环境的紧急故障' },
  { id: 'T10', name: '内部工具/脚本开发', description: '开发内部使用的工具和脚本' },
  { id: 'T11', name: '第三方系统集成', description: '与第三方系统进行对接集成' },
  { id: 'T12', name: '数据迁移/同步', description: '数据的迁移或同步工作' },
  { id: 'T13', name: '安全加固/合规改造', description: '安全加固或合规相关的改造' },
  { id: 'T14', name: '性能优化', description: '系统性能优化' }
]

/**
 * 可用的行业列表
 */
export const INDUSTRIES: IndustryInfo[] = [
  { id: 'software', name: '软件互联网', description: '追求快速迭代、小步快跑，允许试错，合规成本低' },
  { id: 'manufacturing', name: '制造业', description: '开发周期长，核心约束是供应链、合规认证、量产可行性' },
  { id: 'healthcare', name: '医疗健康', description: '强监管属性，合规优先于效率，容错率近乎为0' },
  { id: 'finance', name: '金融服务', description: '安全与合规是核心，功能稳定性优先于创新速度' },
  { id: 'retail', name: '传统零售', description: '围绕消费场景，核心是落地效率和市场适配' }
]