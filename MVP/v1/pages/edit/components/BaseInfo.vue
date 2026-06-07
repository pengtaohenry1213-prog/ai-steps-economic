<script lang="ts" setup>
import { computed } from 'vue';

import { useModelStore } from '#/store/index';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}), // 提供空对象作为默认值
  },
});

const modelStore = useModelStore();

const list = computed(() => {
  let res = null;
  if (props.data) {
    const {
      investmentType,
      modelType,
      versionName,
      companyName,
      forecastTimeRange = '',
      currencyCode,
      projectName,
      targetIndustry,
    } = props.data;
    res = [
      { label: '投资类型', value: investmentType },
      { label: '模型类型', value: modelType },
      { label: '版本名称', value: versionName },
      { label: '专业化公司', value: companyName },
      // 预测时间（季度待处理）
      { label: '预测时间', value: forecastTimeRange.replace(',', '-') },
      // 获取货币名称 (币种列表 中find)
      {
        label: '货币类型',
        value: modelStore.currencyList.find(
          (item: any) => item.currencyCode === currencyCode,
        )?.currencyName,
      },
      { label: '项目名称', value: projectName },
      // 仅速算模型显示，完整模型下隐藏
      {
        label: '目标行业',
        value: targetIndustry,
        // hidden: modelType === '完整模型',
        hidden: false,
      },
    ];
  }
  return res;
});
</script>

<template>
  <div class="top_info">
    <div class="info_title">基础信息</div>
    <el-row class="info_content">
      <template v-for="item in list" :key="item.label">
        <el-col v-if="!item.hidden" :lg="6" :md="6" class="info_item">
          <span class="info__label"> {{ item.label }}： </span>
          {{ item.value }}
        </el-col>
      </template>
    </el-row>
  </div>
</template>

<style scoped lang="less">
.top_info {
  width: 100%;
  font-size: 12px;
  .info_title {
    margin: 10px;
    font-size: 14px;
    font-weight: bold;
    color: #61a6f2;
  }
  .info_content {
    padding: 5px 10px;
    .info_item {
      padding: 5px 0;
      white-space: nowrap;
      .info__label {
        font-weight: bold;
      }
    }
  }
}
</style>
