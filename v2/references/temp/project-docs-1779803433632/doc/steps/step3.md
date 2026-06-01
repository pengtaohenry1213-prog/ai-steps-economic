# Step 3: 实现数据模型管理 CRUD（创建、查询、更新、删除、列表）

## 任务目标
实现数据模型管理 CRUD（创建、查询、更新、删除、列表）

## 详细说明
实现数据模型（DataModel）的完整 CRUD 功能，包括模型创建、详情查询、列表分页、条件筛选、软删除。配置 Prisma Schema，关联用户和版本信息。
- v1复用量：25%
- 技术方案：1. 设计 DataModel Entity，包含 name、description、status、ownerId
2. 实现 DataModelModule（Controller/Service/Repository）
3. 实现分页查询（cursor-based）
4. 实现软删除（isDeleted + deletedAt）
5. 前端实现模型列表页（vxe-table）、模型创建/编辑弹窗
6. 实现模型详情页基础布局

## Out of Scope（当前 Step 不做的事情）
- 不实现模型版本管理（独立 step）
- 不实现模型复制/导入/导出
- 不实现模型模板功能
- 不实现模型分享功能

## 执行任务（TODO）
- [ ] todo-3.1: 设计 DataModel Entity 和 Prisma Schema
- [ ] todo-3.2: 实现 DataModelModule（Controller/Service/Repository）
- [ ] todo-3.3: 实现创建模型接口 POST /api/v1/models
- [ ] todo-3.4: 实现查询模型列表接口 GET /api/v1/models
- [ ] todo-3.5: 实现获取模型详情接口 GET /api/v1/models/:id
- [ ] todo-3.6: 实现更新模型接口 PATCH /api/v1/models/:id
- [ ] todo-3.7: 实现删除模型接口 DELETE /api/v1/models/:id
- [ ] todo-3.8: 前端实现模型列表页面（vxe-table）
- [ ] todo-3.9: 前端实现模型创建/编辑弹窗
- [ ] todo-3.10: 前端实现模型详情页基础布局

## 约束条件
- 模型名称唯一性：同一用户下不可重名
- 软删除：数据不真正删除，仅标记
- 列表必须支持分页和排序
- 响应格式统一 {data, error, meta}

## 验收标准
### 功能验收
- [ ] 用户可创建新的数据模型
- [ ] 用户可查看自己的模型列表（分页）
- [ ] 用户可编辑模型名称和描述
- [ ] 用户可软删除自己的模型
- [ ] 支持按名称/状态/创建时间筛选

### 性能验收
| 指标 | 标准 |
|------|------|
| 模型列表查询（100条） | < 200ms |

### 安全验收
- 用户只能访问自己的模型
- 模型 owner 可执行删除操作
- 软删除数据可通过后台恢复

## 测试标准
### 功能测试
- 创建模型接口正常工作
- 列表查询接口返回正确分页数据
- 更新模型接口正确保存变更
- 删除模型接口执行软删除
- 筛选和排序功能正常

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 1000个模型的分页查询 | < 300ms | undefined |

### 安全测试
- 跨用户数据隔离测试
- 未授权访问返回 404（不暴露存在性）

## 测试验收流程
单元测试 → API 接口测试 → 前端功能测试 → Human Gate

## 涉及文件
- packages/backend/prisma/schema.prisma
- packages/backend/src/modules/datamodel/dto/create-datamodel.dto.ts
- packages/backend/src/modules/datamodel/dto/update-datamodel.dto.ts
- packages/backend/src/modules/datamodel/entities/datamodel.entity.ts
- packages/backend/src/modules/datamodel/datamodel.controller.ts
- packages/backend/src/modules/datamodel/datamodel.service.ts
- packages/backend/src/modules/datamodel/datamodel.module.ts
- packages/frontend/src/views/models/ModelList.vue
- packages/frontend/src/views/models/ModelDetail.vue
- packages/frontend/src/api/models.ts
- packages/frontend/src/stores/models.ts

## 前置依赖
step2 角色权限系统

## 前置产出验证
- RBAC 系统正常工作
- 用户权限校验正常

## 风险提示
- **模型名称唯一性校验的并发问题**: 数据库层添加唯一约束，前端做乐观锁提示
- **软删除数据积累导致性能下降**: 定期清理超过30天的软删除数据

## 关联规范
- 角色：Backend Agent
- 关联规则：.cursor/rules/backend.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构设计文档 - API 设计 - 数据模型
- 架构设计文档 - 数据模型设计

## 里程碑映射
核心功能（Day 3-4）
