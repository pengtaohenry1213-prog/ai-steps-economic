---
name: step21-安装Vitest测试框架
overview: 安装 Vitest 测试框架到 frontend 和 backend，包括依赖安装、配置文件更新、示例测试文件创建
todos:
  - id: frontend-deps
    content: "Frontend: 安装 vitest、@vue/test-utils、jsdom"
    status: completed
  - id: frontend-vite-config
    content: "Frontend: 更新 vite.config.ts 添加 test 配置"
    status: completed
  - id: frontend-setup
    content: "Frontend: 创建 src/utils/__tests__/setup.ts"
    status: completed
  - id: frontend-scripts
    content: "Frontend: 更新 package.json 添加测试脚本"
    status: completed
  - id: frontend-tsconfig
    content: "Frontend: 更新 tsconfig.json 添加 vitest types"
    status: completed
  - id: frontend-example
    content: "Frontend: 创建 example.test.ts 示例测试"
    status: completed
  - id: backend-deps
    content: "Backend: 安装 vitest"
    status: completed
  - id: backend-scripts
    content: "Backend: 更新 package.json 添加测试脚本"
    status: completed
  - id: backend-tsconfig
    content: "Backend: 更新 tsconfig.json 添加 vitest types"
    status: completed
  - id: backend-example
    content: "Backend: 创建 example.test.ts 示例测试"
    status: completed
  - id: verify
    content: 运行测试验证配置正确
    status: completed
isProject: false
---

## Step21 Plan - 安装 Vitest 测试框架

### 1. Frontend 测试配置

#### 1.1 安装依赖

- 在 `packages/frontend/` 安装：`vitest`、`@vue/test-utils`、`jsdom`

#### 1.2 更新 vite.config.ts

- 添加 `test` 配置项：`globals: true`、`environment: 'jsdom'`、`setupFiles: ['./src/utils/__tests__/setup.ts']`

#### 1.3 创建测试环境配置

- 新建 `packages/frontend/src/utils/__tests__/setup.ts`
- 包含 `window.matchMedia` 和 `ResizeObserver` 的 mock

#### 1.4 更新 package.json

- 添加 scripts：`test`、`test:ui`、`coverage`

#### 1.5 更新 tsconfig.json

- 添加 `types: ["vitest/globals"]`

#### 1.6 创建示例测试文件

- 新建 `packages/frontend/src/utils/__tests__/example.test.ts`

---

### 2. Backend 测试配置

#### 2.1 安装依赖

- 在 `packages/backend/` 安装：`vitest`

#### 2.2 更新 package.json

- 添加 scripts：`test`、`test:ui`、`coverage`

#### 2.3 更新 tsconfig.json

- 添加 `types: ["vitest/globals", "node"]`
- 更新 `include` 包含 `src/__tests__/**/*.ts`

#### 2.4 创建示例测试文件

- 新建 `packages/backend/src/__tests__/example.test.ts`

---

### 3. 验收标准

- `pnpm -F @ai-ka/frontend test` 执行成功（运行示例测试）
- `pnpm -F @ai-ka/backend test` 执行成功（运行示例测试）
- 测试脚本已添加到 package.json

---

### 4. Git Commit

```
feat: 初始化安装前、后端Vitest测试框架
- Frontend: vitest + @vue/test-utils + jsdom
- Backend: vitest for Node.js service testing
- Add test scripts: test, test:ui, coverage
- Create example test files
```

