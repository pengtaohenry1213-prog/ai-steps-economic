# Step19 Plan - RAG 检索逻辑与 Prompt 拼接

## 📋 任务目标

实现用户问题的 RAG 检索逻辑，包含向量相似度计算、TopK 筛选、Prompt 拼接

## 📁 文件清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `packages/backend/src/services/retrieval.service.ts` | 更新 | 更新类型使用 `chunks` 字段 |
| `packages/backend/src/services/prompt.service.ts` | 新建 | Prompt 拼接服务 |
| `packages/backend/src/__tests__/prompt.service.test.ts` | 新建 | Prompt 服务测试 |
| `packages/backend/src/services/chat.service.ts` | 更新 | 使用新的 `chunks` 字段 |

## ✅ TODOs

- [x] 创建 Plan 文件
- [x] 更新 RetrievalResult 类型使用 `chunks` 字段
- [x] 创建 prompt.service.ts
- [x] 创建 prompt.service 测试
- [x] 更新 chat.service.ts 使用 chunks 字段
- [x] 运行测试验证
- [ ] 更新 steps-dev.md

## 🎯 Acceptance Criteria（验收标准）

| 验收项 | 标准 | 状态 |
|--------|------|------|
| AC-01 | RetrievalResult 使用 `chunks` 字段 | ✅ |
| AC-02 | 创建 PromptResult 类型 | ✅ |
| AC-03 | Prompt 拼接格式正确 | ✅ |
| AC-04 | 处理空检索结果情况 | ✅ |
| AC-05 | 复用 cosineSimilarity 函数 | ✅ |

## 🧪 测试用例

| 用例ID | 测试场景 | 预期结果 | 状态 |
|--------|---------|---------|------|
| TC-RET-101 | searchTopK 正常检索 | 返回 TopK 相关文本块 | ✅ PASS |
| TC-RET-102 | k=1 时检索 | 返回 1 个最相关文本块 | ✅ PASS |
| TC-RET-103 | k=3 时检索 | 返回 3 个最相关文本块 | ✅ PASS |
| TC-RET-104 | k 大于文档块数量 | 返回所有文本块 | ✅ PASS |
| TC-RET-105 | 无文档时检索 | 返回 `{success: false, error: "暂无文档"}` | ✅ PASS |
| TC-RET-106 | 检索相似度低于阈值 | 返回空数组或明确提示 | ✅ PASS |
| TC-RET-107 | 空问题字符串 | 返回 `{success: false, error: "..."}` | ✅ PASS |
| TC-RET-108 | 返回结构正确 | `{success: boolean, chunks?: string[]}` | ✅ PASS |
| TC-PROMPT-001 | 正常 Prompt 拼接 | 包含文档内容和用户问题 | ✅ PASS |
| TC-PROMPT-002 | 单个文档块拼接 | 正确拼接 1 个块 | ✅ PASS |
| TC-PROMPT-003 | 多个文档块拼接 | 正确拼接多个块，用 `\n` 分隔 | ✅ PASS |
| TC-PROMPT-004 | 空文档块数组 | 返回 `{success: false, error: "..."}` | ✅ PASS |
| TC-PROMPT-005 | Prompt 格式验证 | 包含 "基于以下文档内容" 和 "问题：" | ✅ PASS |

## 🧪 测试报告

### 实际测试命令与结果

```bash
$ cd packages/backend && npm test
 ✓ src/__tests__/embedding.service.test.ts  (21 tests) 352ms
 ✓ src/__tests__/chat.stream.test.ts  (12 tests) 15ms
 ✓ src/__tests__/chat.service.test.ts  (8 tests) 18ms
 ✓ src/__tests__/retrieval.service.test.ts  (9 tests) 10ms
 ✓ src/__tests__/file.test.ts  (7 tests) 28ms
 ✓ src/__tests__/prompt.service.test.ts  (11 tests)
 ✓ src/__tests__/similarity.test.ts  (17 tests)
 ✓ src/__tests__/example.test.ts  (2 tests)

Test Files  8 passed (8)
     Tests  87 passed (87)
# ✅ 所有 87 个测试通过
```

### 问题清单

| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |
