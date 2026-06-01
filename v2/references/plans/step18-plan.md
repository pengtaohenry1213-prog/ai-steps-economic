# Step18 Plan - 豆包 Embedding API 调用

## 📋 任务目标

封装豆包 Embedding API 调用，包含超时、重试、错误处理

## 📁 文件清单

| 文件路径 | 操作 | 说明 |
|---------|------|------|
| `packages/backend/src/types/embedding.types.ts` | 更新 | 添加/更新类型定义 |
| `packages/backend/src/services/embedding.service.ts` | 更新 | 更新 API 端点和模型名称 |

## ✅ TODOs

- [x] 创建 Plan 文件
- [x] 更新 embedding types 类型定义
- [x] 更新 embedding service API endpoint 和 model name
- [x] 运行测试验证
- [ ] 更新 steps-dev.md

## 🎯 Acceptance Criteria（验收标准）

| 验收项 | 标准 | 状态 |
|--------|------|------|
| AC-01 | API endpoint 为 `/embeddings/text-embedding` | ✅ |
| AC-02 | model 名称为 `doubao-embedding-v1` | ✅ |
| AC-03 | 使用 TS 定义请求/响应类型 | ✅ |
| AC-04 | 实现重试机制（2 次） | ✅ |
| AC-05 | 设置超时（10 秒） | ✅ |
| AC-06 | 从配置读取 API 密钥 | ✅ |

## 🧪 测试用例

| 用例ID | 测试场景 | 预期结果 | 状态 |
|--------|---------|---------|------|
| TC-EMB-API-001 | 正常调用 Embedding API | 返回向量数组 | ✅ PASS |
| TC-EMB-API-002 | 单文本调用 | 返回单个向量 | ✅ PASS |
| TC-EMB-API-003 | 多文本批量调用 | 返回多个向量，按顺序对应 | ✅ PASS |
| TC-EMB-API-004 | API 超时（>10s） | 10s 后触发重试 | ✅ PASS |
| TC-EMB-API-005 | API 第一次失败重试 | 最多重试 2 次 | ✅ PASS |
| TC-EMB-API-006 | API 全部失败 | 返回 `{success: false, error: "..."}` | ✅ PASS |
| TC-EMB-API-007 | API Key 缺失 | 启动时抛出错误 | ✅ PASS |
| TC-EMB-API-008 | 网络错误 | 捕获错误，返回错误信息 | ✅ PASS |
| TC-EMB-API-009 | API 返回错误状态码 | 捕获 HTTP 错误，返回错误信息 | ✅ PASS |
| TC-EMB-API-010 | 空文本数组调用 | 返回错误 | ✅ PASS |
| TC-EMB-API-011 | 返回值类型正确 | data 为 number[] 类型 | ✅ PASS |

## 🧪 测试报告

### 实际测试命令与结果

```bash
# 1. 启动服务测试
$ cd packages/backend && npm run dev
Backend server running on http://localhost:3000
# ✅ 服务启动成功

# 2. 运行单元测试
$ cd packages/backend && npm test
 ✓ src/__tests__/embedding.service.test.ts  (21 tests) 347ms
 ✓ src/__tests__/chat.stream.test.ts  (12 tests) 14ms
 ✓ src/__tests__/chat.service.test.ts  (8 tests) 18ms
 ✓ src/__tests__/retrieval.service.test.ts  (9 tests) 9ms
 ✓ src/__tests__/file.test.ts  (7 tests) 28ms
 ✓ src/__tests__/similarity.test.ts  (17 tests)
 ✓ src/__tests__/example.test.ts  (2 tests)

Test Files  7 passed (7)
     Tests  76 passed (76)
# ✅ 所有 76 个测试通过
```

### 代码变更

1. **embedding.types.ts**:
   - 添加 `EmbeddingRequest` 类型定义
   - 添加 `EmbeddingResponse` 类型定义
   - 更新 `DoubaoEmbeddingResponse` 使 `code` 和 `msg` 可选

2. **embedding.service.ts**:
   - 新增 `EMBEDDING_ENDPOINT = '/embeddings/text-embedding'`
   - 新增 `EMBEDDING_MODEL = 'doubao-embedding-v1'`
   - 更新 API 调用使用新端点和模型

### 问题清单

| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |

