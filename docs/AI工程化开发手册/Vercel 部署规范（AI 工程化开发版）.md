# Vercel 部署规范（AI 工程化开发版）

---

# 一、为什么必须有 Vercel 部署规范

很多人：

- 本地能跑
    
- 上传 GitHub
    
- Vercel 直接报错
    

原因：

# “开发环境”

≠

# “部署环境”

AI 时代尤其容易：

- 路径错误
    
- 环境变量错误
    
- Node版本错误
    
- 打包失败
    
- API路径错误
    

所以：

# 部署必须标准化

---

# 二、Vercel 最适合什么项目

---

# 非常适合

✅ Next.js  
✅ React  
✅ Vue3  
✅ Vite  
✅ 静态网站  
✅ 前端项目  
✅ AI Web App  
✅ 管理后台  
✅ 展示页

---

# 一般适合

✅ Node API  
✅ Serverless API

---

# 不适合

❌ 超大型后端  
❌ 长连接服务  
❌ WebSocket重度项目  
❌ 高实时系统

---

# 三、Vercel 部署标准流程（推荐）

---

# 标准流程

```txt
本地开发
→ 本地测试
→ Git提交
→ GitHub
→ Vercel自动部署
→ 线上验证
```

---

# 四、本地必须先通过（核心）

# 本地跑不通

=

# Vercel 必报错

---

# 部署前必须检查

---

## 1. 本地启动

```bash
npm run dev
```

必须：

- 页面正常
    
- 无红色报错
    

---

## 2. 本地打包

最重要。

```bash
npm run build
```

必须：

- 打包成功
    
- 无 TypeScript 错误
    
- 无 ESLint 错误
    

---

# 五、项目结构规范（非常重要）

---

# 推荐结构（Vite/Vue）

```txt
src/
public/
package.json
vite.config.ts
.env
```

---

# 推荐结构（Next.js）

```txt
app/
pages/
components/
public/
next.config.js
```

---

# 六、Vercel 最常见报错（重点）

---

# 1. Build Failed

最常见。

原因：

- TS报错
    
- ESLint报错
    
- 依赖缺失
    
- Node版本不兼容
    

---

# 排查

```bash
npm run build
```

本地先解决。

---

# 2. Module not found

例如：

```txt
Cannot find module
```

原因：

- 路径错误
    
- 大小写错误
    

---

# 注意（Mac 最容易踩坑）

Mac：

```txt
User.ts
```

Linux：

```txt
user.ts
```

Vercel 是 Linux。

---

# 所以：

# 文件大小写必须严格一致

---

# 3. 环境变量失效

表现：

- API key undefined
    

---

# 错误方式

```javascript
const key = "xxx"
```

---

# 正确方式

```txt
.env
```

---

# Vite

```txt
VITE_API_URL=
```

---

# Next.js

```txt
NEXT_PUBLIC_API_URL=
```

---

# 七、环境变量规范（极重要）

---

# 1. 禁止提交 .env

必须：

```txt
.gitignore
```

---

# 2. Vercel 后台配置

Vercel：

```txt
Project
→ Settings
→ Environment Variables
```

---

# 3. 前端变量必须带前缀

---

# Vite

```txt
VITE_
```

---

# Next.js

```txt
NEXT_PUBLIC_
```

---

# 八、Node.js 版本规范（非常重要）

很多 Vercel 报错：

就是 Node 版本不一致。

---

# 推荐固定版本

```json
"engines": {
  "node": "20.x"
}
```

---

# package.json

```json
{
  "engines": {
    "node": "20.x"
  }
}
```

---

# 九、依赖规范（AI时代重点）

---

# 禁止：

```bash
npm install xxx
```

AI 随便装依赖。

---

# 必须：

先确认：

- 是否真的需要
    
- 是否维护活跃
    
- 是否兼容当前项目
    

---

# 十、部署前检查清单（推荐）

---

# 部署 Checklist

```txt
[ ] npm run dev 正常
[ ] npm run build 成功
[ ] 无 TS 报错
[ ] 无 ESLint 报错
[ ] 环境变量已配置
[ ] API 地址正确
[ ] 图片路径正确
[ ] 路由刷新正常
[ ] package.json 正常
[ ] Node版本正确
```

---

# 十一、前端路由刷新问题（经典）

---

# Vue Router History 模式

刷新：

```txt
404
```

---

# 解决方案（Vite）

创建：

```txt
vercel.json
```

---

# 内容

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

# 十二、Next.js 部署规范（重点）

Vercel：

# 官方最佳支持 Next.js

---

# 推荐：

✅ App Router  
✅ Server Actions  
✅ Edge Functions

---

# 不建议：

❌ 超复杂 custom server

---

# 十三、AI 项目部署规范（重要）

---

# 1. API Key 必须服务端

不要：

```javascript
OPENAI_API_KEY
```

直接放前端。

---

# 正确：

```txt
Vercel Serverless Function
```

---

# 2. AI 调用必须限流

否则：

- 被刷爆
    
- 高额账单
    

---

# 建议：

- 用户鉴权
    
- Rate Limit
    
- IP限制
    

---

# 十四、Git + Vercel 推荐工作流

---

# 推荐流程

```txt
feature分支
→ GitHub
→ Preview部署
→ 测试
→ Merge main
→ Production部署
```

---

# Preview Deployment

Vercel 最大优势之一。

每个分支：

# 自动生成测试链接

---

# 十五、Vercel AI 开发最危险行为（必须避免）

---

# 1. 本地不 build 直接部署

危险指数：

★★★★★

---

# 2. AI 自动装依赖

危险指数：

★★★★★

---

# 3. API Key 放前端

危险指数：

★★★★★

---

# 4. 不配置 Node版本

危险指数：

★★★★★

---

# 5. 不看 Build Log

危险指数：

★★★★★

---

# 十六、Build Log 排查 SOP（非常实用）

---

# Step1

看：

```txt
Build Logs
```

---

# Step2

找到：

```txt
error
failed
cannot find
```

---

# Step3

本地复现：

```bash
npm run build
```

---

# Step4

逐个解决。

不要：

❌ 一次乱改几十处

---

# 十七、Vercel 推荐配置（前端项目）

---

# vercel.json

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

---

# Next.js 一般无需配置

Vercel 自动识别。

---

# 十八、AI 工程化部署核心思想

真正危险的不是：

> 部署失败

而是：

> AI 帮你“自动部署错误代码”

---

# 十九、Vercel + AI 最佳实践（高手核心）

---

# 1. Preview 部署先验证

不要直接 Production。

---

# 2. 一个功能一个 Preview

---

# 3. 每次部署必须可回滚

---

# 4. Build 成功

≠  
功能正常

必须：

- 手动测试
    
- API测试
    
- 权限测试
    

---

# 二十、Vercel 万能 Prompt（推荐）

```txt
请检查当前项目是否适合 Vercel 部署。

检查：
1. package.json
2. Node版本
3. 环境变量
4. 打包配置
5. 路由配置
6. API路径
7. vercel.json

输出：
1. 风险点
2. 修改建议
3. 是否存在部署风险
```

---

# 二十一、最终核心思想

Vercel 真正核心不是：

> “一键部署”

而是：

# 标准化部署流程

AI 工程时代：

真正值钱的是：

# 可重复、可回滚、可验证的部署体系。