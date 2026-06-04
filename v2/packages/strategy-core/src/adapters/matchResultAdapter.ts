/**
 * MatchResult Adapter — ACL Layer #1
 * 标准化 A 的 MatchResult 以适配 B 的数据结构
 */

import type { MatchResult, StrategyInfo, IndustryInfo } from '../types'

/**
 * A 的 MatchResult 中 strategy/industry 的字段可能不完整
 * 此适配器补全 optional fields 并标准化字段名
 */
export function standardizeMatchResult(raw: MatchResult): MatchResult {
  return {
    strategy: standardizeStrategyInfo(raw.strategy),
    industry: standardizeIndustryInfo(raw.industry),
    confidence: raw.confidence ?? 0,
    reasoning: raw.reasoning ?? '',
    judgmentBasis: raw.judgmentBasis ?? '',
  }
}

function standardizeStrategyInfo(info: StrategyInfo): StrategyInfo {
  return {
    id: info.id ?? '',
    name: info.name ?? '',
    description: info.description ?? '',
  }
}

function standardizeIndustryInfo(info: IndustryInfo): IndustryInfo {
  return {
    id: info.id ?? '',
    name: info.name ?? '',
    description: info.description ?? '',
  }
}

/**
 * 反向转换：B 的数据转回 A 的 MatchResult 格式
 * 用于从 Supabase 读取后还原
 */
export function toOriginalMatchResult(standardized: MatchResult): MatchResult {
  return { ...standardized }
}