# 开发路线

此文档是产品实现步骤与 Agent 执行指南，由 **TechLead** 负责维护。

## Agent 执行方案（Plan 中间层）

> 每次执行 step 前，先用 Plan 模式生成 `.cursor/plans/stepN-plan.md`，再由 Agent 执行。
> 详见 [.cursor/plans/README.md](./.cursor/plans/README.md)

### 工作流约定

| 顺序 | 步骤          | 说明                                                                       |
| ---- | ------------- | -------------------------------------------------------------------------- |
| 1    | **读取规格**  | 读取 `doc/steps/stepN.md` 了解任务目标、要求、强约束                       |
| 2    | **生成 Plan** | Plan 模式生成 `.cursor/plans/stepN-plan.md`（todos + 文件清单 + 验收标准） |
| 3    | **执行 Plan** | Agent 模式按 todos 顺序执行代码                                            |
| 4    | **验收闭环**  | 对照 Plan 里的验收标准逐项确认                                             |

### 为什么用 Plan 作为中间层

- **规格与执行解耦**：`stepN.md` 是「做什么」，`stepN-plan.md` 是「怎么做、做成什么样」
- **减少执行跑偏**：todos 相当于执行路线图，AI 不会漏掉步骤或误解需求
- **可追溯**：每次执行都有 Plan 记录存档，回溯「当时为什么这么实现」比翻对话记录清晰

---

## 正确的开发顺序

### 阶段划分与依赖逻辑

| 阶段                       | 包含步骤                                   | 核心依赖逻辑                                     |
| -------------------------- | ------------------------------------------ | ------------------------------------------------ |
| **第零阶段：项目初始化**   | step0                                      | 所有开发的前置，搭建 monorepo 结构               |
| **第一阶段：基础搭建**     | step1、step6                               | 前后端同时初始化，形成基础项目结构               |
| **第二阶段：核心功能链路** | step7～step9、step13～step14、step2～step5 | **后端 API 优先**，完成后端再开发前端，避免 Mock |
| **第三阶段：集成 + 优化**  | step12、step15～step20                     | 前后端联调、全局异常、日志、API 封装             |

### 为什么这样排序

- **step0 先于一切**：项目结构是所有开发的前提，step1 和 step6 依赖 step0 的基础配置
- **后端 API 先行**：step7～step14 完成后，前端 step2～step5 可以直接调用真实接口，不需要 Mock，数据格式在开发过程中就确认了
- **step1 + step6 同期**：前端和后端的基础项目结构同步初始化，互不依赖
- **step12（整合）放最后**：等所有组件和 API 都就位再整合，减少返工

### 各阶段详细步骤

#### 第零阶段：项目初始化

| step  | 任务目标               | 说明                                      |
| ----- | ---------------------- | ----------------------------------------- |
| step0 | 搭建 monorepo 项目结构 | pnpm workspace、shared 包、前后端基础配置 |

> step0 详情参见 [doc/steps/step0.md](./steps/step0.md)

#### 第一阶段：基础搭建

| step   | 任务目标                             | 说明                                 |
| ------ | ------------------------------------ | ------------------------------------ |
| step1  | 初始化 Vue3 + TS + Vite 前端项目     | 路由、Pinia、Axios 基础配置          |
| step21 | 安装 Vitest 测试框架                 | 前端 + 后端单元测试基础设施 \*\*\*\* |
| step6  | 初始化 Express + TypeScript 后端项目 | 基础结构与中间件                     |

#### 第二阶段：核心功能链路

