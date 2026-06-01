# Step 2: 前端认证界面 - 登录注册与Token管理

## 任务目标
前端认证界面 - 登录注册与Token管理

## 详细说明
实现前端认证相关页面和功能：登录页面、注册页面、Token 管理、路由守卫。集成 Pinia 进行状态管理（authStore）。使用 Tailwind CSS 定制 UI 样式。实现 Axios 封装和请求拦截器（自动携带 Token、自动刷新过期 Token）。实现表单验证（Zod Schema）。

v1复用量：25%（认证流程代码、Axios 封装、表单验证规则可复用 v1）

技术方案：
1. 创建 authStore（Pinia）：管理用户信息、Token 状态
2. 创建 apiClient（Axios 封装）：请求拦截、响应拦截、Token 刷新
3. 创建 Login.vue 登录页面：邮箱密码登录
4. 创建 Register.vue 注册页面：用户名、邮箱、密码
5. 创建路由守卫（router.beforeEach）：Token 校验、自动跳转
6. 创建 authApi.ts：封装认证接口调用
7. 实现 Zod 表单验证 schema
- v1复用量：25%
- 技术方案：复用 v1 的 Axios 封装和拦截器逻辑。authStore 使用 defineStore 创建，管理 user、accessToken、refreshToken 状态。apiClient 封装：1）请求拦截自动添加 Authorization header；2）响应拦截处理 401 自动刷新 Token；3）错误拦截统一处理错误提示。登录页面使用 Vue3 Composition API + Tailwind CSS。

## Out of Scope（当前 Step 不做的事情）
- 不实现 OAuth 第三方登录按钮（UI 占位，后续实现）
- 不实现「记住我」功能（后续扩展）
- 不实现忘记密码/重置密码流程（后续扩展）
- 不实现 MFA 验证码输入界面（后续扩展）
- 不实现社交账号登录（Google/GitHub）

## 执行任务（TODO）
- [ ] todo-2.1: 安装依赖（axios, zod, @vueuse/core）
- [ ] todo-2.2: 创建 stores/authStore.ts（Pinia）
- [ ] todo-2.3: 创建 utils/apiClient.ts（Axios 封装）
- [ ] todo-2.4: 创建 api/authApi.ts（认证接口封装）
- [ ] todo-2.5: 创建 views/auth/Login.vue 登录页面
- [ ] todo-2.6: 创建 views/auth/Register.vue 注册页面
- [ ] todo-2.7: 创建 router/index.ts 路由配置和守卫
- [ ] todo-2.8: 创建 layouts/AuthLayout.vue 认证布局
- [ ] todo-2.9: 创建 views/dashboard/Index.vue 首页（临时）
- [ ] todo-2.10: 配置 Tailwind CSS 主题和组件样式
- [ ] todo-2.11: 编写单元测试（vitest）

## 约束条件
- 必须使用 Vue 3 Composition API（禁止 Options API）
- 必须使用 Pinia 进行状态管理
- 必须使用 Tailwind CSS 定制样式（禁止 Scoped CSS）
- 表单验证使用 Zod（禁止其他验证库）
- Token 存储在内存中（不持久化到 localStorage）
- RefreshToken 存储在 HTTP Only Cookie（后端处理）

## 验收标准
### 功能验收
- [ ] 登录页面 UI 正常显示
- [ ] 表单验证正常（空字段、邮箱格式、密码强度）
- [ ] 登录成功后跳转到首页
- [ ] Token 自动附加到后续请求
- [ ] Token 过期后自动刷新
- [ ] 刷新失败后跳转到登录页
- [ ] 退出登录清除状态并跳转
- [ ] 未登录访问受保护页面跳转登录

### 性能验收
| 指标 | 标准 |
|------|------|
| 页面首屏渲染 | < 1秒 |
| 登录响应处理 | < 500ms |

### 安全验收
- Token 不明文存储在 localStorage
- 敏感表单字段使用 type=password
- 防止 XSS 注入（输入转义）

## 测试标准
### 功能测试
- 登录表单验证：空邮箱提示必填
- 登录表单验证：无效邮箱格式提示
- 登录表单验证：密码少于 8 位提示
- 登录成功跳转到 /dashboard
- Token 自动刷新流程正常
- 退出登录清除状态

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 登录页面加载 | < 1秒 | Lighthouse |

### 安全测试
- Token 不在 localStorage 中
- 登录请求密码加密传输

## 测试验收流程
1. 单元测试：执行 pnpm test 验证 authStore 和 apiClient
2. 功能验证：浏览器手动测试登录流程
3. Human Gate 验收：人工确认 UI 样式和交互正常
4. 签字确认：负责人确认后方可进入 Step 3

## 涉及文件
- packages/frontend/src/stores/authStore.ts
- packages/frontend/src/utils/apiClient.ts
- packages/frontend/src/utils/validators.ts
- packages/frontend/src/api/authApi.ts
- packages/frontend/src/views/auth/Login.vue
- packages/frontend/src/views/auth/Register.vue
- packages/frontend/src/layouts/AuthLayout.vue
- packages/frontend/src/layouts/MainLayout.vue
- packages/frontend/src/router/index.ts
- packages/frontend/src/views/dashboard/Index.vue
- packages/frontend/tailwind.config.js
- packages/shared/src/types/auth.types.ts

## 前置依赖
Step 0（项目框架初始化）、Step 1（后端认证模块）

## 前置产出验证
- 后端 /api/v1/auth/* 接口可正常调用
- 前端路由配置正确

## 风险提示
- **Token 刷新竞态条件（多个请求同时触发刷新）**: 使用 Promise 缓存机制，同一时刻只发起一次刷新请求
- **页面刷新后登录状态丢失**: 后端验证请求时通过 Cookie 自动续期，前端无需持久化

## 关联规范
- 角色：Frontend Agent
- 关联规则：.cursor/rules/frontend.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构文档 - 前端模块 - 认证授权模块
- 架构文档 - API 设计 - 认证授权接口
- 前端规范 frontend-vue3.mdc
- 前端 UI 规范 UI-components.mdc

## 里程碑映射
Day 6-8：完成前端认证界面
