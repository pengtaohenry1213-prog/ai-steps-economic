/* eslint-disable @typescript-eslint/no-dynamic-delete */

import { ref } from 'vue';
// 初始化变化数据池
const changeData: any = ref({});

export function useChangeData() {
  // 添加数据
  const setData = (code: string, field: number | string, value: any) => {
    if (!changeData.value[code]) {
      changeData.value[code] = {};
    }
    changeData.value[code][field] = value;
  };
  // 移除数据
  const removeData = (code: string, field: number | string) => {
    // 移除指标指定属性
    if (changeData.value[code]?.[field]) {
      delete changeData.value[code][field];
    }
    // 如果该指标属性为空，移除该指标
    if (
      changeData.value[code] &&
      Object.keys(changeData.value[code]).length === 0
    ) {
      delete changeData.value[code];
    }
  };

  return {
    changeData,
    setData,
    removeData,
    clear: () => {
      changeData.value = {};
    },
  };
}
