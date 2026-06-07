<script lang="ts" setup>
import Chart from './Chart.vue';

const menu = [
  {
    label: '融投一体',
    children: [
      { label: 'EBITDA利息覆盖倍数', value: 'C10001A0510' },
      { label: 'EBIT利息覆盖倍数', value: 'C10001A0511' },
      {
        label: '对每股净利润的影响（绝对值）',
        value: 'C10001A0512',
        unit: '单位：元/股',
      },
      {
        label: '对每股净利润的影响（百分比）',
        value: 'C10001A0513',
        percentage: true,
      },
      {
        label: '对每股净资产的影响（绝对值）',
        value: 'C10001A0514',
        unit: '单位：元/股',
      },
      {
        label: '对每股净资产的影响（百分比）',
        value: 'C10001A0515',
        percentage: true,
      },
      {
        label: '对资产总收益率的影响（百分比）',
        value: 'C10001A0516',
        percentage: true,
      },
    ],
  },
  {
    label: '投运一体',
    children: [
      { label: '项目交付销量', value: 'C10001A0428', unit: '单位：吨' },
      { label: '项目平均售价', value: 'C10001A0039', unit: '单位：元/吨' },
      { label: '其他收入比重', value: 'C10001A0517', percentage: true },
      { label: '单吨生产成本', value: 'C10001A0518', unit: '单位：元/吨' },
      {
        label: '运营费用分解',
        children: [
          { label: '财务费用', value: 'C10001A0522' },
          { label: '研发费用', value: 'C10001A0521' },
          { label: '管理费用', value: 'C10001A0520' },
          { label: '销售费用', value: 'C10001A0519' },
        ],
        unit: '单位：万元',
        isStack: true,
      },
    ],
  },
  {
    label: '业财一体',
    children: [
      { label: '净资产收益率', value: 'C10001A0499', percentage: true },
      { label: 'EBITDA回报率', value: 'C10001A0504' },
      {
        label: '常用利润指标分析一览',
        children: [
          { label: '毛利率', value: 'C10001A0530' },
          { label: '息税折旧摊销前利润率', value: 'C10001A0531' },
          { label: '息税前利润率', value: 'C10001A0532' },
          { label: '净利润率', value: 'C10001A0533' },
        ],
        percentage: true,
      },
      { label: '盈亏平衡点产量', value: 'C10001A0545' },
      { label: '人均销售额', value: 'C10001A0534', unit: '单位：万元/年' },
    ],
  },
];
</script>

<template>
  <div style="height: 100%; padding-top: 20px; overflow-y: scroll">
    <template v-for="item in menu" :key="item.label">
      <h2 style="padding: 40px 0 0 10px">{{ item.label }}</h2>
      <div class="wrap">
        <template v-for="child in item.children" :key="child.label">
          <Chart :data="child" v-bind="$attrs" />
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.wrap {
  display: grid;
  grid-template-columns: 1fr 1fr;

  /* 创建两列，每列宽度相等 */
  gap: 20px;

  /* 设置列间距 */
}
</style>
