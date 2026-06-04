/**
 * ACL Layer — Anti-Corruption Layer Adapters
 * 项目合并 B→A 的数据转换层
 *
 * 用于在项目 A（策略核心）和项目 B（生命周期管理）之间
 * 做数据结构的双向转换
 */

export { standardizeMatchResult, toOriginalMatchResult } from './matchResultAdapter'
export { standardizeEnhancedStrategy, toOriginalEnhancedStrategy } from './enhancedStrategyAdapter'
export {
  toProposalContent,
  toProposalDocument,
  formatProposalAsMarkdown,
  toProposalContentFromAny,
} from './proposalAdapter'

import type { ProposalDocument } from '../types'
import type { ProposalContent } from './proposalAdapter'

/**
 * ACL 入口函数
 * 将项目 A 的数据结构转换为项目 B 的 ProposalContent
 */
export function aclToB<T>(data: T): ProposalContent | null {
  if (isProposalDocument(data)) {
    return toProposalContent(data as ProposalDocument)
  }
  return null
}

// 重新导出类型供外部使用
export type { ProposalContent }