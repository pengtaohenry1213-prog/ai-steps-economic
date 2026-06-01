
# 🎯 任务目标

实现 embedding.service.ts，完成文本分块、豆包Embedding调用、内存存储

## 🧱 项目背景

RAG的核心是将文本转为向量（Embedding），通过向量相似度检索相关内容，该服务是RAG的基础。

## 📋 任务要求

1. 文本分块函数：
   * 每块500字，上下文重叠100字
   * 保留段落/句子完整性，不截断完整句子
   * TS类型：TextChunk = { id: string; content: string }
2. Embedding调用函数：
   * 调用豆包Embedding API，API Key从环境变量读取
   * 超时10s，重试2次，完整错误捕获
3. 内存存储：
   * 类型：VectorItem = { id: string; content: string; embedding: number[] }
   * 提供 addDocument(text: string)、getAllVectors() 方法

## ⚠️ 强约束

* 必须使用 TS 严格定义所有类型
* API调用需处理网络异常、密钥缺失等情况
* 内存存储仅用数组，预留数据库扩展接口

## 📤 输出格式

### 文件：src/services/embedding.service.ts

```ts
// 完整可运行代码（分块+Embedding调用+内存存储）
```

## 🚫 禁止行为

* 不要硬编码API Key
* 不要忽略分块的句子完整性
* 不要省略超时和重试逻辑

---

## 🧪 测试要求（参考 TEST Rule）

### 测试类型：功能测试 + 接口测试

### 测试范围

- 文本分块函数
* Embedding API 调用
* 内存存储功能

### 测试用例

| 用例ID | 测试场景 | 预期结果 | 实际结果 | 测试状态 |
|--------|---------|---------|---------|----------|
| TC-EMB-001 | 分块函数处理 500 字文本 | 返回 1 个分块，内容完整 | - | - |
| TC-EMB-002 | 分块函数处理 1500 字文本 | 返回 3 个分块，每个约 500 字 | - | - |
| TC-EMB-003 | 分块函数处理边界（499 字） | 返回 1 个分块 | - | - |
| TC-EMB-004 | 分块函数处理边界（501 字） | 返回 2 个分块 | - | - |
| TC-EMB-005 | 分块保留句子完整性（不截断句子） | 分块边界不在句子中间 | - | - |
| TC-EMB-006 | Embedding API 调用成功 | 返回 1536 维度向量数组 | - | - |
| TC-EMB-007 | Embedding API 超时处理 | 10s 后触发重试，失败返回 error | - | - |
| TC-EMB-008 | API Key 缺失时调用 | 返回 `{success: false, error: "API Key 未配置"}` | - | - |
| TC-EMB-009 | addDocument 后 getAllVectors | 返回包含所有已添加文档的向量数组 | - | - |
| TC-EMB-010 | 空文本调用 addDocument | 返回 `{success: false, error: "文本内容为空"}` | - | - |

### 问题清单

| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |

---

## 项目目录结构（tree 形式）

- 参考：`md/项目结构.md`

## 项目 git commit 规范

- 参考：`md/Git提交规范.md`

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step8.md - 实现 Embedding 向量化服务
