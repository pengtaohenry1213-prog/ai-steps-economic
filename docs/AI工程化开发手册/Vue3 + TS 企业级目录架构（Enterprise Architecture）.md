# 🏗 Vue3 + TS 企业级目录架构（Enterprise Architecture）

适用于：

- Vue3
    
- TypeScript
    
- Vben Admin
    
- 中大型后台系统
    
- AI工程化开发
    
- Monorepo / 微前端（可扩展）
    

目标：

```text
高可维护
高扩展
低耦合
AI友好
多人协作
长期演进
```

---

# 🚀 一、最终推荐目录（企业级）

```text
src/
├── api/                    # API层
├── apps/                   # 子应用（微前端可扩展）
├── assets/                 # 静态资源
├── components/             # 全局公共组件
├── composables/            # 通用组合式逻辑
├── config/                 # 全局配置
├── constants/              # 常量
├── directives/             # 自定义指令
├── enums/                  # 枚举
├── hooks/                  # hooks（偏业务）
├── layouts/                # 布局
├── locales/                # i18n
├── model/                  # 全局类型
├── plugins/                # 插件
├── router/                 # 路由
├── services/               # 业务服务层
├── stores/                 # Pinia
├── styles/                 # 样式
├── types/                  # 类型扩展
├── utils/                  # 工具
├── views/                  # 页面
├── workers/                # WebWorker
├── permission/             # 权限系统
├── scheduler/              # 调度器
└── bootstrap/              # 启动流程
```

---

# 🧠 二、核心分层思想（关键）

企业级项目必须分层。

---

# 📌 推荐分层

```text
UI层
 ↓
Hooks层
 ↓
Service层
 ↓
API层
 ↓
Backend
```

---

# ❌ 禁止：

```text
Vue页面直接请求API
Vue页面直接写复杂业务
```

---

# ✅ 正确：

```text
index.vue
 ↓
useUser.ts
 ↓
userService.ts
 ↓
userApi.ts
```

---

# 🧱 三、views 页面架构（核心）

---

# 📌 页面目录标准

```text
views/
└── user/
    ├── index.vue
    ├── model.ts
    ├── constants.ts
    ├── hooks/
    ├── services/
    ├── utils/
    ├── components/
    ├── schemas/
    ├── enums/
    └── tests/
```

---

# 📌 页面职责

|文件|职责|
|---|---|
|index.vue|页面UI|
|hooks|页面逻辑|
|services|页面业务|
|schemas|表单配置|
|model.ts|类型|
|utils|数据处理|

---

# 🚨 四、Vue 页面规范（强制）

---

# 📌 index.vue 只做：

- UI
    
- 事件绑定
    
- hooks调用
    

---

# ❌ 禁止：

- 写复杂逻辑
    
- 写 fetch
    
- 写大型计算
    
- 写公式引擎逻辑
    

---

# 📌 页面最大限制

|类型|行数|
|---|---|
|Vue页面|≤ 300|
|hooks|≤ 200|
|utils|≤ 150|

超过必须拆分。

---

# 🧠 五、Hooks 分层（很重要）

---

# 📌 hooks 分类

```text
hooks/
├── business/      # 业务hooks
├── ui/            # UI hooks
├── state/         # 状态hooks
├── request/       # 请求hooks
└── table/         # 表格hooks
```

---

# 📌 示例

```ts
useUserTable
useUserForm
useFormulaEngine
useCellSelection
```

---

# 📌 hooks原则

一个 hook：

- 一个职责
    
- 一个核心能力
    
- 可测试
    

---

# ⚙️ 六、API 架构（推荐）

---

# 📌 API层

```text
api/
├── user/
│   ├── user.api.ts
│   ├── user.model.ts
│   └── user.mock.ts
```

---

# 📌 Service层

负责：

- 数据转换
    
- 业务聚合
    
- 缓存
    
- 错误处理
    

---

# 📌 推荐：

```text
api = 网络请求
service = 业务逻辑
```

---

# 🧩 七、组件架构（重点）

---

# 📌 组件分类

```text
components/
├── base/              # 基础组件
├── business/          # 业务组件
├── table/             # 表格组件
├── form/              # 表单组件
├── modal/             # 弹窗
├── chart/             # 图表
└── excel/             # 在线Excel
```

---

# 📌 组件职责

|类型|职责|
|---|---|
|base|完全通用|
|business|业务复用|
|page|页面局部|

---

# 🚨 八、Store 架构（Pinia）

---

# 📌 Store 目录

```text
stores/
├── user/
├── app/
├── permission/
├── cache/
└── formula/
```

---

# 📌 Store 原则

Store 只负责：

- 全局状态
    
- 缓存
    
- 权限
    
- 用户
    

---

# ❌ 禁止：

页面临时状态进入 store。

---

# 🧠 九、在线Excel架构（你重点）

这是你最值得重视的部分。

---

# 📌 推荐目录

```text
excel/
├── engine/
├── parser/
├── graph/
├── formula/
├── renderer/
├── worker/
├── dependency/
└── history/
```

---

# 📌 Formula Engine 分层

```text
公式字符串
 ↓
Tokenizer
 ↓
AST
 ↓
Interpreter
 ↓
Dependency Graph
 ↓
计算结果
```

---

# 📌 关系图谱（你非常适合）

```text
A1 = B1 + C1
```

转：

```text
A1 -> B1
A1 -> C1
```

最终：

- Neo4j
    
- Graph visualization
    
- 联动更新
    

---

# ⚡ 十、性能架构（核心）

---

# 📌 大型表格必须：

- 虚拟滚动
    
- WebWorker
    
- 增量更新
    
- 局部渲染
    
- 缓存层
    

---

# 📌 推荐：

```text
主线程 = UI
Worker = Formula计算
```

---

# 🔐 十一、安全架构

---

# 📌 必须：

- Token隔离
    
- API封装
    
- 权限中台
    
- sanitize HTML
    

---

# 📌 禁止：

```vue
v-html
```

---

# 🧪 十二、测试架构

---

# 📌 tests结构

```text
tests/
├── unit/
├── integration/
├── e2e/
└── performance/
```

---

# 📌 重点测试：

- hooks
    
- formula
    
- parser
    
- graph
    

---

# 🤖 十三、AI工程化目录（未来核心）

---

# 📌 推荐新增：

```text
ai/
├── prompts/
├── agents/
├── review/
├── memory/
├── context/
└── workflows/
```

---

# 📌 Prompt 分类

```text
prompts/
├── coding/
├── review/
├── testing/
├── architecture/
└── document/
```

---

# 🚀 十四、Monorepo（未来推荐）

大型项目建议：

```text
apps/
packages/
```

---

# 📌 packages

```text
packages/
├── ui/
├── utils/
├── formula-engine/
├── graph-engine/
├── eslint-config/
└── ts-config/
```
