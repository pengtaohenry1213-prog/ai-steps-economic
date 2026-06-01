# Step 1: 实现用户认证系统（注册、登录、Token刷新、登出）

## 任务目标
实现用户认证系统（注册、登录、Token刷新、登出）

## 详细说明
基于 NestJS + Prisma + PostgreSQL 实现完整的用户认证系统。支持邮箱密码注册登录、JWT Token 签发、Token 自动刷新、密码加密存储。配置 Supabase Auth 风格的安全策略。
- v1复用量：15%
- 技术方案：1. 使用 bcryptjs 加密密码
2. 使用 @nestjs/jwt + @nestjs/passport 实现 JWT 认证
3. 实现 AuthModule（Controller/Service/Strategy）
4. 配置 Prisma User Entity
5. 前端封装 Axios 拦截器处理 Token 自动刷新
6. 实现登录页面和注册页面
7. 路由守卫保护需要认证的页面

## Out of Scope（当前 Step 不做的事情）
- 不支持 OAuth 第三方登录（Google/GitHub）
- 不支持 MFA 多因素认证
- 不支持社交账号绑定
- 不支持忘记密码/重置密码功能

## 执行任务（TODO）
- [ ] todo-1.1: 设计并创建 User 和 RefreshToken Entity（Prisma）
- [ ] todo-1.2: 实现 AuthModule（Controller/Service/Strategy）
- [ ] todo-1.3: 实现注册接口 POST /api/v1/auth/signup
- [ ] todo-1.4: 实现登录接口 POST /api/v1/auth/login
- [ ] todo-1.5: 实现 Token 刷新接口 POST /api/v1/auth/refresh
- [ ] todo-1.6: 实现登出接口 POST /api/v1/auth/logout
- [ ] todo-1.7: 实现 JWT 守卫和路由守卫
- [ ] todo-1.8: 前端封装 Axios 实例和 Token 拦截器
- [ ] todo-1.9: 前端实现登录页面和注册页面
- [ ] todo-1.10: 前端实现路由守卫和 Token 自动刷新

## 约束条件
- 使用 JWT Bearer Token 认证
- Token 有效期 Access Token 15分钟，Refresh Token 7天
- 密码必须 bcrypt 加密存储
- 前端 API 请求统一添加 Authorization Header

## 验收标准
### 功能验收
- [ ] 用户可使用邮箱密码注册账号
- [ ] 用户可登录获取 JWT Token
- [ ] 访问受保护接口需携带有效 Token
- [ ] Token 过期自动使用 Refresh Token 刷新
- [ ] 用户可登出并清除本地 Token

### 性能验收
| 指标 | 标准 |
|------|------|
| 登录响应时间 | < 500ms |

### 安全验收
- 密码加密存储（bcrypt cost 12）
- Token 不存储在 URL 中
- Refresh Token 仅用于刷新，不可用于 API 请求

## 测试标准
### 功能测试
- 注册接口 POST /api/v1/auth/signup 正常工作
- 登录接口 POST /api/v1/auth/login 返回 JWT
- 刷新接口 POST /api/v1/auth/refresh 正常刷新
- 登出接口 POST /api/v1/auth/logout 清除 Refresh Token
- 前端登录流程完整可用

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 并发登录100用户 | 全部成功，< 2秒 | loadtest |

### 安全测试
- 暴力破解防护：5次失败后锁定15分钟
- 密码强度校验：至少8位，包含数字和字母

## 测试验收流程
单元测试 → API 接口测试 → 前端集成测试 → Human Gate

## 涉及文件
- packages/backend/src/modules/auth/dto/signup.dto.ts
- packages/backend/src/modules/auth/dto/login.dto.ts
- packages/backend/src/modules/auth/entities/user.entity.ts
- packages/backend/src/modules/auth/auth.controller.ts
- packages/backend/src/modules/auth/auth.service.ts
- packages/backend/src/modules/auth/auth.module.ts
- packages/backend/src/modules/auth/strategies/jwt.strategy.ts
- packages/backend/src/modules/auth/guards/jwt-auth.guard.ts
- packages/backend/prisma/schema.prisma
- packages/frontend/src/utils/http.ts
- packages/frontend/src/stores/auth.ts
- packages/frontend/src/views/auth/Login.vue
- packages/frontend/src/views/auth/Register.vue
- packages/frontend/src/router/index.ts

## 前置依赖
step0 项目框架初始化

## 前置产出验证
- packages/backend/src/main.ts 存在且可启动
- packages/frontend/src/App.vue 存在
- Prisma 已安装并配置

## 风险提示
- **JWT Secret 泄露风险**: 使用 .env 存储，通过环境变量注入，永不硬编码
- **Refresh Token 被盗用**: Refresh Token 仅存储 hash 到数据库，设置短有效期

## 关联规范
- 角色：Backend Agent
- 关联规则：.cursor/rules/backend.mdc, .cursor/rules/security-rules.md
- 关联执行：.cursor/prompts/run-step.md
- 架构设计文档 - API 设计
- 架构设计文档 - 数据模型设计

## 里程碑映射
用户系统（Day 2）
