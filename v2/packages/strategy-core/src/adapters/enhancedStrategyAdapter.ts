/**
 * EnhancedStrategy Adapter — ACL Layer #2
 * 标准化 A 的 EnhancedStrategy 以适配 B 的数据结构
 */

import type { EnhancedStrategy, PhaseInfo, ModuleDevMode, RiskInfo, ToolChain } from '../types'

/**
 * A 的 EnhancedStrategy 有很多可选字段
 * 此适配器确保所有嵌套字段都有默认值
 */
export function standardizeEnhancedStrategy(raw: EnhancedStrategy): EnhancedStrategy {
  return {
    title: raw.title ?? '',
    definition: raw.definition ?? '',
    applicableScenarios: raw.applicableScenarios ?? [],
    notApplicableScenarios: raw.notApplicableScenarios ?? [],
    coreCharacteristics: raw.coreCharacteristics ?? [],
    coreConflict: raw.coreConflict ?? '',
    phases: (raw.phases ?? []).map(standardizePhaseInfo),
    moduleDevModes: (raw.moduleDevModes ?? []).map(standardizeModuleDevMode),
    keyNotes: raw.keyNotes ?? [],
    recommendedToolChain: (raw.recommendedToolChain ?? []).map(standardizeToolChain),
    typicalRisks: (raw.typicalRisks ?? []).map(standardizeRiskInfo),
    successCriteria: raw.successCriteria ?? [],
    industryAdaptation: raw.industryAdaptation ?? '',
  }
}

function standardizePhaseInfo(phase: PhaseInfo): PhaseInfo {
  return {
    name: phase.name ?? '',
    goal: phase.goal ?? '',
    devMode: phase.devMode ?? '',
    specLevel: phase.specLevel ?? '',
    vibeRatio: phase.vibeRatio ?? '',
    humanGate: phase.humanGate ?? '',
    deliverables: phase.deliverables ?? '',
    successCriteria: phase.successCriteria ?? '',
  }
}

function standardizeModuleDevMode(mode: ModuleDevMode): ModuleDevMode {
  return {
    moduleType: mode.moduleType ?? '',
    devMode: mode.devMode ?? '',
    humanGate: mode.humanGate ?? '',
    note: mode.note ?? '',
  }
}

function standardizeToolChain(tc: ToolChain): ToolChain {
  return {
    phase: tc.phase ?? '',
    tools: tc.tools ?? '',
    note: tc.note ?? '',
  }
}

function standardizeRiskInfo(risk: RiskInfo): RiskInfo {
  return {
    riskType: risk.riskType ?? '',
    specificRisk: risk.specificRisk ?? '',
    mitigation: risk.mitigation ?? '',
  }
}

/**
 * 反向转换
 */
export function toOriginalEnhancedStrategy(standardized: EnhancedStrategy): EnhancedStrategy {
  return { ...standardized }
}