import type { ProposalContent } from '../types'
import {
  validateDocument,
  getRequiredFields,
  getCompletenessScore,
  type ValidationResult
} from '../schemas/documentSchemas'

export interface DocumentValidation {
  isValid: boolean
  errors: Array<{ field: string; message: string; level: 'high' | 'medium' | 'low' }>
  score: number
  missingFields: string[]
}

export function validateProposalContent(
  stageId: string,
  content: ProposalContent | null | undefined
): DocumentValidation {
  if (!content) {
    return {
      isValid: false,
      errors: [{ field: 'document', message: '文档内容为空', level: 'high' }],
      score: 0,
      missingFields: getRequiredFields(stageId)
    }
  }

  const result = validateDocument(stageId, content)

  if (result.success) {
    const score = getCompletenessScore(stageId, content)
    const requiredFields = getRequiredFields(stageId)
    const missingFields = requiredFields.filter(field => {
      const value = (content as Record<string, unknown>)[field]
      if (Array.isArray(value)) return value.length === 0
      return value === undefined || value === null || value === ''
    })

    return {
      isValid: missingFields.length === 0,
      errors: [],
      score,
      missingFields
    }
  }

  const errors = (result.errors || []).map(err => ({
    field: err.path,
    message: err.message,
    level: err.path.includes('name') || err.path.includes('goals') || err.path.includes('scope') ? 'high' as const : 'medium' as const
  }))

  const requiredFields = getRequiredFields(stageId)
  const score = getCompletenessScore(stageId, content as Record<string, unknown>)
  const missingFields = requiredFields.filter(field => {
    const value = (content as Record<string, unknown>)[field]
    if (Array.isArray(value)) return value.length === 0
    return value === undefined || value === null || value === ''
  })

  return {
    isValid: false,
    errors,
    score,
    missingFields
  }
}

export function createDocumentValidator(stageId: string) {
  return (content: ProposalContent | null | undefined) => validateProposalContent(stageId, content)
}