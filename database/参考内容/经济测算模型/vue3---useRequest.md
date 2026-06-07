const { loading: instanceLoading, runAsync: runInstance } = useRequest(
  () =>
    getInstance({
      versionCode: query.versionCode, // 版本代码
    }),
  {
    onSuccess(res) {
      // ... 处理返回数据
    },
  },
);

useRequest 是一个 Vue 组合式 API 的 hook，它返回了一个异步函数 runAsync 和一些状态.
关键点在于：useRequest 的第一个参数是一个函数，这个函数会在 useRequest 被调用时立即执行，除非设置了 manual: true。

在上面的代码中，useRequest 的配置中没有设置 manual: true，这意味着：
1. 当组件初始化时（useRequest 被调用时）
2. 传入的函数 () => getInstance({ versionCode: query.versionCode }) 会立即执行
