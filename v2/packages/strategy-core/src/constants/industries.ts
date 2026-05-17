import type { IndustryInfo } from '../types'

export const INDUSTRIES: IndustryInfo[] = [
  { id: 'software', name: '软件互联网', description: '追求快速迭代、小步快跑，允许试错，合规成本低' },
  { id: 'manufacturing', name: '制造业', description: '开发周期长，核心约束是供应链、合规认证、量产可行性' },
  { id: 'healthcare', name: '医疗健康', description: '强监管属性，合规优先于效率，容错率近乎为0' },
  { id: 'finance', name: '金融服务', description: '安全与合规是核心，功能稳定性优先于创新速度' },
  { id: 'retail', name: '传统零售', description: '围绕消费场景，核心是落地效率和市场适配' }
]

export function getIndustryById(id: string): IndustryInfo | undefined {
  return INDUSTRIES.find(i => i.id === id)
}

export function getAllIndustries(): IndustryInfo[] {
  return [...INDUSTRIES]
}