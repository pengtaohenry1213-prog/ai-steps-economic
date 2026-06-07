import { ref } from 'vue';

// 动画池（维护每次修改前的旧数据）
const animationData: any = ref(new Map());
const expireTime = 10 * 1000;
// 高亮信息
const highlight: any = ref({
  enabled: false,
  metricCode: null,
  field: null,
});

// 时间戳监听 + 惰性清理
export function useAnimationData() {
  const add = (key: string, value: number | string | undefined) => {
    if (animationData.value.has(key)) return;
    animationData.value.set(key, { value, timestamp: Date.now() });
  };
  const get = (key: string) => {
    const item = animationData.value.get(key);
    if (!item) return undefined;

    // 访问时检查过期（惰性过期检查）
    if (Date.now() - item.timestamp >= expireTime) {
      animationData.value.delete(key);
      return undefined;
    }

    return item.value;
  };
  // 计算完成后检查过期（惰性过期检查）
  const check = () => {
    const now = Date.now();
    for (const [key, item] of animationData.value.entries()) {
      if (now - item.timestamp >= expireTime) {
        animationData.value.delete(key);
      }
    }
  };

  return {
    hasAnimationData: (key: string) => animationData.value.has(key),
    addAnimationData: add,
    getAnimationData: get,
    checkAnimationData: check,
    clearAnimationData: () => animationData.value.clear(),
    highlight,
  };
}
