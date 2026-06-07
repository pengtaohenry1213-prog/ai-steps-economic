<script lang="ts" setup>
import { ref } from 'vue';

import { ElMessage } from 'element-plus';

import { useModelStore } from '#/store/index';

const emit = defineEmits(['submit', 'cancel']);
const { unitTree } = useModelStore();
const groupValue: any = ref({});
const onSubmit = () => {
  console.log('submit!', groupValue.value);
  if (Object.keys(groupValue.value).length === 0) {
    ElMessage.error('请选择单位');
    return;
  }

  // 组装需要变更的unitCode集合：key为变更前，value为变更后
  const obj: any = {};
  unitTree.forEach((item: any) => {
    const val = groupValue.value[item.categoryCode];
    if (!val) return;

    item.unitList.forEach((child: any) => {
      if (child.unitCode !== val) {
        obj[child.unitCode] = val;
      }
    });
  });
  console.log('submit!', obj);
  emit('submit', obj);
};
</script>

<template>
  <el-form label-suffix="：" label-width="120">
    <template v-for="item in unitTree" :key="item.categoryCode">
      <el-form-item :label="item.categoryName">
        <el-radio-group v-model="groupValue[item.categoryCode]">
          <el-radio
            v-for="child in item.unitList"
            :key="child.unitCode"
            :label="child.unitName"
            :value="child.unitCode"
          />
        </el-radio-group>
      </el-form-item>
    </template>
  </el-form>
  <div class="dialog-footer">
    <el-button @click="emit('cancel')">取消</el-button>
    <el-button type="primary" @click="onSubmit">批量修改</el-button>
  </div>
</template>

<style scoped>
.el-radio {
  min-width: 5em;
}

.dialog-footer {
  display: flex;
  justify-content: center;
}
</style>
