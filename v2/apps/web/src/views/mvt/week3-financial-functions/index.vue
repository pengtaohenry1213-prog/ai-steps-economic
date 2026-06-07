<script setup lang="ts">
/**
 * Week3 Demo入口 - 财务函数兼容性验证
 */

import { ref, defineAsyncComponent } from 'vue'

const activeView = ref<'demo'>('demo')

// Demo 组件动态导入
const demos = {
  demo: defineAsyncComponent(() => import('./FinancialFunctionsDemo.vue'))
}
</script>

<template>
  <div class="week3-mvt">
    <div class="header">
      <h1>MVT Week3 - 财务函数兼容性验证</h1>
      <p class="subtitle">验证目标：XIRR/NPV/IRR 函数在 HyperFormula 中的兼容性</p>
    </div>

    <div class="demo-content">
      <component :is="demos[activeView]" />
    </div>

    <div class="footer">
      <h3>MVT/v1/week3 产出</h3>
      <ul>
        <li>✅ FinancialFunctionsDemo.vue - 财务函数验证组件</li>
        <li>✅ testCases.ts - XIRR/NPV/IRR 测试用例</li>
        <li>✅ 验证 HyperFormula 内置财务函数</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.week3-mvt {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  margin-bottom: 8px;
  color: #333;
}

.subtitle {
  color: #666;
}

.demo-content {
  background: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.footer {
  margin-top: 30px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.footer h3 {
  margin-bottom: 10px;
}

.footer ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer li {
  padding: 5px 0;
  color: #67c23a;
}
</style>