# temp

## 一、现有体系成熟度评估

  ✅ 已完成的部分

 | 模块 | 成熟度 | 说明 |
 | --- | --- | --- |
 | 规范文档| 95% | 20+ 文档，覆盖前端/后端/安全/测试/流程 |
 | .cursor/rules | 90% | 核心规则已同步(backend/security/database） |
 | .cursor/prompts | 85% | Human Gate 流程完整 |
 | workflow-dashboard 集成 | 80% | STAGE_SPECS + SpecReferences 组件|
 | aiPrompts.ts 关联 | 80% | architecture/initialization/deployment 已配置 |

  ⚠️ 仍需补充的部分

 | 部分 | 状态 | 说明 |
 | --- | --- | --- |
 | .cursor/rules/ 完整同步 | 部分完成 | backend/security/database 已同步，其他待同步 |
 | 12阶段与规范映射.md | ✅ 完成 | 映射关系完整 |
 | AI工程化接入指南.md | ✅ 完成 | 对接说明完整 |

---

## 二、如何在新的生命周期中使用

 ```markdown
  阶段1：立项(Init）

  规范引用：

 - Prompt模板库.md → 市场分析、竞品分析Prompt
 - AI工程化团队规范.md → 团队角色定义

  Cursor Rules：

 - PM.mdc - 产品经理规则
 - tech-lead.mdc - 技术负责人规则

  Human Gate：HG1(PMO + Security）

  ---
  阶段2：需求(Requirement）

  规范引用：

 - Prompt模板库.md → PRD生成Prompt
 - AI工程化团队规范.md → Prompt分层规范

  ---
  阶段3：架构(Architecture）

  规范引用：

 - 前端工程化SOP.md
 - 后端工程化SOP.md
 - 数据库设计规范.md
 - 安全工程规范.md

  Cursor Rules：

 - frontend-vue3.mdc
 - backend.mdc
 - database.mdc
 - security-rules.md

  ---
  阶段4-11：后续阶段

  每个阶段都已配置 STAGE_SPECS，在 workflow-dashboard 的 StepDetail 页面会自动显示对应规范。
 ```

## 三、如何让 AI 使用这些规范

  1. 在 Cursor 中使用

  当你打开 Cursor 并切换到特定 Agent 时，对应的 .cursor/rules/*.mdc 会自动加载：

 ```markdown
  Frontend Agent  → frontend-vue3.mdc → 前端工程化 SOP
  Backend Agent → backend.mdc → 后端工程化 SOP
  Security Agent  → security-rules.md → 安全工程规范
 ```

  1. 在 Claude Code 中使用

  Claude Code 会读取项目根目录的 CLAUDE.md，里面已经引用了规范文档位置。

  1. 在 workflow-dashboard 中使用

  每个 Step 详情页面顶部会显示 "关联规范文档" 面板，点击可以直接打开。

  ---

## 四、建议的新生命周期流程

1. Init(立项）
 ↓
2. Requirement(需求）
 ↓
3. Architecture(架构）← 这里会用到 .cursor/rules + 规范文档
 ↓
4. Initialization(初始化）← 生成项目时自动引用规范
 ↓
5. Development(开发）← 全程使用规范文档
 ↓
6. Testing(测试）← 使用 Bug排查SOP + AI安全审查清单
 ↓
7. Acceptance(验收）
 ↓
8~11. 打包/部署/运维/迭代

---

## 五、是否成熟可用？

  回答：基本成熟，可以开始使用

  但建议：

  1. 先用架构阶段测试 - 因为这个阶段的规范配置最完整
  2. 观察 Human Gate 是否生效 - HG1/HG2 的审核流程
  3. 根据实际情况调整 - .cursor/rules/ 中可能有少量规则需要微调

  ---
  六、接下来的建议

  全生命周期开发：立项~初始化阶段 我是在这个管理网站进行管理的，开发阶段及其以后各个阶段我想在cursor中运行。

现在你可以：

  1. 在 workflow-dashboard 中完成 init → initialization 阶段
  2. initialization 完成后会生成 docs/steps/step{N}.md 作为交接文档
  3. 切换到 Cursor，读取 Step 文档开始 development 阶段开发

---

## 项目全生命周期管理方案

  一、整体架构

  管理边界划分：

 | 阶段 | 管理位置 | 说明 |
 | --- | --- | --- |
 | init(立项） | workflow-dashboard | 提案生成、可行性评估 |
 | requirement(需求） | workflow-dashboard | 需求分析、PRD编写 |  
 | architecture(架构） | workflow-dashboard | 系统设计、技术选型 |
 | initialization(初始化） | workflow-dashboard → 交接 | 生成项目脚手架 + step文档 |
 | development(开发） | Cursor | 读取stepN.md执行 |
 | testing(测试） | Cursor | 测试执行 |
 | acceptance(验收) | Cursor | 验收确认 |
 | packaging(打包） | Cursor | Docker/构建 |
 | deployment(部署) | Cursor | 部署上线 |
 | operation(运维） | Cursor | 监控运维 |
 | iteration(迭代） | workflow-dashboard + Cursor | 新需求处理 |

  ---

  二、初始化阶段产出(预生成模式）

  2.1 产出目录结构

 ```plaintext
 v2/dev/{projectName}/
   ├── .cursor/rules/     # Cursor规范(复制自根目录）
   │ ├── tech-lead.mdc
   │ ├── frontend-vue3.mdc
   │ ├── backend.mdc
   │ ├── database.mdc
   │ └── security-rules.md
   ├── docs/
   │ └── steps/     # 开发任务文档
   │   ├── step1.md
   │   ├── step2.md
   │   └── step3.md
   ├── src/       # 项目脚手架代码
   │ ├── main.ts
   │ ├── App.vue
   │ └── ...
   ├── package.json
   └── ...
 ```

  2.2 stepN.md 文档结构  

##  Step {N}: {功能名称}

## 任务目标

  {具体功能描述，来自架构文档的components数组}

## 约束条件

- 遵循前端工程化 SOP
- 遵循后端工程化 SOP
- 遵循数据库设计规范
- 遵循安全工程规范

## 验收标准

- [ ] 功能可正常运行
- [ ] 单元测试覆盖率 > 70%
- [ ] 无安全漏洞

## 涉及文件

- src/views/{Component}.vue  
- src/api/{api}.ts

## 前置依赖

- step{N-1}.md (如有)  

  2.3 stepN.md 生成逻辑  

  来源：

- 架构文档的 components 数组 → 拆分为多个 step
- 架构文档的 milestones → 映射 step 顺序
- 架构文档的 scope.inScope.P0/P1 → 确定 step 优先级  

  ---

  三、开发阶段 Cursor 工作流

  3.1 Cursor 启动  

  1. 打开 v2/dev/{projectName}/ 目录
  2. 读取根目录 .cursor/rules/ 中的规范
  3. 读取 docs/steps/step1.md  
  4. 按 run-step.md 流程执行

  3.2 Cursor 执行循环

  while (存在待执行的step) {
currentStep = 获取下一个stepN.md
执行 stepN.md  
if (stepN 有前置依赖 && 前置未完成) {  
  等待或标记阻塞
} else {
  执行完成
  标记step为已完成
  继续下一个step
}
  }

  3.3 Human Gate 执行规则  

 | 阶段 | HG1 | HG2 |
 | --- ----|-------|-------|  
 | init ~ initialization | ❌ 不需要 | ❌ 不需要 |  
 | development | ✅ 需要 | ❌ 不需要 |
 | testing | ✅ 需要 | ✅ 需要 |  
 | acceptance| ✅ 需要 | ✅ 需要 |  
 | packaging ~ iteration | ❌ 不需要 | ❌ 不需要 |  

  ---

## 四、迭代阶段流程

  4.1 触发方式

  workflow-dashboard 页面操作触发(推荐）  

  用户操作:

  1. 在 workflow-dashboard 进入 iteration 阶段
  2. 点击"添加新需求"
  3. 输入/上传新需求内容
  4. AI 生成新的 stepN.md  
  5. Human Gate 审批通过
  6. 保存到 v2/dev/{projectName}/docs/steps/step{N+1}.md

  Cursor操作:

- 完成当前 step 后自动检查下一个 step
- 有新 step 则继续执行

  4.2 迭代阶段追加 step 文档
  
  ```plaintext
  初始生成:     迭代追加:
  docs/steps/     docs/steps/  
  ├── step1.md    ├── step1.md  ✅
  ├── step2.md    ├── step2.md  ✅
  └── step3.md    ├── step3.md  ✅
        └── step4.md  🔄 (新需求)
        └── step5.md  ⬜️
  ```

  4.3 迭代阶段不会重新初始化

  原因：

  - 现有代码已通过测试/验收
  - 只需在现有项目基础上增量开发
  - 保持项目历史和版本完整性

  ---

  五、需要修改的代码

  5.1 新增文档

- docs/AI工程化开发手册/Cursor 使用指南.md(已创建）
- docs/AI工程化开发手册/迭代阶段操作指南.md(待创建）  

---

## 六、文件位置汇总

 | 产出物 | 位置 |  
 | --- | --- |
 | 项目代码 | v2/dev/{projectName}/src/ |
 | Cursor 规范 | v2/dev/{projectName}/.cursor/rules/ |
 | Step 文档 | v2/dev/{projectName}/docs/steps/stepN.md |
 | Plan 文件 | v2/dev/{projectName}/.cursor/plans/stepN-plan.md |

  ---
  七、流程图  

  ```plaintext
   workflow-dashboard                               Cursor
           │                                          │
           ├─ init 阶段                                │
           ├─ requirement 阶段                         │
           ├─ architecture 阶段 ── 生成 step1,2,3... ──►│
           ├─ initialization 阶段 ── 生成项目脚手架    ──►│
           │                                           │
           │                                    ◄──────┤
           │                                           │
           │                                    ◄──────┤
           │                                           │
           │  iteration 阶段                            │
           ├─ 添加新需求                                 │
           ├─ 生成 step4.md  ──────────────────────────►│
           │                                           │
  ```

 已修改的文件：

 | 文件 | 修改内容 |
 | --- | --- |
 | aiPrompts.ts - architecture prompt | 添加 steps 数组输出，生成 stepN.md 文档 |
 | aiPrompts.ts - initialization prompt | 添加输出路径 v2/dev/{projectName}/，Step 文档保存位置 |
 | LifecycleDashboard.vue - completeStage | initialization 阶段跳过 proposalContent 检查，直接完成 |
 | run-step.md | 更新为预生成模式，强调 stepN.md 已预生成，Cursor 只执行 |

新建的文档：

 | 文档 | 说明 |
 | --- | --- |
 | Cursor 使用指南.md | Cursor 如何接管开发阶段 |
 | 迭代阶段操作指南.md | 迭代阶段如何追加新的 step |

  流程总结：

  workflow-dashboard:
    init → requirement → architecture → initialization
                                       ↓
                                生成 v2/dev/{projectName}/
                                - src/ (脚手架)
                                - .cursor/rules/
                                - docs/steps/step1,2,3...
                                       ↓
  Cursor:
    打开 v2/dev/{projectName}/
    读取 docs/steps/step1.md → 执行 → 完成
    检查 step2.md → 执行 → 完成
    检查 step3.md → ...

  迭代时：
    workflow-dashboard 生成 step4.md → Cursor 执行
