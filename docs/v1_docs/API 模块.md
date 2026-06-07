## 7. API 模块

### 7.1 请求封装

**文件位置**: `api/request.ts`

**核心配置**:

```typescript
const client = new RequestClient({
  baseURL: apiURL,
  timeout: 10_000_000_000,  // 10秒超时
});

// 请求拦截器
client.addRequestInterceptor({
  fulfilled: async (config) => {
    config.headers.Authorization = accessToken;
    config.headers['User-Code'] = userCode;
    config.headers['Accept-Language'] = locale;
    return config;
  },
});

// 响应拦截器 - 解构数据
client.addResponseInterceptor({
  fulfilled: (response) => {
    const { code, data, message } = response.data;
    if (code >= 200 && code < 400) {
      return data;
    }
    throw new Error(`Error ${status}: ${message}`);
  },
});

// Token 刷新
client.addResponseInterceptor(authenticateResponseInterceptor({
  doRefreshToken: async () => {
    const resp = await refreshTokenApi();
    accessStore.setAccessToken(resp.data);
  },
}));
```

---