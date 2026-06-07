## 9. 后端 Mock 模块

### 9.1 API 路由结构

```
api/
├── auth/
│   ├── login.post.ts      # 登录
│   ├── logout.post.ts     # 登出
│   ├── refresh.post.ts    # Token 刷新
│   └── codes.ts          # 验证码
├── model/
│   ├── list.ts           # 模型列表
│   ├── info.ts           # 模型详情
│   ├── config.ts         # 模型配置
│   ├── units.ts          # 单位列表
│   └── metric/list.ts    # 指标列表
├── instance/
│   ├── list.ts           # 版本列表
│   └── info.ts           # 版本详情
├── economodel/
│   └── currencydictionary/list.ts  # 币种列表
├── investsystem/
│   └── projectbase/
│       ├── findAllByProfCompy.ts   # 投资公司列表
│       └── findAllByProject.ts      # 项目列表
└── table/
    └── list.ts           # 表格数据
```

---
