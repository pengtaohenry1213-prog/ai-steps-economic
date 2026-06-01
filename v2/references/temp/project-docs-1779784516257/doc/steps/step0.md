# Step 0: 项目框架初始化 - monorepo结构与基础配置

## 任务目标
项目框架初始化 - monorepo结构与基础配置

## 详细说明
搭建 pnpm monorepo 项目结构，包含根目录配置、packages/frontend（Vue3）、packages/backend（NestJS）、packages/shared（共享类型）。配置 TypeScript、Vite、ESLint、Prettier 等基础工具链。设置环境变量模板、根 workspace 配置。安装跨包依赖，建立包之间的引用关系。这是所有后续开发的基础环境。

v1复用量：0%（新项目初始化，无代码可复用）

技术方案：
1. 创建 pnpm-workspace.yaml 定义工作空间结构
2. 根目录 package.json 配置 workspaces、scripts、devDependencies
3. 根目录 tsconfig.json 配置 composite 项目引用
4. packages/backend 配置 NestJS + Prisma + PostgreSQL
5. packages/frontend 配置 Vue3 + Vite + TypeScript + Tailwind CSS + Pinia
6. packages/shared 配置共享类型定义和工具函数
7. 创建 .env.example 环境变量模板
8. 配置跨包引用（frontend -> shared, backend -> shared）
- v1复用量：0%
- 技术方案：采用 pnpm workspace 实现 monorepo 结构。根目录统一管理依赖安装和脚本执行。packages/backend 使用 NestJS CLI 初始化，packages/frontend 使用 Vite 创建 Vue3 项目。packages/shared 使用 tsc --init 初始化为纯类型定义包。三者通过 TypeScript Project References 实现类型共享。

## Out of Scope（当前 Step 不做的事情）
- 不实现任何业务功能代码（仅搭建空框架）
- 不配置数据库连接和 Prisma Schema（backend 基础包）
- 不实现具体页面组件和路由（frontend 基础包）
- 不配置 CI/CD 和部署流程（Step 9 处理）
- 不集成任何第三方服务（AI、日志等）

## 执行任务（TODO）
- [ ] todo-0.1: 创建 pnpm-workspace.yaml 定义工作空间结构
- [ ] todo-0.2: 创建根目录 package.json 配置 scripts 和 devDependencies
- [ ] todo-0.3: 创建根目录 tsconfig.json 配置 TypeScript Project References
- [ ] todo-0.4: 创建 .gitignore 和 .env.example 环境变量模板
- [ ] todo-0.5: 创建 packages/shared 包（共享类型定义）
- [ ] todo-0.6: 创建 packages/backend 包（NestJS 基础框架）
- [ ] todo-0.7: 创建 packages/frontend 包（Vue3 + Vite 基础框架）
- [ ] todo-0.8: 配置 Tailwind CSS 和 PostCSS
- [ ] todo-0.9: 配置 ESLint 和 Prettier 代码规范
- [ ] todo-0.10: 执行 pnpm install 安装所有依赖
- [ ] todo-0.11: 验证前后端可独立启动

## 约束条件
- 必须使用 pnpm（禁止 npm/yarn）
- 必须使用 Vue 3 Composition API（禁止 Options API）
- 必须使用 NestJS（禁止 Express/Koa）
- 必须使用 Prisma ORM（禁止其他 ORM）
- 禁止 kebab-case 文件命名，必须使用 camelCase
- 前端目录结构遵循 Vben Admin 规范（src/views/、src/components/、src/stores/）
- 后端目录结构遵循 NestJS 模块化规范（src/modules/<module>/）

## 验收标准
### 功能验收
- [ ] pnpm install 可成功安装所有依赖
- [ ] pnpm dev 启动命令可同时启动前后端
- [ ] 前端访问 http://localhost:5173 可看到 Vue3 默认页面
- [ ] 后端访问 http://localhost:3000 可看到 NestJS 默认响应
- [ ] packages/shared 的类型定义可被前后端包引用

### 性能验收
| 指标 | 标准 |
|------|------|
| 依赖安装时间 | < 2分钟 |
| 冷启动时间 | < 10秒 |

### 安全验收
- .env 文件不提交到 Git（已在 .gitignore）
- 敏感配置使用环境变量，不硬编码

## 测试标准
### 功能测试
- 验证 pnpm install 无错误
- 验证前后端可独立启动
- 验证热更新（HMR）正常工作
- 验证跨包类型引用正常

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 首次安装 | < 2分钟 | time pnpm install |
| 启动时间 | < 10秒 | time pnpm dev |

### 安全测试
- 验证 .gitignore 包含 .env
- 验证无敏感信息硬编码

## 测试验收流程
1. 单元测试：无（纯框架配置）
2. 功能验证：执行 pnpm install && pnpm dev 验证启动
3. Human Gate 验收：人工确认前后端可正常运行
4. 签字确认：负责人确认后方可进入 Step 1

## 涉及文件
- pnpm-workspace.yaml
- package.json
- tsconfig.json
- .gitignore
- .env.example
- packages/shared/package.json
- packages/shared/tsconfig.json
- packages/shared/src/index.ts
- packages/backend/package.json
- packages/backend/tsconfig.json
- packages/backend/src/main.ts
- packages/backend/src/app.module.ts
- packages/frontend/package.json
- packages/frontend/tsconfig.json
- packages/frontend/vite.config.ts
- packages/frontend/tailwind.config.js
- packages/frontend/postcss.config.js
- packages/frontend/index.html
- packages/frontend/src/main.ts
- packages/frontend/src/App.vue

## 前置依赖
无

## 前置产出验证
无

## 风险提示
- **pnpm 版本兼容性导致 workspace 功能异常**: 在 package.json engines 字段指定 pnpm >= 8.0，并在 README 中说明 pnpm 版本要求
- **NestJS 和 Vue3 的 TypeScript 配置可能冲突**: 使用独立的 tsconfig.json，通过 TypeScript Project References 隔离配置

## 关联规范
- 角色：Fullstack Agent
- 关联规则：.cursor/rules/fullstack.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构文档 - 技术栈选型
- 架构文档 - monorepo 结构
- 前端规范 frontend-vue3.mdc
- 后端规范 backend-nestjs.mdc

## 里程碑映射
Day 1-2：完成项目基础框架搭建
