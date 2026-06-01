# Step 4: 实现数据模型版本控制系统（创建、发布、回滚、状态流转）

## 任务目标
实现数据模型版本控制系统（创建、发布、回滚、状态流转）

## 详细说明
实现数据模型的版本控制功能，支持创建草稿版本、发布版本、变更版本状态（草稿/发布/归档）、版本回滚。版本与指标、单元格、公式关联，形成完整的版本快照。
- v1复用量：20%
- 技术方案：1. 设计 DataModelVersion Entity，关联 datamodelId
2. 实现版本状态机：draft → published → archived
3. 实现版本创建接口（基于当前版本克隆）
4. 实现版本回滚（复制历史版本到新版本）
5. 前端实现版本列表和状态切换
6. 配合 Prisma Transaction 保证版本数据一致性

## Out of Scope（当前 Step 不做的事情）
- 不实现版本对比功能（diff）
- 不实现版本分支/合并
- 不实现版本评论/批注
- 不实现自动版本保存

## 执行任务（TODO）
- [ ] todo-4.1: 设计 DataModelVersion Entity（Prisma Schema）
- [ ] todo-4.2: 实现 VersionModule（Controller/Service）
- [ ] todo-4.3: 实现版本状态机逻辑
- [ ] todo-4.4: 实现创建版本接口 POST /api/v1/models/:id/versions
- [ ] todo-4.5: 实现版本状态变更接口 PATCH /api/v1/models/:id/versions/:vid/status
- [ ] todo-4.6: 实现版本回滚接口 POST /api/v1/models/:id/versions/:vid/rollback
- [ ] todo-4.7: 前端实现版本列表组件
- [ ] todo-4.8: 前端实现版本切换功能
- [ ] todo-4.9: 前端实现版本发布/归档操作

## 约束条件
- 每个模型最多保留 10 个版本（超出自动归档最旧版本）
- 发布状态的版本不可直接编辑
- 回滚操作生成新版本，不覆盖历史
- 版本状态变更需记录操作日志

## 验收标准
### 功能验收
- [ ] 用户可在模型下创建新版本（草稿状态）
- [ ] 用户可将草稿版本发布
- [ ] 用户可将发布版本归档
- [ ] 用户可执行版本回滚
- [ ] 版本列表显示版本号、状态、创建时间

### 性能验收
| 指标 | 标准 |
|------|------|
| 版本回滚操作 | < 2秒 |

### 安全验收
- 只有模型 owner 或 admin 可发布/归档版本
- 归档版本不可回滚
- 版本操作记录可审计

## 测试标准
### 功能测试
- 创建版本接口正常工作
- 发布版本接口正确变更状态
- 归档版本接口正确变更状态
- 回滚操作生成新版本且数据正确
- 版本限制规则生效

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 创建版本（1000个指标） | < 3秒 | undefined |

### 安全测试
- 非 owner 发布测试应返回 403
- 并发发布冲突测试

## 测试验收流程
单元测试 → 状态流转测试 → 前端集成测试 → Human Gate

## 涉及文件
- packages/backend/prisma/schema.prisma
- packages/backend/src/modules/version/dto/create-version.dto.ts
- packages/backend/src/modules/version/dto/update-version-status.dto.ts
- packages/backend/src/modules/version/entities/version.entity.ts
- packages/backend/src/modules/version/version.controller.ts
- packages/backend/src/modules/version/version.service.ts
- packages/backend/src/modules/version/version.module.ts
- packages/frontend/src/views/models/components/VersionList.vue
- packages/frontend/src/views/models/ModelDetail.vue

## 前置依赖
step3 数据模型管理

## 前置产出验证
- DataModel CRUD 正常
- 模型详情页可访问

## 风险提示
- **版本回滚数据不一致**: 使用 Prisma Transaction 确保指标、单元格、公式原子性克隆
- **版本号冲突**: 使用 UUID + 版本序号组合，序号由数据库原子操作生成

## 关联规范
- 角色：Backend Agent
- 关联规则：.cursor/rules/backend.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构设计文档 - 版本控制 API
- 架构设计文档 - 数据模型设计 - 版本关系

## 里程碑映射
核心功能（Day 4-5）
