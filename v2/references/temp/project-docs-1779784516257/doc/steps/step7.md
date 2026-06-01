# Step 7: 导入导出功能 - Excel解析与文件处理

## 任务目标
导入导出功能 - Excel解析与文件处理

## 详细说明
实现 Excel 导入导出功能。导入支持 .xlsx、.xls、.csv 格式，解析并转换为内部数据模型。导出支持将模型数据导出为 Excel。实现文件上传、格式检测、数据预览、导入确认流程。集成 xlsx 库进行文件解析和生成。

v1复用量：20%（文件解析逻辑和导入流程可复用 v1）

技术方案：
1. 使用 xlsx 库进行文件解析
2. 实现 FileModule 和 FileService
3. 实现文件上传（支持大文件分片上传）
4. 实现数据预览（返回前 100 行）
5. 实现导入确认（批量插入）
6. 实现导出生成（流式输出）
7. 前端 ImportWizard.vue（多步骤导入向导）
- v1复用量：20%
- 技术方案：文件上传使用 multipart/form-data，支持最大 50MB。解析使用 xlsx.parse，获取 Sheet 数据转换为 JSON 数组。导入分两步：1）upload 返回 fileId 和预览数据；2）confirm 执行实际导入。导出使用 xlsx.make_workbook，生成后流式下载。

## Out of Scope（当前 Step 不做的事情）
- 不实现实时导入进度（后续扩展）
- 不实现导入模板管理（后续扩展）
- 不实现导入历史记录（后续扩展）
- 不实现导出格式自定义（仅 Excel）
- 不实现大文件异步导入（后续扩展）

## 执行任务（TODO）
- [ ] todo-7.1: 安装 xlsx、multer 包
- [ ] todo-7.2: 创建 FileModule
- [ ] todo-7.3: 实现文件上传接口
- [ ] todo-7.4: 实现 Excel 解析逻辑
- [ ] todo-7.5: 实现数据预览接口
- [ ] todo-7.6: 实现导入确认逻辑
- [ ] todo-7.7: 实现导出生成逻辑
- [ ] todo-7.8: 创建前端 ImportWizard.vue
- [ ] todo-7.9: 创建前端 ExportDialog.vue
- [ ] todo-7.10: 编写单元测试

## 约束条件
- 导入文件最大 50MB
- 导入超时 < 60秒（超时则异步处理）
- 导出文件命名规范（模型名_版本_时间戳.xlsx）
- 支持 UTF-8 编码
- CSV 解析处理 BOM 和换行符

## 验收标准
### 功能验收
- [ ] 支持 .xlsx、.xls、.csv 格式
- [ ] 文件上传进度显示
- [ ] 导入预览显示数据
- [ ] 导入确认后数据正确
- [ ] 导出文件可正常打开
- [ ] 格式检测自动识别

### 性能验收
| 指标 | 标准 |
|------|------|
| 10MB 文件解析 | < 5秒 |
| 导出 10000 行 | < 3秒 |

### 安全验收
- 文件类型白名单校验
- 文件名过滤特殊字符
- 防止 zip 炸弹攻击

## 测试标准
### 功能测试
- 各种格式文件导入测试
- 大文件导入测试
- 特殊字符文件名测试
- 导出文件与 Excel 对比

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 文件解析性能 | 符合上述标准 | undefined |

### 安全测试
- 恶意文件上传测试
- 文件名注入测试

## 测试验收流程
1. 单元测试：文件解析逻辑测试
2. 功能验证：完整导入导出流程测试
3. Human Gate 验收：人工确认
4. 签字确认：负责人确认后方可进入 Step 8

## 涉及文件
- packages/backend/src/modules/files/files.module.ts
- packages/backend/src/modules/files/files.controller.ts
- packages/backend/src/modules/files/files.service.ts
- packages/backend/src/modules/files/excel-parser.ts
- packages/backend/src/modules/files/excel-exporter.ts
- packages/backend/src/modules/files/entities/uploaded-file.entity.ts
- packages/frontend/src/components/import/ImportWizard.vue
- packages/frontend/src/components/export/ExportDialog.vue
- packages/frontend/src/api/filesApi.ts

## 前置依赖
Step 6（AI 能力服务）

## 前置产出验证
- 模型管理功能已完成
- AI 功能界面已集成

## 风险提示
- **大文件导致内存溢出**: 使用流式解析，设置文件大小限制，分片处理
- **恶意文件导致服务崩溃**: 文件类型白名单，文件名严格校验，内容扫描

## 关联规范
- 角色：Fullstack Agent
- 关联规则：.cursor/rules/fullstack.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构文档 - 后端模块 - 文件处理服务
- 架构文档 - 前端模块 - 导入导出模块
- 架构文档 - API 设计 - 导入导出接口

## 里程碑映射
Day 26-28：完成导入导出功能
