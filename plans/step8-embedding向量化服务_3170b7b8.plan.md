---
name: step8-Embedding向量化服务
overview: 实现 Embedding 向量化服务，包含文本分块、豆包 API 调用、内存存储及完整测试用例
todos:
  - id: step8-types
    content: 新增 embedding.types.ts 类型定义
    status: completed
  - id: step8-service
    content: 实现 embedding.service.ts（分块+API+存储）
    status: completed
  - id: step8-test
    content: 新增 embedding.service.test.ts 测试用例
    status: completed
  - id: step8-dev
    content: 更新 steps-dev.md 标记完成
    status: completed
isProject: false
---

## Step8 Plan：Embedding 向量化服务

### 1. 新增类型文件

- 新建 `packages/backend/src/types/embedding.types.ts`，定义：
  - `TextChunk = { id: string; content: string }`
  - `VectorItem = { id: string; content: string; embedding: number[] }`
  - `EmbeddingResult = { success: boolean; data?: number[]; error?: string }`

### 2. 新增 Embedding 服务

- 新建 `packages/backend/src/services/embedding.service.ts`，实现：
  - **文本分块** `splitIntoChunks(text: string, chunkSize = 500, overlap = 100)`：按句子拆分，合并到 ~500 字
  - **Embedding 调用** `createEmbedding(text: string)`：调用豆包 Embedding API，超时 10s、重试 2 次、错误捕获
  - **内存存储** `VectorStore` 类：`addDocument(text: string)` 返回 `EmbeddingResult`、`getAllVectors()` 返回 `VectorItem[]`
  - 预留数据库扩展接口（`toDatabase()` 空方法）

### 3. 读取豆包 API 配置

- 从 `process.env` 读取 `DOUBAO_API_KEY` 和 `DOUBAO_BASE_URL`（使用根目录 `.env` 中已有的豆包配置）

### 4. 新增测试文件

- 新建 `packages/backend/src/__tests__/embedding.service.test.ts`，覆盖 TC-EMB-001 ~ TC-EMB-010：
  - 分块边界测试（499/501/1500 字）
  - 句子完整性测试（不截断句子中间）
  - API 成功/超时/缺失 Key 测试
  - 内存存储 add/get 测试
  - 空文本输入测试

### 5. 更新 steps-dev.md

- step8 标记为 ✅ 完成

### 关键实现约束

- **不硬编码 API Key**：从环境变量读取
- **句子完整性**：按 `.!?。！？` 断句，不在句子中间截断
- **严格 TS 类型**：所有参数/返回值均定义类型
- **测试用 mock**：用 `vi.mock` 模拟豆包 API 响应，避免真实调用

