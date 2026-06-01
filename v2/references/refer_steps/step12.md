
# 🎯 任务目标

将所有前端组件整合到对应页面，实现路由跳转和数据共享

## 🧱 项目背景

分散的组件需要整合为完整页面，实现“上传文档→跳转到对话页→进行对话”的完整流程。

## 📋 任务要求

1. 页面整合：
   * 文档上传页（DocumentUpload.vue）：整合 FileUpload + TextPreview
   * 智能对话页（IntelligentChat.vue）：整合 ChatList 组件
2. 路由配置：
   * 配置路由跳转（上传成功后一键跳转到对话页）
   * App.vue 添加导航栏（仅“上传文档”“智能对话”按钮）
3. 数据共享：
   * 通过Pinia存储上传的文本内容，页面切换数据不丢失
   * 对话页可读取Pinia中的文档文本，用于RAG对话
4. **对话页 API 调用（关键）**：
   * 调用流式对话接口 `POST /api/chat/stream`
   * **必须使用 `streamPost` 函数**（基于 Fetch API 的流式请求，不是普通 request.post）
   * 请求参数必须是 `{ question: string }`，**参数名必须是 `question`，不是 `message`**
   * **不需要 `history` 参数**，后端不支持此参数
   * 使用 `AbortController` 支持取消请求

## ⚠️ 强约束

* 页面切换时数据仅内存级存储（不持久化）
* 路由跳转逻辑清晰，有加载状态提示
* 所有交互符合用户直觉（如上传成功后按钮跳转）
* **API 调用参数名必须是 `question`，禁止使用 `message`**
* **必须使用 `streamPost` 流式请求，禁止使用普通 `request.post`**
* 创建助手消息占位符，实时更新 `content` 实现打字机效果

## 📤 输出格式

### 文件1：src/views/DocumentUpload.vue

```vue
// 上传页面整合代码
```

### 文件2：src/views/IntelligentChat.vue

```vue
// 对话页面整合代码
// 关键：必须使用 streamPost，参数名必须是 question
import { streamPost } from '@/utils/request';

const handleSend = async () => {
  // 创建用户消息
  const userMessage: Message = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: userInput.value.trim(),
    time: new Date().toLocaleString('zh-CN')
  };
  messages.value.push(userMessage);

  // 创建助手消息占位符（用于流式更新）
  const assistantMessage: Message = {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    content: '',
    time: new Date().toLocaleString('zh-CN')
  };
  messages.value.push(assistantMessage);

  // 使用 AbortController 支持取消
  const abortController = new AbortController();

  // ⚠️ 关键：使用 streamPost，参数是 { question: ... }
  streamPost(
    { question: userMessage.content },
    {
      onChunk: (text: string, done: boolean) => {
        assistantMessage.content += text;  // 实时追加文本
        scrollToBottom();
      },
      onFinish: () => {
        loading.value = false;
      },
      onError: (error: Error) => {
        ElMessage.error('发送消息失败：' + error.message);
        messages.value.pop();  // 移除失败的助手消息
        loading.value = false;
      }
    },
    abortController.signal
  );
};
```

### 文件3：src/App.vue

```vue
// 包含导航栏的根组件代码
```

### 文件4：src/store/modules/document.ts

```ts
// 文档数据存储的Pinia模块代码
```

## 🚫 禁止行为

* 不要省略页面空状态/加载状态
* 不要硬编码路由路径
* 不要忽略Pinia数据共享逻辑
* **不要使用 `message` 作为 API 参数名，必须用 `question`**
* **不要使用普通 `request.post` 调用流式接口，必须用 `streamPost`**
* **不要发送 `history` 参数，后端不支持**

---

## 🧪 测试要求（参考 TEST Rule）

### 测试类型：功能测试 + 兼容性测试

### 测试范围

- 上传页面整合
* 对话页面整合
* 路由跳转功能
* Pinia 数据共享

### 测试用例

| 用例ID | 测试场景 | 预期结果 | 实际结果 | 测试状态 |
|--------|---------|---------|---------|----------|
| TC-FRONT-001 | 上传 PDF 文件后跳转 | 成功上传后自动跳转到对话页 | - | - |
| TC-FRONT-002 | 上传 Word 文件后跳转 | 成功上传后自动跳转到对话页 | - | - |
| TC-FRONT-003 | 对话页读取上传文本 | 对话页能从 Pinia 读取文档内容 | - | - |
| TC-FRONT-004 | 页面切换数据不丢失 | 从上传页跳转到对话页，文档内容保持 | - | - |
| TC-FRONT-005 | 空文档文本提示 | 上传后文本为空时显示提示 | - | - |
| TC-FRONT-006 | 导航栏切换页面 | 点击按钮可切换上传/对话页 | - | - |
| TC-FRONT-007 | 上传中显示加载状态 | 上传时显示 loading 指示器 | - | - |
| TC-FRONT-008 | 上传失败显示错误 | 上传失败时显示错误提示 | - | - |
| TC-FRONT-009 | 对话历史列表渲染 | 历史对话列表正确显示 | - | - |
| TC-FRONT-010 | PC 浏览器兼容性 | Chrome/Firefox/Safari/Edge 正常显示 | - | - |

### 问题清单

| 序号 | 问题描述 | 严重级别 | 复现步骤 | 问题状态 |
|------|---------|---------|---------|----------|
| 1 | - | - | - | - |

---

## 项目目录结构（tree 形式）

- 参考：`md/项目结构.md`

## 项目 git commit 规范

- 参考：`md/Git提交规范.md`

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step12.md - 将所有前端组件整合到对应页面
