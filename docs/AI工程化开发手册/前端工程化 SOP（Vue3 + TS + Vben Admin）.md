# 🧠 前端工程化 SOP（Vue3 + TS + Vben Admin）

适用于：

- Vue3
    
- TypeScript
    
- Vben Admin
    
- Element Plus
    
- Pinia
    
- Vue Router
    
- Axios / Fetch
    
- Handsontable / vxe-table（可扩展）
    

目标：

- 可维护
    
- 可扩展
    
- AI友好
    
- 工程化
    
- 适合多人协作
    
- 适合 Cursor / Claude Code / Codex
    

---

# 📦 一、项目目录标准（强制）

```text
src/
├── api/                # 接口层
├── assets/             # 静态资源
├── components/         # 公共组件
├── composables/        # 组合式逻辑
├── constants/          # 常量
├── directives/         # 指令
├── enums/              # 枚举
├── hooks/              # hooks
├── layouts/            # 布局
├── router/             # 路由
├── stores/             # pinia
├── styles/             # 样式
├── types/              # 全局类型
├── utils/              # 工具函数
├── views/              # 页面
├── model/              # interface/type
└── plugins/            # 插件
```

---

# 🧱 二、模块拆分规范（核心）

---

## 📌 2.1 页面结构标准

```text
views/user/
├── index.vue
├── model.ts
├── service.ts
├── hooks.ts
├── constants.ts
├── utils.ts
└── components/
```

---

## 📌 2.2 职责分离（必须）

|文件|职责|
|---|---|
|index.vue|页面UI|
|service.ts|API请求|
|hooks.ts|业务逻辑|
|model.ts|类型定义|
|utils.ts|数据处理|
|constants.ts|常量|

---

# 🚨 三、禁止事项（非常重要）

---

## ❌ 禁止在 Vue 文件里：

- 直接写复杂业务逻辑
    
- 直接写 fetch/axios
    
- 直接写大段 if-else
    
- 定义大量 interface/type
    
- 写超过 300 行
    

---

## ❌ 禁止：

```ts
const data: any = {};
```

---

## ❌ 禁止：

```ts
if (type === 1) {}
else if (type === 2) {}
else if (type === 3) {}
```

改为：

```ts
const strategyMap = {
  1: fn1,
  2: fn2,
  3: fn3,
};
```

---

# 🧠 四、TypeScript 工程规范

---

# 📌 4.1 tsconfig 强制配置

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

---

# 📌 4.2 类型文件规范

统一：

```text
model.ts
```

例如：

```ts
export interface UserInfo {
  id: string;
  name: string;
}
```

---

# 📌 4.3 API返回统一结构

```ts
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
```

---

# ⚙️ 五、API 工程化规范

---

# 📌 5.1 接口层结构

```text
api/
├── user/
│   ├── index.ts
│   ├── model.ts
```

---

# 📌 5.2 请求禁止直接写页面中

❌：

```ts
onMounted(async () => {
  const res = await axios.get('/api/user');
});
```

✅：

```ts
// service.ts
export async function getUserList() {}
```

---

# 📌 5.3 API命名规范

```ts
getUserList
createUser
updateUser
deleteUser
```

禁止：

```ts
query
data
list
```

---

# 🧩 六、组件工程化规范

---

# 📌 6.1 组件分类

|类型|目录|
|---|---|
|通用组件|components/common|
|业务组件|views/**/components|
|弹窗组件|components/modal|

---

# 📌 6.2 单组件职责

一个组件：

- 只负责一个功能
    
- props 不超过 10 个
    
- emits 必须定义类型
    

---

# 📌 6.3 Props规范

```ts
interface Props {
  visible: boolean;
  userId: string;
}
```

禁止：

```ts
props: ['data']
```

---

# 🧠 七、状态管理规范（Pinia）

---

# 📌 7.1 store职责

store：

- 共享状态
    
- 用户信息
    
- 权限
    
- 全局缓存
    

禁止：

- 页面临时状态
    

---

# 📌 7.2 store拆分

```text
stores/
├── user.ts
├── app.ts
├── permission.ts
```

---

# ⚡ 八、性能优化 SOP

---

# 📌 8.1 页面优化

必须：

- 懒加载路由
    
- 虚拟列表（大数据）
    
- 防抖/节流
    
- computed缓存
    

---

# 📌 8.2 watch规范

禁止：

```ts
watch(obj, () => {}, {
  deep: true
});
```

除非必要。

---

# 📌 8.3 表格优化（你重点）

对于：

- Handsontable
    
- vxe-table
    

必须：

- 分页
    
- 行虚拟化
    
- 防止全量diff
    
- 单元格局部更新
    

---

# 🔐 九、安全规范

---

# 📌 9.1 禁止

```vue
<div v-html="html" />
```

除非经过 sanitize。

---

# 📌 9.2 Token

禁止：

```ts
localStorage.setItem('token', token);
```

推荐：

- httpOnly cookie
    
- 或加密缓存
    

---

# 🧪 十、测试工程化

---

# 📌 10.1 单测范围

必须测试：

- utils
    
- hooks
    
- store
    
- formula逻辑（你项目重点）
    

---

# 📌 10.2 推荐

|类型|工具|
|---|---|
|单测|Vitest|
|组件测试|Vue Testing Library|
|E2E|Playwright|

---

# 🧹 十一、代码规范（强制）

---

# 📌 ESLint

必须：

```bash
eslint
typescript-eslint
unicorn
import
vue
```

---

# 📌 Prettier

统一：

- 单引号
    
- trailingComma
    
- semi
    

---

# 📌 Husky

提交前自动：

```bash
lint
typecheck
test
```

---

# 🚀 十二、AI协作开发 SOP（重点）

---

# 📌 Cursor / Claude Code 正确流程

---

## ❌ 错误方式

```text
帮我写个页面
```

---

## ✅ 正确方式

```text
【任务】
实现用户管理页面

【技术栈】
Vue3 + TS + Vben Admin

【要求】
- hooks拆分业务逻辑
- API独立
- strict mode
- 不允许 any
- 表格支持分页

【输出】
1. 目录结构
2. 类型设计
3. hooks设计
4. API设计
5. 页面代码
```

---

# 🧠 十三、Vben Admin 专项规范（重要）

---

# 📌 页面规范

```text
views/module-name/
```

禁止：

```text
views/test/
views/demo/
```

---

# 📌 表单规范

统一：

- useForm
    
- schema-driven
    

---

# 📌 表格规范

统一：

- useTable
    
- columns.ts
    
- api.ts
    

---

# 📌 权限规范

统一：

```ts
v-auth
```

不要页面里手写：

```ts
if(role === 'admin')
```

---

# 🔥 十四、最终目标（真正工程化）

最终形成：

```text
需求
 ↓
Prompt
 ↓
AI生成设计
 ↓
AI生成代码
 ↓
ESLint
 ↓
TypeCheck
 ↓
Test
 ↓
PR Review
 ↓
CI
 ↓
Merge
```

---
