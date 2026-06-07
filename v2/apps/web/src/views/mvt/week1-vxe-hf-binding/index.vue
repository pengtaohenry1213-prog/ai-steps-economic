<script setup lang="ts">
/**
 * Week1 Demo入口 - MVT v1 Week1 工作目录
 *
 * 本目录包含 Week1 的三个验证 Demo:
 * 1. VxeTableDemo.vue - vxe-table 基础渲染
 * 2. HyperFormulaDemo.vue - HyperFormula 初始化
 * 3. BindingDemo.vue - 双向绑定核心验证
 */

import { ref, defineAsyncComponent } from 'vue'

const activeDemo = ref<'vxe' | 'hf' | 'binding'>('binding')

// Demo 组件动态导入 - 使用 defineAsyncComponent
const demos = {
  vxe: defineAsyncComponent(() => import('./VxeTableDemo.vue')),
  hf: defineAsyncComponent(() => import('./HyperFormulaDemo.vue')),
  binding: defineAsyncComponent(() => import('./BindingDemo.vue'))
}
</script>

<template>
  <div class="week1-mvt">
    <div class="header">
      <h1>MVT Week1 - vxe-table + HyperFormula 双向绑定验证</h1>
      <p class="subtitle">验证目标：vxe-table 与 HyperFormula双向绑定的可行性</p>
    </div>

    <div class="demo-tabs">
      <button
        :class="{ active: activeDemo === 'vxe' }"
        @click="activeDemo = 'vxe'"
      >
        Demo1: vxe-table 基础
      </button>
      <button
        :class="{ active: activeDemo === 'hf' }"
        @click="activeDemo = 'hf'"
      >
        Demo2: HyperFormula 基础
      </button>
      <button
        :class="{ active: activeDemo === 'binding' }"
        @click="activeDemo = 'binding'"
      >
        Demo3: 双向绑定 ⭐核心
      </button>
    </div>

    <div class="demo-content">
      <component :is="demos[activeDemo]" />
    </div>

    <div class="footer">
      <h3>MVT/v1/week1 产出</h3>
      <ul>
        <li>✅ 安装 vxe-table + hyperformula 依赖</li>
        <li>✅ VxeTableDemo.vue - vxe-table 基础渲染验证</li>
        <li>✅ HyperFormulaDemo.vue - HyperFormula 初始化验证</li>
        <li>✅ BindingDemo.vue - 双向绑定核心验证</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.week1-mvt {
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

.demo-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e4e7ed;
  padding-bottom: 10px;
}

.demo-tabs button {
  padding: 10px 20px;
  border: none;
  background: #f5f7fa;
  color: #606266;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  transition: all 0.3s;
}

.demo-tabs button:hover {
  background: #ecf5ff;
  color: #409eff;
}

.demo-tabs button.active {
  background: #409eff;
  color: white;
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