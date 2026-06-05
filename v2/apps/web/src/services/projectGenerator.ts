/**
 * 项目生成服务
 * 根据架构文档生成项目脚手架代码
 */

import type { ArchitectureDocument } from '../schemas/documentSchemas'

export interface GeneratedFile {
  path: string
  content: string
}

export interface ProjectConfig {
  projectName: string
  techStack: string[]
  architectureType: string
  components: string[]
  outputPath: string
}

interface TechMapping {
  keywords: string[]
  package: string
  version: string
  type: 'production' | 'development'
}

const TECH_MAPPINGS: TechMapping[] = [
  {
    keywords: ['vue', 'vue3'],
    package: 'vue',
    version: '^3.4.0',
    type: 'production'
  },
  {
    keywords: ['pinia'],
    package: 'pinia',
    version: '^2.1.0',
    type: 'production'
  },
  {
    keywords: ['vue-router'],
    package: 'vue-router',
    version: '^4.3.0',
    type: 'production'
  },
  {
    keywords: ['vxe-table', 'vxe-table', 'table'],
    package: 'vxe-table',
    version: '^4.8.0',
    type: 'production'
  },
  {
    keywords: ['vxe-pc-ui'],
    package: 'vxe-pc-ui',
    version: '^4.3.0',
    type: 'production'
  },
  {
    keywords: ['hyperformula', 'formula', 'excel'],
    package: 'hyperformula',
    version: '^2.6.0',
    type: 'production'
  },
  {
    keywords: ['axios'],
    package: 'axios',
    version: '^1.6.0',
    type: 'production'
  },
  {
    keywords: ['@vueuse/core', 'vueuse'],
    package: '@vueuse/core',
    version: '^10.9.0',
    type: 'production'
  },
  {
    keywords: ['element-plus', 'element'],
    package: 'element-plus',
    version: '^2.6.0',
    type: 'production'
  },
  {
    keywords: ['tailwind', 'tailwindcss'],
    package: 'tailwindcss',
    version: '^3.4.0',
    type: 'development'
  },
  {
    keywords: ['vite'],
    package: 'vite',
    version: '^5.2.0',
    type: 'development'
  },
  {
    keywords: ['@vitejs/plugin-vue'],
    package: '@vitejs/plugin-vue',
    version: '^5.0.0',
    type: 'development'
  },
  {
    keywords: ['typescript'],
    package: 'typescript',
    version: '^5.4.0',
    type: 'development'
  },
  {
    keywords: ['vitest'],
    package: 'vitest',
    version: '^1.4.0',
    type: 'development'
  },
  {
    keywords: ['@vue/test-utils'],
    package: '@vue/test-utils',
    version: '^2.4.0',
    type: 'development'
  },
  {
    keywords: ['eslint'],
    package: 'eslint',
    version: '^8.57.0',
    type: 'development'
  },
  {
    keywords: ['prettier'],
    package: 'prettier',
    version: '^3.2.0',
    type: 'development'
  },
  {
    keywords: ['@typescript-eslint/parser'],
    package: '@typescript-eslint/parser',
    version: '^7.0.0',
    type: 'development'
  },
  {
    keywords: ['@typescript-eslint/eslint-plugin'],
    package: '@typescript-eslint/eslint-plugin',
    version: '^7.0.0',
    type: 'development'
  },
  {
    keywords: ['autoprefixer'],
    package: 'autoprefixer',
    version: '^10.4.0',
    type: 'development'
  },
  {
    keywords: ['postcss'],
    package: 'postcss',
    version: '^8.4.0',
    type: 'development'
  }
]

export function mapTechStackToDependencies(techStack: string[]): { production: string[]; development: string[] } {
  const production = new Set<string>()
  const development = new Set<string>()

  for (const tech of techStack) {
    const normalizedTech = tech.toLowerCase()
    for (const mapping of TECH_MAPPINGS) {
      if (mapping.keywords.some(k => normalizedTech.includes(k))) {
        if (mapping.type === 'production') {
          production.add(`${mapping.package}@${mapping.version}`)
        } else {
          development.add(`${mapping.package}@${mapping.version}`)
        }
      }
    }
  }

  return {
    production: Array.from(production),
    development: Array.from(development)
  }
}

