# OpenAI Codex 工作流（AI 工程化开发版）

---

# 一、OpenAI Codex 的定位

[OpenAI Codex 官方介绍](https://openai.com/index/introducing-codex/?utm_source=chatgpt.com)

[OpenAI Codex CLI 官方文档](https://help.openai.com/en/articles/11096431?utm_source=chatgpt.com)

---

OpenAI Codex 本质上不是：

> “代码补全工具”

而是：

# AI 软件工程 Agent

核心能力：

- 理解整个代码仓库
    
- 修改多个文件
    
- 自动运行命令
    
- 自动测试
    
- 自动修 Bug
    
- 自动生成 PR
    
- 自动理解项目结构
    

Codex 的核心特点是：

# “可执行”

不是只给建议。

而是真正：

- 读文件
    
- 改文件
    
- 跑命令
    
- 跑测试
    
- 修改代码
    

([OpenAI Help Center](https://help.openai.com/en/articles/11096431?utm_source=chatgpt.com "OpenAI Codex CLI – Getting Started | OpenAI Help Center"))

---

# 二、Codex 体系结构（重要）

现在 OpenAI Codex 主要分为两种：

---

# 1. Codex CLI（本地 Agent）

运行在 Terminal：

```bash
npm install -g @openai/codex
```

([OpenAI Help Center](https://help.openai.com/en/articles/11096431?utm_source=chatgpt.com "OpenAI Codex CLI – Getting Started | OpenAI Help Center"))

特点：

- 本地运行
    
- 终端操作
    
- 可控制权限
    
- 适合开发者
    
- 与 Git 配合极强
    

---

# 2. ChatGPT 内置 Codex（云端 Agent）

ChatGPT 中：

- Ask
    
- Code
    

模式。

特点：

- 云端沙箱
    
- 可并行任务
    
- 自动生成 PR
    
- 多 Agent 工作流
    

([OpenAI](https://openai.com/index/introducing-codex/?utm_source=chatgpt.com "Introducing Codex | OpenAI"))

---

# 三、Codex 最核心思想

Codex 真正厉害的地方：

不是：

> “生成代码”

而是：

# 自动执行工程流程

例如：

```txt
读代码
→ 理解架构
→ 修改文件
→ 跑测试
→ 修复失败
→ 再测试
→ 输出结果
```

这是传统 AI Chat 最大区别。

---

# 四、Codex CLI 安装工作流

---

# 安装

```bash
npm install -g @openai/codex
```

([OpenAI Help Center](https://help.openai.com/en/articles/11096431?utm_source=chatgpt.com "OpenAI Codex CLI – Getting Started | OpenAI Help Center"))

---

# 登录（推荐）

```bash
codex --login
```

现在支持：

# ChatGPT 账号直接登录

不需要手动复制 API Key。([OpenAI Help Center](https://help.openai.com/en/articles/11381614?utm_source=chatgpt.com "Codex CLI and Sign in with ChatGPT | OpenAI Help Center"))

---

# 启动

```bash
codex
```

---

# 五、Codex 三种权限模式（极重要）

官方提供三种模式：([OpenAI Help Center](https://help.openai.com/en/articles/11096431?utm_source=chatgpt.com "OpenAI Codex CLI – Getting Started | OpenAI Help Center"))

---

# 1. Suggest 模式（默认）

最安全。

Codex：

✅ 读文件  
✅ 提建议  
❌ 不自动改文件  
❌ 不自动执行命令

适合：

- 看项目
    
- 学项目
    
- 分析架构
    
- Review代码
    

---

# 2. Auto Edit 模式

```bash
codex --auto-edit
```

Codex：

✅ 自动修改文件  
❌ 执行命令前仍需确认

适合：

- 小规模重构
    
- 批量修改
    
- 修样式
    
- 改组件
    

---

# 3. Full Auto 模式（危险）

```bash
codex --full-auto
```

Codex：

✅ 自动读写文件  
✅ 自动执行命令  
✅ 自动运行测试

官方明确说明：

> Full Auto 会自动执行任务。

([OpenAI Help Center](https://help.openai.com/en/articles/11096431?utm_source=chatgpt.com "OpenAI Codex CLI – Getting Started | OpenAI Help Center"))

---

# 六、真正推荐的 Codex 工作模式

---

# 推荐：

# Suggest + Auto Edit

而不是：

# Full Auto

原因：

AI Agent 最大风险：

> 悄悄改坏整个项目。

---

# Full Auto 适合：

✅ 小工具  
✅ 临时项目  
✅ 测试项目  
✅ Demo项目

---

# 企业项目建议：

❌ 禁止 Full Auto

---

# 七、Codex 标准工程工作流（推荐）

---

# Stage1：先理解项目

不要：

❌ “直接写功能”

正确：

```txt
请先阅读整个项目。

分析：
1. 技术栈
2. 目录结构
3. 状态管理
4. API组织
5. 构建方式
6. 风险模块

不要修改代码。
```

---

# Stage2：输出项目地图

让 Codex 输出：

- 模块结构
    
- 页面关系
    
- 数据流
    
- API流
    
- 风险点
    

目的：

> 建立 AI 全局上下文。

---

# Stage3：限制修改范围

必须明确：

```txt
只允许修改：

src/views/user

禁止修改：

- router
- store
- global style
- layout
```

否则：

Codex 很可能：

- 顺手重构
    
- 顺手优化
    
- 顺手改依赖
    

---

# Stage4：先方案后编码

正确流程：

```txt
先不要写代码。

请输出：
1. 修改方案
2. 涉及文件
3. 风险点
4. 数据流变化
5. 回滚方案
```

确认后再开发。

---

# 八、Codex 最强工作模式（高手核心）

---

# 1. 多 Agent 并行

官方推荐：

> 多任务并行。

([OpenAI](https://openai.com/index/introducing-codex/?utm_source=chatgpt.com "Introducing Codex | OpenAI"))

例如：

---

## Agent1

负责：

- UI
    

---

## Agent2

负责：

- API
    

---

## Agent3

负责：

- 测试
    

---

## Agent4

负责：

- 文档
    

---

这是未来 AI 工程化核心。

---

# 2. Git 分支隔离（非常重要）

标准流程：

```txt
新需求
→ 新分支
→ Codex开发
→ 本地测试
→ Review
→ Merge
```

不要：

❌ 直接改主分支

---

# 九、Codex Prompt 规范（核心）

---

# Prompt 必须包含：

---

## 1. 项目背景

```txt
这是 Vue3 + TypeScript 项目。
```

---

## 2. 目标

```txt
目标：
新增用户列表页面。
```

---

## 3. 限制

```txt
限制：
- 不新增依赖
- 保持现有代码风格
- 使用现有组件体系
```

---

## 4. 禁止事项

```txt
禁止：
- 不要重构无关模块
- 不要修改UI风格
- 不要修改接口结构
```

---

## 5. 输出要求

```txt
输出：
1. 修改文件列表
2. 修改原因
3. 风险说明
```

---

# 十、Codex Debug 工作流（重点）

---

# 错误示范

```txt
报错了，帮我修。
```

---

# 正确方式

```txt
问题：
点击保存按钮后页面白屏。

现象：
控制台报错：
xxx

复现步骤：
1.
2.
3.

最近修改：
新增权限模块。

怀疑：
可能是权限数据为空。
```

---

# 十一、两次无新增证据原则（极重要）

如果：

- 连续两次没修好
    
- 没新增信息
    
- 开始乱改
    

必须停止。

---

# 正确处理方式

---

## 1. 最小复现

缩小问题范围。

---

## 2. 打日志

打印：

- 参数
    
- 返回值
    
- 状态变化
    

---

## 3. 跑测试

锁定行为。

---

## 4. Git 回滚

回到稳定版本。

---

# 十二、Codex 安全规范（非常重要）

---

# 1. Full Auto 必须隔离目录

官方明确：

> Full Auto 在沙箱中运行。

([OpenAI Help Center](https://help.openai.com/en/articles/11096431?utm_source=chatgpt.com "OpenAI Codex CLI – Getting Started | OpenAI Help Center"))

但：

仍然必须：

- 限制目录
    
- Git管理
    
- 权限控制
    

---

# 2. API Key 禁止进前端

不要：

```txt
const API_KEY = "xxx"
```

必须：

```txt
.env
```

---

# 3. AI 生成代码必须人工审核

重点审核：

- SQL
    
- 登录
    
- 支付
    
- 上传
    
- 权限
    

---

# 十三、Codex 工程化最佳实践（真正重要）

---

# 1. PROJECT_STATE.md

建议长期维护：

```txt
当前阶段：
当前功能：
当前问题：
禁止修改：
下一步：
```

---

# 2. references 目录

用于：

- 标准按钮
    
- 标准表格
    
- 标准组件
    
- API规范
    

目的：

> 不让 AI 每次自由发挥。

---

# 3. 文件拆分

不要：

❌ 巨型文件

建议：

- 单文件 300~500 行
    
- 超过立即拆分
    

因为：

> AI 最怕超长文件。

---

# 十四、Codex 与 Cursor / Claude Code 的区别

|工具|核心强项|
|---|---|
|Cursor|IDE协作|
|Claude Code|长上下文工程理解|
|Codex|Agent执行能力|

---

# Codex 最大特点

不是：

> “最聪明”

而是：

# 最像真正工程 Agent

因为它：

- 真跑命令
    
- 真执行流程
    
- 真修改项目
    

---

# 十五、Codex 高级玩法（未来方向）

近期 Codex 已开始支持：

- 多 Agent
    
- App 模式
    
- Browser Use
    
- 自动审批
    
- 技能系统
    

([TechRadar](https://www.techradar.com/pro/openai-reveals-codex-app-for-mac-a-much-easier-way-to-deploy-ai-agents-on-apple-devices?utm_source=chatgpt.com "OpenAI reveals Codex app for Mac - 'a different kind of tool' it says is a much easier way to deploy AI agents on Apple devices"))

这意味着：

未来开发模式会逐渐变成：

# “人类负责决策”

# “Agent 负责执行”

---

# 十六、Codex 万能控制 Prompt（推荐长期复用）

```txt
重要要求：

1. 先分析再修改
2. 先输出方案
3. 只改指定范围
4. 不要顺手重构
5. 不要修改无关逻辑
6. 保持现有技术栈
7. 保持现有代码风格
8. 优先最小修改方案
9. 输出影响文件列表
10. 修改后解释原因
11. 有风险先提示
12. 不确定先询问
```

---

# 十七、Codex 最终核心思想

Codex 真正价值不是：

> “自动写代码”

而是：

# 自动执行工程流程

真正危险的不是：

> AI 不会写代码。

而是：

> AI 在你没发现时，  
> 自动执行了错误操作。