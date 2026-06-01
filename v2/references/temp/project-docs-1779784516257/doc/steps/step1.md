# Step 1: 后端基础设施 - 数据库连接与认证模块

## 任务目标
后端基础设施 - 数据库连接与认证模块

## 详细说明
配置 Prisma ORM 连接 PostgreSQL 数据库，设计用户、角色、权限相关的数据模型。实现 JWT 认证流程，包括用户注册、登录、Token 刷新、登出功能。实现 RBAC 权限控制基础架构。配置 NestJS 守卫（Guards）和装饰器进行接口权限校验。

v1复用量：15%（认证流程和 JWT 处理逻辑可参考 v1 实现）

技术方案：
1. 配置 Prisma Schema：User、Role、Permission、RefreshToken 实体
2. 实现 AuthModule：注册、登录、Token刷新、登出接口
3. 实现 JWT Service：Token 生成与验证
4. 实现 RolesModule：角色与权限管理
5. 实现守卫：JwtAuthGuard、RolesGuard
6. 实现装饰器：@Public、@Roles、@CurrentUser
7. 配置 Swagger 文档注解
- v1复用量：15%
- 技术方案：复用 v1 的 JWT 认证流程设计。Prisma Schema 采用 PostgreSQL，主要字段：User（id, email, password, name, createdAt）、Role（id, name, code）、Permission（id, resource, action）、UserRole、RolePermission 多对多关系。JWT AccessToken 有效期 15 分钟，RefreshToken 有效期 7 天，存储在 HTTP Only Cookie 中。

## Out of Scope（当前 Step 不做的事情）
- 不实现 OAuth 第三方登录（后续扩展）
- 不实现 MFA 多因素认证（后续扩展）
- 不实现社交账号注册（后续扩展）
- 不实现邮件验证功能（后续扩展）
- 不实现权限的细粒度 CRUD（仅基础 RBAC）

## 执行任务（TODO）
- [ ] todo-1.1: 配置 Prisma Schema（User, Role, Permission 实体）
- [ ] todo-1.2: 创建 Prisma Service 和 Database Module
- [ ] todo-1.3: 实现 UsersModule 和 UsersService
- [ ] todo-1.4: 实现 AuthModule（注册、登录、Token刷新、登出）
- [ ] todo-1.5: 实现 JWT Service 和 Token 管理
- [ ] todo-1.6: 实现 JwtAuthGuard 和 RolesGuard 守卫
- [ ] todo-1.7: 实现 @Public、@Roles、@CurrentUser 装饰器
- [ ] todo-1.8: 配置 Swagger 文档和 API 注解
- [ ] todo-1.9: 编写单元测试用例
- [ ] todo-1.10: 执行数据库迁移（prisma migrate dev）

## 约束条件
- 密码必须 bcrypt 加密（cost factor >= 12）
- JWT Secret 必须从环境变量读取
- RefreshToken 存储在数据库，支持撤销
- 接口遵循 RESTful 规范（/api/v1/auth/*）
- 统一响应格式 {code, message, data}
- 错误码遵循分类编码规范

## 验收标准
### 功能验收
- [ ] POST /api/v1/auth/register 可创建用户并返回 JWT
- [ ] POST /api/v1/auth/login 可验证凭证并返回 JWT
- [ ] POST /api/v1/auth/refresh 可刷新 AccessToken
- [ ] POST /api/v1/auth/logout 可撤销 RefreshToken
- [ ] 受保护接口无 Token 返回 401
- [ ] 过期 Token 返回 401
- [ ] 角色权限校验正常生效

### 性能验收
| 指标 | 标准 |
|------|------|
| 登录响应时间 | < 200ms |
| Token 验证时间 | < 10ms |

### 安全验收
- 密码加密存储，不可逆
- Token 使用 HTTPS 传输
- RefreshToken 支持单点登出
- 防止暴力破解（登录限流）

## 测试标准
### 功能测试
- 用户注册成功并收到 JWT
- 错误密码登录失败
- Token 过期后无法访问受保护接口
- RefreshToken 可正常刷新
- 登出后 RefreshToken 失效

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 登录接口 | < 200ms | 压力测试 100 并发 |

### 安全测试
- 密码数据库存储为 hash（非明文）
- JWT payload 不包含敏感信息
- Rate limiting 生效

## 测试验收流程
1. 单元测试：执行 pnpm --filter backend test 验证认证逻辑
2. 功能验证：Postman/curl 测试各接口
3. Human Gate 验收：人工确认认证流程正常
4. 签字确认：负责人确认后方可进入 Step 2

## 涉及文件
- packages/backend/prisma/schema.prisma
- packages/backend/src/modules/auth/auth.module.ts
- packages/backend/src/modules/auth/auth.controller.ts
- packages/backend/src/modules/auth/auth.service.ts
- packages/backend/src/modules/auth/dto/auth.dto.ts
- packages/backend/src/modules/users/users.module.ts
- packages/backend/src/modules/users/users.service.ts
- packages/backend/src/modules/users/entities/user.entity.ts
- packages/backend/src/modules/roles/roles.module.ts
- packages/backend/src/modules/roles/roles.service.ts
- packages/backend/src/modules/roles/entities/role.entity.ts
- packages/backend/src/common/guards/jwt-auth.guard.ts
- packages/backend/src/common/guards/roles.guard.ts
- packages/backend/src/common/decorators/public.decorator.ts
- packages/backend/src/common/decorators/roles.decorator.ts
- packages/backend/src/common/decorators/current-user.decorator.ts
- packages/backend/src/common/services/jwt.service.ts
- packages/shared/src/types/auth.types.ts

## 前置依赖
Step 0（项目框架初始化）

## 前置产出验证
- packages/backend 目录结构存在
- tsconfig.json 配置正确
- package.json 包含必要依赖（@nestjs/*, @prisma/client, jsonwebtoken, bcrypt）

## 风险提示
- **JWT Secret 泄露风险**: 使用强随机字符串作为 JWT Secret，定期轮换，存储在环境变量中
- **数据库连接池耗尽**: 配置合理的连接池大小，设置超时时间和重试机制

## 关联规范
- 角色：Backend Agent
- 关联规则：.cursor/rules/backend.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构文档 - 后端模块 - 用户认证与权限
- 架构文档 - API 设计 - 认证授权接口
- 架构文档 - 数据模型设计 - 核心实体
- 后端规范 backend-nestjs.mdc

## 里程碑映射
Day 3-5：完成后端认证授权模块
