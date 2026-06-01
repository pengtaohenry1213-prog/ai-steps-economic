
# 🎯 任务目标

封装豆包 Embedding API 调用，包含超时、重试、错误处理

## 🧱 项目背景

RAG 系统需要将文本转换为向量才能进行相似度计算，Embedding 是核心基础设施。

## 豆包配置信息
参考： ~/config/doubao-model.md

## 📋 任务要求

1. Embedding API 封装（src/services/embedding.service.ts）：
   * 调用豆包 Embedding API
   * API 地址：POST <https://ark.cn-beijing.volces.com/api/v3/embeddings/text-embedding>
   * 请求格式：{ input: string[], model: "doubao-embedding-v1" }
   * 响应处理：提取 embedding 向量数组
2. 错误处理与重试：
   * 超时设置：10 秒
   * 重试机制：失败后重试 2 次
   * 完整错误捕获：网络错误、API 错误、超时等
3. TS 类型定义：

   ```ts
   interface EmbeddingRequest {
     input: string[];
     model: string;
   }
   
   interface EmbeddingResponse {
     data: Array<{
       embedding: number[];
       index: number;
     }>;
   }
   
   interface EmbeddingResult {
     success: boolean;
     data?: number[];
     error?: string;
   }
   ```

4. 从配置读取：
   * API 密钥从 src/config 读取
   * API 地址从 src/config 读取

## ⚠️ 强约束

* 必须使用 TS 定义请求/响应类型
* 必须实现重试机制（2 次）
* 必须设置超时（10 秒）
* 必须从配置读取 API 密钥

## 📤 输出格式

### 文件1：src/services/embedding.service.ts

```ts
// Embedding 服务完整代码
```

## 🚫 禁止行为

* 不要硬编码 API 密钥
* 不要忽略错误处理
* 不要使用同步请求

---

## 🧪 测试要求（参考 TEST Rule）

### 测试类型：接口测试 + 功能测试

### 测试范围

- Embedding API 调用
* 超时和重试机制
* 错误处理

### 测试用例

| 用例ID | 测试场景 | 预期结果 | 实际结果 | 测试状态 |
|--------|---------|---------|---------|----------|
| TC-EMB-API-001 | 正常调用 Embedding API | 返回 1536 维度向量数组 | - | - |
| TC-EMB-API-002 | 单文本调用 | 返回单个向量 | - | - |
| TC-EMB-API-003 | 多文本批量调用 | 返回多个向量，按顺序对应 | - | - |
| TC-EMB-API-004 | API 超时（>10s） | 10s 后触发重试 | - | - |
| TC-EMB-API-005 | API 第一次失败重试 | 最多重试 2 次 | - | - |
| TC-EMB-API-006 | API 全部失败 | 返回 `{success: false, error: "..."}` | - | - |
| TC-EMB-API-007 | API Key 缺失 | 返回 `{success: false, error: "API Key 未配置"}` | - | - |
| TC-EMB-API-008 | 网络错误 | 捕获错误，返回错误信息 | - | - |
| TC-EMB-API-009 | API 返回错误状态码 | 捕获 HTTP 错误，返回错误信息 | - | - |
| TC-EMB-API-010 | 空文本数组调用 | 返回 `{success: false, error: "..."}` | - | - |
| TC-EMB-API-011 | 返回值类型正确 | data 为 number[] 类型 | - | - |

### 问题清单

| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |

---

## 项目目录结构（tree 形式）

- 参考：`md/项目结构.md`

## 项目 git commit 规范

- 参考：`md/Git提交规范.md`

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step18.md - 封装豆包 Embedding API 调用
