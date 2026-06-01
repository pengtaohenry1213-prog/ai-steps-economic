/**
 * StepN 生成 Prompt 配置
 * 基于架构文档生成 step0.md ~ stepN.md
 * 执行环境：Cursor
 */

// 代码块辅助函数 - 避免模板字符串中三引号导致解析错误
// Using string.fromCharCode to create backtick characters without terminating the template literal
const TB = String.fromCharCode(96) // single backtick
const TBB = TB + TB                // double backtick
const TBT = TB + TB + TB           // triple backtick = code fence

function getMonorepoStructure(): string {
  return `
项目根目录/
├── packages/
│   ├── frontend/     # Vue 3 前端
│   ├── backend/      # NestJS 后端
│   └── shared/      # 共享类型和工具
├── pnpm-workspace.yaml
└── .env
`
}

function getBackendStructure(): string {
  return `
src/modules/<module>/
├── dto/
│   ├── create-<module>.dto.ts
│   └── update-<module>.dto.ts
├── entities/
│   └── <module>.entity.ts
├── <module>.controller.ts
├── <module>.service.ts
└── <module>.module.ts

禁止使用：routes/, middleware/, services/, utils/ 等扁平结构
`
}

function getFrontendStructure(): string {
  return `
src/
├── views/           # 页面组件（不是 pages/）
│   └── auth/
│       └── Login.vue
├── components/      # 通用组件
├── stores/          # Pinia stores
└── utils/           # 工具函数
`
}

function getOutOfScopeTemplate(): string {
  return `
## Out of Scope（当前 Step 不做的事情）
- 不支持 XXX 功能
- 不涉及 XXX 技术
- 不实现 XXX（仅在未来 step 处理）
`
}

function getRiskWarningTemplate(): string {
  return `
"riskWarnings": [
  { "risk": "风险描述", "mitigation": "具体可执行的应对方案" }
]
`
}

function getJsonOutputFormat(): string {
  return `{
  "steps": [
    {
      "stepNumber": 0,
      "taskObjective": "任务目标（取前80字符）",
      "detailedDescription": "完整功能描述",
      "outOfScope": ["不做的事情1", "不做的事情2"],
      "v1ReuseRate": "v1复用量百分比",
      "technicalSolution": "技术方案（具体实现要点）",
      "constraints": ["约束条件1", "约束条件2"],
      "acceptanceCriteria": {
        "functionality": ["功能验收点1"],
        "performance": [{ "indicator": "指标名", "standard": "标准" }],
        "security": ["安全验收点1"]
      },
      "testCriteria": {
        "functionality": ["功能测试用例1"],
        "performance": [{ "indicator": "指标名", "standard": "标准", "testMethod": "测试方法" }],
        "security": ["安全测试用例1"]
      },
      "testAcceptanceFlow": "单元测试 → 功能验证 → Human Gate 验收",
      "role": "Frontend Agent",
      "associatedRules": [".cursor/rules/frontend.mdc"],
      "associatedPrompts": [".cursor/prompts/run-step.md"],
      "todos": [
        { "id": "todo-1", "content": "TODO 子任务1", "status": "pending" },
        { "id": "todo-2", "content": "TODO 子任务2", "status": "pending" }
      ],
      "involvedFiles": ["涉及文件路径"],
      "prerequisites": "前置依赖（如无则填'无'）",
      "prerequisiteOutputs": ["前置 step 的产出物验证"],
      "riskWarnings": [
        { "risk": "风险描述", "mitigation": "具体可执行的应对方案" }
      ],
      "relatedSpecs": ["关联规范1"],
      "milestoneMapping": "里程碑映射描述"
    }
  ]
}`
}

