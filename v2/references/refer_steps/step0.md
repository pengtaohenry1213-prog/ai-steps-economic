# 项目结构初始化.md（基础框架版）

## 一、前置条件

1. 已安装 `pnpm`（`npm install -g pnpm`）
2. 已初始化 Git 仓库（可选）
3. 工作目录：`ai-knowledge-assistant/`（根目录）

## 二、快速初始化目录结构

```bash
# 创建根目录（若未创建）
mkdir -p ai-knowledge-assistant && cd ai-knowledge-assistant

# 创建核心目录结构
mkdir -p packages/{frontend/src/{views,components,utils,api},backend/src/{routes,services,utils,types},shared/src/{types,utils}}
```

## 三、项目目录结构

```plaintext
ai-knowledge-assistant/
├── packages/
│   ├── frontend/              # 前端子包（Vue3 + TS + Vite）
│   │   ├── src/
│   │   │   ├── views/         # 页面组件（step1 实现）
│   │   │   ├── components/    # 公共组件
│   │   │   ├── router/        # 路由配置（step1 实现）
│   │   │   ├── store/         # 状态管理（step1 实现）
│   │   │   ├── utils/         # 工具函数（step1 实现）
│   │   │   └── api/           # API 接口
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── tsconfig.node.json
│   ├── backend/               # 后端子包（Express + TS）
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/                # 共享类型
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── package.json               # 根配置
├── tsconfig.json              # 根 TS 配置
├── .env                       # 环境变量
└── pnpm-workspace.yaml        # 工作区配置
```

## 四、根目录配置

### 4.1 package.json

```json
{
  "name": "ai-knowledge-assistant",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "pnpm run dev:backend & pnpm run dev:frontend",
    "dev:backend": "pnpm --filter @ai-ka/backend dev",
    "dev:frontend": "pnpm --filter @ai-ka/frontend dev"
  },
  "workspaces": ["packages/*"],
  "packageManager": "pnpm@8.0.0"
}
```

### 4.2 tsconfig.json（全局共享）

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "exclude": ["node_modules", "**/dist"]
}
```

### 4.3 .env（环境变量）

```env
# 后端端口
PORT=3000
# 豆包 API 配置
DOUBAO_API_KEY=279dc1d3-2003-4aa2-baea-5ceda434f97e
DOUBAO_API_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL_NAME=doubao-seed-2-0-code-preview-260215
```

### 4.4 pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
```

## 五、子包配置

### 5.1 shared 包（共享类型）

#### packages/shared/package.json

```json
{
  "name": "@ai-ka/shared",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "devDependencies": {
    "typescript": "^5.2.2"
  }
}
```

#### packages/shared/src/index.ts

```typescript
export * from './types/chat';
```

#### packages/shared/src/types/chat.ts

```typescript
export interface ChatItem {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

export interface HistoryItem {
  sessionId: string;
  title: string;
  chats: ChatItem[];
  createTime: number;
}
```

### 5.2 frontend 包（Vue3 + Vite）

#### packages/frontend/package.json

```json
{
  "name": "@ai-ka/frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.3.11",
    "axios": "^1.6.2",
    "pinia": "^2.1.7",
    "vue-router": "^5.0.3"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.5.2",
    "typescript": "^5.2.2",
    "vite": "^5.0.8",
    "vue-tsc": "^1.8.25"
  }
}
```

#### packages/frontend/vite.config.ts

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
  }
});
```

#### packages/frontend/tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@ai-ka/shared/*": ["../../shared/src/*"]
    },
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

#### packages/frontend/index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Knowledge Assistant</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

#### packages/frontend/src/vite-env.d.ts

```typescript
/// <reference types="vite/client" />
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
```

### 5.3 backend 包（Express + TS）

#### packages/backend/package.json

```json
{
  "name": "@ai-ka/backend",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "scripts": {
    "dev": "ts-node src/index.ts",
    "start": "tsc && node dist/index.js",
    "build": "tsc"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "ts-node": "^10.9.2",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.5"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

#### packages/backend/tsconfig.json

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
    }
  },
  "include": ["src/**/*.ts"]
}
```

#### packages/backend/src/index.ts

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// 加载根目录环境变量
dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3000;

// 基础中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查接口
app.get('/api/health', (_req, res) => {
  res.json({ code: 200, msg: 'server is running' });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
```

## 六、依赖安装

```bash
pnpm install
```

## 七、启动与验证

### 启动命令

```bash
# 并行启动前后端
pnpm run dev

# 单独启动后端
pnpm run dev:backend

# 单独启动前端
pnpm run dev:frontend
```

### 验证步骤

1. 后端验证：访问 `http://localhost:3000/api/health`
2. 前端验证：访问 `http://localhost:8080`

### Todo

1. 检查并更新根目录配置文件 (.env, pnpm-workspace.yaml, package.json)
2. 创建 shared 包配置文件 (package.json, tsconfig.json, src/index.ts, src/types/chat.ts)
3. 创建 frontend 包配置文件 (package.json, vite.config.ts, tsconfig.json, index.html, main.ts, App.vue, vite-env.d.ts)
4. 创建 backend 包配置文件 (package.json, tsconfig.json, src/index.ts)
5. 运行 pnpm install 验证依赖

## 八、注意事项

1. `.env` 文件需替换实际的 `DOUBAO_API_KEY`，已加入 `.gitignore`
2. 端口调整：后端修改 `.env` 中的 `PORT`，前端修改 `vite.config.ts` 中的 `port`
3. 前端业务代码（router, store, views, request）由 **step1.md** 实现

## Git Commit

```plaintext
feat: 初始化AI智能知识库助手项目结构
- 搭建pnpm monorepo工作区（frontend/backend/shared子包）
- 前端：Vue3+TS+Vite模板+路由/Pinia/Axios基础配置
- 后端：Express+TS基础服务+环境变量+健康检查接口
- 共享包：定义Chat/History核心类型，统一前后端数据格式
- 全局配置：tsconfig/pnpm-workspace/.env/启动脚本
```

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step0.md - 初始化AI智能知识库助手项目结构
