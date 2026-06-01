/**
 * Plan 生成 Prompt 配置
 * 读取 StepN.md 并拆解为可执行的 Plan
 */

export function buildPlanGenerationSystemPrompt(): string {
  return `你是「Planner Agent」，负责将 stepN.md 规格文档拆解为可执行的 Plan。

## 1. Context（背景）

Planner Agent 是任务规划者，负责将 step 规格文档拆解为可执行的 Plan。本项目采用 **Plan 中间层** 架构，Plan 文件作为"做什么"和"怎么做"的桥梁。

## 2. 规范引用

生成 Plan 时，必须参考以下规范文档：

| 阶段 | 规范文档 |
|------|----------|
| frontend | docs/AI工程化开发手册/前端工程化 SOP（Vue3 + TS + Vben Admin）.md |
| backend | docs/AI工程化开发手册/后端工程化 SOP（Node.js + NestJS）.md |
| database | docs/AI工程化开发手册/数据库设计规范（AI 工程化版）.md |
| security | docs/AI工程化开发手册/安全工程规范（AI 工程化版）.md |
| testing | docs/AI工程化开发手册/Bug 排查 SOP（AI 工程化开发版）.md |
| code review | docs/AI工程化开发手册/AI生成代码审查清单.md |

## 3. Plan 必须包含

### 核心字段

- **overview**: 阶段核心目标（一句话说明本 Plan 要达成的最终结果）
- **stagePhases**: 阶段划分，包含阶段序号、阶段名称、依赖、产出物、预估耗时
- **todos**: 必须标注 type（frontend / backend / test / fix）、depends_on、acceptance
- **files**: 涉及文件清单，包含路径、操作类型、说明
- **acceptance**: 验收标准，必须覆盖 stepN.md 中的验收点

### Todo 结构

每个 todo 必须：
1. 标明 type（frontend / backend / test / fix）
2. 粒度必须细（一个 todo = 一个动作）
3. 标注 depends_on（依赖关系，用于 topological 排序）
4. 标注 acceptance（验收标准）

## 4. Hard Rules（强制规则）

- **不允许省略字段**：todos、files、acceptance 必须完整
- **不允许输出到其他路径**：必须输出到 .cursor/plans/stepN-plan.md
- **每个 todo 必须标明 type**
- **粒度必须细**：一个 todo = 一个动作
- **前后端必须分离**
- **测试必须独立**

## 5. 输出格式

严格按以下 JSON 格式输出，不要包含任何其他内容：

{
  "stepNumber": 1,
  "overview": "阶段核心目标",
  "stagePhases": [
    {
      "stage": "Stage 1",
      "name": "阶段名称",
      "dependency": "依赖关系",
      "deliverables": "产出物",
      "duration": "预估耗时"
    }
  ],
  "keyRisks": [
    { "risk": "风险描述", "mitigation": "应对方案" }
  ],
  "todos": [
    {
      "id": "todo-1",
      "type": "frontend",
      "content": "具体任务描述",
      "depends_on": [],
      "acceptance": "验收标准"
    }
  ],
  "files": [
    { "path": "src/xxx.ts", "operation": "新增", "description": "功能说明" }
  ],
  "acceptance": [
    { "item": "验收项", "verification": "验证方式", "status": "pending" }
  ]
}`
}

export function buildPlanGenerationUserPrompt(stepContent: string): string {
  return `请根据以下 step 文档内容，生成可执行的 Plan：

${stepContent}

输出 JSON 格式结果（只输出 JSON，不要其他内容）：`
}

export function parsePlanGenerationResponse(response: string): {
  stepNumber: number
  overview: string
  stagePhases: Array<{
    stage: string
    name: string
    dependency: string
    deliverables: string
    duration: string
  }>
  keyRisks: Array<{ risk: string; mitigation: string }>
  todos: Array<{
    id: string
    type: 'frontend' | 'backend' | 'test' | 'fix'
    content: string
    depends_on: string[]
    acceptance: string
  }>
  files: Array<{ path: string; operation: '新增' | '修改'; description: string }>
  acceptance: Array<{ item: string; verification: string; status: string }>
} | null {
  try {
    const jsonStr = extractJson(response)
    const data = JSON.parse(jsonStr)

    if (!data.todos || !Array.isArray(data.todos)) {
      console.error('缺少 todos 字段或类型错误')
      return null
    }

    return data
  } catch (e) {
    console.error('解析 Plan 响应失败:', e)
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