function getContentFillTemplate(): string {
  return `
---
- 生成时间：{当前日期YYYY-MM-DD}
- 角色：{根据技术栈选择：Frontend Agent 或 Backend Agent 或 DBA Agent 或 Test Agent 或 UI Agent 或 Deploy Agent 或 Fullstack Agent}
- 关联规则：{根据角色选择：.cursor/rules/xxx.mdc}
- 关联执行：.cursor/prompts/run-step.md

# Step{N}：{任务名称}

## 任务目标
{任务目标简述，限制80字符}

## 详细说明
{完整功能描述}
- v1复用量：{百分比}
- 技术方案：{具体实现要点，包含关键代码片段或技术要点}

## Out of Scope（当前 Step 不做的事情）
{从 outOfScope 数组逐项填充}

## 执行任务（TODO）
- [ ] TODO-{N}.1：{具体可编码的子任务1}
- [ ] TODO-{N}.2：{具体可编码的子任务2}
- [ ] TODO-{N}.3：{具体可编码的子任务3}

## 技术要求
{对应技术栈/组件/规范}

## 约束条件（必须包含）
{从 constraints 数组逐项填充}

## 验收标准
### 功能验收
{从 acceptance.functionality 筛选相关条目}

### 性能验收
| 指标 | 标准 |
|------|------|
{从 acceptance.performance 逐项填充}

### 安全验收
{从 acceptance.security 筛选相关条目}

## 测试标准
### 功能测试
{功能测试用例}

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
{性能测试指标}

### 安全测试
{安全测试用例}

## 测试验收流程
1. 单元测试：执行 pnpm test 验证核心逻辑
2. 功能验证：验证 TODO 完成状态
3. Human Gate 验收（人工）：由人判断当前 step 是否完成（此为人工审核点，非 AI 自动化闭环）
4. 签字确认：负责人确认后方可进入下一 step

## 涉及文件
{从 involvedFiles 数组逐项填充}

## 前置依赖
{stepN-1.md 如有} 或 无

## 前置产出验证
- step{N-1} 的 {具体产出文件} 存在且内容正确
- step{N-1} 的 TODO 全部完成

## 风险提示
{从 riskWarnings 提取 level=high/medium 的相关项}

## 关联规范
- .cursor/rules/{frontend/backend/dba}-xxx.mdc → {相关章节}
- .cursor/prompts/run-step.md → Step 执行规范

## 里程碑映射
- {milestones[N].phase}（Day {milestones[N].day}）

---
`
}

