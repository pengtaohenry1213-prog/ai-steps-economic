---
name: step4-封装Fetch流式请求
overview: 在 utils/request.ts 中新增 Fetch 流式请求函数，支持 AI 流式回答的打字机效果
todos:
  - id: define-types
    content: 在 request.ts 中定义流式请求相关类型接口
    status: completed
  - id: implement-fetch-stream
    content: 实现 fetchStream 函数（基于 Fetch API + ReadableStream）
    status: completed
  - id: implement-stream-post
    content: 实现 streamPost 便捷封装函数
    status: completed
  - id: verify-types
    content: 验证 TypeScript 类型检查通过
    status: completed
isProject: false
---

## Step4 Plan - 封装 Fetch 流式请求函数

### 1. 定义类型接口

在 `packages/frontend/src/utils/request.ts` 中新增：

```ts
// 流式响应数据类型
export interface StreamResponse {
  content?: string;
  done?: boolean;
  error?: string;
}

// 流式回调函数类型
export interface StreamCallbacks {
  onChunk: (text: string, done: boolean) => void;
  onFinish: () => void;
  onError: (error: Error) => void;
}

// 流式请求配置类型
export interface StreamRequestConfig {
  url: string;
  params: Record<string, unknown>;
  callbacks: StreamCallbacks;
  signal?: AbortSignal;
}
```

### 2. 实现 fetchStream 函数

在 `request.ts` 中新增 `fetchStream` 函数：

- 使用 Fetch API + ReadableStream
- 逐行解析响应体（按 `\n` 分隔）
- 解析每行 JSON，调用 `onChunk` 传递文本
- `done: true` 时调用 `onFinish`
- 异常时调用 `onError`
- 支持 AbortController 取消请求

### 3. 导出便捷方法

新增 `streamPost` 便捷函数，封装常用配置：

```ts
export function streamPost(params: Record<string, unknown>, callbacks: StreamCallbacks, signal?: AbortSignal)
```

### 4. 更新文件结构

- 修改文件：`packages/frontend/src/utils/request.ts`
- 无需新增文件

---

### 验收标准

- `onChunk(text, done)` 能正确接收每个文本片段
- `onFinish()` 在流结束时被调用
- `onError(error)` 在网络错误时被调用
- 调用 `abort()` 可取消正在进行的请求
- 完整 TypeScript 类型定义无报错

---

## 执行日志

### 10:41

**操作**: 定义流式请求类型接口

**执行**:
- 读取文件: packages/frontend/src/utils/request.ts
- 新增 StreamResponse 接口
- 新增 StreamCallbacks 接口
- 新增 StreamRequestConfig 接口

**结果**: 完成

### 10:42

**操作**: 实现 fetchStream 函数

**执行**:
```ts
// 在 request.ts 中新增 fetchStream 函数
// 使用 Fetch API + ReadableStream
// 逐行解析 SSE 格式响应（data: {...}）
// 支持 AbortController 取消请求
// 正确处理 AbortError
```

**结果**: 完成

### 10:43

**操作**: 实现 streamPost 便捷封装函数

**执行**:
```ts
// 封装常用配置，默认请求 /chat/stream
// 自动携带 Authorization token
```

**结果**: 完成

### 10:44

**操作**: 验证 TypeScript 类型检查

**执行**:
```bash
pnpm -F @ai-ka/frontend type-check
```

**输出**: None of the selected packages has a "type-check" script

**执行**:
```bash
npx tsc --noEmit
```

**输出**: npm warn Unknown env config "devdir". This will stop working in the next major version of npm.

**备注**: 沙盒网络受限，使用本地 node_modules/.bin/tsc

**执行**:
```bash
cd packages/frontend && ./node_modules/.bin/tsc --noEmit
```

**输出**: 无错误

**结果**: 通过

### 10:44

**操作**: 所有 todos 完成

**结果**: 完成
