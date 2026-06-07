<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Minus, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

import {
  getProductInstanceList,
  getProductList,
  saveProductInstance,
} from '#/api/index';

// props、emit
const props = defineProps({
  data: {
    type: Object,
    default: () => ({}), // 提供空对象作为默认值
  },
});
const emit = defineEmits(['update', 'cancel']);
console.log(props);
// form
const productFormRef: any = ref();
const formData: any = ref({});
const rules = {
  productName: {
    required: true,
    message: '请输入产品名称',
    trigger: 'change',
  },
};

// 产品数据
let cloneData: any = []; // 记录数据
let productList: any = []; // 20行产品列表

const loading = ref<boolean>(true);
onMounted(async () => {
  // 查询版本产品
  formData.value.products = await getProductInstanceList({
    versionCode: props.data.versionCode,
    orderBy: 'sort asc',
  });

  // eslint-disable-next-line unicorn/prefer-structured-clone
  cloneData = JSON.parse(JSON.stringify(formData.value.products));

  // 查询20行产品列表
  productList = await getProductList({
    category: 'common',
    // modelCode: props.data.modelCode,
    orderBy: 'sort asc',
  });
  loading.value = false;
});

// 获取下一个产品序号
const getNextNum = () => {
  // 初始序号
  const numbers = Array.from({ length: 20 }, (_, i) => i + 1);
  // 已使用序号
  const used = formData.value.products.map((e: any) => e.sort);
  return numbers.find((item) => !used?.includes(item));
};

// 增
const productPlus = () => {
  if (formData.value.products.length === 20) {
    ElMessage({
      type: 'error',
      message: '最多添加20个产品',
    });
    return;
  }
  formData.value.products.push({ productName: '', sort: getNextNum() });
};

// 减
const productMinus = (i: number) => {
  if (formData.value.products.length === 1) {
    ElMessage({
      type: 'error',
      message: '最少保留1个产品',
    });
    return;
  }
  formData.value.products.splice(i, 1);
};

// 根据指定key 对比数组对象
const diff = (arrA: any[], arrB: any[], key: string) => {
  // 交集（重叠部分）
  const intersection = arrA.filter((itemA) =>
    arrB.some((itemB) => itemA[key] === itemB[key]),
  );

  // A相对于B的差集（在A中但不在B中的元素）
  const differenceA = arrA.filter(
    (itemA) => !arrB.some((itemB) => itemA[key] === itemB[key]),
  );

  // B相对于A的差集（在B中但不在A中的元素）
  const differenceB = arrB.filter(
    (itemB) => !arrA.some((itemA) => itemA[key] === itemB[key]),
  );

  return {
    intersection,
    differenceA,
    differenceB,
  };
};

const onSubmit = async () => {
  const validate = await productFormRef.value!.validate();
  if (!validate) {
    ElMessage({ type: 'error', message: '请检查必填项' });
    return;
  }
  // 组装提交数据
  const {
    intersection, // sort交集
    differenceA: delData, // 原始数据里有，修改后没有，是删除
    differenceB: addData, // 原始数据没有，修改后有，是新增
  } = diff(cloneData, formData.value.products, 'sort');
  // sort交集继续比对 productName，获取修改项
  const changeData: any = [];
  intersection.forEach(({ sort }: any) => {
    const objA: any = cloneData.find((e: any) => e.sort === sort);
    const objB: any = formData.value.products.find((e: any) => e.sort === sort);
    if (objA.productName !== objB.productName) {
      Object.assign(objA, objB); // 使用objB覆盖objA，用来保留objA的id、productCode属性
      changeData.push(objA);
    }
  });
  // 删除项添加 delFlag 属性
  delData.forEach((item: any) => {
    item.delFlag = 1;
  });
  // 新增项添加 productCode 属性
  addData.forEach((item: any) => {
    const obj: any = productList.find(
      (product: any) => product.sort === item.sort,
    );
    item.productCode = obj.productCode;
  });

  const arr: any = [...changeData, ...delData, ...addData];
  if (arr.length === 0) {
    ElMessage({ type: 'error', message: '数据未变动' });
    return;
  }

  arr.forEach((item: any) => {
    item.versionCode = props.data.versionCode;
  });
  arr.sort((a: any, b: any) => a.sort - b.sort); // ASC

  const res = await saveProductInstance(arr, props.data.modelCode);
  if (res) {
    ElMessage({ type: 'success', message: '编辑成功' });
    emit('update');
  }
};
</script>

<template>
  <div v-loading="loading">
    <el-form
      ref="productFormRef"
      :model="formData"
      label-suffix="："
      label-width="120"
      style="max-height: 50vh; overflow-y: scroll"
    >
      <el-form-item
        v-for="(item, index) in formData.products"
        :key="index"
        :label="`产品${item.sort}`"
        :prop="`products[${index}].productName`"
        :rules="rules.productName"
        style="display: flex"
      >
        <el-input
          v-model="item.productName"
          placeholder="请输入产品名称"
          style="flex: 1; margin-right: 20px"
        />
        <el-popconfirm
          title="删除产品会导致已填写数据丢失，是否确认删除？"
          @confirm="productMinus(index)"
        >
          <template #reference>
            <el-button :icon="Minus" circle />
          </template>
        </el-popconfirm>
      </el-form-item>
      <el-form-item>
        <el-button :icon="Plus" circle type="primary" @click="productPlus()" />
      </el-form-item>
    </el-form>
    <div class="dialog-footer">
      <el-button @click="emit('cancel')">取消</el-button>
      <el-button type="primary" @click="onSubmit">确定</el-button>
    </div>
  </div>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}
</style>
