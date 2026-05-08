---
name: step13-plan
overview: 实现文档对话核心接口（非流式），完成 RAG 端到端对话流程
todos:
  - id: create-llm-service
    content: 创建 LLM 服务 (llm.service.ts) - 调用豆包对话 API
    status: completed
  - id: create-chat-service
    content: 创建聊天服务 (chat.service.ts) - RAG 流程整合
    status: completed
  - id: create-chat-route
    content: 创建聊天路由 (chat.route.ts) - POST /api/chat/normal
    status: completed
  - id: register-route
    content: 注册 chat 路由到 routes/index.ts
    status: completed
  - id: create-chat-tests
    content: 创建单元测试 (chat.service.test.ts)
    status: completed
  - id: run-tests
    content: 运行测试验证功能
    status: completed
isProject: false
---

# Step13 Plan: 文档对话核心接口（非流式）

## 任务目标

实现 `POST /api/chat/normal` 接口，完成 RAG 端到端对话流程

## 实现步骤

### 1. 创建 LLM 服务 - `src/services/llm.service.ts`

- 调用豆包对话 API
- 函数：`chatCompletion(prompt: string): Promise<LLMResult>`
- 类型定义：

```typescript
interface LLMResult {
  success: boolean;
  data?: { answer: string };
  error?: string;
}
```

### 2. 创建聊天服务 - `src/services/chat.service.ts`

- 实现 RAG 流程：
  1. 验证问题非空
  2. 调用 `searchTopK(question, k=5)` 获取 Top5 相关文本块
  3. 拼接 Prompt：`基于以下文档内容回答问题：{文本块} 问题：{用户提问}`
  4. 调用 LLM 获取回答
  5. 返回结构化响应

### 3. 创建路由 - `src/routes/chat.route.ts`

- `POST /api/chat/normal`
- 请求体：`{ question: string }`
- 响应结构：

```typescript
// 成功
{ success: true, data: { answer: string } }
// 失败
{ success: false, error: string }
```

### 4. 注册路由 - `src/routes/index.ts`

```typescript
import chatRouter from './chat.route';
router.use('/chat', chatRouter);
```

### 5. 创建单元测试 - `src/__tests__/chat.service.test.ts`

- TC-CHAT-001: 正常 RAG 对话
- TC-CHAT-002: 空问题校验
- TC-CHAT-003: 无文档时对话
- TC-CHAT-004: API 调用失败处理

## 验收标准

- 接口返回结构化 JSON，不返回裸字符串
- 无文档时返回明确错误提示
- 空问题返回校验错误
- 所有测试用例通过
- 符合 TypeScript 严格模式

