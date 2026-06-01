# Step 0: 初始化 monorepo 项目结构，配置前端 Vue3 + 后端 NestJS + 共享类型

## 任务目标
初始化 monorepo 项目结构，配置前端 Vue3 + 后端 NestJS + 共享类型

## 详细说明
创建完整的 monorepo 项目结构，配置 pnpm workspace，包含 packages/frontend（Vue3）、packages/backend（NestJS）、packages/shared（共享类型）。配置 TypeScript、Vite、ESLint、Prettier 等基础工具，安装所有依赖并验证项目可运行。
- v1复用量：0%
- 技术方案：1. 创建 pnpm-workspace.yaml 配置多包结构
2. 根目录 package.json 配置 workspaces
3. packages/frontend: Vue 3 + Vite + TypeScript + Tailwind CSS + Pinia + Vue Router
4. packages/backend: NestJS + Prisma + TypeScript
5. packages/shared: 共享类型定义和工具函数
6. 配置 .env 示例文件
7. 安装所有依赖: pnpm install

## Out of Scope（当前 Step 不做的事情）
- 不实现任何业务功能代码
- 不创建具体页面组件
- 不配置数据库连接
- 不实现认证逻辑

## 执行任务（TODO）
- [ ] todo-0.1: 创建 pnpm-workspace.yaml 配置多包结构
- [ ] todo-0.2: 创建根目录 package.json 和 tsconfig.json
- [ ] todo-0.3: 创建 packages/frontend 基础配置（Vite + Vue3 + TypeScript）
- [ ] todo-0.4: 创建 packages/backend 基础配置（NestJS + Prisma）
- [ ] todo-0.5: 创建 packages/shared 类型定义包
- [ ] todo-0.6: 配置 Tailwind CSS 和基础样式
- [ ] todo-0.7: 创建 .env.example 示例配置文件
- [ ] todo-0.8: 安装所有依赖并验证项目可启动

## 约束条件
- 必须使用 pnpm 作为包管理器
- 前端必须使用 Vue 3 Composition API
- 后端必须使用 NestJS 模块化结构
- 禁止使用 kebab-case 命名文件

## 验收标准
### 功能验收
- [ ] monorepo 结构创建成功
- [ ] 所有子包 package.json 配置正确
- [ ] pnpm install 无报错
- [ ] 前端可执行 pnpm dev 启动
- [ ] 后端可执行 pnpm start:dev 启动

### 性能验收
| 指标 | 标准 |
|------|------|
| pnpm install 时间 | < 60秒 |

### 安全验收
- 不暴露敏感配置信息

## 测试标准
### 功能测试
- 验证 frontend/src/App.vue 存在
- 验证 backend/src/main.ts 存在
- 验证 shared/index.ts 导出正确

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 冷启动时间 | < 5秒 | time pnpm dev |

### 安全测试
- 验证 .env 不提交到 git

## 测试验收流程
依赖安装验证 → 项目结构验证 → 服务启动验证 → Human Gate

## 涉及文件
- pnpm-workspace.yaml
- package.json
- tsconfig.json
- packages/frontend/package.json
- packages/frontend/vite.config.ts
- packages/frontend/tsconfig.json
- packages/frontend/src/main.ts
- packages/frontend/src/App.vue
- packages/backend/package.json
- packages/backend/tsconfig.json
- packages/backend/src/main.ts
- packages/shared/package.json
- packages/shared/index.ts
- .env.example

## 前置依赖
无

## 前置产出验证
无

## 风险提示
- **pnpm 版本兼容性可能导致依赖安装失败**: 在 package.json 中指定engines字段锁定pnpm版本
- **前端和后端同时启动的端口冲突**: 前端默认5173，后端默认3000，确保端口不冲突

## 关联规范
- 角色：Fullstack Agent
- 关联规则：.cursor/rules/frontend.mdc, .cursor/rules/backend.mdc, .cursor/rules/fullstack.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构设计文档 - 技术栈选型
- 架构设计文档 - 部署架构

## 里程碑映射
基础准备（Day 1）
