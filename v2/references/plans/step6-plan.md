---
name: step6-后端项目初始化
overview: 按 step6.md 规格，初始化 Express + TypeScript 后端项目，搭建基础分层结构并实现健康检查接口
todos:
  - id: init-pnpm
    content: 使用 pnpm init 初始化后端项目，安装核心依赖
    status: pending
  - id: config-ts
    content: 配置 tsconfig.json（严格模式、输出目录、路径别名）
    status: pending
  - id: create-dirs
    content: 创建分层目录结构（routes/services/utils/types/middlewares）
    status: pending
  - id: impl-index
    content: 实现 src/index.ts（服务入口，cors/json 中间件）
    status: pending
  - id: impl-error-middleware
    content: 实现 src/middlewares/error.middleware.ts（全局异常处理）
    status: pending
  - id: impl-logger-middleware
    content: 实现 src/middlewares/logger.middleware.ts（请求日志）
    status: pending
  - id: impl-health-check
    content: 实现 GET /api/health 接口
    status: pending
  - id: verify-run
    content: 验证服务启动无报错
    status: pending
isProject: false
---

## 任务背景

AI智能知识库助手后端需提供文件解析、Embedding、RAG检索、流式对话等接口，需先搭建规范的项目骨架。

## 文件路径清单

```
packages/backend/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              ← 服务入口
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── types/
│   └── middlewares/
│       ├── error.middleware.ts
│       └── logger.middleware.ts
```

## 验收标准

| 验收项 | 预期结果 |
|--------|----------|
| 项目可启动 | `pnpm dev` / `ts-node src/index.ts` 无报错 |
| 健康检查 | `GET /api/health` 返回 `{ "code": 200, "msg": "server is running" }` |
| 中间件顺序 | cors → json解析 → 路由 → 异常处理 |
| TypeScript | 无类型错误，严格模式通过 |
| CORS | 已配置，支持跨域请求 |
| 异常捕获 | 服务启动异常被捕获，不会直接崩溃 |

## 风险/注意项

1. **端口占用处理**：服务启动时需捕获 `EADDRINUSE` 错误，给出友好提示
2. **中间件顺序**：严格按照 cors → 解析 → 路由 → 异常处理的顺序注册
3. **类型完整**：所有函数、变量必须有显式类型声明，禁止 `any`
4. **规范引用**：代码风格遵循 `my-rules/规范/AI_Coding_Style.md`

## 执行顺序

1. 先完成 `init-pnpm` 和 `config-ts`
2. 再创建目录结构
3. 实现中间件
4. 实现主入口和健康检查接口
5. 最后验证运行
