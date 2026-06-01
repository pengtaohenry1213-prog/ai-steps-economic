# 技术栈配置

## 核心依赖

### 框架
- **Vue**: ^3.4.0
- **TypeScript**: ^5.3.0
- **Vite**: ^5.0.0

### UI
- **Tailwind CSS**: ^3.4.0
- **vxe-table**: ^4.5.0 (表格组件)

### 状态管理
- **Zustand**: ^4.5.0 (推荐，Yjs 友好)
- 或 **Pinia**: ^2.1.0

### 公式引擎
- **HyperFormula**: ^6.0.0

### 测试
- **Vitest**: ^1.2.0
- **@vue/test-utils**: ^2.4.0

### 代码规范
- **ESLint**: ^8.56.0
- **@typescript-eslint/eslint-plugin**: ^7.0.0
- **Prettier**: ^3.2.0

## 开发工具

### 构建工具
- **Turborepo**: 用于 Monorepo 构建优化
- **pnpm**: 包管理器

### 类型检查
- TypeScript 严格模式启用

## 配置要点

### Vite 配置
- 使用 `@vitejs/plugin-vue` 插件
- 配置路径别名 `@/` 指向 `src/`
- 配置代理用于开发环境 API 请求

### TypeScript 配置
- 启用严格模式
- 配置路径映射
- 包含 Vue 类型声明

### Tailwind 配置
- 配置内容路径: `./src/**/*.{vue,js,ts,jsx,tsx}`
- 自定义主题扩展
- 配置插件

### ESLint 配置
- 使用 `@typescript-eslint` 解析器
- 配置 Vue 规则
- 集成 Prettier
