
# 🎯 任务目标

开发 ChatList.vue 组件，渲染对话列表并实现AI回答打字机流式效果

## 🧱 项目背景

用户与AI知识库对话时，需要直观展示对话记录，且AI流式回答需有打字机效果提升交互体验。

## 📋 任务要求

* 接收对话列表数据（TS类型：ChatItem = { id: string; role: 'user' | 'assistant'; content: string }）
* 渲染用户/AI消息气泡（样式区分角色）
* 接收AI流式回答的实时内容，实现逐字追加的打字机效果
* 回答过程中禁用重复发送（通过props控制）
* 空状态显示“请上传文档后提问”提示
* 封装打字机效果工具函数（基于setTimeout/requestAnimationFrame）

## ⚠️ 强约束

* 打字机效果需流畅无卡顿
* 流式内容追加时需保留历史对话，不覆盖
* 完整 TS 类型定义（props、emit、ChatItem类型）

## 📤 输出格式

### 文件1：src/components/ChatList.vue

```vue
// 完整可运行代码（模板+脚本+样式）
```

### 文件2：src/utils/typingEffect.ts

```ts
// 封装打字机效果的工具函数完整代码
```

## 🚫 禁止行为

* 不要用假数据模拟流式效果
* 不要忽略角色样式区分
* 不要省略空状态处理

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: step5.md - 开发消息展示组件
