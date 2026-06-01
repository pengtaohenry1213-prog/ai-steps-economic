/**
 * Step 拆分服务
 * 将大 steps 文档拆分为独立的 step0.md, step1.md, ... 文件
 */

import type { StepDocument } from '../types'
import { formatStepAsMarkdown } from './step-generation-service'

export interface SplitStepFile {
  stepNumber: number
  fileName: string
  filePath: string
  content: string
  taskObjective: string
}

export interface SplitResult {
  stepFiles: SplitStepFile[]
  totalCount: number
}

export function splitStepsIntoFiles(
  steps: StepDocument[],
  options: { baseDir?: string; projectName?: string } = {}
): SplitResult {
  if (!steps || steps.length === 0) {
    return { stepFiles: [], totalCount: 0 }
  }

  const baseDir = options.baseDir || 'doc/steps'
  const projectName = options.projectName || ''

  const stepFiles: SplitStepFile[] = steps
    .sort((a, b) => a.stepNumber - b.stepNumber)
    .map(step => {
      const fileName = `step${step.stepNumber}.md`
      const filePath = projectName ? `${projectName}/${baseDir}/${fileName}` : `${baseDir}/${fileName}`
      return {
        stepNumber: step.stepNumber,
        fileName,
        filePath,
        content: formatStepAsMarkdown(step),
        taskObjective: step.taskObjective
      }
    })

  return {
    stepFiles,
    totalCount: stepFiles.length
  }
}

export function getStepFilePath(stepNumber: number, baseDir: string = 'doc/steps'): string {
  return `${baseDir}/step${stepNumber}.md`
}

export function formatStepsAsFullDocument(steps: StepDocument[]): string {
  const sortedSteps = [...steps].sort((a, b) => a.stepNumber - b.stepNumber)
  return sortedSteps.map(step => formatStepAsMarkdown(step)).join('\n\n---\n\n')
}