
# 🎯 任务目标

实现文档对话流式接口，将 LLM 的流式响应逐行推送给前端

## 🧱 项目背景

前端需要实现打字机效果展示 AI 回答，后端需将豆包 API 的流式响应实时推送，这是提升用户体验的关键功能。

## 📋 任务要求

1. 接口设计：
   * 在 src/routes/chat.route.ts 中扩展 POST /api/chat/stream
   * 接收请求参数：{ question: string }
2. 核心逻辑：
   * 调用豆包流式对话 API，设置 stream: true
   * 通过 response.write 逐行返回 JSON 行格式数据
   * 数据格式：`{"chunk":"文本片段","finish":false}\n{"chunk":"！","finish":true}`
3. 响应头配置：
   * Content-Type: text/event-stream
   * Transfer-Encoding: chunked
   * Cache-Control: no-cache
4. 异常处理：
   * 客户端断开连接检测（req.on('close')）
   * API 流式返回中断处理
   * 确保资源正常释放

## ⚠️ 强约束

* 必须处理客户端断开连接，避免内存泄漏
* 必须封装流式响应工具函数保证复用
* 必须使用 JSON 行格式（每行独立 JSON，以 \n 分隔）
* 不要使用 setTimeout 模拟流式返回

## 📤 输出格式

### 文件1：src/routes/chat.route.ts

```ts
// 包含非流式+流式接口的完整代码
```

### 文件2：src/utils/streamResponse.ts

```ts
// 流式响应工具函数完整代码
```

## 🚫 禁止行为

* 不要忽略响应头配置
* 不要未处理客户端断开连接导致内存泄漏
* 不要返回非约定格式的流式数据

---

## 🧪 测试要求（参考 TEST Rule）

### 测试类型：接口测试 + 功能测试

### 测试范围

- POST /api/chat/stream 流式对话接口
* SSE 响应格式和数据流
* 客户端断开处理

### 测试用例

| 用例ID | 测试场景 | 预期结果 | 实际结果 | 测试状态 |
|--------|---------|---------|---------|----------|
| TC-STREAM-101 | 正常流式对话 | 返回 SSE 流，逐块返回 AI 回答 | - | - |
| TC-STREAM-102 | 响应头验证 Content-Type | 为 `text/event-stream` | - | - |
| TC-STREAM-103 | 响应头验证 Transfer-Encoding | 为 `chunked` | - | - |
| TC-STREAM-104 | 响应头验证 Cache-Control | 为 `no-cache` | - | - |
| TC-STREAM-105 | JSON 行格式验证 | 每行为 `{"chunk":"...","finish":bool}` | - | - |
| TC-STREAM-106 | 最后一行 finish=true | 流结束时返回 `{"finish":true}` | - | - |
| TC-STREAM-107 | 发送空问题 | 返回 `{success: false, error: "问题不能为空"}` | - | - |
| TC-STREAM-108 | 客户端断开连接 | 服务器正确关闭连接，释放资源 | - | - |
| TC-STREAM-109 | API 返回错误 | 返回错误信息并 finish | - | - |
| TC-STREAM-110 | 并发多个流式请求 | 每个请求独立流，互不干扰 | - | - |
| TC-STREAM-111 | 未上传文档时流式对话 | 返回错误提示或基于空文档回答 | - | - |

### 问题清单

| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |

---

## 项目目录结构（tree 形式）

- 参考：`md/项目结构.md`

## 项目 git commit 规范

- 参考：`md/Git提交规范.md`

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step14.md - 实现文档对话流式接口
