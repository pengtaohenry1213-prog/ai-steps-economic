import { z } from 'zod'

export const ScopeSchema = z.object({
  inScope: z.union([
    z.object({
      P0: z.array(z.string()).refine(arr => arr.length >= 1, {
        message: '至少需要一个 P0 任务'
      }),
      P1: z.array(z.string()).optional(),
      P2: z.array(z.string()).optional()
    }),
    z.array(z.string())
  ]),
  outScope: z.array(z.string()).optional()
})

export const AcceptanceSchema = z.union([
  z.object({
    functionality: z.array(z.string()).refine(arr => arr.length >= 1, {
      message: '至少需要一条功能验收标准'
    }),
    performance: z.record(z.string(), z.string()).optional(),
    security: z.array(z.string()).optional()
  }),
  z.string()
])

export const RiskSchema = z.object({
  type: z.enum(['高', '中', '低']),
  description: z.string(),
  impact: z.string().optional(),
  countermeasure: z.string().optional()
})

export const InitSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  type: z.string().optional(),
  decisionMakers: z.array(z.string()).optional(),
  background: z.string().min(1, '项目背景不能为空'),
  currentIssues: z.array(z.string()).optional(),
  goals: z.array(z.string()).refine(arr => arr.length >= 1, {
    message: '项目目标不能为空'
  }),
  milestones: z.array(z.string()).optional(),
  risks: z.array(RiskSchema).optional(),
  humanGate: z.object({
    pmo: z.array(z.string()).optional(),
    security: z.array(z.string()).optional()
  }).optional()
})

export const RequirementSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  type: z.string().optional(),
  decisionMakers: z.array(z.string()).optional(),
  background: z.string().optional(),
  currentIssues: z.array(z.string()).optional(),
  goals: z.array(z.string()).refine(arr => arr.length >= 1, {
    message: '项目目标不能为空'
  }),
  scope: ScopeSchema.optional(),
  acceptance: AcceptanceSchema.optional(),
  milestones: z.array(z.string()).optional(),
  risks: z.array(RiskSchema).optional(),
  humanGate: z.object({
    pmo: z.array(z.string()).optional(),
    security: z.array(z.string()).optional()
  }).optional()
})

export const ArchitectureSchema = z.object({
  name: z.string().min(1, '项目名称不能为空'),
  overview: z.string().min(1, '架构概述不能为空'),
  architectureType: z.string().optional(),
  components: z.array(z.string()).refine(arr => arr.length >= 1, {
    message: '至少需要一个组件设计'
  }),
  dataModel: z.record(z.string(), z.unknown()).optional(),
  apiDesign: z.array(z.unknown()).optional(),
  securityDesign: z.record(z.string(), z.string()).optional(),
  deploymentArchitecture: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  nonFunctionalRequirements: z.record(z.string(), z.string()).optional()
})

export const MilestoneSchema = z.object({
  name: z.string(),
  deadline: z.string().optional(),
  deliverables: z.array(z.string()).optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional()
})

export const TestPlanSchema = z.object({
  testScope: z.object({
    inScope: z.array(z.string()).optional(),
    outScope: z.array(z.string()).optional()
  }).optional(),
  testStrategy: z.string().optional(),
  testTypes: z.array(z.string()).optional(),
  testEnvironment: z.record(z.string(), z.string()).optional(),
  testSchedule: z.array(MilestoneSchema).optional(),
  testDeliverables: z.array(z.string()).optional(),
  testCases: z.array(z.unknown()).optional()
})

export const AcceptanceReportSchema = z.object({
  summary: z.string().min(1, '验收概述不能为空'),
  scopeVerification: z.array(z.string()).optional(),
  criteriaVerification: z.array(z.string()).optional(),
  defects: z.object({
    open: z.array(z.string()).optional(),
    closed: z.array(z.string()).optional()
  }).optional(),
  signOff: z.record(z.string(), z.string()).optional()
})

export const DeploymentSchema = z.object({
  environments: z.array(z.string()).refine(arr => arr.length >= 1, {
    message: '至少需要一个部署环境'
  }),
  deploymentSteps: z.array(z.string()).refine(arr => arr.length >= 1, {
    message: '至少需要一个部署步骤'
  }),
  rollbackPlan: z.string().optional(),
  monitoringSetup: z.record(z.string(), z.string()).optional(),
  securityConfig: z.record(z.string(), z.string()).optional()
})

export type InitDocument = z.infer<typeof InitSchema>
export type RequirementDocument = z.infer<typeof RequirementSchema>
export type ArchitectureDocument = z.infer<typeof ArchitectureSchema>
export type TestPlanDocument = z.infer<typeof TestPlanSchema>
export type AcceptanceReportDocument = z.infer<typeof AcceptanceReportSchema>
export type DeploymentDocument = z.infer<typeof DeploymentSchema>

export const StageSchemaMap: Record<string, z.ZodType> = {
  init: InitSchema,
  requirement: RequirementSchema,
  architecture: ArchitectureSchema,
  testing: TestPlanSchema,
  acceptance: AcceptanceReportSchema,
  deployment: DeploymentSchema
}

export interface ValidationResult {
  success: boolean
  data?: Record<string, unknown>
  errors?: Array<{
    path: string
    message: string
  }>
}

export function validateDocument(stageId: string, data: unknown): ValidationResult {
  const schema = StageSchemaMap[stageId]

  if (!schema) {
    return { success: true, data: data as Record<string, unknown> }
  }

  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data as Record<string, unknown> }
  }

  const errors = result.error.issues.map(issue => ({
    path: issue.path.join('.'),
    message: issue.message
  }))

  return { success: false, errors }
}

export function getRequiredFields(stageId: string): string[] {
  const requiredMap: Record<string, string[]> = {
    init: ['name', 'goals'],
    requirement: ['name', 'goals', 'scope', 'acceptance'],
    architecture: ['name', 'overview', 'components'],
    testing: [],
    acceptance: ['summary'],
    deployment: ['environments', 'deploymentSteps']
  }
  return requiredMap[stageId] || []
}

export function getCompletenessScore(stageId: string, data: Record<string, unknown>): number {
  const requiredFields = getRequiredFields(stageId)

  if (requiredFields.length === 0) return 100

  const missingCount = requiredFields.filter(field => {
    const value = data[field]
    if (Array.isArray(value)) return value.length === 0
    return value === undefined || value === null || value === ''
  }).length

  return Math.round(((requiredFields.length - missingCount) / requiredFields.length) * 100)
}
