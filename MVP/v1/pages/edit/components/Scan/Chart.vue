<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import echarts from '@vben/plugins/new-echarts';
import { preferences, usePreferences } from '@vben/preferences';

import { useData } from '../../hooks/index';
import { darkTheme, lightTheme } from './themes';

const props = defineProps({
  data: { type: Object, default: () => ({}) },
  dateFields: { type: Array, default: () => [] },
});
const { isDark } = usePreferences();
const { getRow } = useData();

// 创建一个响应式引用来保存DOM元素
const chartDom: any = ref(null);

// 创建echarts实例
let chartInstance: any = null;

// 使用 ResizeObserver 监听容器大小变化
const resizeObserver = new ResizeObserver(() => {
  chartInstance.resize();
});

// 初始化图表
const initChart = () => {
  // 如果存在实例，销毁实例
  chartInstance?.dispose();

  // 使用当前主题初始化
  const theme = isDark.value ? darkTheme : lightTheme;
  chartInstance = echarts.init(chartDom.value);

  // 处理数据
  const xData = props.dateFields;
  const series = [];
  const legend: any = [];
  const isMultiple = props.data.children && props.data.children.length > 0;
  if (isMultiple) {
    // 堆叠面积或多折线
    props.data.children.forEach((element: any, index: number) => {
      const obj = getRow(element.value);
      series.push({
        data: xData.map((k: string) => Number.parseFloat(obj[k]).toFixed(2)),
        name: element.label,
        type: 'line',
        symbol: 'circle',
        symbolSize: 4,
        stack: props.data.isStack ? 'Total' : null,
        areaStyle: props.data.isStack ? {} : { color: 'transparent' },
        emphasis: {
          focus: 'series',
        },
        itemStyle: { color: theme.series[index] },
        lineStyle: { color: theme.color[index] },
      });
      legend.push(element.label);
    });
  } else {
    // 基础折线
    const obj = getRow(props.data.value);
    series.push({
      data: xData.map((k: string) => Number.parseFloat(obj[k]).toFixed(2)),
      type: 'line',
      symbolSize: 4,
      symbol: 'circle',
    });
  }

  // 配置图表
  chartInstance.setOption({
    color: theme.color,
    title: {
      text: props.data.label,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal',
        color: theme.title,
      },
      top: isMultiple ? 'auto' : '5%',
    },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: number) =>
        props.data.percentage ? `${(value * 100).toFixed(2)}%` : value,
    },
    legend: {
      data: legend,
      top: '12%',
      textStyle: { color: theme.axisLabel },
    },
    grid: {
      top: isMultiple ? '28%' : '20%',
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisLine: {
        show: true, // 是否显示轴线
        lineStyle: {
          color: theme.axisLine, // 轴线颜色
          width: 1, // 轴线宽度
          type: 'solid', // 线类型（solid/dashed/dotted）
        },
      },
      axisLabel: { color: theme.axisLabel },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) =>
          props.data.percentage ? `${(value * 100).toFixed(2)}%` : value,
        color: theme.axisLabel,
      },
      name: props.data.unit,
      nameTextStyle: { color: theme.axisLabel },
      splitLine: {
        show: true, // 是否显示轴线
        lineStyle: {
          color: theme.splitLine, // 轴线颜色
          width: 1, // 轴线宽度
          type: 'solid', // 线类型（solid/dashed/dotted）
        },
      },
    },
    series,
  });
};

// 监听主题切换
// console.log(preferences);
watch(() => preferences.theme.mode, initChart);

onMounted(async () => {
  await nextTick(); // 确保DOM已经渲染完成
  initChart();
  // 开始观察容器
  resizeObserver.observe(chartDom.value);
});
onUnmounted(() => {
  chartInstance?.dispose(); // 销毁实例
  resizeObserver.disconnect(); // 取消观察
});
</script>
<template>
  <div>
    <div ref="chartDom" class="chart-container"></div>
  </div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  height: 300px;
  overflow: hidden;

  /* border: solid #fff 1px; */
}
</style>
