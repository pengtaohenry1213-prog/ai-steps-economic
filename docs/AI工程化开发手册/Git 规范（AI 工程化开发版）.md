# Git 规范（AI 工程化开发版）

---

# 一、为什么必须有 Git 规范

很多人以为：

> Git 只是“代码备份工具”。

实际上：

# Git 是工程安全系统

尤其 AI 开发时代：

- AI 会乱改代码
    
- AI 会误删文件
    
- AI 会顺手重构
    
- AI 会引入隐藏 Bug
    

没有 Git：

> 项目非常容易直接崩。

---

# 二、AI 开发时代的 Git 核心思想

Git 最核心作用：

# 随时回到稳定版本

AI 工程开发里：

> “可回滚”  
> 比  
> “写得快”  
> 更重要。

---

# 三、推荐 Git 工作流（强烈推荐）

---

# 标准流程

```txt
新需求
→ 新分支
→ AI开发
→ 本地测试
→ Git提交
→ Code Review
→ Merge主分支
```

---

# 禁止流程

```txt
主分支直接开发
→ AI疯狂修改
→ 项目崩溃
→ 无法回滚
```

---

# 四、分支规范（核心）

---

# 1. main/master

生产稳定分支。

要求：

- 永远保持可运行
    
- 禁止直接开发
    
- 禁止 AI 直接修改
    

---

# 2. develop

开发主分支。

用于：

- 日常开发
    
- 功能合并
    

---

# 3. feature 分支

功能开发分支。

命名：

```bash
feature/login
feature/user-list
feature/dashboard
```

---

# 4. fix 分支

Bug 修复分支。

命名：

```bash
fix/login-error
fix/api-timeout
```

---

# 5. refactor 分支

重构分支。

命名：

```bash
refactor/user-module
```

---

# 五、AI 开发最重要原则

# 一个功能一个分支

不要：

❌ 一个分支做所有功能

否则：

- AI 修改互相污染
    
- Bug难定位
    
- 回滚困难
    

---

# 正确方式

```txt
feature/login
只做登录功能
```

---

# 六、Commit 提交规范（非常重要）

---

# Commit 核心原则

# 小步提交

不要：

❌ 一次提交几千行

应该：

✅ 一个小功能一次提交

---

# 七、推荐 Commit 规范（行业标准）

---

# 1. feat

新功能

```bash
feat: 新增登录页面
```

---

# 2. fix

修复 Bug

```bash
fix: 修复表单校验失效
```

---

# 3. refactor

重构

```bash
refactor: 拆分用户模块
```

---

# 4. style

样式调整

```bash
style: 调整按钮间距
```

---

# 5. docs

文档修改

```bash
docs: 更新项目说明
```

---

# 6. chore

杂项修改

```bash
chore: 更新eslint配置
```

---

# 八、AI 开发 Commit 最佳实践

---

# 错误方式

```bash
update
fix
修改代码
test
```

完全无法回溯。

---

# 正确方式

```bash
feat: 新增用户权限页面
fix: 修复登录token失效问题
refactor: 拆分订单模块API
```

---

# 九、AI 开发必须频繁提交

推荐：

---

# 每完成：

- 一个页面
    
- 一个组件
    
- 一个接口
    
- 一个Bug
    

立即提交。

---

# 原因

AI 最大风险：

> 后面修改把前面改崩。

所以：

# Git 提交点 = 安全存档点

---

# 十、禁止 AI 直接修改 main 分支

这是 AI 工程化最重要规则之一。

---

# 正确流程

```txt
main
↑
develop
↑
feature/xxx
```

---

# AI 只能：

```txt
feature/xxx
```

开发。

---

# 十一、Git + AI 最佳工作流（推荐）

---

# Step1：新建功能分支

```bash
git checkout -b feature/login
```

---

# Step2：AI开发

例如：

- Cursor
    
- Claude Code
    
- Codex
    

---

# Step3：本地测试

必须：

- 页面能打开
    
- 接口正常
    
- 控制台无报错
    

---

# Step4：提交代码

```bash
git add .
git commit -m "feat: 新增登录页面"
```

---

# Step5：推送远程

```bash
git push origin feature/login
```

---

# Step6：Code Review

检查：

- 是否误删
    
- 是否误改
    
- 是否引入风险
    

---

# Step7：Merge

确认无问题后：

合并 develop/main。

---

# 十二、Git 回滚规范（AI时代极重要）

---

# AI 开发一定会遇到：

- 改崩项目
    
- Bug扩大
    
- 逻辑污染
    
- 样式混乱
    

所以：

# 必须会回滚

---

# 1. 查看提交记录

```bash
git log
```

---

# 2. 回滚到稳定版本

```bash
git reset --hard commit_id
```

---

# 3. 回退某次提交

```bash
git revert commit_id
```

---

# 十三、AI 开发最危险行为（必须避免）

---

# 1. AI 连续改几十个文件

危险指数：

★★★★★

原因：

- 难Review
    
- 难回滚
    
- 难定位
    

---

# 2. 很久不提交

危险指数：

★★★★★

原因：

- 一旦崩溃无法恢复
    

---

# 3. AI 自动重构

危险指数：

★★★★★

表现：

- 顺手改命名
    
- 顺手改结构
    
- 顺手改依赖
    

必须：

```txt
不要重构无关模块。
```

---

# 十四、推荐 Git 目录规范

---

# 推荐目录

```txt
main
develop
feature/*
fix/*
refactor/*
```

---

# 十五、推荐 .gitignore（前端项目）

```txt
node_modules
dist
.env
coverage
.DS_Store
.vscode
```

---

# 十六、AI 工程化必备文档（强烈推荐）

项目根目录：

```txt
PRD.md
ARCH.md
PROJECT_STATE.md
CHANGELOG.md
```

---

# PROJECT_STATE.md 推荐内容

```txt
当前阶段：
当前功能：
已完成：
当前问题：
禁止修改：
下一步：
```

作用：

> 给 AI 提供稳定上下文。

---

# 十七、Git + AI 的真正核心思想

以前：

# Git 是版本工具

现在：

# Git 是 AI 安全保险

---

# 十八、多人 + AI 协作规范（高级）

---

# 必须：

- 功能隔离
    
- 分支隔离
    
- AI任务隔离
    

---

# 禁止：

❌ 多人同时让 AI 修改同一个模块

否则：

- 冲突爆炸
    
- 逻辑污染
    
- Bug难查
    

---

# 十九、AI Code Review 规范（真正关键）

AI 写完代码：

不要直接 merge。

必须检查：

---

# 1. 是否误删代码

---

# 2. 是否误改无关逻辑

---

# 3. 是否引入新依赖

---

# 4. 是否出现重复逻辑

---

# 5. 是否存在安全风险

重点检查：

- 登录
    
- Token
    
- SQL
    
- 上传
    
- 权限
    

---

# 二十、Git 高级最佳实践（高手核心）

---

# 1. Commit 不要过大

建议：

- 单次 commit < 300 行
    

---

# 2. PR 不要过大

建议：

- 一个 PR 一个功能
    

---

# 3. 功能完成立即合并

不要：

❌ 分支长期不合并

否则：

- 冲突越来越大
    

---

# 二十一、AI 开发时代真正核心

真正危险的不是：

> AI 写错代码

而是：

> AI 改坏代码后，  
> 你回不去了。

---

# 二十二、Git 最终核心思想

Git 真正价值不是：

> “保存代码”

而是：

# 给 AI 开发提供“后悔药”

AI 工程化时代：

# 没有 Git 规范

≈

# 没有安全系统。