| step   | 任务目标                            | 说明                  |
| ------ | ----------------------------------- | --------------------- |
| step7  | 开发 /api/file/upload 接口          | PDF/Word 上传解析 API |
| step8  | 实现 embedding.service.ts           | Embedding 向量化服务  |
| step9  | 实现余弦相似度计算和 TopK 检索      | RAG 检索核心          |
| step13 | 实现文档对话核心接口（非流式）      | 后端对话逻辑          |
| step14 | 实现文档对话流式接口                | 流式输出支持          |
| step2  | 开发 FileUpload.vue 组件            | 文件上传 UI           |
| step3  | 开发 TextPreview.vue 组件           | 文本预览 UI           |
| step4  | 封装 Fetch 流式请求函数             | 前端流式请求封装      |
| step5  | 开发 ChatList.vue 组件 + 打字机效果 | 消息列表 UI           |

#### 第三阶段：集成 + 优化

| step   | 任务目标                     | 说明         |
| ------ | ---------------------------- | ------------ |
| step12 | 将所有前端组件整合到对应页面 | 前后端联调   |
| step15 | 历史对话管理接口             | CRUD 操作    |
| step16 | 全局异常处理与日志中间件     | 稳定性保障   |
| step17 | 环境变量与配置管理           | 配置分离     |
| step18 | 豆包 Embedding API 调用      | 向量服务接入 |
| step19 | 用户问题检索 + Prompt 拼接   | RAG 流程串联 |
| step20 | 豆包对话 API 调用            | LLM 对话接入 |

---

## 执行进度追踪

| step | 状态 | 角色 | 负责人 | Plan 文件 | 完成日期 |
| ------ | ------ | ------------------ | ------ | ------------------------ | -------- |
| step0 | ✅ 完成 | Backend | - | - | - |
| step1 | ✅ 完成 | Frontend | - | doc/plans/step1-plan.md | - |
| step21 | ✅ 完成 | Frontend + Backend | - | doc/plans/step21-plan.md | - |
| step6 | ✅ 完成 | Backend | - | doc/plans/step1-plan.md | - |

| step7 | ✅ 完成 | Backend | - | doc/plans/step7-plan.md | - |
| step8 | ✅ 完成 | Backend | - | doc/plans/step8-plan.md | - |
| step9 | ✅ 完成 | Backend | - | doc/plans/step8-plan.md | - |
| step13 | ✅ 完成 | Backend | - | doc/plans/step13-plan.md | - |
| step14 | ✅ 完成 | Backend | - | doc/plans/step14-plan.md | - |
| step2 | ✅ 完成 | Frontend（UI） | - | doc/plans/step2-plan.md | - |
| step3 | ✅ 完成 | Frontend（UI） | - | doc/plans/step3-plan.md | - |
| step4 | ✅ 完成 | Frontend | - | doc/plans/step4-plan.md | - |
| step5 | ✅ 完成 | Frontend（UI） | - | doc/plans/step5-plan.md | - |
| step12 | ✅ 完成 | Frontend（集成） | - | doc/plans/step12-plan.md | 2026-03-30 |
| step15 | ✅ 完成 | Backend | - | doc/plans/step15-plan.md | 2026-03-30 |
| step16 | ✅ 完成 | Backend | - | doc/plans/step16-plan.md | 2026-03-30 |
| step17 | ✅ 完成 | Backend | - | doc/plans/step17-plan.md | 2026-03-30 |
| step18 | ✅ 完成 | Backend | - | doc/plans/step18-plan.md | 2026-03-30 |
| step19 | ✅ 完成 | Backend | - | doc/plans/step19-plan.md | 2026-03-30 |
| step20 | ✅ 完成 | Backend | - | doc/plans/step20-plan.md | 2026-03-30 |

> 状态说明：✅ 已完成、🔄 进行中、⬜ 待开始。执行完一个 step 后更新此表。
>
> 角色说明：Frontend（UI）= 前端 UI 组件开发、Frontend（集成）= 前后端联调、Backend = 后端 API/服务实现。

### 角色对应规则

| 角色             | 负责的 step                          |
| ---------------- | ------------------------------------ |
| Backend          | step0、step6～step9、step13～step20 |
| Frontend         | step1、step4、step21                 |
| Frontend（UI）   | step2、step3、step5                  |
| Frontend（集成） | step12                               |
