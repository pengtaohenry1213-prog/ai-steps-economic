
# 🎯 任务目标

初始化 Express + TypeScript 后端项目，搭建基础分层结构

## 🧱 项目背景

AI智能知识库助手后端需提供文件解析、Embedding、RAG检索、流式对话等接口，需先搭建规范的项目骨架。

## 📋 任务要求

* 使用 pnpm init 初始化项目，安装核心依赖（express、typescript、@types/express、ts-node、cors、dotenv）
* 配置 tsconfig.json（启用严格模式、指定输出目录、路径别名）
* 搭建分层结构：src/routes、src/services、src/utils、src/types、src/middlewares
* 实现基础Express服务启动逻辑，添加cors、json解析中间件
* 实现健康检查接口（GET /api/health），返回 { code: 200, msg: 'server is running' }

## ⚠️ 强约束

* 所有代码使用 TypeScript 编写，类型定义完整
* 服务启动需处理端口占用、异常捕获
* 中间件注册顺序合理（cors → 解析 → 路由 → 异常处理）

## 📤 输出格式

1. 后端项目目录结构（tree形式）
2. 关键文件完整代码：
   * src/index.ts（服务入口）
   * tsconfig.json
   * src/middlewares/error.middleware.ts（全局异常处理）
   * src/middlewares/logger.middleware.ts（简单日志）

## 🚫 禁止行为

* 不要省略核心依赖
* 不要忽略跨域配置
* 不要写无类型的松散代码

---

## 🧪 测试要求（参考 TEST Rule）

### 测试类型：功能测试 + 冒烟测试

### 测试范围

- 健康检查接口 `/api/health`
* Express 服务启动
* 中间件注册顺序
* 跨域配置

### 测试用例

| 用例ID | 测试场景 | 预期结果 | 实际结果 | 测试状态 |
|--------|---------|---------|---------|----------|
| TC-INIT-001 | GET /api/health 返回 200 | 返回 `{code: 200, msg: "server is running"}` | - | - |
| TC-INIT-002 | 服务启动端口检测 | 服务成功监听配置的端口 | - | - |
| TC-INIT-003 | CORS 跨域请求 | 允许前端跨域访问接口 | - | - |
| TC-INIT-004 | JSON 请求体解析 | POST JSON 数据能被正确解析 | - | - |
| TC-INIT-005 | 端口占用处理 | 端口被占用时返回友好错误提示 | - | - |
| TC-INIT-006 | TypeScript 类型检查 | tsc 编译无类型错误 | - | - |
| TC-INIT-007 | 目录结构验证 | 存在 routes/services/utils/types/middlewares 目录 | - | - |
| TC-INIT-008 | tsconfig 配置验证 | strict 模式启用，路径别名配置正确 | - | - |
| TC-INIT-009 | 依赖完整性 | package.json 包含所有核心依赖 | - | - |
| TC-INIT-010 | 服务重启可用 | 停止后重新启动正常 | - | - |

### 问题清单

| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |

---

## 项目目录结构（tree 形式）

- 参考：`md/项目结构.md`

## 项目 git commit 规范

- 参考：`md/Git提交规范.md`

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step6.md - 初始化 Express + TypeScript 后端项目，搭建基础分层结构并实现健康检查接口
