/* eslint-disable unicorn/prefer-structured-clone */
/**
 * @description 使用数据池做为页面池、ID池、公式池、变化池统一入口
 */

import { useAnimationData } from './useAnimationData';
import { useChangeData } from './useChangeData';
import { usePageData } from './usePageData';

const isDev = import.meta.env.DEV;

const { update: updatePageData } = usePageData();
const { setData: setChangeData, removeData: removeChangeData } =
  useChangeData();
const { addAnimationData } = useAnimationData();

let data: any = {}; // 数据池 {code: {2025: 100, ...}, ...}
let _data: any = {}; // 原始数据数据池（来源于查询、导入或保存成功后）
let visibleRows: string[] = []; // 视图范围内的指标集合

// 是否相等
const isEqual = (valA: any, valB: any) => {
  // console.log(`valA=${valA}`, `valB=${valB}`);
  const isEmpty = (value: any) =>
    ['', '0', 0, 'NaN', null, undefined, '空'].includes(value);
  // 都为空
  if (isEmpty(valA) && isEmpty(valB)) {
    return true;
  }
  // 都不为空
  if (!isEmpty(valA) && !isEmpty(valB)) {
    // eslint-disable-next-line eqeqeq
    return valA == valB;
  }
  // 一个为空一个不为空
  return false;
};

export function useData() {
  // 以行为单位设置数据
  const setData = (key: string, field: string, value: number | string) => {
    if (!data[key]) {
      data[key] = {};
    }
    data[key][field] = value;
  };
  // 获取单个数据
  const getData = (key: string, field: number | string) => {
    return data[key]?.[field];
  };
  // 克隆数据
  const clone = () => {
    _data = JSON.parse(JSON.stringify(data));
  };
  // 设置可视范围内的指标集合
  const setVisibleRows = (value: any) => {
    visibleRows = JSON.parse(value);
  };
  // 更新数据池
  const updateData = (code: string, field: string, value: number | string) => {
    // console.log('updateData', code, field, value);

    const oldValue = data[code]?.[field] || undefined;

    // 数据未变动
    if (isEqual(oldValue, value)) return;

    // 先更新修改前的旧值到动画池
    if (visibleRows.includes(code)) {
      addAnimationData(`${code}-${field}`, oldValue);
    }
    // 更新数据池
    data[code][field] = value;

    // if (code === 'C10001A0001') {
    //   console.log('C10001A0001 - oldValue', oldValue);
    //   console.log('C10001A0001 - newValue', value);
    // }
    // 更新页面池
    updatePageData(code, field, value);
    // 更新变化池
    if (isEqual(_data[code][field], value)) {
      // 与原始值相等
      removeChangeData(code, field);
    } else {
      // 与原始值不等
      setChangeData(code, field, value);
    }
  };

  if (isDev) {
    (window as any).myData = data;
  }

  return {
    setData,
    clone,
    updateData,
    getData,
    setVisibleRows,
    clearData: () => {
      data = {};
      _data = {};
      visibleRows = [];
    },
  };
}
