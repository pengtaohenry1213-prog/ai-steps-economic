# Step 5: 实现指标管理功能（CRUD、树形结构、分类管理）

## 任务目标
实现指标管理功能（CRUD、树形结构、分类管理）

## 详细说明
实现指标定义的管理功能，支持指标的增删改查、父子层级关系（树形结构）、指标分类（财务/运营/自定义）、属性配置（单位、币种、格式化）。
- v1复用量：30%
- 技术方案：1. 设计 ModelMetric Entity（parentId 自关联）
2. 实现递归 CTE 查询树形结构
3. 实现指标分类（财务类/运营类/自定义类）
4. 前端使用 vxe-table 展示树形指标列表
5. 实现指标拖拽排序
6. 实现指标属性配置面板

## Out of Scope（当前 Step 不做的事情）
- 不实现指标计算公式（公式引擎 step）
- 不实现指标数据导入导出
- 不实现指标历史数据查询
- 不实现指标阈值告警

## 执行任务（TODO）
- [ ] todo-5.1: 设计 ModelMetric Entity（Prisma Schema）
- [ ] todo-5.2: 实现 MetricModule（Controller/Service）
- [ ] todo-5.3: 实现指标 CRUD 接口
- [ ] todo-5.4: 实现指标树形结构查询（递归 CTE）
- [ ] todo-5.5: 实现指标分类和属性配置接口
- [ ] todo-5.6: 前端实现指标列表页面（树形表格）
- [ ] todo-5.7: 前端实现指标创建/编辑面板
- [ ] todo-5.8: 前端实现指标拖拽排序
- [ ] todo-5.9: 前端实现指标属性配置（币种、单位、格式化）

## 约束条件
- 指标编码在同一版本内必须唯一
- 指标树最大深度 5 层
- 删除父指标需确认是否级联删除子指标
- 财务类指标必须关联币种和单位

## 验收标准
### 功能验收
- [ ] 用户可在版本下创建指标
- [ ] 用户可查看指标树形结构
- [ ] 用户可编辑指标属性
- [ ] 用户可删除指标（支持级联）
- [ ] 财务类指标配置币种和单位

### 性能验收
| 指标 | 标准 |
|------|------|
| 获取1000个指标树 | < 500ms |

### 安全验收
- 只有版本 owner 或 editor 可修改指标
- viewer 仅可查看
- 指标编码不可重复

## 测试标准
### 功能测试
- 指标 CRUD 接口正常工作
- 树形结构查询返回正确层级
- 父子关系创建和变更正常
- 财务类指标必须配置币种
- 删除父指标提示确认

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 1000个指标树渲染 | < 1秒 | undefined |

### 安全测试
- 重复指标编码测试应返回错误
- 越权修改测试返回 403

## 测试验收流程
单元测试 → 功能验证 → 前端集成测试 → Human Gate

## 涉及文件
- packages/backend/prisma/schema.prisma
- packages/backend/src/modules/metric/dto/create-metric.dto.ts
- packages/backend/src/modules/metric/dto/update-metric.dto.ts
- packages/backend/src/modules/metric/entities/metric.entity.ts
- packages/backend/src/modules/metric/metric.controller.ts
- packages/backend/src/modules/metric/metric.service.ts
- packages/backend/src/modules/metric/metric.module.ts
- packages/frontend/src/views/models/components/MetricTree.vue
- packages/frontend/src/views/models/components/MetricPanel.vue
- packages/frontend/src/api/metrics.ts

## 前置依赖
step4 版本控制系统

## 前置产出验证
- 版本功能正常工作
- 用户可在模型下操作

## 风险提示
- **深层嵌套指标树导致性能问题**: 限制最大深度5层，递归查询添加超时限制
- **循环引用导致树查询死循环**: 数据库层添加 parentId ≠ id 约束，递归查询设置最大深度

## 关联规范
- 角色：Backend Agent
- 关联规则：.cursor/rules/backend.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构设计文档 - API 设计 - 指标管理
- 架构设计文档 - 数据模型设计 - 指标定义

## 里程碑映射
核心功能（Day 5-6）
