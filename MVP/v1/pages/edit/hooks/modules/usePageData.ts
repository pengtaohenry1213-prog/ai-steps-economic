import { ref } from 'vue';

const isDev = import.meta.env.DEV;

// 初始化页面池
const pageData: any = ref({});

export function usePageData() {
  // 以页面为单位添加数据
  const setPageData = (code: string, value: any) => {
    pageData.value[code] = value;
  };

  // 遍历所有页面更新指定单元格
  const update = (code: string, field: string, value: number | string) => {
    Object.values(pageData.value).forEach((data: any) => {
      data.forEach((row: any) => {
        if (code === row.metricCode) {
          row[field] = value;

          // 取单一值行的第一个有值的日期值回填单一值
          if ([0, '0'].includes(row.isFixed)) {
            const k: string | undefined = Object.keys(row).find(
              (key) => /^(?:\d{4}|\d{4}-[1-4])$/.test(key) && row[key],
            );
            row.isFixeds = k ? row[k] : '';
          }
        }
      });
    });
  };

  if (isDev) {
    (window as any).myPage = pageData.value;
  }

  return {
    pageData,
    setPageData,
    update,
    clear: () => {
      pageData.value = {};
    },
  };
}
