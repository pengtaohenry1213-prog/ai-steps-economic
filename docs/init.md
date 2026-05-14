# 初始化阶段详细设计方案

一、需求与技术映射

核心需求 → 技术选型

| 需求痛点          | 技术方案             | 解决说明                              |
|---------------|------------------|-----------------------------------|
| 在线 Excel 表格编辑 | vxe-table        | Vue3 表格组件，支持单元格编辑、合并、筛选           |
| 公式计算（财务函数）    | HyperFormula     | Excel 兼容公式引擎，支持 SUM/XNPV/IRR/XIRR |
| 多人实时协作（后期）    | Yjs              | CRDT 算法，支持离线编辑、冲突合并               |
| 后端数据存储（后期）    | Supabase         | PostgreSQL + Realtime + Auth      |
| 页面状态管理        | Pinia            | Vue3 官方推荐，与 Vite 集成良好             |
| 前端构建工具        | Vite             | 快速的冷启动和 HMR                       |
| Monorepo 管理   | Turborepo + pnpm | 高效的依赖管理 + 增量构建                    |
| 样式方案          | Tailwind CSS     | 原子化 CSS，快速样式开发                    |
| 文档检索辅助（后期）    | RAG              | 向量数据库 + LLM 理解架构文档                |

架构阶段输出的 techStack 映射到技术依赖

techStack: ["Vue3", "TypeScript", "Vite", "Pinia", "TailwindCSS", "Vitest", "vxe-table", "HyperFormula"]
                                       ↓
生成 package.json:
{
  "dependencies": {
    "vue": "^3.4",
    "pinia": "^2.1",
    "vxe-table": "^4.8",
    "vxe-pc-ui": "^4.3",
    "hyperformula": "^2.6",
    "@vueuse/core": "^10.9"
  },
  "devDependencies": {
    "vite": "^5.2",
    "typescript": "^5.4",
    "tailwindcss": "^3.4",
    "vitest": "^1.4",
    "@vitejs/plugin-vue": "^5.0"
  }
}

二、输入与输出

输入:

- ArchitectureDocument（来自架构阶段）
- .cursor/rules/ 下的角色规范（tech-lead.mdc, frontend-vue3.mdc 等）

输出:

- ZIP 文件保存到: /Users/taopeng/workspace/AI_2026/ai-steps-economic/v2/apps/{projectName}.zip

三、项目结构生成

```plaintext
{projectName}/
├── .cursor                   # Cursor 项目级配置
├── package.json              # 基于 techStack 生成
├── pnpm-workspace.yaml       # Monorepo 配置
├── turbo.json                # Turborepo 配置
├── vite.config.ts            # Vite 配置
├── tsconfig.json             # TypeScript 配置
├── tailwind.config.js        # Tailwind 配置
├── .eslintrc.js              # ESLint 配置
├── vitest.config.ts          # Vitest 配置
├── apps/
  └── web/
      ├── src/
        ├── main.ts
        ├── App.vue
        ├── api/
        ├── components/
        ├── views/
        ├── stores/
        ├── types/
        └── utils/
      └── package.json
├── packages/
  └── shared/
      └── types/
└── .cursor/
    └── rules/                 # 从 .cursor/rules/ 复制相关规则
        ├── tech-lead.mdc
        ├── frontend-vue3.mdc
        └── coding-standards.md
```

四、AI Prompt 配置（基于 .cursor/rules/）

文件: src/config/aiPrompts.ts

```json
initialization: {
  type: 'initialization',
  name: '项目初始化',
  role: {
    title: 'Tech Lead + 全栈工程师',
    certifications: '基于 .cursor/rules/tech-lead.mdc',
    expertise: [
      'Vue3 + TypeScript',      // 来自 frontend-vue3.mdc
      'Monorepo 架构',          // 来自 tech-lead.mdc
      'vxe-table + HyperFormula', // 本项目特定
      'Turborepo',             // 本项目特定
      'Cursor Rules 配置'       // 来自 .cursor/rules/
    ]
  },
  task: '基于架构文档和 Cursor Rules，生成项目脚手架代码',
  inputDescription: `【自动加载】
