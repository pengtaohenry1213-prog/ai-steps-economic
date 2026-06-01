# Step 5: 公式计算引擎 - HyperFormula集成与财务函数

## 任务目标
公式计算引擎 - HyperFormula集成与财务函数

## 详细说明
集成 HyperFormula 实现公式计算引擎。实现公式定义、解析、执行、依赖分析功能。支持常用财务函数（NPV, IRR, XNPV, XIRR, PMT, FV 等）。实现增量计算（只重新计算受影响的单元格）。实现公式错误提示和调试信息。

v1复用量：10%（财务函数测试用例可参考 v1，但集成 HyperFormula 是全新的）

技术方案：
1. 安装 hyperformula 包
2. 创建 FormulaModule 和 FormulaService
3. 封装 HyperFormula 实例管理（每个版本独立实例）
4. 实现公式依赖图构建
5. 实现增量计算算法
6. 封装财务函数库
7. 前端 FormulaEditor.vue：公式输入、语法高亮、函数提示
- v1复用量：10%
- 技术方案：HyperFormula 实例按版本 ID 缓存管理。公式定义存储在 Metric 实体中。计算时：1）解析公式语法；2）构建依赖图；3）拓扑排序确定计算顺序；4）增量计算（对比变更范围）。财务函数通过 HyperFormula 的 custom-functions 插件注册。

## Out of Scope（当前 Step 不做的事情）
- 不实现自定义函数扩展（后续扩展）
- 不实现公式模板功能（后续扩展）
- 不实现公式版本历史（Step 4 已处理）
- 不实现循环引用检测（基础支持）
- 不实现跨模型引用（仅单模型内）

## 执行任务（TODO）
- [ ] todo-5.1: 安装 hyperformula 包
- [ ] todo-5.2: 创建 FormulaModule 和 FormulaService
- [ ] todo-5.3: 封装 HyperFormula 实例管理器
- [ ] todo-5.4: 实现公式解析和依赖分析
- [ ] todo-5.5: 实现增量计算算法
- [ ] todo-5.6: 封装财务函数库（NPV, IRR, XNPV, XIRR, PMT, FV）
- [ ] todo-5.7: 创建 FormulaController
- [ ] todo-5.8: 创建前端 FormulaEditor.vue
- [ ] todo-5.9: 实现函数自动提示
- [ ] todo-5.10: 编写财务函数测试用例

## 约束条件
- 公式语法兼容 Excel
- 循环引用检测（最多 3 层）
- 单个公式执行超时 < 1秒
- 全局计算超时 < 10秒
- 公式缓存有效时间 5 分钟

## 验收标准
### 功能验收
- [ ] 公式输入支持语法高亮
- [ ] 函数自动提示正常
- [ ] 公式解析无语法错误
- [ ] 财务函数计算结果正确（NPV, IRR, PMT 等）
- [ ] 依赖分析显示引用关系
- [ ] 增量计算只更新受影响单元格
- [ ] 公式错误显示友好提示

### 性能验收
| 指标 | 标准 |
|------|------|
| 单个公式计算 | < 100ms |
| 1000 个公式全量计算 | < 5秒 |
| 增量计算（1 个变更） | < 500ms |

### 安全验收
- 公式执行沙箱隔离
- 防止恶意公式攻击
- 公式长度限制（< 1000 字符）

## 测试标准
### 功能测试
- 基础算术公式计算正确
- 财务函数 NPV/IRR 计算正确（与 Excel 对比）
- 依赖关系正确
- 增量计算正确

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| 计算性能 | 符合上述标准 | JMeter 压测 |

### 安全测试
- 恶意公式（死循环）被拦截
- 公式执行超时机制生效

## 测试验收流程
1. 单元测试：财务函数测试用例
2. 功能验证：公式编辑器和计算结果验证
3. Human Gate 验收：人工确认计算准确性
4. 签字确认：负责人确认后方可进入 Step 6

## 涉及文件
- packages/backend/src/modules/formulas/formulas.module.ts
- packages/backend/src/modules/formulas/formulas.controller.ts
- packages/backend/src/modules/formulas/formulas.service.ts
- packages/backend/src/modules/formulas/formula-engine.ts
- packages/backend/src/modules/formulas/financial-functions.ts
- packages/backend/src/modules/formulas/dependency-graph.ts
- packages/frontend/src/components/formula/FormulaEditor.vue
- packages/frontend/src/components/formula/FunctionHelper.vue
- packages/frontend/src/api/formulasApi.ts
- packages/frontend/src/stores/formulaStore.ts

## 前置依赖
Step 4（版本控制）

## 前置产出验证
- 版本数据可正常存储
- 指标编辑页面已创建

## 风险提示
- **公式循环引用导致死循环**: 实现循环检测算法，设置最大计算深度限制
- **大量公式计算性能问题**: 实现 Worker 线程计算，公式缓存，批量计算优化

## 关联规范
- 角色：Backend Agent
- 关联规则：.cursor/rules/backend.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构文档 - 后端模块 - 公式计算引擎
- 架构文档 - 前端模块 - 公式计算模块
- 架构文档 - API 设计 - 公式计算接口

## 里程碑映射
Day 16-20：完成公式计算引擎
