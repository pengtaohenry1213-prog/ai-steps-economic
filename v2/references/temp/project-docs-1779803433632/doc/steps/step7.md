# Step 7: 实现公式引擎（HyperFormula 集成、常用财务函数）

## 任务目标
实现公式引擎（HyperFormula 集成、常用财务函数）

## 详细说明
集成 HyperFormula 公式引擎，实现 Excel 兼容的公式计算功能。定义公式语法、支持常用财务函数（NPV、IRR、XNPV等）、公式调试、循环引用检测。
- v1复用量：40%
- 技术方案：1. 安装 hyperformula npm 包
2. 设计 ModelFormula Entity（formulaText + sheetId + cellRange）
3. 实现 HyperFormula 封装类（初始化、公式注册、计算）
4. 实现财务函数库（XNPV、IRR、MIRR、CUMIPMT等）
5. 实现公式解析和依赖追踪
6. 实现公式计算接口（支持异步计算）
7. 前端实现公式编辑器和公式调试面板

## Out of Scope（当前 Step 不做的事情）
- 不支持 VBA 脚本
- 不支持自定义函数注册
- 不支持图表
- 不支持条件格式化公式

## 执行任务（TODO）
- [ ] todo-7.1: 安装 hyperformula 并创建封装类
- [ ] todo-7.2: 设计 ModelFormula Entity（Prisma Schema）
- [ ] todo-7.3: 实现 FormulaModule（Controller/Service）
- [ ] todo-7.4: 实现财务函数库（XNPV、IRR、MIRR、CUMIPMT等）
- [ ] todo-7.5: 实现公式 CRUD 接口
- [ ] todo-7.6: 实现公式计算接口 POST /api/v1/models/:id/formulas/calculate
- [ ] todo-7.7: 实现公式调试接口 POST /api/v1/models/:id/formulas/debug
- [ ] todo-7.8: 前端实现公式编辑器组件
- [ ] todo-7.9: 前端实现公式调试面板
- [ ] todo-7.10: 前端实现公式自动计算和依赖追踪

## 约束条件
- 公式必须以 = 开头
- 最大公式长度 1000 字符
- 单个单元格最多引用 100 个其他单元格
- 循环引用检测到则报错不计算

## 验收标准
### 功能验收
- [ ] 用户可在单元格输入 Excel 风格公式
- [ ] 公式自动计算并显示结果
- [ ] 公式依赖变更时自动重算
- [ ] 支持常用财务函数（NPV、IRR、XNPV等）
- [ ] 公式错误时显示错误信息和调试信息

### 性能验收
| 指标 | 标准 |
|------|------|
| 1000个公式全量计算 | < 3秒 |

### 安全验收
- 公式不能执行系统命令
- 公式不能访问外部网络
- 计算超时自动终止

## 测试标准
### 功能测试
- 简单公式（=A1+B1）计算正确
- 财务函数（NPV、IRR）计算正确
- 公式依赖追踪正确触发重算
- 循环引用正确报错
- 公式编辑器语法高亮正常

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 单公式计算（10000个依赖单元格） | < 1秒 | undefined |

### 安全测试
- 注入恶意公式测试应被拦截
- 计算资源限制测试

## 测试验收流程
单元测试 → 公式计算测试 → 财务函数验证 → Human Gate

## 涉及文件
- packages/shared/src/formula/hyperformula-wrapper.ts
- packages/shared/src/formula/financial-functions.ts
- packages/backend/prisma/schema.prisma
- packages/backend/src/modules/formula/dto/create-formula.dto.ts
- packages/backend/src/modules/formula/entities/formula.entity.ts
- packages/backend/src/modules/formula/formula.controller.ts
- packages/backend/src/modules/formula/formula.service.ts
- packages/backend/src/modules/formula/formula.module.ts
- packages/frontend/src/views/models/components/FormulaEditor.vue
- packages/frontend/src/views/models/components/FormulaDebugPanel.vue
- packages/frontend/src/components/common/FormulaInput.vue

## 前置依赖
step6 单元格数据操作

## 前置产出验证
- 单元格 CRUD 正常
- 表格渲染正常

## 风险提示
- **HyperFormula 内存泄漏**: 定期销毁和重建 HyperFormula 实例，设置内存限制
- **循环引用导致无限计算**: 设置最大计算深度（50层），超出则报错

## 关联规范
- 角色：Backend Agent
- 关联规则：.cursor/rules/backend.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构设计文档 - API 设计 - 公式引擎
- 架构设计文档 - 技术栈选型 - 公式引擎

## 里程碑映射
核心功能（Day 7-8）
