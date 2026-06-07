<!-- 使用自定义加载动画防止阻塞主线程，保证执行密集型任务时能保持流畅的动画效果 -->
<script setup lang="ts">
import { usePreferences } from '@vben/preferences';

const { isDark } = usePreferences();
</script>

<template>
  <div :class="{ dark: isDark }" class="overlay" @click.stop>
    <div class="spinner"></div>
    <p class="text">加载中...</p>
  </div>
</template>

<style scoped lang="less">
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  background-color: rgba(255, 255, 255, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 9999;
  transition: opacity 0.3s ease;
  .spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top-color: #3498db;
    animation: spin 1s ease-in-out infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .text {
    margin-top: 15px;
    font-size: 16px;
    color: #333;
    text-align: center;
  }
}
.overlay.dark {
  background-color: rgba(0, 0, 0, 0.3);
  .spinner {
    border-top-color: #3498db;
  }
  .text {
    color: #3498db;
  }
}
</style>