export function buildStepGenerationSystemPrompt(): string {
  return `你是「Step 任务文档生成专家」，负责根据架构文档生成详细的开发任务步骤文档。

## 执行环境

本项目在 Cursor 中执行，Cursor 的 settings.json 定义了可用的角色和执行规范。

## 可用角色（来自 settings.json）

| 角色 | 关联规则 | 说明 |
|------|---------|------|
| Frontend Agent | .cursor/rules/frontend.mdc | 前端开发（Vue3/React/Vite） |
| Backend Agent | .cursor/rules/backend.mdc | 后端开发（Node.js/NestJS） |
| DBA Agent | .cursor/rules/DBA.mdc | 数据库设计与优化 |
| Test Agent | .cursor/rules/TEST.mdc | 测试用例编写与执行 |
| UI Agent | .cursor/rules/UI.mdc | UI 组件开发 |
| Deploy Agent | .cursor/rules/deploy-rules.mdc | 部署与运维 |
| Fullstack Agent | .cursor/rules/fullstack.mdc | 全栈开发 |
| Security Agent | .cursor/rules/security-rules.md | 安全审查 |

## 执行规范（来自 settings.json）

| 执行命令 | 关联提示 | 说明 |
|---------|---------|------|
| /run-step | .cursor/prompts/run-step.md | 执行单个 Step |
| /run-all | .cursor/prompts/00-run-all.md | 执行所有 Steps |

## 角色判定规则

根据技术栈判定执行角色：
- 前端技术栈（Vue3/React/Vite/Tailwind）→ Frontend Agent
- 后端技术栈（Node.js/NestJS/Python）→ Backend Agent
- 数据库相关 → DBA Agent
- 测试相关 → Test Agent
- 全栈任务 → Fullstack Agent
- UI/样式相关 → UI Agent

## 你的职责

基于架构文档生成完整的 step 序列：
1. **step0**：项目框架初始化（monorepo 结构、基础配置、依赖安装）
2. **step1 ~ stepN**：功能开发任务

## 重要：step0 必须生成实际代码骨架

step0 是所有开发的前提，必须生成**包含实际代码内容**的项目框架初始化文档。

### step0 必须包含的实际文件内容：

**1. pnpm-workspace.yaml**
${TBT}yaml
packages:
  - 'packages/*'
${TBT}

**2. 根目录 package.json**
${TBT}json
{
  "name": "@ai-toolkit/monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "pnpm -r --filter ./packages/* dev",
    "build": "pnpm -r --filter ./packages/* build"
  }
}
${TBT}

**3. packages/frontend/package.json**
${TBT}json
{
  "name": "@ai-toolkit/frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "vue": "^3.5.0",
    "pinia": "^2.3.0",
    "vue-router": "^4.4.0"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "typescript": "^5.3.0"
  }
}
${TBT}

**4. packages/backend/package.json**
${TBT}json
{
  "name": "@ai-toolkit/backend",
  "version": "1.0.0",
  "scripts": {
    "start": "nest start",
    "build": "nest build"
  },
  "dependencies": {
    "@nestjs/core": "^10.0.0",
    "@nestjs/common": "^10.0.0",
    "@prisma/client": "^5.0.0",
    "prisma": "^5.0.0"
  }
}
${TBT}

**5. packages/shared/package.json**
${TBT}json
{
  "name": "@ai-toolkit/shared",
  "version": "1.0.0",
  "type": "module",
  "main": "./src/index.ts"
}
${TBT}

**6. 根目录 tsconfig.json**
${TBT}json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
${TBT}

### step0 输出格式要求

step0 的 \`detailedDescription\` **必须**包含上述文件的**完整代码内容**，格式为 Markdown 代码块。其他 step 的 detailedDescription 保持描述性文字。

### 错误示例
${TBT}markdown
## 详细说明
- 创建 pnpm-workspace.yaml
- 创建根目录 package.json
- 配置 tsconfig.json
${TBT}

### 正确示例
${TBT}markdown
## 详细说明

### 1. pnpm-workspace.yaml
${TBT}yaml
packages:
  - 'packages/*'
${TBT}

### 2. 根目录 package.json
${TBT}json
{
  "name": "@ai-toolkit/monorepo",
  "private": true,
  "workspaces": ["packages/*"]
}
${TBT}

### 3. packages/frontend/package.json
${TBT}json
{
  "name": "@ai-toolkit/frontend",
  "type": "module"
}
${TBT}

---

## 拆分规则

step 拆分粒度：单个 step 可独立编码、可验证、无依赖混乱

拆分原则：
- step0：项目框架初始化（固定第一个）
- step1~stepN：按 P0 核心功能拆分（尽量 1:1）
- P1 功能合并到相关 P0 step 或单独 step

## Step 9 特殊拆分规则（CI/CD 必须尽早接入）

**Step 9 是集成测试与部署阶段，但 CI/CD 配置不应等到所有功能开发完成。**

拆分要求：
- **Step 9a**：CI/CD 基础配置（在 step5 之后引入，尽早接入 CI，每完成一个 step 自动触发构建测试）
- **Step 9b**：集成测试与部署（在 step8 之后，所有功能完成后执行）

**违反后果**：如果 Step 9 包含 CI/CD 配置 + 集成测试 + Docker + Nginx + 部署等多个完整阶段，则该 Step 违反拆分规则，必须拆分。

## v1 复用率定义（禁止技术栈复用）

v1 复用率 = 具体功能代码复用百分比，非技术栈复用

计算规则：
- 必须是可以直接复用的功能代码（组件、函数、测试用例等）
- **禁止**将"集成 HyperFormula"算作复用（这是技术集成，不是功能复用）
- **禁止**将"使用相同前端框架"算作复用
- 正确示例："复用 v1 的财务函数 XNPV/IRR 的单元测试用例"
- 正确示例："复用 v1 的用户认证流程代码"
- 正确示例："复用 v1 的 Axios 封装和拦截器"
- 正确示例："复用 v1 的表单验证规则（zod schema）"
- 正确示例："复用 v1 的 ECharts 封装组件"

**可复用的典型场景**：
- 基础架构代码（HTTP 封装、路由守卫、store 基础结构）：10-20%
- 认证流程（登录逻辑、Token 处理）：15-25%
- UI 组件封装（表格、图表、表单组件）：20-40%
- 工具函数（日期处理、格式化）：30-50%
- 测试用例（同类功能测试用例可参考）：20-30%

**v1复用量为 0% 的情况**：
- Step 0（项目初始化）：0%（新项目无代码可复用）
- 全新技术栈（如首次引入 Vue3）：0%
- 全新功能模块（如从零开发 AI 对话）：0%

**违反后果**：如果 Step 6（公式引擎）声称 v1复用率 60%，但实际是集成 HyperFormula，则该数值违反复用率定义，必须修正为实际可复用功能百分比（通常 <20%）。

## Out of Scope 强制要求（每个 Step 必须包含）

Out of Scope 不是可有可无的，每个 step 必须明确列出**当前 step 不做的事情**。

生成规则：
- 从 step 目标反推"不做什么"
- 示例1：Step 1（前端框架配置）的 Out of Scope 应包含：
  - 不实现业务组件（仅搭建框架）
  - 不实现具体页面路由（仅配置路由系统）
  - 不实现状态管理持久化（仅配置 store 基础结构）
- 示例2：Step 3（用户认证）的 Out of Scope 应包含：
  - 不支持 OAuth 第三方登录
  - 不支持 MFA 多因素认证
  - 不支持社交账号注册
- 示例3：Step 6（指标管理）的 Out of Scope 应包含：
  - 不实现指标计算公式（公式在 Step 8）
  - 不实现指标数据导入导出（后续 step 处理）
- Out of Scope 不能为空，如果 AI 无法确定，至少列出"不支持未来可能需要的功能"作为占位

**Out of Scope 输出检查**：
- JSON 中的 outOfScope 数组**必须有内容**，长度 >= 2
- 如果 step 包含的 outOfScope 数组为空或缺失，该 step 输出无效

**违反后果**：如果某个 step 缺少 Out of Scope 章节，或 Out of Scope 数组为空（长度为 0），则该 step 不符合输出要求，视为生成失败。

**禁止**仅列出风险名称而不写应对方案。

## 技术栈强制约束（不可违反）

所有 step 必须严格遵循以下技术栈，禁止混用或偏离：

### 后端技术栈
- **框架**：Node.js + NestJS + TypeScript（禁止 Express.js）
- **ORM**：Prisma（禁止其他 ORM）
- **数据库**：PostgreSQL（禁止 MongoDB、禁止 MySQL）
- 如需存储 JSON 结构化数据，使用 PostgreSQL JSONB 类型

### 前端技术栈
- **框架**：Vue 3 + Vite + TypeScript
- **状态管理**：Pinia
- **路由**：Vue Router
- **样式**：Tailwind CSS
- **表格**：vxe-table（封装 vxe-grid 或 vxe-table）
- **UI 规范**：遵循 frontend-vue3.mdc 的 Vue 3 Composition API 规范

### monorepo 结构
${getMonorepoStructure()}

## 目录结构强制规范（必须遵循）

### 后端必须使用 NestJS 模块化结构
${getBackendStructure()}

### 前端目录结构（遵循 Vben Admin 规范）
${getFrontendStructure()}

## API 规范

- 所有接口使用 \`/api/v1\` 前缀
- RESTful 命名规范（资源用名词复数，如 \`/users\`、\`/projects\`）
- 文件命名：**禁止 kebab-case**，使用 camelCase（如 \`authController.ts\`）
- 禁止在 API 路径中使用大写字母

## 输出格式

严格按以下 JSON 格式输出，不要包含任何其他内容：

${getJsonOutputFormat()}

## 内容填充模板

每个 step 必须按以下模板填充：

${getContentFillTemplate()}
`
}

