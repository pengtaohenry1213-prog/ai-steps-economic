
# 🎯 任务目标

开发独立可复用的 FileUpload.vue 组件，支持PDF/Word上传、校验、解析调用

## 🧱 项目背景

AI智能知识库助手需要先上传解析文档，才能基于文档内容进行智能对话，该组件是核心入口。

## 📋 任务要求

* 基于 Vue3 Composition API + TS 编写
* 支持选择/拖拽上传 PDF (.pdf) / Word (.docx) 文件
* 前端校验：文件类型（仅允许pdf/docx）、文件大小（≤10MB），校验失败给出清晰文字提示
* 上传时显示进度条，成功/失败显示对应状态图标
* 调用后端 /api/file/upload 接口，解析返回文本并通过 emit 传递给父组件
* 组件样式简洁，仅保留核心交互（无需复杂UI）

## ⚠️ 强约束

* 必须添加完整 TS 类型定义（文件上传结果、错误类型等）
* 拖拽上传需处理边界（如多文件拖拽仅取第一个）
* 接口调用封装到 api/file.ts 中，组件仅调用封装方法
* **必须严格遵循后端 API 响应格式，不能假设返回结构**

## 📡 API 响应格式规范

### 后端接口：POST /api/file/upload

**请求格式：** `multipart/form-data`，字段名 `file`

**成功响应：**
```json
{
  "success": true,
  "data": {
    "text": "解析后的文档文本内容"
  },
  "error": null
}
```

**失败响应：**
```json
{
  "success": false,
  "data": null,
  "error": "错误描述信息"
}
```

**前端必须：**
1. 检查 `response.data.success` 判断请求是否成功
2. 从 `response.data.data.text` 获取解析后的文本
3. 从 `response.data.error` 获取错误信息
4. 不能假设响应直接包含 `content` 或 `filename` 字段

## 📤 输出格式

### 文件1：src/components/FileUpload.vue

```vue
// 完整可运行代码（模板+脚本+样式）
```

### 文件2：src/api/file.ts

```ts
// 封装文件上传/解析接口的完整代码

// 关键点：必须定义与后端匹配的响应类型
interface FileUploadResponse {
  success: boolean;
  data: {
    text: string;  // 注意：是 text 不是 content
  } | null;
  error: string | null;
}

// 上传函数示例
async function uploadFile(file: File): Promise<{ content: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<FileUploadResponse>('/api/file/upload', formData);

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || '上传失败');
  }

  // 必须从 response.data.data.text 获取文本
  return { content: response.data.data.text };
}
```

## 🚫 禁止行为

* 不要忽略文件大小/类型校验
* 不要硬编码接口地址
* 不要使用 Options API
* **不要假设 API 返回 `content` 或 `filename` 字段，必须严格按响应格式解析**

## 项目目录结构（tree 形式）

### 参考

```text
project/
├── frontend/
│   ├── views/
│   ├── router/
│   ├── components/
│   ├── store/
│   ├── utils/
│   └── api/
│
├── backend/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── types/
│   └── config/
```

## 生成 git commit message

请根据以下代码变更，生成一条规范的 git commit message：

### 要求

- 使用 feat/fix 等规范前缀
* 简洁清晰
* 一句话描述核心改动

### 代码如下

```bash
feat: add embedding service with chunking and vector storage
```

### AI友好型 commit 规范

## 📌 commit 模板

```bash
<type>: <简要描述>

<详细说明（可选）>
```

---

## 📌 type 规范

| 类型       | 含义    |
| -------- | ----- |
| feat     | 新功能   |
| fix      | 修复    |
| refactor | 重构    |
| chore    | 配置/构建 |
| docs     | 文档    |

---

## 📌 示例（你的项目）

```bash
feat: 初始化前端项目结构

feat: 实现文件上传组件（支持pdf/docx）

feat: 实现文本分块与embedding服务

feat: 实现余弦相似度计算工具

feat: 实现RAG检索逻辑（TopK）
```

## 项目目录结构（tree 形式）

- 参考：`md/项目结构.md`

## 项目 git commit 规范

- 参考：`md/Git提交规范.md`

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step2.md - 开发文件上传组件（支持pdf/docx）
