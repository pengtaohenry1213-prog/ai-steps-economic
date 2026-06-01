# Step 6: AI能力服务 - MiniMax集成与智能功能

## 任务目标
AI能力服务 - MiniMax集成与智能功能

## 详细说明
集成 MiniMax AI 能力，实现三个核心功能：1）智能公式建议（根据上下文推荐合适公式）；2）数据异常检测（识别数据中的异常值）；3）自然语言查询（NL2SQL 将自然语言转为查询）。实现 AI 调用追踪和日志记录。

v1复用量：0%（AI 功能是全新集成的，无 v1 可复用）

技术方案：
1. 创建 AiModule 和 AiService
2. 集成 MiniMax API（公式建议、异常检测、NLP 查询）
3. 实现 Prompt 工程（Few-shot learning）
4. 实现结果缓存（Redis，5 分钟 TTL）
5. 实现调用日志和追踪
6. 前端 AiPanel.vue：AI 功能入口和结果展示
- v1复用量：0%
- 技术方案：AiService 封装三个核心方法：suggestFormula(context)、detectAnomaly(data)、naturalQuery(question)。使用 Redis 缓存 AI 响应，key = hash(request)，TTL = 5min。MiniMax API 调用使用流式响应，提升用户体验。日志记录使用结构化日志（包含 latency, tokens, model）。

## Out of Scope（当前 Step 不做的事情）
- 不实现 AI 模型微调（使用官方模型）
- 不实现 AI 对话历史保存（后续扩展）
- 不实现 AI 结果人工审核（后续扩展）
- 不实现多 AI 模型切换（仅 MiniMax）
- 不实现 AI 能力计费功能（后续扩展）

## 执行任务（TODO）
- [ ] todo-6.1: 安装 MiniMax SDK 和 Redis 客户端
- [ ] todo-6.2: 创建 AiModule
- [ ] todo-6.3: 实现 MiniMaxService（API 封装）
- [ ] todo-6.4: 实现公式建议功能（suggestFormula）
- [ ] todo-6.5: 实现异常检测功能（detectAnomaly）
- [ ] todo-6.6: 实现自然语言查询（naturalQuery）
- [ ] todo-6.7: 实现 Redis 缓存
- [ ] todo-6.8: 实现调用日志和追踪
- [ ] todo-6.9: 创建前端 AiPanel.vue
- [ ] todo-6.10: 集成流式响应
- [ ] todo-6.11: 编写单元测试

## 约束条件
- AI 响应超时 < 30秒
- AI 调用频率限制（每用户每分钟 10 次）
- 敏感数据脱敏后再发送 AI
- AI 结果需后端二次校验
- 支持流式输出

## 验收标准
### 功能验收
- [ ] 公式建议返回相关推荐（> 80% 准确率）
- [ ] 异常检测标记出异常值
- [ ] 自然语言查询返回 SQL/公式
- [ ] AI 结果可一键应用到单元格
- [ ] AI 调用日志完整记录

### 性能验收
| 指标 | 标准 |
|------|------|
| AI 响应时间 | < 10秒（首 token） |
| 流式响应延迟 | < 500ms |

### 安全验收
- 敏感数据脱敏
- API Key 不得暴露
- 调用频率限制

## 测试标准
### 功能测试
- 公式建议功能测试
- 异常检测功能测试
- 自然语言查询测试
- 结果准确性验证

### 性能测试
| 指标 | 标准 | 测试方法 |
|------|------|---------|
| AI 响应时间 | 符合上述标准 | 手动计时 |

### 安全测试
- API Key 不在代码中硬编码
- 频率限制生效

## 测试验收流程
1. 单元测试：AI Service 逻辑测试（Mock MiniMax）
2. 功能验证：各 AI 功能手动测试
3. Human Gate 验收：人工确认 AI 效果
4. 签字确认：负责人确认后方可进入 Step 7

## 涉及文件
- packages/backend/src/modules/ai/ai.module.ts
- packages/backend/src/modules/ai/ai.controller.ts
- packages/backend/src/modules/ai/ai.service.ts
- packages/backend/src/modules/ai/minimax.service.ts
- packages/backend/src/modules/ai/prompts/formula-suggest.prompt.ts
- packages/backend/src/modules/ai/prompts/anomaly-detect.prompt.ts
- packages/backend/src/modules/ai/prompts/nl-query.prompt.ts
- packages/backend/src/modules/ai/cache/ai-cache.service.ts
- packages/backend/src/modules/ai/entities/ai-log.entity.ts
- packages/frontend/src/components/ai/AiPanel.vue
- packages/frontend/src/components/ai/FormulaSuggest.vue
- packages/frontend/src/components/ai/AnomalyDetect.vue
- packages/frontend/src/components/ai/NlQuery.vue
- packages/frontend/src/api/aiApi.ts

## 前置依赖
Step 5（公式计算引擎）

## 前置产出验证
- 公式编辑器已创建
- 单元格数据可编辑

## 风险提示
- **AI API 调用失败或超时**: 实现降级策略（返回预设答案），设置合理的超时时间
- **AI 结果不准确导致用户误导**: 显示 AI 置信度，提示用户二次确认，提供否定选项

## 关联规范
- 角色：Backend Agent
- 关联规则：.cursor/rules/backend.mdc
- 关联执行：.cursor/prompts/run-step.md
- 架构文档 - 后端模块 - AI 能力服务
- 架构文档 - 前端模块 - AI 助手模块
- 架构文档 - API 设计 - AI 能力接口

## 里程碑映射
Day 21-25：完成 AI 能力集成