- 架构文档 (techStack, components, architectureType)
- .cursor/rules/tech-lead.mdc（技术决策规范）
- .cursor/rules/frontend-vue3.mdc（前端规范）
- .cursor/rules/coding-standards.md（编码规范）`,
  outputFormat: {
    jsonSchema: {
      projectName: '',
      techStack: [],
      files: [{ path: '', content: '' }],
      dependencies: { production: [], development: [] }
    }
  }
}
```

五、实现步骤

Step 1: 创建项目生成服务

文件: src/services/projectGenerator.ts

// 核心功能
interface TechMapping {
  need: string      // 需求关键词
  package: string   // npm 包名
  version: string   // 版本
}

const TECH_MAPPINGS: TechMapping[] = [
  { need: 'vxe-table', package: 'vxe-table', version: '^4.8' },
  { need: 'HyperFormula', package: 'hyperformula', version: '^2.6' },
  { need: 'Pinia', package: 'pinia', version: '^2.1' },
  // ...
]

// 生成 package.json
function generatePackageJson(techStack: string[]): PackageJson

// 生成文件内容
function generateFileContent(filePath: string, context: ProjectContext): string

// 打包 ZIP
async function packageToZip(files: File[], outputPath: string): Promise<void>

Step 2: 添加 AI 提示配置

文件: src/config/aiPrompts.ts

```typescript
// 新增 initialization prompt
export type PromptType = 'initialization' | ...

export const AI_PROMPTS = {
  initialization: {
    type: 'initialization',
    name: '项目初始化',
    role: {
      title: 'Tech Lead',
      expertise: ['Vue3', 'TypeScript', 'Monorepo', ...]
    },
    task: '根据架构文档生成项目脚手架',
    // ...
  }
}
```

Step 3: 集成到 lifecycleStore

文件: src/stores/lifecycleStore.ts

```typescript
actions: {
  async executeInitialization(): Promise<boolean> {
    // 1. 读取架构文档
    const archStage = this.stages.find(s => s.id === 'architecture')
    const archDoc = archStage?.proposalContent as ArchitectureDocument

    // 2. 调用 Claude 生成项目结构                                                                                                        
    const files = await generateProjectFromArchitecture(archDoc)                                                                          

    // 3. 打包为 ZIP 并保存                                                                                                               
    const outputPath = '/Users/taopeng/workspace/AI_2026/ai-steps-economic/v2/apps/'                                                      
    await saveProjectAsZip(files, outputPath, archDoc.name)                                                                               

    // 4. 更新阶段状态                                                                                                                    
    this.updateStageStatus('initialization', 'completed')                                                                                 
    return true                                                                                                                           
  }
}

Step 4: UI 交互

- 复用 DocumentEditorSimple 显示生成进度
- 添加"下载源码"按钮（类似现有的导出功能）

六、涉及文件

| 文件                               | 操作                           |
|----------------------------------|------------------------------|
| src/services/projectGenerator.ts | 新增                           |
| src/config/aiPrompts.ts          | 修改（添加 initialization）        |
| src/stores/lifecycleStore.ts     | 修改（添加 executeInitialization） |
| src/views/LifecycleDashboard.vue | 修改（添加初始化 UI）                 |

七、技术决策记录（ADR）

每项技术选型需说明理由：

| 技术           | 选型理由                          | 备选方案                                     |
|--------------|-------------------------------|------------------------------------------|
| vxe-table    | Vue3 生态最完整的企业级表格，支持编辑/树形/虚拟滚动 | element-plus table（功能弱）、HandsonTable（收费） |
| HyperFormula | Excel 公式兼容性好，支持自定义函数          | ExcelJS（只能读写，无法计算）、formulajs（函数少）        |
| Turborepo    | 增量构建快，缓存机制完善                  | Nx（配置复杂）、Lerna（维护不活跃）                    |
| pnpm         | 磁盘占用小，支持 Monorepo 原生          | npm（浪费空间）、yarn（慢）                        |
