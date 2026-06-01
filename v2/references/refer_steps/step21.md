
# 任务目标

安装测试框架，为前端和后端项目配置 Vitest 测试环境，保障后续 step 开发有测试人员参与，保障代码质量。

## 项目背景

为确保 AI 智能知识库助手的代码质量，需要在项目初期建立测试基础设施。Vitest 与 Vite 项目天然集成，支持 Vue 和 Node.js 测试，是当前最佳选择。

## 测试框架选型

| 子包 | 测试框架 | 配套工具 | 说明 |
|-----|---------|---------|------|
| frontend | Vitest | @vue/test-utils, jsdom | Vue3 组件测试 |
| backend | Vitest | @types/node | Node.js 服务测试 |

## 前端测试配置

### 1. 安装依赖

```bash
pnpm add -D vitest @vue/test-utils jsdom @vitejs/plugin-vue
```

### 2. packages/frontend/vite.config.ts

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@ai-ka/shared': path.resolve(__dirname, '../../shared/src')
    }
  },
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/utils/__tests__/setup.ts']
  }
});
```

### 3. packages/frontend/src/utils/__tests__/setup.ts

```typescript
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

### 4. packages/frontend/package.json 更新

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "coverage": "vitest run --coverage"
  }
}
```

### 5. packages/frontend/tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@ai-ka/shared/*": ["../../shared/src/*"]
    },
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

## 后端测试配置

### 1. 安装依赖

```bash
pnpm add -D vitest
```

### 2. packages/backend/package.json 更新

```json
{
  "scripts": {
    "dev": "ts-node src/index.ts",
    "start": "tsc && node dist/index.js",
    "build": "tsc",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "coverage": "vitest run --coverage"
  }
}
```

### 3. packages/backend/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["vitest/globals", "node"]
  },
  "include": ["src/**/*.ts", "src/__tests__/**/*.ts"]
}
```

## 测试自动化配置（Husky）

配置 Git pre-commit 钩子，在提交前自动运行测试。

### 1. 安装依赖

```bash
pnpm add -D husky lint-staged
```

### 2. 根目录 package.json 添加 lint-staged 配置

```json
{
  "lint-staged": {
    "packages/backend/src/**/*.ts": ["vitest run --passWithNoTests"],
    "packages/frontend/src/**/*.ts": ["vitest run --passWithNoTests"]
  }
}
```

### 3. 创建 .husky/pre-commit 钩子

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "Running pre-commit tests..."

# 运行后端测试
echo "Running backend tests..."
cd packages/backend && pnpm test
cd ..

# 运行前端测试
echo "Running frontend tests..."
cd packages/frontend && pnpm test
```

### 4. 初始化 husky

```bash
npx husky install
```

### 5. 验证

```bash
# 手动触发 pre-commit 钩子测试
npx husky run pre-commit

# 或者直接运行测试
cd packages/backend && pnpm test
cd packages/frontend && pnpm test
```

## 示例测试文件

### Frontend: packages/frontend/src/utils/__tests__/example.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

describe('Example Test Suite', () => {
  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should work with Vue reactivity', () => {
    const count = ref(0);
    count.value++;
    expect(count.value).toBe(1);
  });
});
```

### Backend: packages/backend/src/__tests__/example.test.ts

```typescript
import { describe, it, expect } from 'vitest';

describe('Example Backend Test Suite', () => {
  it('should pass basic assertion', () => {
    expect(true).toBe(true);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });
});
```

## 测试规范引用

### 测试标准文档

- 详细测试规范：`.my-rules/TEST.md`
- 简明测试规则：`.cursor/rules/TEST.mdc`

### 问题级别标准

| 级别 | 定义 | 处理要求 |
|-----|------|---------|
| P0 | 核心不可用或数据严重错误，阻塞发布 | 必须立即修复 |
| P1 | 主路径受损或高风险逻辑错误 | 高优先级尽快修复 |
| P2 | 非主路径缺陷 | 正常排期修复 |
| P3 | 文案、轻微视觉、体验类 | 可后续迭代优化 |

### 测试报告要求

- 覆盖目标：核心场景 100%，非核心场景 ≥95%
- 包含：前置条件、步骤、可观察的预期结果
- 缺陷需包含：环境、步骤、实际 vs 期望、证据

## 目录结构

```
ai-knowledge-assistant/
├── packages/
│   ├── frontend/
│   │   └── src/
│   │       └── utils/
│   │           └── __tests__/
│   │               ├── setup.ts      # 测试环境配置
│   │               └── example.test.ts
│   └── backend/
│       └── src/
│           └── __tests__/
│               └── example.test.ts
```

## Git Commit

```bash
chore: install vitest testing framework for frontend and backend

- Frontend: vitest + @vue/test-utils + jsdom
- Backend: vitest for Node.js service testing
- Add test scripts: test, test:ui, coverage
- Create example test files
- Reference test standards from .my-rules/TEST.md
```

## 验证步骤

```bash
# 安装依赖后初始化 husky
npx husky install

# 手动触发 pre-commit 钩子测试
npx husky run pre-commit

# 运行测试
cd packages/frontend && pnpm test
cd packages/backend && pnpm test

# 查看测试覆盖率
pnpm coverage
```

## Git Commit

```bash
feat: 初始化安装 前、后端 Vitest 测试框架 + Husky CI

- Frontend: vitest + @vue/test-utils + jsdom
- Backend: vitest for Node.js service testing
- Add test scripts: test, test:ui, coverage
- Create example test files
- Reference test standards from .my-rules/TEST.md
- Configure husky pre-commit hook for automatic testing
- Add lint-staged for staged file testing
```

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: 初始化安装 前、后端 Vitest 测试框架 + Husky CI
