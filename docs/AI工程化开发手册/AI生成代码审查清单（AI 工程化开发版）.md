## 📌 AI生成代码审查清单（Code Review Checklist）

---

# 1️⃣ 代码正确性（Correctness）

### 必查项

-  逻辑是否符合需求描述（不是“看起来对”）
    
-  边界条件是否处理：
    
    - null / undefined
        
    - 空数组 / 空对象
        
    - 极值（0 / -1 / 超大值）
        
-  是否存在明显 bug（循环、递归、异步）
    
-  返回值是否完整一致
    

### ⚠️ AI常见问题

- “假正确代码”（能跑但逻辑错）
    
- 漏掉异常路径
    
- 忽略 async/await 错误
    

---

# 2️⃣ 类型与数据结构（Type Safety）

### 必查项

-  TypeScript 类型是否完整
    
-  是否存在 any 泛滥
    
-  interface / type 是否清晰分层
    
-  是否有隐式类型转换风险
    

### 推荐规范

- 使用 strict 模式
    
- 禁止：
    
    - `any`
        
    - `as unknown as T`（除非明确理由）
        

---

# 3️⃣ 架构合理性（Architecture）

### 必查项

-  是否职责单一（Single Responsibility）
    
-  是否存在“AI一把梭”大函数
    
-  是否存在重复逻辑
    
-  是否合理拆分模块
    

### 红线

- ❌ 一个函数 > 100 行（前端建议）
    
- ❌ UI + 数据处理混在一起
    
- ❌ 业务逻辑写在组件里（Vue/React）
    

---

# 4️⃣ 可维护性（Maintainability）

### 必查项

-  命名是否语义清晰（禁止 a/b/c/test1）
    
-  是否有注释说明复杂逻辑
    
-  是否存在魔法数字（magic number）
    
-  是否容易扩展
    

### 推荐

- 使用常量枚举
    
- 使用配置化替代 if-else 链
    

---

# 5️⃣ 安全性（Security）

### 必查项

-  是否存在 XSS 风险（innerHTML / v-html）
    
-  是否直接拼接 SQL / 请求参数
    
-  是否暴露敏感信息（token / key）
    
-  是否信任前端输入
    

### ⚠️ AI常见漏洞

- 直接 render HTML
    
- fetch 拼 URL query 未 encode
    
- localStorage 存敏感 token（无加密）
    

---

# 6️⃣ 性能（Performance）

### 必查项

-  是否存在重复渲染 / 重复计算
    
-  是否滥用 deep watch / useEffect
    
-  是否存在 O(n²) 隐性循环
    
-  大数据是否分页/懒加载
    

### Vue/React重点

- computed / memo 是否合理
    
- useEffect dependency 是否正确
    

---

# 7️⃣ 并发与异步（Concurrency）

### 必查项

-  Promise 是否有错误处理 catch
    
-  async 是否被正确 await
    
-  是否存在竞态条件（race condition）
    
-  是否重复触发请求
    

---

# 8️⃣ UI / UX（前端项目）

### 必查项

-  loading 状态是否完整
    
-  error 状态是否处理
    
-  空状态（empty state）
    
-  用户反馈是否存在（toast / message）
    

---

# 9️⃣ 测试覆盖（Testability）

### 必查项

-  是否可单测
    
-  是否有关键逻辑测试点
    
-  是否 mock 外部依赖
    
-  是否容易 E2E 测试
    

---

# 🔟 AI生成代码专项审查（重点）

### 必查项

-  是否“过度复杂化”（AI喜欢写复杂方案）
    
-  是否引入不必要依赖
    
-  是否使用不存在的 API / 伪代码
    
-  是否与项目技术栈一致（Vue/React/Node）
    
-  是否符合已有代码风格
    

---

# 🧩 工程化补充规则（强烈建议）

## 1. 禁止 AI 直接输出“最终版代码”

要求：

> 必须先输出设计，再输出代码

---

## 2. 强制三段式生成

AI生成代码必须遵循：

1. 需求理解
    
2. 设计方案
    
3. 实现代码
    

---

## 3. PR 合并标准（建议）

- CI 通过
    
- ESLint / Prettier 通过
    
- 覆盖关键逻辑测试
    
- Code Review checklist 全部满足
    

---

# 🚀 高级建议（工程化升级）

你可以把这套体系升级成：

## 📦 AI Code Review Bot（未来方向）

结合：

- ESLint
    
- SonarQube
    
- AST 分析
    
- LLM Reviewer
    

实现自动 PR 审查。
