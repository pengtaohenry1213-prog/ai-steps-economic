---
name: v2-project-init
description: 初始化 v2 全栈在线表格协作系统项目，基于 Vue 3 + TypeScript + Vite 技术栈。当用户提到"初始化项目"、"创建 v2 项目"、"搭建表格系统"、"项目初始化"或"v2 项目"时使用此技能。
---

# v2 项目初始化

## 任务目标

本 Skill 用于初始化 v2 全栈在线表格协作系统（经济模型版）项目，基于 Mock 数据实现核心编辑功能。

**核心能力**:
- 创建 Monorepo 项目结构（Turborepo）
- 配置 Vue 3 + TypeScript + Vite 开发环境
- 配置 Tailwind CSS 样式系统
- 配置 ESLint + Prettier 代码规范
- 配置 Vitest 测试框架
- 导入 v1 Mock 数据

**触发场景**:
- 用户需要初始化 v2 项目
- 用户提到"创建项目"、"搭建表格系统"
- 用户需要配置 Vue 3 + Vite 环境
- 用户需要导入 v1 Mock 数据

## 前置准备

### 依赖说明

**npm 依赖**:
- vue@^3.4.0
- typescript@^5.3.0
- vite@^5.0.0
- @vitejs/plugin-vue@^5.0.0
- tailwindcss@^3.4.0
- postcss@^8.4.0
- autoprefixer@^10.4.0
- eslint@^8.56.0
- @typescript-eslint/eslint-plugin@^7.0.0
- @typescript-eslint/parser@^7.0.0
- prettier@^3.2.0
- vitest@^1.2.0
- @vue/test-utils@^2.4.0

**系统命令**:
- pnpm install
- mkdir -p apps/web/src/{components,views,stores,hooks,services,types,utils}

## 操作步骤

### 步骤 1: 创建项目结构

1. 创建 Monorepo 根目录结构
2. 创建 pnpm-workspace.yaml 配置
3. 创建 turbo.json 配置

### 步骤 2: 配置主应用

1. 在 `apps/web/` 目录下创建 Vue 3 + Vite 项目
2. 配置 package.json 依赖
3. 配置 vite.config.ts
4. 配置 tsconfig.json

### 步骤 3: 配置样式系统

1. 初始化 Tailwind CSS
2. 配置 tailwind.config.js
3. 配置 postcss.config.js
4. 创建基础样式文件

### 步骤 4: 配置代码规范

1. 配置 ESLint (.eslintrc.cjs)
2. 配置 Prettier (.prettierrc)
3. 配置编辑器配置 (.editorconfig)

### 步骤 5: 配置测试框架

1. 配置 Vitest (vitest.config.ts)
2. 创建测试示例文件

### 步骤 6: 导入 v1 Mock 数据

1. 创建 Mock 数据目录结构
2. 导入 v1 核心数据文件
3. 创建 Mock Service 基础实现

## 项目结构

```
v2/
├── apps/
│   └── web/                      # 主前端应用
│       ├── src/
│       │   ├── api/              # API 层
│       │   ├── components/       # 组件
│       │   ├── views/            # 页面
│       │   ├── stores/           # 状态管理
│       │   ├── hooks/            # 业务 hooks
│       │   ├── services/         # 服务层
│       │   ├── types/            # TypeScript 类型
│       │   └── utils/            # 工具函数
│       ├── public/
│       ├── tests/
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
├── packages/
│   └── shared/                   # 共享包
├── v1_db/                       # v1 数据库资产
│   ├── sql/
│   ├── mock/
│   └── api/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 资源索引

### 参考文档
- **[references/project-structure.md](references/project-structure.md)**
  - 内容: 完整的项目目录结构说明
  - 使用时机: 在创建项目结构前，**必须先读取此文档**
  - 关键作用: 确保目录结构符合规范

- **[references/tech-stack.md](references/tech-stack.md)**
  - 内容: 技术栈配置说明
  - 使用时机: 在配置开发环境前，**必须先读取此文档**
  - 关键作用: 确保依赖版本和配置正确

### 静态资源
- **[assets/templates/](assets/templates/)**
  - 内容: 配置文件模板
  - 使用方式: 当需要创建配置文件时，**直接使用此资源**

## 注意事项

- **附件读取规则**: 在初始化项目前，**必须优先读取** references/ 中的相关文档，了解完整的项目结构规范
- **依赖版本**: 确保使用文档中指定的依赖版本，避免兼容性问题
- **路径规范**: 所有文件路径必须符合项目结构规范
- **Mock 数据**: v1 Mock 数据需要正确导入到 v1_db/mock/ 目录
