
# 🎯 任务目标

实现用户问题的 RAG 检索逻辑，包含向量相似度计算、TopK 筛选、Prompt 拼接

## 🧱 项目背景

用户提问后，需要先将问题转换为向量，再与文档向量进行相似度计算，筛选出最相关的文本块，这是 RAG 的核心检索环节。

## 📋 任务要求

1. 检索服务（src/services/retrieval.service.ts）：
   * 接收用户问题（string）
   * 调用 embedding 服务生成问题向量
   * 计算问题向量与所有文档块的余弦相似度
   * 筛选 TopK 高相似度文本块（默认 Top5）
   * 返回相关文本块列表
2. Prompt 拼接（src/services/prompt.service.ts）：
   * 拼接格式：`基于以下文档内容回答问题：{文本块1}\n{文本块2}...\n问题：{用户提问}`
   * 处理空检索结果的情况
   * 可配置的 Prompt 模板
3. TS 类型定义：

   ```ts
   interface RetrievalResult {
     success: boolean;
     chunks?: string[];
     error?: string;
   }
   
   interface PromptResult {
     success: boolean;
     prompt?: string;
     error?: string;
   }
   ```

4. 余弦相似度函数复用：
   * 复用 src/utils/similarity.ts 中的函数

## ⚠️ 强约束

* 必须使用 TS 定义类型
* 必须处理无文档时的边界情况
* 必须返回结构化响应
* 检索结果为空时返回明确提示

## 📤 输出格式

### 文件1：src/services/retrieval.service.ts

```ts
// 检索服务完整代码
```

### 文件2：src/services/prompt.service.ts

```ts
// Prompt 拼接服务完整代码
```

## 🚫 禁止行为

* 不要忽略无文档时的边界处理
* 不要返回裸字符串
* 不要硬编码 TopK 值

---

## 🧪 测试要求（参考 TEST Rule）

### 测试类型：功能测试

### 测试范围

- 检索服务（embedding → 相似度计算 → TopK 筛选）
* Prompt 拼接服务
* 边界条件处理

### 测试用例

| 用例ID | 测试场景 | 预期结果 | 实际结果 | 测试状态 |
|--------|---------|---------|---------|----------|
| TC-RET-101 | searchTopK 正常检索 | 返回 TopK 相关文本块 | - | - |
| TC-RET-102 | k=1 时检索 | 返回 1 个最相关文本块 | - | - |
| TC-RET-103 | k=3 时检索 | 返回 3 个最相关文本块 | - | - |
| TC-RET-104 | k 大于文档块数量 | 返回所有文本块 | - | - |
| TC-RET-105 | 无文档时检索 | 返回 `{success: false, error: "暂无文档"}` | - | - |
| TC-RET-106 | 检索相似度低于阈值 | 返回空数组或明确提示 | - | - |
| TC-RET-107 | 空问题字符串 | 返回 `{success: false, error: "问题不能为空"}` | - | - |
| TC-RET-108 | 返回结构正确 | `{success: boolean, chunks?: string[]}` | - | - |
| TC-PROMPT-001 | 正常 Prompt 拼接 | 包含文档内容和用户问题 | - | - |
| TC-PROMPT-002 | 单个文档块拼接 | 正确拼接 1 个块 | - | - |
| TC-PROMPT-003 | 多个文档块拼接 | 正确拼接多个块，用 `\n` 分隔 | - | - |
| TC-PROMPT-004 | 空文档块数组 | 返回 `{success: false, error: "..."}` | - | - |
| TC-PROMPT-005 | Prompt 格式验证 | 包含 "基于以下文档内容" 和 "问题：" | - | - |

### 问题清单

| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |

---

## 项目目录结构（tree 形式）

- 参考：`md/项目结构.md`

## 项目 git commit 规范

- 参考：`md/Git提交规范.md`

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step19.md - 实现用户问题的 RAG 检索逻辑
