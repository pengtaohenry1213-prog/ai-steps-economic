
# 🎯 任务目标

在 utils/request.ts 中封装 Fetch 流式请求函数，适配AI流式回答

## 🧱 项目背景

前端需要接收后端流式返回的AI回答，实现打字机效果，需专门封装流式请求逻辑。

## 📋 任务要求

* 基于 Fetch API 编写（非 Axios）
* 接收请求URL、请求参数（用户问题）
* 逐行解析流式响应（JSON行格式：每行独立JSON，\n分隔）
* 通过回调函数传递数据：
  * onChunk：每段文本chunk和finish状态
  * onFinish：标记流式结束
  * onError：处理异常（网络中断、后端报错）
* 支持取消请求（AbortController）

## ⚠️ 强约束

* 完整 TS 类型定义（流式响应类型、回调函数类型）
* 必须处理流式响应的异常边界
* 函数需通用可复用，不耦合业务逻辑

## 📤 输出格式

### 文件：src/utils/request.ts

```ts
// 包含常规Axios请求 + 新增流式Fetch请求的完整代码
```

## 🚫 禁止行为

* 不要使用 Axios 实现流式请求
* 不要忽略 AbortController 取消请求逻辑
* 不要写死请求参数或URL

## 项目目录结构（tree 形式）

- 参考：`md/项目结构.md`

## 项目 git commit 规范

- 参考：`md/Git提交规范.md`

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step4.md - 封装 Fetch 流式请求函数
