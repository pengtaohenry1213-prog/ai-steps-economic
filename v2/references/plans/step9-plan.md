---
name: step9-rag-retrieval
overview: 实现 RAG 检索核心：余弦相似度计算 + TopK 检索服务
todos:
  - id: similarity-impl
    content: 新建 packages/backend/src/utils/similarity.ts - 余弦相似度函数
    status: completed
  - id: similarity-test
    content: 新建 packages/backend/src/__tests__/similarity.test.ts - 相似度测试
    status: completed
  - id: retrieval-impl
    content: 新建 packages/backend/src/services/retrieval.service.ts - 检索服务
    status: completed
  - id: retrieval-test
    content: 新建 packages/backend/src/__tests__/retrieval.service.test.ts - 检索服务测试
    status: completed
  - id: test-run
    content: 运行测试验证实现
    status: completed
isProject: false
---

## Step9 Plan: 实现 RAG 检索与生成 API

### 实现文件

#### 1. 新建 `packages/backend/src/utils/similarity.ts`

余弦相似度计算工具函数：

```typescript
/**
 * 计算两个向量的余弦相似度
 * cos(θ) = (A·B) / (||A|| × ||B||)
 */
export function cosineSimilarity(a: number[], b: number[]): number

/**
 * 计算向量点积
 */
export function dotProduct(a: number[], b: number[]): number

/**
 * 计算向量范数（模长）
 */
export function vectorNorm(vec: number[]): number
```

边界处理：

- 长度不一致 → 返回 0
- 空数组 → 返回 0
- 零向量 → 返回 0

#### 2. 新建 `packages/backend/src/services/retrieval.service.ts`

检索服务，复用 `embedding.service.ts` 中的 `vectorStore`：

```typescript
import { vectorStore } from './embedding.service';
import { cosineSimilarity } from '../utils/similarity';
import { createEmbedding } from './embedding.service';

export interface RetrievalResult {
  success: boolean;
  data?: string[];
  error?: string;
}

export async function searchTopK(
  question: string, 
  k: number
): Promise<RetrievalResult>
```

检索流程：

1. 验证 k 值（≥1）
2. 调用 `createEmbedding(question)` 获取问题向量
3. 调用 `vectorStore.getAllVectors()` 获取所有文档向量
4. 计算余弦相似度
5. 排序取 TopK
6. 返回文本块数组

#### 3. 新建测试文件 `packages/backend/src/__tests__/similarity.test.ts`

测试用例（参考 step9.md）：


| 用例         | 场景               | 预期    |
| ---------- | ---------------- | ----- |
| TC-SIM-001 | [1,1] vs [1,1]   | 1.0   |
| TC-SIM-002 | [1,0] vs [0,1]   | 0.0   |
| TC-SIM-003 | [1,1] vs [-1,-1] | -1.0  |
| TC-SIM-005 | 不同长度向量           | 0 或错误 |
| TC-SIM-006 | 空数组              | 0 或错误 |
| TC-SIM-008 | 零向量              | 0     |


#### 4. 新建测试文件 `packages/backend/src/__tests__/retrieval.service.test.ts`


| 用例         | 场景   | 预期                                |
| ---------- | ---- | --------------------------------- |
| TC-RET-001 | 正常检索 | TopK 结果                           |
| TC-RET-002 | k=1  | 1 个结果                             |
| TC-RET-004 | 无文档  | `{success: false, error: "暂无文档"}` |


### 依赖关系

```
retrieval.service.ts
├── embedding.service.ts (vectorStore, createEmbedding)
└── similarity.ts (cosineSimilarity)
```

### 后续扩展

- Step10: 接入 LLM 调用，实现 Prompt 拼接
- 数据库持久化: vectorStore.toDatabase()

