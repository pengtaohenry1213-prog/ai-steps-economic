# Step 6: 实现单元格数据操作（CRUD、批量更新、行列操作）

## 任务目标
实现单元格数据操作（CRUD、批量更新、行列操作）

## 详细说明
实现单元格数据的管理功能，支持按行列坐标读写数据、批量更新单元格、单元格属性配置（数据类型、格式化）。数据以行为单位存储，每行包含该行的所有指标值。
- v1复用量：25%
- 技术方案：1. 设计 DataEntry Entity（versionId + rowId + columnId + value）
2. 使用 JSONB 存储行数据（rowData）
3. 实现行列坐标系统
4. 实现批量更新接口（支持事务）
5. 前端使用 vxe-grid 渲染表格
6. 实现虚拟滚动处理大数据量
7. 实现单元格选中、复制、粘贴

## Out of Scope（当前 Step 不做的事情）
- 不实现公式计算（公式引擎 step）
- 不实现单元格合并
- 不实现条件格式化
- 不实现数据验证规则

## 执行任务（TODO）
- [ ] todo-6.1: 设计 DataEntry Entity（Prisma Schema）
- [ ] todo-6.2: 实现 CellModule（Controller/Service）
- [ ] todo-6.3: 实现获取单元格接口 GET /api/v1/models/:id/cells
- [ ] todo-6.4: 实现更新单元格接口 PATCH /api/v1/models/:id/cells
- [ ] todo-6.5: 实现批量更新单元格接口 POST /api/v1/models/:id/cells/batch
- [ ] todo-6.6: 前端实现 vxe-grid 表格组件
- [ ] todo-6.7: 前端实现虚拟滚动支持
- [ ] todo-6.8: 前端实现单元格选中、复制、粘贴
- [ ] todo-6.9: 前端实现行列操作（添加、删除、重命名）

## 约束条件
- 单次批量更新最多 1000 个单元格
- 单元格值类型支持：number/string/date/boolean
- 行号和列号从 1 开始编号
- 批量操作使用事务保证原子性

## 验收标准
### 功能验收
- [ ] 用户可按行列坐标读取单元格值
- [ ] 用户可批量更新多个单元格
- [ ] 用户可添加/删除行
- [ ] 用户可重命名列标题
- [ ] 支持复制整行数据

### 性能验收
| 指标 | 标准 |
|------|------|
| 批量更新1000个单元格 | < 500ms |

### 安全验收
- 只允许更新当前版本的数据
- 批量操作校验数据权限
- 超出限制的操作返回错误

## 测试标准
### 功能测试
- 单元格 CRUD 接口正常工作
- 批量更新接口正确保存数据
- 行列操作正常工作
- 虚拟滚动正常渲染大数据量
- 复制粘贴功能正常

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 渲染10000行x100列 | < 2秒 | performance.mark |

### 安全测试
- 跨版本数据隔离测试
- 越权批量修改测试返回 403

## 测试验收流程
单元测试 → 性能测试 → 前端集成测试 → Human Gate

## 涉及文件
- packages/backend/prisma/schema.prisma
- packages/backend/src/modules/cell/dto/update-cell.dto.ts
- packages/backend/src/modules/cell/dto/batch-update-cell.dto.ts
- packages/backend/src/modules/cell/entities/cell.entity.ts
- packages/backend/src/modules/cell/cell.controller.ts
- packages/backend/src/modules/cell/cell.service.ts
- packages/backend/src/modules/cell/cell.module.ts
- packages/frontend/src/views/models/components/DataGrid.vue
- packages/frontend/src/components/common/VxeGridTable.vue
- packages/frontend/src/stores/grid.ts

## 前置依赖
step5 指标管理功能

## 前置产出验证
- 指标树正常显示
- 指标可编辑保存

## 风险提示
- **大量单元格数据导致数据库查询慢**: 使用分页加载 + 虚拟滚动，仅加载可视区域数据
- **并发编辑冲突**: 实现乐观锁，编辑前检测版本号，冲突时提示用户

## 关联规范
- 角色：Backend Agent
- 关联规则：.cursor/rules/backend.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构设计文档 - API 设计 - 单元格
- 架构设计文档 - 数据模型设计 - 单元格数据

## 里程碑映射
核心功能（Day 6-7）
