<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { useFormula } from '../hooks/index';

const props = defineProps({
  code: { type: String, default: '' },
});

const { getFormulaDetail } = useFormula();

const detail: any = ref({});
onMounted(() => {
  // console.log(props.code, getFormulaDetail(props.code));
  detail.value = getFormulaDetail(props.code);
  detail.value.remarks = detail.value.remarks
    ? detail.value.remarks.replaceAll('\n', '<br>')
    : detail.value.formulaName;
});
</script>
<template>
  <div class="title">科目名称</div>
  <div>{{ detail.metricName }}</div>

  <el-divider />
  <div class="title">指标编码</div>
  <div>{{ props.code }}</div>

  <template v-if="detail.remarks">
    <el-divider />
    <div class="title">指标描述</div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-html="detail.remarks"></div>
  </template>

  <template v-if="detail.formulaDescription">
    <el-divider />
    <div class="title">计算逻辑</div>
    <div>{{ detail.formulaDescription }}</div>
  </template>

  <template v-if="detail.formulaExpression">
    <el-divider />
    <div class="title">公式表达式</div>
    <div>{{ detail.formulaExpression }}</div>
  </template>
</template>

<style scoped lang="less">
div {
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
}

.title {
  font-weight: bold;
  margin-bottom: 20px;
}
</style>