export function generatePackageJson(config: ProjectConfig, dependencies: { production: string[]; development: string[] }): string {
  const projectName = config.projectName.toLowerCase().replace(/\s+/g, '-')

  return JSON.stringify({
    name: `${projectName}`,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vue-tsc && vite build',
      preview: 'vite preview',
      test: 'vitest',
      lint: 'eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx --fix',
      'lint:check': 'eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx'
    },
    dependencies: Object.fromEntries(
      dependencies.production.map(dep => {
        const [name, version] = dep.split('@')
        return [name, version]
      })
    ),
    devDependencies: Object.fromEntries(
      dependencies.development.map(dep => {
        const [name, version] = dep.split('@')
        return [name, version]
      })
    )
  }, null, 2)
}

export function generateViteConfig(): string {
  return `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'esnext',
    minify: 'esbuild'
  }
})
`
}

export function generateTsConfig(): string {
  return JSON.stringify({
    compilerOptions: {
      target: 'ESNext',
      useDefineForClassFields: true,
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      jsx: 'preserve',
      resolveJsonModule: true,
      isolatedModules: true,
      esModuleInterop: true,
      lib: ['ESNext', 'DOM'],
      skipLibCheck: true,
      noEmit: true,
      baseUrl: '.',
      paths: {
        '@/*': ['src/*']
      }
    },
    include: ['src/**/*.ts', 'src/**/*.d.ts', 'src/**/*.tsx', 'src/**/*.vue'],
    references: [{ path: './tsconfig.node.json' }]
  }, null, 2)
}

export function generateTsConfigNode(): string {
  return JSON.stringify({
    compilerOptions: {
      composite: true,
      module: 'ESNext',
      moduleResolution: 'bundler',
      allowSyntheticDefaultImports: true
    },
    include: ['vite.config.ts']
  }, null, 2)
}

export function generateTailwindConfig(): string {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        }
      }
    }
  },
  plugins: []
}
`
}

export function generatePostcssConfig(): string {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
`
}

export function generateESLintConfig(): string {
  return `import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import parser from '@typescript-eslint/parser'
import pluginTs from '@typescript-eslint/eslint-plugin'

export default [
  js.configs.recommended,
  ...pluginVue.configs['vue3-recommended'],
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': pluginTs
    },
    rules: {
      ...pluginTs.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  {
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
    }
  }
]
`
}

export function generateVitestConfig(): string {
  return `import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
`
}

export function generateMainTs(): string {
  return `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'element-plus/dist/index.css'
import 'vxe-table/lib/style.css'
import 'vxe-pc-ui/lib/style.css'
import './styles/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
`
}

export function generateAppVue(): string {
  return `<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  console.log('App mounted')
})
</script>

<style>
#app {
  min-height: 100vh;
}
</style>
`
}

export function generateMainHtml(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
`
}

export function generateRouter(): string {
  return `import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue')
    }
  ]
})

export default router
`
}

export function generateMainCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #0ea5e9;
}

body {
  @apply bg-gray-50;
}
`
}

export function generateIndexExport(): string {
  return `export { default as Button } from './Button.vue'
export { default as Table } from './Table.vue'
`
}

export function generateTypesIndex(): string {
  return `export interface User {
  id: string
  name: string
}

export interface ApiResponse<T = unknown> {
  code: number
  data: T
  message: string
}
`
}

export function generateStoreExample(): string {
  return `import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useExampleStore = defineStore('example', () => {
  const count = ref(0)

  function increment() {
    count.value++
  }

  return {
    count,
    increment
  }
})
`
}

export function generateApiExample(): string {
  return `import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default api
`
}

export function generateUtilsExample(): string {
  return `export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
`
}

export function generatePackageSharedTypes(): string {
  return JSON.stringify({
    name: '@shared/types',
    version: '0.1.0',
    type: 'module',
    main: './index.ts',
    types: './index.ts'
  }, null, 2)
}

