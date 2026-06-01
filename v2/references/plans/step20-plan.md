# Step20 Plan - 豆包对话 API 调用

## 📋 任务目标

封装豆包对话 API 调用，支持非流式和流式两种模式

## 📁 文件清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `packages/backend/src/services/llm.service.ts` | 更新 | 添加类型定义 |
| `packages/backend/src/__tests__/llm.service.test.ts` | 新建 | LLM 服务测试 |

## ✅ TODOs

- [x] 创建 Plan 文件
- [x] 添加 LLM service 类型定义
- [x] 创建 LLM service 测试
- [x] 运行测试验证
- [ ] 更新 steps-dev.md

## 🎯 Acceptance Criteria（验收标准）

| 验收项 | 标准 | 状态 |
|--------|------|------|
| AC-01 | ChatRequest 类型定义 | ✅ |
| AC-02 | ChatResponse 类型定义 | ✅ |
| AC-03 | StreamChunk 类型定义 | ✅ |
| AC-04 | 非流式对话实现 | ✅ |
| AC-05 | 流式对话实现 | ✅ |
| AC-06 | 从配置读取 API 密钥 | ✅ |
| AC-07 | API 端点为 /chat/completions | ✅ |
| AC-08 | 错误处理完整 | ✅ |

## 🧪 测试用例

| 用例ID | 测试场景 | 预期结果 | 状态 |
|--------|---------|---------|------|
| TC-CHAT-SVC-001 | 非流式对话成功 | 返回 `{success: true, data: {answer: "..."}}` | ✅ PASS |
| TC-CHAT-SVC-002 | 空 Prompt | 返回 `{success: false, error: "..."}` | ✅ PASS |
| TC-CHAT-SVC-003 | API Key 缺失 | 启动时抛出错误 | ✅ PASS |
| TC-CHAT-SVC-004 | API 调用超时 | 触发重试机制 | ✅ PASS |
| TC-CHAT-SVC-005 | API 返回错误 | 返回 `{success: false, error: "..."}` | ✅ PASS |
| TC-CHAT-SVC-006 | 网络错误 | 捕获错误，返回错误信息 | ✅ PASS |
| TC-CHAT-SVC-007 | 流式对话成功 | 返回 SSE 流，逐块返回 | ✅ PASS |
| TC-CHAT-SVC-008 | 流式对话 JSON 格式 | 每行为 `{"chunk":"...","finish":bool}` | ✅ PASS |
| TC-CHAT-SVC-009 | 流式对话最后一块 | `finish: true` 出现在最后 | ✅ PASS |
| TC-CHAT-SVC-010 | 流式 API 错误 | 返回错误信息并 `finish: true` | ✅ PASS |
| TC-CHAT-SVC-011 | 模型名称配置正确 | 使用配置中的模型名称 | ✅ PASS |
| TC-CHAT-SVC-012 | 消息格式正确 | `messages: [{role: "user", content: "..."}]` | ✅ PASS |

## 🧪 测试报告

### 实际测试命令与结果

```bash
$ cd packages/backend && npm test
 ✓ src/__tests__/embedding.service.test.ts  (21 tests) 345ms
 ✓ src/__tests__/llm.service.test.ts  (15 tests) 130ms
 ✓ src/__tests__/chat.stream.test.ts  (12 tests) 5ms
 ✓ src/__tests__/chat.service.test.ts  (8 tests) 18ms
 ✓ src/__tests__/retrieval.service.test.ts  (9 tests) 9ms
 ✓ src/__tests__/file.test.ts  (7 tests) 27ms
 ✓ src/__tests__/prompt.service.test.ts  (11 tests)
 ✓ src/__tests__/similarity.test.ts  (17 tests)
 ✓ src/__tests__/example.test.ts  (2 tests)

Test Files  9 passed (9)
     Tests  102 passed (102)
# ✅ 所有 102 个测试通过
```

### 代码变更

1. **llm.service.ts**:
   - 添加 `ChatRequest` 类型定义
   - 添加 `ChatResponse` 类型定义
   - 添加 `StreamChunk` 类型定义

2. **新建 llm.service.test.ts**:
   - 15 个新测试用例覆盖 TC-CHAT-SVC-001 到 TC-CHAT-SVC-012

### 问题清单

| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |

