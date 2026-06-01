# Step 3: 数据模型管理 - 模型CRUD与指标定义

## 任务目标
数据模型管理 - 模型CRUD与指标定义

## 详细说明
实现数据模型（Model）和指标（Metric）的 CRUD 管理功能。前端使用 vxe-table 展示模型列表和指标列表。后端实现 ModelModule 和 MetricModule。模型包含名称、描述、配置等字段。指标是模型的子资源，包含名称、类型、计算公式等。实现树形结构的数据展示。

v1复用量：20%（CRUD 通用逻辑和表格组件封装可复用 v1）

技术方案：
1. 后端：ModelModule（模型管理）、MetricModule（指标管理）
2. Prisma Schema：Model、Metric、CellData 实体
3. 前端：ModelList.vue（模型列表）、ModelDetail.vue（模型详情）
4. 前端：MetricList.vue（指标列表）、MetricEditor.vue（指标编辑）
5. 封装 vxe-table 组件：BaseTable.vue
6. 实现模型配置（维度、度量、时间粒度等）
- v1复用量：20%
- 技术方案：复用 v1 的 CRUD 通用模板代码。Model 实体包含：id, name, description, ownerId, config(JSONB), createdAt, updatedAt。Metric 实体包含：id, modelId, name, type(财务/运营/自定义), formula, config(JSONB)。使用 vxe-grid 封装 BaseTable 组件，支持排序、筛选、分页。

## Out of Scope（当前 Step 不做的事情）
- 不实现模型复制功能（后续扩展）
- 不实现模型导入导出（Step 8 处理）
- 不实现指标计算公式（公式在 Step 5）
- 不实现单元格数据编辑（Step 4 基础，Step 5 公式）
- 不实现模型权限分享（后续扩展）
- 不实现模型收藏/关注（后续扩展）

## 执行任务（TODO）
- [ ] todo-3.1: 创建 Prisma Schema（Model, Metric 实体）
- [ ] todo-3.2: 执行 Prisma 迁移
- [ ] todo-3.3: 创建后端 ModelsModule
- [ ] todo-3.4: 创建后端 MetricsModule
- [ ] todo-3.5: 创建前端 BaseTable.vue（vxe-table 封装）
- [ ] todo-3.6: 创建前端 modelsApi.ts
- [ ] todo-3.7: 创建前端 views/models/ModelList.vue
- [ ] todo-3.8: 创建前端 views/models/ModelDetail.vue
- [ ] todo-3.9: 创建前端 views/models/MetricEditor.vue
- [ ] todo-3.10: 配置路由（/models, /models/:id）
- [ ] todo-3.11: 编写后端单元测试

## 约束条件
- API 路径使用复数名词（/api/v1/models, /api/v1/metrics）
- 禁止 kebab-case 文件命名
- 前端列表页使用 vxe-table 封装组件
- 后端遵循 NestJS 模块化结构
- 支持软删除（isDeleted 字段）
- 统一响应格式

## 验收标准
### 功能验收
- [ ] 模型列表可分页查询
- [ ] 模型创建成功并显示在列表
- [ ] 模型编辑保存成功
- [ ] 模型删除（软删除）成功
- [ ] 模型详情页显示指标列表
- [ ] 指标创建/编辑/删除正常
- [ ] vxe-table 排序、筛选、分页正常

### 性能验收
| 指标 | 标准 |
|------|------|
| 模型列表查询 | < 300ms |
| 大列表渲染（1000行） | < 1秒 |

### 安全验收
- 非模型所有者不可删除
- 输入校验防止 XSS
- SQL 注入防护（Prisma 参数化查询）

## 测试标准
### 功能测试
- 模型 CRUD 全流程测试
- 指标 CRUD 全流程测试
- 分页、排序、筛选功能测试
- 权限校验（非所有者不可删除）

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 列表查询 | < 300ms | JMeter |

### 安全测试
- SQL 注入测试（特殊字符输入）
- XSS 攻击测试

## 测试验收流程
1. 单元测试：测试 Model 和 Metric Service
2. 功能验证：Postman + 浏览器测试
3. Human Gate 验收：人工确认功能完整性
4. 签字确认：负责人确认后方可进入 Step 4

## 涉及文件
- packages/backend/prisma/schema.prisma
- packages/backend/src/modules/models/models.module.ts
- packages/backend/src/modules/models/models.controller.ts
- packages/backend/src/modules/models/models.service.ts
- packages/backend/src/modules/models/dto/create-model.dto.ts
- packages/backend/src/modules/models/dto/update-model.dto.ts
- packages/backend/src/modules/models/entities/model.entity.ts
- packages/backend/src/modules/metrics/metrics.module.ts
- packages/backend/src/modules/metrics/metrics.controller.ts
- packages/backend/src/modules/metrics/metrics.service.ts
- packages/backend/src/modules/metrics/dto/create-metric.dto.ts
- packages/backend/src/modules/metrics/entities/metric.entity.ts
- packages/frontend/src/components/common/BaseTable.vue
- packages/frontend/src/api/modelsApi.ts
- packages/frontend/src/api/metricsApi.ts
- packages/frontend/src/stores/modelsStore.ts
- packages/frontend/src/views/models/ModelList.vue
- packages/frontend/src/views/models/ModelDetail.vue
- packages/frontend/src/views/models/MetricEditor.vue
- packages/frontend/src/router/index.ts

## 前置依赖
Step 1（后端认证）、Step 2（前端认证）

## 前置产出验证
- 后端基础模块结构正常
- 前端路由守卫正常
- 认证流程可正常完成

## 风险提示
- **大模型列表查询性能问题**: 添加数据库索引，分页查询限制每页数量
- **vxe-table 内存占用过高**: 配置虚拟滚动，合理设置缓冲区

## 关联规范
- 角色：Fullstack Agent
- 关联规则：.cursor/rules/fullstack.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构文档 - 后端模块 - 模型管理服务
- 架构文档 - 前端模块 - 数据模型模块
- 架构文档 - API 设计 - 模型管理接口

## 里程碑映射
Day 9-12：完成数据模型管理
