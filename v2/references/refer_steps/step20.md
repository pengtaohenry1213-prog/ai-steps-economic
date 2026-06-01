
# 🎯 任务目标

封装豆包对话 API 调用，支持非流式和流式两种模式

## 🧱 项目背景

RAG 系统的最后一步是将拼接好的 Prompt 发送给豆包 API，获取 AI 的回答。非流式返回完整回答，流式逐字返回提升用户体验。

## 豆包对话 API 配置信息
参考： ~/config/doubao-model.md

## 📋 任务要求

1. 非流式对话（src/services/chat.service.ts）：
   * 调用豆包对话 API（非流式）
   * 接收 Prompt，返回完整回答
   * API 地址：POST <https://ark.cn-beijing.volces.com/api/v3/chat/completions>
   * 请求格式：

     ```json
     {
       "model": "doubao-seed-2-0-code-preview-260215",
       "messages": [
         { "role": "user", "content": "拼接好的Prompt" }
       ]
     }
     ```

2. 流式对话（扩展）：
   * 设置 stream: true
   * 返回 SSE 流式数据
   * 逐块返回 AI 回答
3. TS 类型定义：

   ```ts
   interface ChatRequest {
     prompt: string;
     stream?: boolean;
   }
   
   interface ChatResponse {
     success: boolean;
     data?: {
       answer: string;
     };
     error?: string;
   }
   
   interface StreamChunk {
     chunk: string;
     finish: boolean;
   }
   ```

4. 从配置读取：
   * API 密钥、模型名称从 src/config 读取

## ⚠️ 强约束

* 必须使用 TS 定义请求/响应类型
* 必须实现非流式和流式两种模式
* 必须从配置读取 API 密钥
* 必须处理 API 异常

## 📤 输出格式

### 文件1：src/services/chat.service.ts

```ts
// 对话服务完整代码（非流式+流式）
```

## 🚫 禁止行为

* 不要硬编码 API 密钥
* 不要忽略错误处理
* 不要返回非结构化数据

---

## 🧪 测试要求（参考 TEST Rule）

### 测试类型：接口测试 + 功能测试

### 测试范围

- 非流式对话 API 调用
* 流式对话 API 调用
* 错误处理

### 测试用例

| 用例ID | 测试场景 | 预期结果 | 实际结果 | 测试状态 |
|--------|---------|---------|---------|----------|
| TC-CHAT-SVC-001 | 非流式对话成功 | 返回 `{success: true, data: {answer: "..."}}` | - | - |
| TC-CHAT-SVC-002 | 空 Prompt | 返回 `{success: false, error: "..."}` | - | - |
| TC-CHAT-SVC-003 | API Key 缺失 | 返回 `{success: false, error: "API Key 未配置"}` | - | - |
| TC-CHAT-SVC-004 | API 调用超时 | 触发重试机制 | - | - |
| TC-CHAT-SVC-005 | API 返回错误 | 返回 `{success: false, error: "..."}` | - | - |
| TC-CHAT-SVC-006 | 网络错误 | 捕获错误，返回错误信息 | - | - |
| TC-CHAT-SVC-007 | 流式对话成功 | 返回 SSE 流，逐块返回 | - | - |
| TC-CHAT-SVC-008 | 流式对话 JSON 格式 | 每行为 `{"chunk":"...","finish":bool}` | - | - |
| TC-CHAT-SVC-009 | 流式对话最后一块 | `finish: true` 出现在最后 | - | - |
| TC-CHAT-SVC-010 | 流式 API 错误 | 返回错误信息并 `finish: true` | - | - |
| TC-CHAT-SVC-011 | 模型名称配置正确 | 使用配置中的模型名称 | - | - |
| TC-CHAT-SVC-012 | 消息格式正确 | `messages: [{role: "user", content: "..."}]` | - | - |

### 问题清单

| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |

---

## 项目目录结构（tree 形式）

- 参考：`md/项目结构.md`

## 项目 git commit 规范

- 参考：`md/Git提交规范.md`

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step20.md - 封装豆包对话 API 调用
