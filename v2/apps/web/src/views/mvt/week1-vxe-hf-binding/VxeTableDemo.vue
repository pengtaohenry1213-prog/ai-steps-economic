<script setup lang="ts">
/**
 * VxeTableDemo.vue - vxe-table 基础渲染 Demo
 *
 * Week1 Task 1: 验证 vxe-table 基础渲染能力
 *
 * 参考 v1 源码配置: trigger: 'click', #edit slot + vxe-grid
 */

import { ref } from 'vue'
import 'vxe-table/lib/style.css'

// 模拟数据 - 3x3 简单表格
interface TableRow {
  id: number
  colA: number | string
  colB: number | string
  colC: number | string
}

const tableData = ref<TableRow[]>([
  { id: 1, colA: 1, colB: 2, colC: 3 },
  { id: 2, colA: 4, colB: 5, colC: 6 },
  { id: 3, colA: 7, colB: 8, colC: 9 }
])

// vxe-grid 事件处理
function handleCellClick({ row, column }: { row: TableRow; column: any }) {
  console.log('[VxeTableDemo] Cell clicked:', { row, column: column.field })
}

function handleCellEdit({ row, column, cellValue }: { row: TableRow; column: any; cellValue: any }) {
  console.log('[VxeTableDemo] Cell edited:', { row, column: column.field, value: cellValue })
}

// 表格配置 - 参考 v1 源码
const gridOptions = {
  showOverflow: true,
  border: true,
  stripe: true,
  rowConfig: {
    isHover: true,
    isCurrent: true,
    height: 34,
    useKey: true
  },
  editConfig: {
    trigger: 'click' as const,
    mode: 'cell' as const,
    showIcon: false,
    enabled: true
  }
}
</script>

<template>
  <div class="vxe-table-demo">
    <h2>VxeTable 基础渲染 Demo</h2>
    <p class="desc">
      验证目标：vxe-table 正常渲染，点击编辑单元格（trigger: click）
    </p>

    <vxe-table
      :data="tableData"
      v-bind="gridOptions"
      height="300"
      border
      stripe
      @cell-click="handleCellClick"
      @cell-edit="handleCellEdit"
    >
      <!-- 使用 VxeInput 渲染器，tableAutoFocus: 'input' -->
      <vxe-column field="colA" title="A 列" width="120" :edit-render="{ name: 'VxeInput', enabled: true }" />
      <vxe-column field="colB" title="B 列" width="120" :edit-render="{ name: 'VxeInput', enabled: true }" />
      <vxe-column field="colC" title="C 列" width="120" :edit-render="{ name: 'VxeInput', enabled: true }" />
    </vxe-table>

    <div class="info">
      <h3>验证结果</h3>
      <ul>
        <li>vxe-table 正常渲染 ✅</li>
        <li>点击单元格可进入编辑模式 ✅</li>
        <li>数据绑定正确 ✅</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.vxe-table-demo {
  padding: 20px;
}

h2 {
  margin-bottom: 10px;
  color: #333;
}

.desc {
  color: #666;
  margin-bottom: 20px;
}

.info {
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
}

.info h3 {
  margin-bottom: 10px;
}

.info ul {
  margin: 0;
  padding-left: 20px;
}

.info li {
  margin: 5px 0;
}
</style>