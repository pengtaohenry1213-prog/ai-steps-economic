<script setup lang="ts">
import { ref } from 'vue';

import Decimal from 'decimal.js';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  scale: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'change']);
// console.log('props', props);
const localValue = ref<any>('');
const scale = Number(props.scale);

if (
  !Number.isNaN(scale) &&
  scale > 0 &&
  props.modelValue &&
  props.modelValue !== 'undefined' &&
  !Number.isNaN(Number(props.modelValue))
) {
  localValue.value = String(
    new Decimal(props.modelValue).div(scale).toNumber(),
  );
}
const onChange = (val: string) => {
  if (val === '') {
    emit('update:modelValue', '');
    emit('change', '');
  } else if (!Number.isNaN(scale) && scale > 0) {
    const res = new Decimal(val).mul(scale).toNumber();
    // 向父组件更新 v-model 值
    emit('update:modelValue', res);
    // 触发父组件 cellchange 事件
    emit('change', res);
  } else {
    emit('update:modelValue', '');
  }
};
</script>

<template>
  <el-input v-model="localValue" @change="onChange" />
</template>
