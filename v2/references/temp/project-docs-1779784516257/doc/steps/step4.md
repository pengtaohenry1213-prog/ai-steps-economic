# Step 4: 版本控制 - 版本历史与回滚机制

## 任务目标
版本控制 - 版本历史与回滚机制

## 详细说明
实现模型版本控制功能。版本（Version）是模型的快照，包含创建时间戳、描述、状态（草稿/已发布）。实现版本历史查看、版本对比、版本切换、版本回滚功能。版本数据存储单元格快照。

v1复用量：15%（版本控制流程逻辑可参考 v1）

技术方案：
1. Prisma Schema：Version 实体（包含 snapshot JSONB）
2. 后端 VersionModule：历史查询、创建快照、切换版本
3. 版本对比 API：返回两个版本的差异
4. 前端 VersionPanel.vue：版本列表、对比视图
5. 使用 diff 库实现版本差异高亮
- v1复用量：15%
- 技术方案：Version 实体包含：id, modelId, versionNumber, description, snapshot(JSONB), status, createdBy。版本快照使用 PostgreSQL JSONB 存储完整的单元格数据。版本对比使用 deep-diff 算法计算差异，返回 {added, removed, modified} 三类变更。

## Out of Scope（当前 Step 不做的事情）
- 不实现版本分支功能（后续扩展）
- 不实现版本协作冲突处理（Step 7 处理）
- 不实现自动版本保存（仅手动保存快照）
- 不实现版本标签/备注编辑（后续扩展）
- 不实现版本发布审批流程（后续扩展）

## 执行任务（TODO）
- [ ] todo-4.1: 创建 Prisma Schema（Version 实体）
- [ ] todo-4.2: 执行 Prisma 迁移
- [ ] todo-4.3: 创建后端 VersionsModule
- [ ] todo-4.4: 实现版本对比算法
- [ ] todo-4.5: 创建前端 versionsApi.ts
- [ ] todo-4.6: 创建前端 VersionPanel.vue
- [ ] todo-4.7: 创建前端 VersionCompare.vue（对比视图）
- [ ] todo-4.8: 集成到 ModelDetail.vue
- [ ] todo-4.9: 编写单元测试

## 约束条件
- 版本号自增不可重复
- 快照数据大小限制（建议 < 10MB）
- 版本切换需确认（不可逆操作提示）
- API 遵循 RESTful 规范

## 验收标准
### 功能验收
- [ ] 模型详情页显示版本列表
- [ ] 可创建新的版本快照
- [ ] 可查看版本详情
- [ ] 可切换到历史版本
- [ ] 版本对比显示差异高亮
- [ ] 版本创建成功后自动切换

### 性能验收
| 指标 | 标准 |
|------|------|
| 版本快照创建 | < 2秒 |
| 版本列表查询 | < 300ms |

### 安全验收
- 非所有者不可创建/切换版本
- 版本操作需校验权限

## 测试标准
### 功能测试
- 版本创建并保存成功
- 版本切换后数据正确
- 版本对比差异显示正确
- 权限校验生效

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 10MB 快照保存 | < 2秒 | undefined |

### 安全测试
- 未授权用户无法操作版本

## 测试验收流程
1. 单元测试：版本 Service 逻辑测试
2. 功能验证：完整版本流程测试
3. Human Gate 验收：人工确认
4. 签字确认：负责人确认后方可进入 Step 5

## 涉及文件
- packages/backend/prisma/schema.prisma
- packages/backend/src/modules/versions/versions.module.ts
- packages/backend/src/modules/versions/versions.controller.ts
- packages/backend/src/modules/versions/versions.service.ts
- packages/backend/src/modules/versions/dto/create-version.dto.ts
- packages/backend/src/modules/versions/entities/version.entity.ts
- packages/frontend/src/api/versionsApi.ts
- packages/frontend/src/components/version/VersionPanel.vue
- packages/frontend/src/components/version/VersionCompare.vue
- packages/frontend/src/views/models/ModelDetail.vue

## 前置依赖
Step 3（数据模型管理）

## 前置产出验证
- Model CRUD 功能已完成
- ModelDetail.vue 页面已创建

## 风险提示
- **大版本快照占用存储过多**: 实现快照压缩，限制最大版本数（自动清理旧版本）
- **版本切换后数据丢失风险**: 切换前提示确认，保留最近 3 个版本的完整备份

## 关联规范
- 角色：Fullstack Agent
- 关联规则：.cursor/rules/fullstack.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构文档 - 后端模块 - 模型管理服务
- 架构文档 - API 设计 - 版本控制接口

## 里程碑映射
Day 13-15：完成版本控制
