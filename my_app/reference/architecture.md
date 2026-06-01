# 项目架构文档

**版本**：v1.0
**创建日期**：2026-02-15
**维护者**：[henrypt]

## 一、文档概述

本文档基于项目现有执行规范、启动指南等核心文件，定义项目整体架构体系，并拆分全生命周期执行步骤，明确各阶段目标、执行动作、验收标准及闭环流程，确保开发过程可落地、可追溯、可验收。

## 二、Out of Scope（不做清单）

本项目**不包含**以下内容：

- 移动端 App 开发
- 第三方支付集成
- AI/ML 模型训练
- 多租户隔离
- 微服务拆分
- 国际化（i18n）

## 三、核心架构体系

### 1. 项目技术架构

| 层级 | 核心组件 | 技术栈 | 职责 |
| --- | --- | --- | --- |
| 前端层 | 页面/组件/状态管理 | Vue3 + TypeScript + Vite | 用户交互、数据展示、请求封装 |
| 后端层 | API/服务/中间件 | Node.js + Express/NestJS + TypeScript | 业务逻辑、数据处理、接口提供 |
| 共享层 | 类型定义/工具函数 | TypeScript | 前后端通用逻辑、类型复用 |
| 数据层 | 存储/缓存 | MySQL + Redis | 数据持久化、高性能缓存 |
| 部署层 | 容器/编排 | Docker + Docker Compose | 环境隔离、服务编排、一键部署 |

### 2. 工程化架构

| 模块 | 核心配置 | 工具 | 目标 |
| --- | --- | --- | --- |
| 包管理 | pnpm workspace | pnpm | 多包管理、本地依赖链路打通 |
| 环境管理 | .env/.env.example | - | 环境变量隔离、配置标准化 |
| 版本控制 | git commit 规范 | Git | 提交记录可追溯、迭代可管理 |
| 质量管控 | Human Gate 审核 | - | 人工把关、标准落地 |

## 三、项目全生命周期拆分步骤

### 阶段0：项目初始化（对应 steps/项目启动指南.md）

#### step0.md - 工程化基础搭建

