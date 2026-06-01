# Step 5 Plan: ChatList.vue + typingEffect.ts

## 📋 需求分析

### 任务目标
开发 ChatList.vue 组件，渲染对话列表并实现AI回答打字机流式效果

### 核心功能
1. **ChatList.vue 组件**
   - 接收对话列表数据（ChatItem[]）
   - 渲染用户/AI消息气泡（样式区分角色）
   - 实现AI流式回答的逐字追加打字机效果
   - 回答过程中禁用重复发送（通过props控制）
   - 空状态显示"请上传文档后提问"提示

2. **typingEffect.ts 工具函数**
   - 封装基于 setTimeout/requestAnimationFrame 的打字机效果
   - 支持流式内容追加
   - 流畅无卡顿

## 📤 输出文件

### 文件1: `packages/frontend/src/components/ChatList.vue`
```vue
<template>
  <!-- 消息列表容器 -->
  <!-- 空状态提示 -->
  <!-- 消息气泡（用户/助手区分样式） -->
  <!-- 打字机效果加载状态 -->
</template>

<script setup lang="ts">
// Props: chatList, isLoading
// Emits: 无（纯展示组件）
// 实现打字机效果
</script>

<style scoped>
/* 样式定义 */
</style>
```

### 文件2: `packages/frontend/src/utils/typingEffect.ts`
```ts
// TypingEffectOptions 接口
// createTypingEffect 函数
// 逐字显示 + requestAnimationFrame 优化
```

### 文件3: `packages/frontend/src/types/chat.ts`
```ts
// ChatItem 接口
// ChatListProps 接口
```

## ✅ 验收标准

- [ ] ChatList.vue 组件完整实现
- [ ] typingEffect.ts 工具函数完整实现
- [ ] ChatItem 类型定义完整
- [ ] 用户消息和助手消息样式区分
- [ ] 空状态提示显示"请上传文档后提问"
- [ ] 打字机效果流畅无卡顿
- [ ] 完整 TS 类型定义

## 🚧 开发步骤

1. 创建 `src/types/chat.ts` - 定义 ChatItem 类型
2. 创建 `src/utils/typingEffect.ts` - 实现打字机效果工具
3. 创建 `src/components/ChatList.vue` - 实现消息列表组件
