# Ollama Server

独立的 Ollama HTTP API 服务，提供跨平台的 AI 生成能力。

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

服务将在 `http://localhost:3000` 启动。

### 生产构建

```bash
npm run build
npm start
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3001` | 服务端口 |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama API 地址 |

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/health` | 健康检查 |
| `GET` | `/api/models` | 获取可用模型列表 |
| `GET` | `/api/prompt-types` | 获取支持的 Prompt 类型 |
| `POST` | `/api/generate` | 生成文本 |
| `POST` | `/api/generate-by-stage` | 按阶段类型生成内容 |

### 请求示例

```bash
# 健康检查
curl http://localhost:3001/api/health

# 获取模型列表
curl http://localhost:3001/api/models

# 生成文本
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "deepseek-r1", "prompt": "Hello, world!"}'

# 按阶段生成
curl -X POST http://localhost:3001/api/generate-by-stage \
  -H "Content-Type: application/json" \
  -d '{
    "stageId": "init",
    "files": [{"name": "README.md", "content": "# Project"}],
    "model": "deepseek-r1"
  }'
```

## 与前端集成

在 Vue/React 项目中，配置 Vite 代理：

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

## 技术栈

- **Runtime**: Node.js (ESM)
- **Language**: TypeScript
- **Framework**: Express.js
- **Dev Tool**: tsx (hot reload)
