---
name: step3-plan
overview: 开发 TextPreview.vue 组件，展示解析后的文档文本，支持基础交互
todos:
  - id: create-text-preview
    content: 创建 TextPreview.vue 组件
    status: completed
  - id: create-tests
    content: 创建单元测试
    status: completed
  - id: run-tests
    content: 运行测试验证
    status: completed
isProject: false
---

# Step3 Plan: 文本预览组件

## 任务目标

开发 `TextPreview.vue` 组件，展示解析后的文档文本，支持基础交互

## 实现步骤

### 1. 创建 TextPreview.vue 组件

**文件位置：** `packages/frontend/src/components/TextPreview.vue`

```vue
<template>
  <div class="text-preview">
    <!-- 空状态 -->
    <div v-if="!text" class="empty-state">
      <p>请先上传并解析文档</p>
    </div>
    
    <!-- 文本内容 -->
    <template v-else>
      <div class="preview-header">
        <span class="text-length">当前文本长度：{{ textLength }}字</span>
        <el-button @click="handleCopy">
          <CopyIcon /> 复制全文
        </el-button>
      </div>
      
      <div class="preview-content">
        {{ text }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface Props {
  text: string;
}
const props = defineProps<Props>();

const textLength = computed(() => props.text.length);
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.text);
    ElMessage.success('复制成功');
  } catch {
    ElMessage.error('复制失败');
  }
};
</script>
```

### 2. 创建单元测试

**文件位置：** `packages/frontend/src/__tests__/TextPreview.test.ts`

测试用例：

- TC-PREVIEW-001: 空文本显示空状态提示
- TC-PREVIEW-002: 有文本时显示内容和字数统计
- TC-PREVIEW-003: 复制按钮点击成功
- TC-PREVIEW-004: 复制按钮点击失败处理

## 验收标准

- 接收 `text: string` prop
- 空状态显示"请先上传并解析文档"
- 显示文本长度统计
- 一键复制全文功能
- 复制成功/失败有提示
- 文本区域最大高度限制并支持滚动
- 响应式宽度自适应
- 单元测试通过

