
# 🎯 任务目标

开发 /api/file/upload 接口，实现文件接收、校验、解析返回文本

## 🧱 项目背景

后端需解析用户上传的PDF/Word文档，提取文本内容用于后续RAG流程，该接口是数据入口。

## 📋 任务要求

* 在 src/routes/file.route.ts 中实现 POST /api/file/upload 接口
* 使用 multer 处理 multipart/form-data 上传，限制单文件≤10MB、仅允许.pdf/.docx
* PDF解析使用 pdf-parse，Word解析使用 mammoth，封装到 src/services/file.service.ts
* 接口返回结构化数据：{ success: boolean, data: { text: string }, error: string }
* 完整错误处理（文件类型/大小错误、解析失败、空文件、multer异常等）

## ⚠️ 强约束

* 所有请求/响应使用 TS 类型定义（FileUploadRequest、FileUploadResponse等）
* 解析逻辑封装到service层，路由仅负责接收请求和返回响应
* 不要将解析后的大文本存储到内存（仅返回，后续Embedding时再处理）

## 📤 输出格式

### 文件1：src/routes/file.route.ts

```ts
// 路由定义ii完整代码
```

### 文件2：src/services/file.service.ts

```ts
// 文件解析逻辑完整代码
```

### 文件3：src/types/file.types.ts

```ts
// 文件相关类型定义完整代码
```

## 🚫 禁止行为

* 不要忽略文件大小限制
* 不要直接在路由中写解析逻辑
* 不要返回非结构化的错误信息

---

## 🧪 测试要求（参考 TEST Rule）

### 测试类型：接口测试 + 功能测试

### 测试范围

- 文件上传接口 `/api/file/upload`
* PDF/Word 文档解析功能
* 文件类型/大小校验逻辑

### 测试用例

| 用例ID | 测试场景 | 预期结果 | 实际结果 | 测试状态 |
|--------|---------|---------|---------|----------|
| TC-FILE-001 | 上传合法 PDF 文件（≤10MB） | 返回 `{success: true, data: {text: "..."}}`，提取到文本内容 | - | - |
| TC-FILE-002 | 上传合法 Word 文件（≤10MB） | 返回 `{success: true, data: {text: "..."}}`，提取到文本内容 | - | - |
| TC-FILE-003 | 上传超过 10MB 的文件 | 返回 `{success: false, error: "文件大小超过限制"}` | - | - |
| TC-FILE-004 | 上传不允许的文件类型（如 .txt） | 返回 `{success: false, error: "不支持的文件类型"}` | - | - |
| TC-FILE-005 | 上传损坏/空文件 | 返回 `{success: false, error: "文件解析失败"}` | - | - |
| TC-FILE-006 | 不带文件参数请求接口 | 返回 `{success: false, error: "未上传文件"}` | - | - |
| TC-FILE-007 | 连续上传多个文件 | 每个文件独立解析，返回对应文本 | - | - |

### 问题清单

| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |

---

## 项目目录结构（tree 形式）

- 参考：`md/项目结构.md`

## 项目 git commit 规范

- 参考：`md/Git提交规范.md`
  
> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step7.md - 实现文件上传解析 API