export function generateSharedTypesIndex(): string {
  return `export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
`
}

export async function generateProjectFiles(config: ProjectConfig): Promise<GeneratedFile[]> {
  const files: GeneratedFile[] = []
  const deps = mapTechStackToDependencies(config.techStack)

  files.push({ path: 'package.json', content: generatePackageJson(config, deps) })
  files.push({ path: 'vite.config.ts', content: generateViteConfig() })
  files.push({ path: 'tsconfig.json', content: generateTsConfig() })
  files.push({ path: 'tsconfig.node.json', content: generateTsConfigNode() })
  files.push({ path: 'tailwind.config.js', content: generateTailwindConfig() })
  files.push({ path: 'postcss.config.js', content: generatePostcssConfig() })
  files.push({ path: '.eslintrc.js', content: generateESLintConfig() })
  files.push({ path: 'vitest.config.ts', content: generateVitestConfig() })
  files.push({ path: 'index.html', content: generateMainHtml() })

  files.push({
    path: 'src/main.ts',
    content: generateMainTs()
  })
  files.push({
    path: 'src/App.vue',
    content: generateAppVue()
  })
  files.push({
    path: 'src/router/index.ts',
    content: generateRouter()
  })
  files.push({
    path: 'src/styles/main.css',
    content: generateMainCss()
  })

  files.push({
    path: 'src/components/index.ts',
    content: generateIndexExport()
  })
  files.push({
    path: 'src/types/index.ts',
    content: generateTypesIndex()
  })
  files.push({
    path: 'src/stores/example.ts',
    content: generateStoreExample()
  })
  files.push({
    path: 'src/api/example.ts',
    content: generateApiExample()
  })
  files.push({
    path: 'src/utils/index.ts',
    content: generateUtilsExample()
  })

  files.push({
    path: 'src/views/Home.vue',
    content: `<template>
  <div class="home">
    <h1>{{ title }}</h1>
    <p>Welcome to ${config.projectName}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const title = ref('${config.projectName}')
</script>

<style scoped>
.home {
  @apply p-8;
}
</style>
`
  })

  for (const component of config.components) {
    const componentName = component.replace(/\s+/g, '')
    files.push({
      path: `src/components/${componentName}.vue`,
      content: `<template>
  <div class="${componentName}">
    <h2>${component}</h2>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<style scoped>
.${componentName} {
  @apply p-4;
}
</style>
`
    })
  }

  files.push({
    path: `packages/shared/package.json`,
    content: generatePackageSharedTypes()
  })
  files.push({
    path: `packages/shared/types/index.ts`,
    content: generateSharedTypesIndex()
  })

  files.push({
    path: `.gitignore`,
    content: `node_modules
dist
dist-ssr
*.local
.DS_Store
.env.local
.env.*.local
coverage
*.log
`
  })

  files.push({
    path: `README.md`,
    content: `# ${config.projectName}

## 项目介绍

基于 ${config.techStack.join(', ')} 构建的现代化应用。

## 技术栈

${config.techStack.map(t => `- ${t}`).join('\n')}

## 快速开始

\`\`\`bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 运行测试
pnpm test

# 构建生产版本
pnpm build
\`\`\`

## 项目结构

\`\`\`
src/
├── components/   # 组件
│   ├── views/        # 页面
│   ├── stores/       # 状态管理
│   ├── api/          # API 层
│   ├── types/        # 类型定义
│   └── utils/        # 工具函数
├── packages/         # 共享包
└── ...
\`\`\`
`
  })

  return files
}

export async function saveProjectToServer(files: GeneratedFile[]): Promise<{ success: boolean; zipPath?: string; extractPath?: string; error?: string }> {
  const response = await fetch('/api/save-project', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files })
  })

  if (!response.ok) {
    const error = await response.json()
    return { success: false, error: error.error || 'Save failed' }
  }

  return await response.json()
}

export function generateCursorRules(): { path: string; content: string }[] {
  // 注意：由于浏览器端无法访问文件系统，此函数返回空数组
  // 实际的 .cursor 规则由 vite.config.ts 中间件在保存时自动添加
  return []
}