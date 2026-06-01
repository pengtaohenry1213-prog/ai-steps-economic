
# 🎯 任务目标

此阶段：完成功能层的 “落地”（路由规则、Pinia 逻辑、Axios 封装、入口集成），解决 “能不能用” 的问题。

## 🧱 项目背景

这是一个企业级AI智能知识库助手项目，需前后端分离开发，前端负责文档上传、智能对话、流式输出等核心交互。

## 📋 任务要求

* 使用 `pnpm create vite@latest` 创建 Vue + TypeScript 模板项目
* 清理默认无用代码（HelloWorld组件、默认样式等）
* 配置 tsconfig.json（补充路径别名、启用严格模式）
* 封装 Axios 请求库（请求拦截器、响应拦截器、错误处理）
* 集成 Pinia 实现内存级状态管理
* 配置基础路由（文档上传页 / 智能对话页）
* 按「views / components / utils / api」分层搭建目录结构

## ⚠️ 强约束

* 必须提供完整可运行的项目结构和代码
* 所有代码使用 Vue3 Composition API 编写
* TypeScript 类型定义完整，启用严格模式
* 路由、Pinia、Axios 配置需直接可用

## 📤 输出格式

请输出：

1. 项目目录结构（tree 形式）
2. 关键文件完整代码：
   * main.ts
   * tsconfig.json
   * router/index.ts
   * store/index.ts
   * utils/request.ts

## 🚫 禁止行为

* 不要省略关键配置项
* 不要写伪代码或占位符
* 不要引入非必要依赖

## 实现步骤

> 注意：使用 pnpm 安装依赖

1. 创建 Vue3 + TS + Vite 项目
   * 使用 pnpm create vite@latest frontend -- --template vue-ts 创建项目
   * 安装依赖：axios, pinia, vue-router
2. 清理默认代码
   * 删除 HelloWorld.vue 等默认组件
   * 清理默认样式
3. 配置 tsconfig.json
   * 配置 tsconfig.json
   * 启用严格模式
   * 配置路径别名（如 @/ 指向 src/）
4. 目录结构（tree 形式）

   ```
   ai-knowledge-assistant/
   ├── packages/
   │   └── frontend/              # 前端子包（Vue3 + TS + Vite）
   │       ├── src/
   │       │   ├── views/         # 页面组件
   │       │   ├── components/    # 公共组件
   │       │   ├── router/        # 路由配置
   │       │   ├── store/         # Pinia 状态管理
   │       │   ├── utils/         # 工具函数
   │       │   ├── api/           # API 接口
   │       │   └── types/         # TypeScript 类型
   │       ├── package.json
   │       ├── vite.config.ts
   │       └── tsconfig.json
   ├── doc/                       # 项目文档
   ├── scripts/                   # 自动化脚本
   └── package.json               # 根配置（workspaces）
   ```

5. 实现核心文件

- packages/frontend/src/router/index.ts - 路由配置（文档上传页 + 智能对话页）
* packages/frontend/src/store/index.ts - Pinia 状态管理
* packages/frontend/src/utils/request.ts - Axios 请求封装（拦截器）
* packages/frontend/src/main.ts - 入口文件（集成 Pinia、Router）
* packages/frontend/src/App.vue - 根组件（带导航栏）

## 预期输出

- 完整可运行的前端项目
* 包含两个页面路由：文档上传页、智能对话页
* Axios 拦截器配置完成
* Pinia 状态管理集成完成

## Git Commit

```plaintext
feat: 初始化 Vue3 + TS + Vite 前端项目

- 创建 Vue3 + TypeScript + Vite 项目结构
- 配置路由、Pinia 状态管理、Axios 请求封装
- 搭建 views/components/utils/api 目录结构
```

step1.md 阶段主要是项目骨架搭建，涉及的内容：
* Vue3 + TS + Vite 项目结构
* 路由、Pinia、Axios 基础配置
* 目录结构创建

这些都是配置性质的工作，尚未涉及需要单元测试的业务逻辑, 所以不需要测试代码。

> 注：auto-commit.sh 会自动生成的内容（当检测到 step 相关变更时）：feat: 初始化 Vue3 + TS + Vite 前端项目
