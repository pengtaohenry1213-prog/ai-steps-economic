
# 🎯 任务目标

实现文档对话核心接口（非流式），完成 RAG 端到端对话流程

## 🧱 项目背景

用户上传文档并解析后，需要能基于文档内容进行智能对话，这是 RAG 系统的核心功能入口。

## 📋 任务要求

1. 接口设计：
   * 在 src/routes/chat.route.ts 中实现 POST /api/chat/normal
   * 接收请求参数：{ question: string }
2. 核心逻辑：
   * 调用 embedding 服务生成问题的 embedding
   * 计算问题 embedding 与内存中所有文本块的相似度
   * 筛选 Top5 高相似度文本块
   * 拼接 Prompt：`基于以下文档内容回答问题：{文本块拼接} 问题：{用户提问}`
   * 调用豆包对话 API 获取完整回答
3. 响应格式：
   * 成功：{ success: true, data: { answer: string } }
   * 失败：{ success: false, error: string }
4. 错误处理：
   * 无文档时返回明确提示
   * API 调用失败、相似度计算异常等

## ⚠️ 强约束

* 必须使用 TS 定义请求/响应类型
* 必须实现完整的 RAG 流程（embedding → 检索 → prompt → LLM）
* 返回结构化响应，不返回裸字符串

## 📤 输出格式

### 文件1：src/routes/chat.route.ts

```ts
// 包含非流式接口的完整路由代码
```

## 🚫 禁止行为

* 不要忽略无文档时的边界处理
* 不要硬编码 API 密钥
* 不要返回非结构化数据

---

## 🧪 测试要求（参考 TEST Rule）

### 测试类型：接口测试 + 功能测试

### 测试范围

- POST /api/chat/normal 非流式对话接口
* RAG 完整流程（embedding → 检索 → prompt → LLM）

### 测试用例

| 用例ID | 测试场景 | 预期结果 | 实际结果 | 测试状态 |
|--------|---------|---------|---------|----------|
| TC-CHAT-001 | 正常 RAG 对话（已上传文档） | 返回 `{success: true, data: {answer: "..."}}`，回答基于文档 | - | - |
| TC-CHAT-002 | 发送空问题 | 返回 `{success: false, error: "问题不能为空"}` | - | - |
| TC-CHAT-003 | 未上传文档时对话 | 返回 `{success: false, error: "暂无文档，请先上传文档"}` | - | - |
| TC-CHAT-004 | API 调用失败 | 返回 `{success: false, error: "..."}` | - | - |
| TC-CHAT-005 | Embedding 服务不可用 | 返回错误信息，包含失败原因 | - | - |
| TC-CHAT-006 | 验证返回内容相关性 | 回答应包含与问题相关的文档内容 | - | - |
| TC-CHAT-007 | 连续多次对话 | 每次都返回独立回答 | - | - |
| TC-CHAT-008 | 验证响应结构 | 返回 `{success: boolean, data/error: {...}}` | - | - |
| TC-CHAT-009 | 相似问题检索验证 | 相似的两次提问应检索到相似的文档块 | - | - |
| TC-CHAT-010 | 长文本问题处理 | 正确处理较长的用户问题 | - | - |

### 问题清单

| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |

---

## 项目目录结构（tree 形式）

- 参考：`md/项目结构.md`

## 项目 git commit 规范

- 参考：`md/Git提交规范.md`

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step13.md - 实现文档对话核心接口（非流式）