| 字段 | 内容 |
| --- | --- |
| 优先级 | **P0**（核心前置） |
| Step编号 | Stage0-Step00 |
| Step目标 | 完成项目工程化基础配置，打通本地开发环境 |
| 输入条件 | Node.js ≥18.0.0、pnpm ≥6.11.0、Docker ≥20.10.0 |
| 执行动作 | 1. 创建 pnpm-workspace.yaml 配置工作空间<br>2. 配置前后端 package.json 依赖（引入 @blog/common 共享包）<br>3. 前端 vite.config.json 配置共享包别名<br>4. 安装项目所有依赖（pnpm install）<br>5. 配置 Docker Compose 启动 MySQL/Redis<br>6. 初始化后端环境变量（复制 .env.example 为 .env 并修改） |
| 输出物&验收标准 | 1. 根目录生成 pnpm-workspace.yaml，内容包含 packages/*<br>2. 前后端 node_modules 中 @blog/common 指向本地共享包（验证：ls -la packages/backend/node_modules/@blog）<br>3. 执行 pnpm install 无报错<br>4. Docker 中 MySQL/Redis 服务启动成功（验证：docker-compose ps 查看状态为 healthy）<br>5. 后端 .env 文件配置完成 |
| 关联依赖 | 无前置依赖；后续所有 step 依赖此 step 完成 |

| 文件变更清单 | 文件 | 操作类型 | 说明 |
| --- | --- | --- | --- |
| - | pnpm-workspace.yaml | 新增 | 配置 pnpm 工作空间 |
| - | packages/backend/package.json | 修改 | 引入 @blog/common workspace 依赖 |
| - | packages/frontend/package.json | 修改 | 引入 @blog/common workspace 依赖 |
| - | packages/frontend/vite.config.json | 修改 | 配置共享包别名 |
| - | packages/backend/.env | 新增 | 后端环境变量配置 |

### 阶段1：基础搭建（第一阶段）

#### step1.md - 后端基础项目初始化

| 字段 | 内容 |
| --- | --- |
| 优先级 | **P0**（核心前置） |
| Step编号 | Stage1-Step01 |
| Step目标 | 完成后端基础架构搭建，启动基础服务并验证 |
| 输入条件 | step0 完成；MySQL/Redis 服务正常运行 |
| 执行动作 | 1. 编写后端入口文件（app.js），配置基础中间件（CORS、日志、解析器）<br>2. 配置数据库连接（Sequelize）并初始化表结构（pnpm run init-db）<br>3. 配置 Swagger API 文档<br>4. 启动后端 dev 服务（pnpm run dev）<br>5. 验证后端服务可用性（访问 <http://localhost:3001）><br>6. 执行 Human Gate 1 审查（PMO 验证需求完整性、Security 扫描敏感配置） |
| 输出物&验收标准 | 1. 后端入口文件可正常启动，无报错<br>2. 数据库表结构初始化完成（验证：MySQL 中存在对应表，默认 admin 账户创建成功）<br>3. Swagger 文档可访问（<http://localhost:3001/api-docs）><br>4. Human Gate 1 审查结果为 PASS<br>5. 执行 git add . && git commit -m "feat: 完成 step1-后端基础初始化" |
| 关联依赖 | 前置：step0；后续：step2（前端基础）、step3（核心API开发） |


| 文件变更清单 |  文件 | 操作类型 | 说明 |
| --- | --- | --- | --- |
| - | packages/backend/app.js | 新增/修改 | 后端入口文件，配置中间件 |
| - | packages/backend/modules/db/index.js | 新增 | 数据库连接配置 |
| - | packages/backend/scripts/init-db.js | 新增 | 数据库初始化脚本 |
| - | packages/backend/swagger.js | 新增 | Swagger 文档配置 |

#### step2.md - 前端基础项目初始化

| 字段 | 内容 |
| --- | --- |
| 优先级 | **P1**（基础搭建） |
| Step编号 | Stage1-Step02 |
| Step目标 | 完成前端基础架构搭建，启动基础服务并验证 |
| 输入条件 | step0 完成；后端 step1 基础服务可访问（可选，前端可先Mock） |
| 执行动作 | 1. 配置前端路由（router/index.js）<br>2. 配置状态管理（stores/index.js）<br>3. 封装请求工具（utils/request.js），对接后端 API 地址<br>4. 启动前端 dev 服务（pnpm run dev）<br>5. 验证前端服务可用性（访问 <http://localhost:5173）><br>6. 执行 Human Gate 1 审查（PMO 验证前端基础架构合理性） |
| 输出物&验收标准 | 1. 前端路由可正常跳转，无报错<br>2. 请求工具可正常发起请求（验证：调用后端健康检查接口返回 200）<br>3. 前端服务启动成功，页面可访问<br>4. Human Gate 1 审查结果为 PASS<br>5. 执行 git add . && git commit -m "feat: 完成 step2-前端基础初始化" |
| 关联依赖 | 前置：step0；后续：step4（前端核心组件开发） |

| 文件变更清单 |  文件 | 操作类型 | 说明 |
| --- | --- | --- | --- |
| - | packages/frontend/src/router/index.js | 新增 | 前端路由配置 |
| - | packages/frontend/src/stores/index.js | 新增 | 状态管理配置 |
| - | packages/frontend/src/utils/request.js | 新增 | 请求工具封装 |

### 阶段2：核心功能（第二阶段）

#### step3.md - 后端核心API开发（用户模块）

| 字段 | 内容 |
| --- | --- |
| 优先级 | **P0**（核心功能） |
| Step编号 | Stage2-Step03 |
| Step目标 | 完成用户模块核心 API 开发（登录、注册、信息查询） |
| 输入条件 | step1 完成；数据库表结构初始化成功 |
| 执行动作 | 1. 编写用户模型（models/user.js）<br>2. 编写用户服务（services/user.js）<br>3. 编写用户控制器（controllers/user.js）<br>4. 配置用户路由（routes/user.js）<br>5. 调试 API 接口（curl 测试登录/注册接口）<br>6. 编写单元测试（tests/user.spec.js）并执行（pnpm test）<br>7. 执行 Human Gate 1 审查（Security 扫描接口鉴权、数据脱敏） |
| 输出物&验收标准 | 1. 用户模块 API 可正常调用，返回格式符合规范<br>2. 单元测试通过率 100%（pnpm test 无失败用例）<br>3. curl 测试结果示例：<br>```bash<br>curl -X POST http://localhost:3001/api/user/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'<br>```<br>返回：`{"code":200,"data":{"token":"xxx"},"msg":"登录成功"}`<br>4. Human Gate 1 审查结果为 PASS<br>5. 执行 git add . && git commit -m "feat: 完成 step3-用户模块API开发" |
| 关联依赖 | 前置：step1；后续：step4（前端用户组件开发） |

| 文件变更清单 | 文件 | 操作类型 | 说明 |
| --- | --- | --- | --- |
| - | packages/backend/models/user.js | 新增 | 用户数据模型 |
| - | packages/backend/services/user.js | 新增 | 用户业务逻辑 |
| - | packages/backend/controllers/user.js | 新增 | 用户接口控制器 |
| - | packages/backend/routes/user.js | 新增 | 用户路由配置 |
| - | packages/backend/tests/user.spec.js | 新增 | 用户模块单元测试 |

#### step4.md - 前端核心组件开发（用户模块）

| 字段 | 内容 |
| --- | --- |
| 优先级 | **P1**（核心功能） |
| Step编号 | Stage2-Step04 |
| Step目标 | 完成用户模块前端组件开发（登录页、个人信息页） |
| 输入条件 | step2 完成；step3 后端用户 API 可正常调用 |
| 执行动作 | 1. 编写登录页面组件（views/Login.vue）<br>2. 编写个人信息页面组件（views/Profile.vue）<br>3. 对接后端用户 API（调用 request 工具）<br>4. 调试组件交互（登录、信息展示）<br>5. 编写组件单元测试（tests/Login.spec.js）<br>6. 执行 Human Gate 1 审查（PMO 验证交互符合需求） |
| 输出物&验收标准 | 1. 登录页面可正常输入账号密码，调用登录接口并跳转<br>2. 个人信息页可正常展示用户信息<br>3. 单元测试通过率 100%<br>4. 页面无控制台报错，样式正常<br>5. Human Gate 1 审查结果为 PASS<br>6. 执行 git add . && git commit -m "feat: 完成 step4-用户模块前端组件" |
| 关联依赖 | 前置：step2、step3；后续：step5（核心功能集成） |

| 文件变更清单 | 文件 | 操作类型 | 说明 |
| --- | --- | --- | --- |
| - | packages/frontend/src/views/Login.vue | 新增 | 登录页面组件 |
| - | packages/frontend/src/views/Profile.vue | 新增 | 个人信息页面组件 |
| - | packages/frontend/src/api/user.js | 新增 | 用户 API 调用封装 |
| - | packages/frontend/tests/Login.spec.js | 新增 | 登录组件单元测试 |

#### step5.md - 核心功能集成与验证

| 字段 | 内容 |
| --- | --- |
| 优先级 | **P0**（集成验证） |
| Step编号 | Stage2-Step05 |
| Step目标 | 完成用户模块前后端集成，端到端验证核心功能 |
| 输入条件 | step3、step4 完成；前后端服务均正常运行 |
| 执行动作 | 1. 集成用户组件到前端路由（配置登录/个人信息页路由）<br>2. 端到端测试（从登录到个人信息展示全流程）<br>3. 验证异常场景（错误账号密码、token 失效）<br>4. 执行 Human Gate 2 复审（PMO 验证功能完整性、Security 扫描接口安全）<br>5. 生成测试报告，写入 .cursor/plans/step5-plan.md |
| 输出物&验收标准 | 1. 前端路由可正常跳转登录/个人信息页<br>2. 端到端测试全流程通过，异常场景处理符合预期<br>3. 测试报告包含命令、预期结果、实际结果，示例：<br>```bash<br># 启动前后端服务<br>cd packages/backend && pnpm run dev &<br>cd ../frontend && pnpm run dev &<br>sleep 5<br># 执行端到端测试<br>curl -X POST http://localhost:3001/api/user/login -d '{"username":"admin","password":"admin123"}' -H "Content-Type: application/json"<br># 验证返回 token 并调用个人信息接口<br>```<br>4. Human Gate 2 审查结果为 PASS<br>5. 执行 git add . && git commit -m "feat: 完成 step5-核心功能集成" |
| 关联依赖 | 前置：step3、step4；后续：step6（集成优化） |

| 文件变更清单 | 文件 | 操作类型 | 说明 |
| --- | --- | --- | --- |
| - | packages/frontend/src/router/index.js | 修改 | 新增用户模块路由配置 |
| - | .cursor/plans/step5-plan.md | 修改 | 追加测试报告内容 |

### 阶段3：集成优化（第三阶段）

#### step6.md - 项目集成与部署优化

| 字段 | 内容 |
| --- | --- |
| 优先级 | **P1**（部署优化） |
| Step编号 | Stage3-Step06 |
| Step目标 | 完成项目 Docker 容器化部署优化，验证生产环境配置 |
| 输入条件 | step5 完成；核心功能验证通过 |
| 执行动作 | 1. 优化后端 Dockerfile（生产环境构建、依赖安装）<br>2. 优化前端 Dockerfile（打包静态资源、Nginx 配置）<br>3. 调整 docker-compose.yml，适配生产环境（设置 NODE_ENV=production）<br>4. 构建并启动生产环境容器（docker-compose up -d --build）<br>5. 验证生产环境服务可用性（访问 <http://localhost> 前端、<http://localhost:3001> 后端）<br>6. 执行 Human Gate 2 复审（Security 验证生产环境配置安全） |
| 输出物&验收标准 | 1. Docker 构建无报错，所有容器启动成功（docker-compose ps 状态为 healthy）<br>2. 生产环境前端可正常访问，后端 API 可正常调用<br>3. 环境变量 NODE_ENV 为 production<br>4. Human Gate 2 审查结果为 PASS<br>5. 执行 git add . && git commit -m "feat: 完成 step6-部署优化" |
| 关联依赖 | 前置：step5；后续：step7（稳定性优化） |

| 文件变更清单 | 文件 | 操作类型 | 说明 |
| --- | --- | --- | --- |
| - | docker/backend/Dockerfile | 修改 | 优化生产环境构建逻辑 |
| - | docker/frontend/Dockerfile | 修改 | 优化前端打包与 Nginx 配置 |
| - | docker/docker-compose.yml | 修改 | 配置生产环境变量、端口映射 |

#### step7.md - 稳定性与扩展性优化

| 字段 | 内容 |
| --- | --- |
| 优先级 | **P1**（稳定性优化） |
| Step编号 | Stage3-Step07 |
| Step目标 | 完成项目稳定性优化，补充日志、监控、异常处理 |
| 输入条件 | step6 完成；生产环境容器正常运行 |
| 执行动作 | 1. 后端添加日志模块（winston），记录请求/错误日志<br>2. 前端添加错误捕获（errorHandler），记录前端报错<br>3. 补充接口异常处理（统一返回格式、错误码）<br>4. 验证日志输出（后端 logs 目录、前端控制台/日志文件）<br>5. 执行全量测试，验证所有功能正常<br>6. 执行 Human Gate 2 复审（PMO 验证稳定性、Security 无漏洞）<br>7. 更新 tracking.md 状态为 ✅ 完成，填写完成日期和验收结果 |
| 输出物&验收标准 | 1. 后端请求/错误日志可正常输出到 logs 目录<br>2. 前端报错可被捕获并记录<br>3. 所有接口返回格式统一，错误码规范<br>4. 全量测试无失败用例<br>5. Human Gate 2 审查结果为 PASS<br>6. tracking.md 中 step0-step7 状态均为 ✅ 完成，更新日志记录完整<br>7. 执行最终提交：git add . && git commit -m "feat(step7): 全部完成 + 验收通过" |
| 关联依赖 | 前置：step6；无后续 step（集成优化阶段结束） |
| 文件变更清单 |  文件 | 操作类型 | 说明 |
| --- | --- | --- | --- |
| - | packages/backend/middleware/logger.js | 新增 | 后端日志中间件 |
| - | packages/frontend/src/utils/errorHandler.js | 新增 | 前端错误捕获工具 |
| - | packages/backend/utils/response.js | 新增 | 统一响应格式工具 |
| - | docs/steps/tracking.md | 修改 | 更新 step 状态、完成日期、验收结果 |

## 四、执行规范补充

### 1. Plan 文件生成规则

每个 step 执行前，需生成对应的 Plan 文件（.cursor/plans/step{N}-plan.md），包含 todos、文件清单、验收标准，严格遵循 generate-plan.md 规范。

### 2. Human Gate 执行规则

- 开发阶段（step1-step5）执行 Human Gate 1（执行前审查）；
- 测试/验收/集成优化阶段（step5-step7）执行 Human Gate 2（执行后复审）；
- 审查结果为 REJECT 时，立即停止执行，修复后重新审查。

### 3. 进度追踪规则

- 执行前：更新 tracking.md 中对应 step 状态为 🔄 进行中；
- 执行后：更新为 ✅ 完成/⚠️ 阻塞/🔴 回滚，填写完成日期和验收结果；
- 每次更新需在 tracking.md 「更新日志」中记录。

### 4. 版本控制规则

- 每个 todo 完成后执行：git add . && git commit -m "feat: 完成 todo-x"；
- 每个 step 完成后执行对应 commit；
- 所有 step 完成后执行最终提交，备注验收通过。

## 五、验收闭环

所有 step 执行完成后，需满足：

1. 每个 step 的输出物&验收标准 100% 达成；
2. Human Gate 1/2 审查均为 PASS；
3. tracking.md 状态更新完整，无阻塞项；
4. 测试报告包含实测命令和输出，无空泛的“通过”描述；
5. 所有代码提交记录完整，版本控制规范。

---

## 版本更新记录

| 版本 | 更新日期 | 更新内容 | 更新人 |
|------|----------|----------|--------|
| v1.0 | 2026-02-15 | 初始版本：添加版本信息、维护者、更新记录、Out of Scope、Step 优先级 | [henrypt] |