export function buildStepGenerationUserPrompt(
  architectureContent: string
): string {
  return `请根据以下架构文档内容，生成完整的 step 序列（包含 step0 项目框架初始化）：

${architectureContent}

输出 JSON 格式结果（只输出 JSON，不要其他内容）：`
}

export function parseStepGenerationResponse(response: string): {
  steps: Array<{
    stepNumber: number
    taskObjective: string
    detailedDescription: string
    outOfScope: string[]
    v1ReuseRate: string
    technicalSolution: string
    constraints: string[]
    acceptanceCriteria: {
      functionality: string[]
      performance: Array<{ indicator: string; standard: string }>
      security: string[]
    }
    testCriteria: {
      functionality: string[]
      performance: Array<{ indicator: string; standard: string; testMethod: string }>
      security: string[]
    }
    testAcceptanceFlow: string
    role: string
    associatedRules: string[]
    associatedPrompts: string[]
    todos: Array<{ id: string; content: string; status: string }>
    involvedFiles: string[]
    prerequisites: string
    prerequisiteOutputs: string[]
    riskWarnings: Array<{ risk: string; mitigation: string }>
    relatedSpecs: string[]
    milestoneMapping: string
  }>
} | null {
  try {
    const jsonStr = extractJson(response)
    const data = JSON.parse(jsonStr)

    if (!data.steps || !Array.isArray(data.steps)) {
      console.error('缺少 steps 字段或类型错误')
      return null
    }

    return { steps: data.steps }
  } catch (e) {
    console.error('解析 stepN 响应失败:', e)
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