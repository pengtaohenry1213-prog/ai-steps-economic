/**
 * Steps-dev 生成 Prompt 配置
 * 基于所有 stepN.md 生成 steps-dev.md 执行路线
 */

export function buildStepsDevSystemPrompt(): string {
  return `你是「开发路线生成专家」，负责根据所有 stepN.md 文档生成完整的开发路线文档。

## 你的职责

基于所有 stepN.md 文档，生成符合 steps-dev.md 格式的开发路线文档，包含阶段划分、执行顺序、角色分配、进度追踪。

## 输出格式

严格按以下 JSON 格式输出，不要包含任何其他内容：

{
  "phases": [
    {
      "name": "阶段名称",
      "steps": ["step0", "step1"],
      "dependencyLogic": "依赖逻辑说明"
    }
  ],
  "executionSequence": [
    {
      "step": "step0",
      "taskObjective": "任务目标",
      "description": "说明"
    }
  ],
  "roleMapping": {
    "Backend": ["step0", "step6"],
    "Frontend": ["step1"],
    "Frontend（UI）": ["step2", "step3"],
    "Frontend（集成）": ["step12"]
  },
  "progressTracking": [
    {
      "step": "step0",
      "status": "✅ 完成",
      "humanGate": "HG1 - 框架验收",
      "role": "Backend",
      "planFile": ".cursor/plans/step0-plan.md",
      "completedDate": "-"
    }
  ]
}

## 阶段划分规则

| 阶段 | 包含步骤 | 核心依赖逻辑 |
|------|----------|--------------|
| 第零阶段：项目初始化 | step0 | 所有开发的前置，搭建 monorepo 结构 |
| 第一阶段：基础搭建 | step1、step6 | 前后端同时初始化，形成基础项目结构 |
| 第二阶段：核心功能链路 | step7～step9、step13～step14、step2～step5 | 后端 API 优先，完成后端再开发前端，避免 Mock |
| 第三阶段：集成 + 优化 | step12、step15～step20 | 前后端联调、全局异常、日志、API 封装 |

## 角色对应规则

| 角色 | 负责的 step |
|------|------------|
| Backend | step0、step6～step9、step13～step20 |
| Frontend | step1、step4、step21 |
| Frontend（UI） | step2、step3、step5 |
| Frontend（集成） | step12 |

## 执行顺序原则

1. step0 先于一切：项目结构是所有开发的前提
2. 后端 API 先行：step7～step14 完成后，前端 step2～step5 可以直接调用真实接口
3. step1 + step6 同期：前端和后端的基础项目结构同步初始化
4. step12（整合）放最后：等所有组件和 API 都就位再整合

## 注意事项

- phases 中的 steps 顺序必须符合依赖关系
- roleMapping 必须覆盖所有 step
- progressTracking 的 status 使用：✅ 已完成、🔄 进行中、⬜ 待开始
- humanGate：Human Gate 审核点，用于 Cursor IDE 中给人提醒检查（**人工审核，非 AI 自动化闭环**）
- planFile 格式：.cursor/plans/stepN-plan.md
- 只返回 JSON 格式，不要有任何其他文字`
}

export function buildStepsDevUserPrompt(
  stepsContent: string
): string {
  return `请根据以下所有 stepN.md 文档内容，生成 steps-dev.md 开发路线文档：

${stepsContent}

输出 JSON 格式结果（只输出 JSON，不要其他内容）：`
}

export function parseStepsDevResponse(response: string): {
  phases: Array<{
    name: string
    steps: string[]
    dependencyLogic: string
  }>
  executionSequence: Array<{
    step: string
    taskObjective: string
    description: string
  }>
  roleMapping: Record<string, string[]>
  progressTracking: Array<{
    step: string
    status: string
    humanGate: string
    role: string
    planFile: string
    completedDate: string
  }>
} | null {
  try {
    const jsonStr = extractJson(response)
    const data = JSON.parse(jsonStr)

    if (!data.phases || !data.executionSequence || !data.roleMapping || !data.progressTracking) {
      console.error('缺少必要字段:', Object.keys(data))
      return null
    }

    return {
      phases: data.phases,
      executionSequence: data.executionSequence,
      roleMapping: data.roleMapping,
      progressTracking: data.progressTracking
    }
  } catch (e) {
    console.error('解析 steps-dev 响应失败:', e)
    return null
  }
}

function extractJson(text: string): string {
  const trimmed = text.trim()

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/i)
  if (codeBlockMatch && codeBlockMatch[1]) {
    const inner = codeBlockMatch[1].trim()
    if (inner.startsWith('{') && inner.endsWith('}')) {
      try {
        JSON.parse(inner)
        return inner
      } catch {
      }
    }
  }

  const firstBrace = trimmed.indexOf('{')
  if (firstBrace === -1) {
    throw new Error('无法从响应中提取 JSON：未找到开始括号')
  }

  let braceCount = 0
  let inString = false
  let escapeNext = false
  let endPos = -1

  for (let i = firstBrace; i < trimmed.length; i++) {
    const char = trimmed[i]

    if (escapeNext) {
      escapeNext = false
      continue
    }

    if (char === '\\') {
      escapeNext = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (!inString) {
      if (char === '{') {
        braceCount++
      } else if (char === '}') {
        braceCount--
        if (braceCount === 0) {
          endPos = i + 1
          break
        }
      }
    }
  }

  if (endPos === -1) {
    throw new Error('无法从响应中提取 JSON：括号不匹配')
  }

  const jsonStr = trimmed.substring(firstBrace, endPos)

  try {
    JSON.parse(jsonStr)
  } catch (e) {
    throw new Error(`JSON 解析失败：${e instanceof Error ? e.message : '未知错误'}`)
  }

  return jsonStr
}