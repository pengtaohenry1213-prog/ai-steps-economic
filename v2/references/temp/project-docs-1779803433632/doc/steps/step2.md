# Step 2: 实现角色权限系统（RBAC）支持数据模型访问控制

## 任务目标
实现角色权限系统（RBAC）支持数据模型访问控制

## 详细说明
实现基于角色的访问控制（RBAC）系统，支持用户角色分配、角色权限管理、页面权限控制、后端接口权限校验。角色包括管理员、编辑者、查看者，权限细化到数据模型粒度。
- v1复用量：20%
- 技术方案：1. Prisma 设计 Role、Permission、UserRole 实体
2. 实现 RolesModule 和 PermissionsModule
3. 使用 @nestjs/casl 实现声明式权限校验
4. 前端实现角色管理和权限分配界面
5. 路由守卫结合角色信息控制页面访问
6. API 守卫校验用户对特定数据模型的操作权限

## Out of Scope（当前 Step 不做的事情）
- 不支持组织/团队概念
- 不支持细粒度到指标/单元格的权限控制
- 不支持权限审批流程
- 不支持自定义权限集

## 执行任务（TODO）
- [ ] todo-2.1: 设计 Role、Permission、UserRole Entity
- [ ] todo-2.2: 实现 RolesModule 和 PermissionsModule
- [ ] todo-2.3: 实现 @nestjs/casl 权限策略
- [ ] todo-2.4: 实现角色管理接口 CRUD
- [ ] todo-2.5: 实现用户角色关联管理接口
- [ ] todo-2.6: 实现数据模型权限校验守卫
- [ ] todo-2.7: 前端实现角色管理页面
- [ ] todo-2.8: 前端实现用户角色分配功能
- [ ] todo-2.9: 前端实现基于角色的 UI 权限控制

## 约束条件
- 权限校验必须服务端执行，前端仅作体验优化
- 内置角色不可删除：admin、editor、viewer
- 用户创建时默认赋予 viewer 角色
- 数据模型创建者自动成为该模型的 admin

## 验收标准
### 功能验收
- [ ] 管理员可创建/编辑/删除角色
- [ ] 管理员可为用户分配角色
- [ ] 用户根据角色获得对应操作权限
- [ ] 无权限用户无法访问受保护接口
- [ ] 数据模型拥有者可授予其他用户访问权限

### 性能验收
| 指标 | 标准 |
|------|------|
| 权限校验响应时间 | < 50ms |

### 安全验收
- 超级管理员角色不可删除
- 权限校验失败返回 403 Forbidden
- 用户无法自行修改自身角色

## 测试标准
### 功能测试
- 角色 CRUD 接口正常工作
- 权限分配功能正常
- 无权限访问受保护接口返回 403
- 前端页面根据角色显示/隐藏功能

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 批量权限检查1000次 | < 100ms | undefined |

### 安全测试
- 越权操作测试：viewer 不能编辑数据
- 角色劫持测试：不能赋予不存在角色

## 测试验收流程
单元测试 → 权限链路测试 → 前端集成测试 → Human Gate

## 涉及文件
- packages/backend/prisma/schema.prisma
- packages/backend/src/modules/rbac/entities/role.entity.ts
- packages/backend/src/modules/rbac/entities/permission.entity.ts
- packages/backend/src/modules/rbac/rbac.controller.ts
- packages/backend/src/modules/rbac/rbac.service.ts
- packages/backend/src/modules/rbac/rbac.module.ts
- packages/backend/src/modules/rbac/guards/model-access.guard.ts
- packages/frontend/src/views/system/Roles.vue
- packages/frontend/src/views/system/Users.vue
- packages/frontend/src/stores/permissions.ts

## 前置依赖
step1 用户认证系统

## 前置产出验证
- 认证接口正常工作
- User Entity 存在
- JWT 认证流程正常

## 风险提示
- **权限缓存导致的数据不一致**: 用户权限变更时立即刷新缓存，设置短缓存 TTL
- **越权漏洞**: 每个 API 接口显式声明所需权限，守卫统一校验

## 关联规范
- 角色：Backend Agent
- 关联规则：.cursor/rules/backend.mdc, .cursor/rules/security-rules.md
- 关联执行：.cursor/prompts/run-step.md
- 架构设计文档 - 数据模型设计 - 角色权限

## 里程碑映射
用户系统（Day 2-3）
