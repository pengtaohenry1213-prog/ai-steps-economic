
架构阶段完整方案

  1. 开始按钮状态

  - 前置条件：当 init 和 requirement 阶段都有 proposalContent 时，架构阶段"开始"按钮可用
  - 按钮文案：可显示"基于前序阶段开始"或保持"开始"

  2. 点击"开始"后的流程

  用户点击"开始"
      ↓
		- startStage('architecture')
    - 设置 status='in_progress'
		  ↓
	出现"生成架构文档"按钮，点击后【startArchitectureGeneration(), 只使用 requirement 内容】
	    ↓
  弹出 DocumentEditorSimple 编辑器
      ↓
  自动加载输入内容（可编辑）：
    - 立项书 (init.fullText)
    - 需求文档 (requirement.fullText)
      ↓
  用户可选择：
    a) 直接点击"开始生成"（使用默认内容）
    b) 先编辑修改输入内容，再点击"开始生成"
      ↓
  调用 generateContentByStageStream('architecture', files, ...)
      ↓
  流式输出：
    - 思考内容（黑色背景区域）
    - 架构文档正文（实时显示）
      ↓
  生成完成，用户可编辑确认
      ↓
  点击"保存" → 保存到 Supabase/localStorage
  点击"完成" → 进入 Human Gate 审批

  3. 关键技术点

  | 点 | 说明 |
  | --- | --- |
  | 输入内容可编辑 | 立项书+需求文档合并后，用户可修改补充 |
  | 流式输出 | 复用 DocumentEditorSimple 组件的流式能力 |
  | 思考内容分离       | `` 显示在黑色背景框中，最新3行 |
  | 保存到 Supabase | 复用现有 store.saveProposalContent('architecture', doc) |

---

  4. 与 requirement_analysis 的对比

  | 对比项 | 需求分析 (requirement_analysis) | 架构阶段 (architecture) |
  | --- | --- | --- |
  | 输入数据   | init 立项书 + 行业标准 | init 立项书 + requirement
   需求文档 |
  | 用户输入   | 无额外输入 | 可编辑输入内容后再生成 |
  | 输出格式   | hasCovered/missingSuggestions/bestPractices | 完整架构文档 |
  | prompt | requirement_analysis | architecture |

  ---

                                                                                                 │
│ ╭──────────────────────────────────────────────────────────────────────────────────────────────╮ │
│ │ 架构阶段实现计划                                                                             │ │
│ │                                                                                              │ │
│ │ 基于 startAIGeneration 流式生成模式 (lines 700-813)，修改 startArchitectureGeneration (lines │ │
│ │  1457-1540)：                                                                                │ │
│ │                                                                                              │ │
│ │ 修改内容                                                                                     │ │
│ │                                                                                              │ │
│ │ 1. 重构 startArchitectureGeneration 函数                                                     │ │
│ │                                                                                              │ │
│ │ 将现在的"生成后打开编辑器"模式改为"先打开编辑器，用户编辑后点击开始生成"：                   │ │
│ │                                                                                              │ │
│ │ // 1. 合并 init + requirement 内容到编辑器                                                   │ │
│ │ const initContent = initStage?.proposalContent?.fullText || ''                               │ │
│ │ const requirementContent = requirementStage.proposalContent?.fullText || ''                  │ │
│ │ const combinedInput = `# 立项书\n\n${initContent}\n\n---\n\n#                                │ │
│ │ 需求文档\n\n${requirementContent}`                                                           │ │
│ │                                                                                              │ │
│ │ // 2. 打开编辑器（显示合并后的输入内容供用户编辑）                                           │ │
│ │ editorMarkdownContent.value = combinedInput                                                  │ │
│ │ editorStageName.value = stageId                                                              │ │
│ │ editorTitle.value = '架构文档编辑器'                                                         │ │
│ │ editorReadOnly.value = false                                                                 │ │
│ │ editorLoadingText.value = '请编辑输入内容，点击"开始生成"启动 AI'                            │ │
│ │ showDocumentEditor.value = true                                                              │ │
│ │ simpleEditorRef.value?.clearContent()                                                        │ │
│ │ simpleEditorRef.value?.setContent(combinedInput)                                             │ │
│ │                                                                                              │ │
│ │ // 3. 状态设为"等待用户点击开始生成"（而非直接生成）                                         │ │
│ │                                                                                              │ │
│ │ 2. 添加 startArchitectureGenerationStreaming 内部函数                                        │ │
│ │                                                                                              │ │
│ │ 用户点击"开始生成"后：                                                                       │ │
│ │ - 调用 simpleEditorRef.value?.clearContent() 清空编辑器                                      │ │
│ │ - 使用 generateContentByStageStream('architecture', processed.files, ...) 流式生成           │ │
│ │ - 通过回调 simpleEditorRef.value?.appendContent(chunk) 实时追加内容                          │ │
│ │ - 生成完成后保存到 store.saveProposalContent                                                 │ │
│ │                                                                                              │ │
│ │ 3. UI 调整                                                                                   │ │
│ │                                                                                              │ │
│ │ 在编辑器工具栏添加"开始生成"按钮（架构阶段特有），流程：                                     │ │
│ │ 1. 点击"生成架构文档" → 打开编辑器显示输入内容                                               │ │
│ │ 2. 用户编辑输入内容（可选）                                                                  │ │
│ │ 3. 点击"开始生成" → 流式生成架构文档                                                         │ │
│ │ 4. 生成完成 → 用户可编辑 → 保存                                                              │ │
│ │                                                                                              │ │
│ │ 关键区别                                                                                     │ │
│ │                                                                                              │ │
│ │ | 项目   | 当前实现                         | 新实现                               |         │ │
│ │ |------|------------------------------|-----------------------------------|                  │ │
│ │ | 时机   | 生成完成后打开编辑器                   | 先打开编辑器，用户编辑后再生成           │ │
│ │          |                                                                                   │ │
│ │ | 内容   | 仅 requirement 内容             | init + requirement 合并             |           │ │
│ │ | 模式   | 非流式 (generateContentByStage) | 流式 (generateContentByStageStream) |           │ │
│ │ | 用户编辑 | 不可编辑输入                       | 可编辑输入内容后再生成                     │ │
│ │    |                                                                                         │ │
│ ╰──────────────────────────────────────────────────────────────────────────────────────────────╯ │



架构设计文档 标准章节 可在后期做功能拆分么？ 我一般拆分是以工作流方式拆，比如：stepN.md, 
  第一步做什么、测什么、校验什么和生成什么。
  先把核心结论给你，再帮你对齐你的工作流 Step 拆分模式，两套完全能兼容、不冲突。
  一、先答核心问题
  架构设计文档，完全可以后期再做功能拆分、任务拆分、工作流拆分。而且正确流程本来就是：
  先写架构设计文档 → 定地基、定分层、定技术栈、定模块边界
  再基于架构，拆工作流 Step 任务（step1.md / step2.md / stepN.md）
  每个 Step 里写：做什么、依赖什么、开发什么、自测什么、产出什么、校验标准
  架构是「顶层骨架」，Step 工作流是「落地施工步骤」，先后关系、互不矛盾，还能互相约束不跑偏。
  二、你这种「按工作流 stepN.md 拆分」的优势
  你习惯的方式：按步骤拆成独立 md：step1 项目初始化.mdstep2 表格组件封装.mdstep3 
  公式引擎集成.md每一步固定结构：
  前置依赖
  本次要做什么
  开发任务
  自测要点
  产出物
  校验通过标准
  特别适合你这种技术升级、渐进式开发、4~6 周迭代项目：
  不被大文档捆死
  每一步可独立验收、可随时暂停续做
  后续接手人照着 step 就能往下干
  和你之前里程碑、周计划天然匹配
  三、两套文档怎么配合共存（最佳搭配方案）
  1. 基线文档保留
  v2_architecture.md 架构文档 只做顶层定规：
  整体架构、分层
  技术栈选型
  目录结构规范
  模块划分、依赖关系
  二期预埋架构（Yjs/Supabase/RAG）
  架构约束、设计原则
  架构文档只定「规则和骨架」，不拆细任务、不写具体开发步骤。
  2. 然后再拆 工作流 stepN.md
  完全基于架构文档来拆，每一步都不突破架构约定：架构定好了有哪些模块、哪些分层，你再按业务开发
  顺序拆成 step1～stepN，每一步只在架构划定的范围内干活。
  3. 推荐目录结构（直接可用）
  plaintext
  docs/
    v1_v2_analysis.md
    v1_v2_upgrade_requirements.md
    v2_init_plan.md
    v2_product_roadmap.md
    v2_architecture.md      # 顶层架构，定地基
    workflow/
      step1 项目初始化与脚手架搭建.md
      step2 公共组件与VxeTable封装.md
      step3 Mock数据层与服务抽象.md
      step4 模型&版本列表页面开发.md
      step5 HyperFormula公式引擎集成.md
      step6 单元格编辑与自动计算.md
      
      step7 版本状态机与权限控制.md
      step8 Excel导入导出实现.md
      step9 性能优化与虚拟滚动验收.md
      step10 单元测试&文档收尾.md
  四、每个 step.md 固定统一模板（给你直接套用）
  以后每一个 step 都用这套结构，统一规范：
  markdown
  # StepX xxxxxx
  ## 一、前置依赖
  依赖架构规范 / 依赖上一个 step 产出

  ## 二、本阶段目标
  要完成什么核心能力

  ## 三、开发任务清单
  1. 
  2. 
  3. 

  ## 四、自测校验项
  - 功能校验
  - 边界场景校验
  - 性能/样式校验

  ## 五、本步骤产出物
  代码、组件、接口、文档等

  ## 六、通过标准
  满足即可进入下一 step
  五、总结一句话
  架构文档先写，只定顶层骨架和规则，不用拆细功能步骤
  功能拆分、开发落地，全部放到独立 workflow/stepN.md 按工作流拆分
  架构管「怎么搭」，Step 管「一步步怎么建」，完全兼容，还最适合你渐进式研发节奏。

	理解你的方法论，完全认同。

  架构文档 vs Step工作流 的分工

  | 文档                 | 职责                             | 粒度            |
  |--------------------|--------------------------------|---------------|
  | v2_architecture.md | 定骨架、分层、技术栈、模块边界、设计原则           |
  顶层约束，不写具体开发步骤 |
  | workflow/stepN.md  | 落地执行清单：做什么、依赖什么、产出什么、自测什么、通过标准 |
  每步可独立验收       |

  与当前项目的对应关系

  当前 docs/v2/ 下已有：
  - v2_architecture.md - 顶层架构
  - v2_init_plan.md - 初始化计划
  - v2_product_roadmap.md - 产品路线图

  你的 workflow/stepN.md 拆分方式可以直接补充进来，例如：
  docs/v2/workflow/
    step1_项目初始化.md
    step2_公共组件封装.md
    step3_数据服务抽象.md
    ...

  每步固定模板：前置依赖 → 开发任务 → 自测校验 → 产出物 → 通过标准。

  这种模式特别适合你们 4~6 周的迭代节奏，每步可独立验收、随时暂停续做。

  需要我帮你整理现有的 v2_architecture.md 内容，然后按这个结构拆分出 workflow/step1~stepN.md
  吗？

> {
      "stages": [
          {
              "id": "init",
              "name": "立项",
              "label": "Init",
              "status": "completed",
              "steps": [
                  "step-init"
              ],
              "feedbackLoop": false,
              "proposalContent": {
                  "fullText": "# 经济模型系统 v2 升级项目立项书\n\n---\n\n## 1. 
  项目基本信息\n\n| 字段 | 内容 |\n|------|------|\n| **项目名称** | 经济模型系统 v2 升级项目 
  |\n| **项目类型** | 产品策划 + 技术预研 + 内部研发 |\n| **类型判断依据** | ① 
  基于已有系统(v1)的架构升级；② 涉及多项新技术选型（HyperFormula、Yjs CRDT、Supabase）；③ 
  包含完整产品路线图(P0/P1/P2)和功能规划；④ 明确的研发阶段规划和技术里程碑 |\n| **项目负责人** 
  | 【待补充】 |\n| **项目经理** | 【待补充】 |\n| **项目周期** | 4-6 周（第一阶段 
  MVP），后续可选扩展 2-4 周/功能 |\n| **文档版本** | v1.0.0 |\n| **创建日期** | 2026-05-09 
  |\n| **基线文档** | 
  v1_v2_analysis.md、v1_v2_upgrade_requirements.md、v2_init_plan.md、v2_product_roadmap.md 
  |\n\n---\n\n## 2. 项目背景与目标\n\n### 2.1 
  项目背景\n\n当前系统（v1）已实现经济模型系统的核心功能，包括模型管理、版本控制、公式计算和 
  Excel 导入导出。但存在以下局限：\n\n| 局限项 | 说明 | 业务影响 
  |\n|--------|------|----------|\n| 公式引擎自研 | FunctionCore + Kahn 拓扑排序 | 
  维护成本高，XIRR 等复杂函数算法不精确 |\n| 单人编辑 | 无实时协作能力 | 多部门协作效率低 |\n| 
  后端 Mock | 基于 Nitro | 无法支持真实业务扩展 |\n| 安全机制 | 前端权限控制 | 
  无法满足等保合规要求 |\n\n### 2.2 升级目标\n\n| 目标 | 说明 |\n|------|------|\n| 
  **公式零误差** | HyperFormula 确保财务公式 100% 准确 |\n| **协作无冲突** | Yjs CRDT 
  支持多人同时编辑 |\n| **内网可运行** | Supabase 本地化部署，无外网依赖 |\n| **数据零泄漏** | 
  敏感字段全程脱敏 |\n| **审计可追溯** | 完整操作日志记录 |\n\n### 2.3 核心升级内容\n\n| 维度 |
   v1（现有） | v2（目标） |\n|------|-----------|-----------|\n| **公式引擎** | 自研 
  FunctionCore + Kahn 拓扑排序 | HyperFormula |\n| **协作机制** | 单人编辑（无实时协作） | Yjs 
  CRDT 多人实时协作 |\n| **智能助手** | 无 | RAG + LLM |\n| **后端** | Nitro Mock | Supabase 
  本地化 |\n| **状态管理** | Pinia | Zustand + Yjs Y.Map |\n| **安全** | 前端权限控制 | RBAC + 
  RLS + 审计日志 |\n| **合规** | 无 | 等保二级/三级 |\n\n---\n\n## 3. 项目范围\n\n### In 
  Scope（P0/P1/P2）\n\n#### P0 核心功能（必须实现）\n\n| 功能项 | 描述 | v1 复用量 | 验收标准 
  |\n|--------|------|-----------|----------|\n| **表格编辑** | vxe-table 
  封装，支持双击编辑、虚拟滚动（1000+行流畅） | 40% | 
  双击单元格可编辑，回车确认；1000行数据加载<2s |\n| **公式引擎** | HyperFormula + v1 
  财务函数(XNPV/NPV/IRR)混合方案 | 30% | SUM/XIRR/XNPV/NPV/IRR 计算正确，与 v1 结果一致 |\n| 
  **版本管理** | 模型版本 CRUD + 状态机(草稿→已提交→已锁定) | 80% | 
  可创建/编辑/删除版本；状态流转正确；锁定版本不可编辑 |\n| **Mock 数据层** | localStorage 
  替代真实后端 | 90% | 数据可 CRUD；页面加载正常；3个模型+3个版本初始数据就位 |\n\n#### P1 
  重要功能（重要）\n\n| 功能项 | 描述 | v1 复用量 | 验收标准 
  |\n|--------|------|-----------|----------|\n| **导入导出** | Excel 模板导入/导出 | 50% | 
  Excel 模板导入正常；Excel 导出正常；与 v1 格式兼容 |\n| **树形表格** | 指标层级展示与折叠 | 
  70% | 父子指标层级正确显示；展开/折叠功能正常 |\n| **数据格式化** | 千分位/百分比/绝对值显示 
  | 90% | 千分位、百分比显示正确；格式化配置可调整 |\n| **权限控制（RBAC）** | 
  集团用户/锁定者/其他用户权限矩阵 | 100% | 权限矩阵生效；锁定者不可编辑他人锁定版本 |\n\n#### 
  P2 扩展功能（后续阶段）【可裁剪】\n\n| 功能项 | 描述 | 工期 | 前置条件 
  |\n|--------|------|------|----------|\n| **Yjs 多人协作** | 多人实时编辑、冲突解决、光标同步
   | 2周 | Phase 1-2 完成 |\n| **Supabase 后端** | PostgreSQL + Auth + Realtime | 2周 | Yjs 
  协作验证 |\n| **RAG 智能助手** | 向量检索 + LLM 自然语言查询 | 4周 | Supabase 就绪 |\n\n### 
  Out of Scope\n\n以下功能明确不在本项目范围内：\n\n| 功能项 | 排除原因 | 后续阶段 
  |\n|--------|----------|----------|\n| **实时多人协作** | 第一阶段仅实现单人编辑功能 | Phase 
  2（Yjs） |\n| **真实后端服务** | 第一阶段使用 localStorage Mock | Phase 2（Supabase） |\n| 
  **RAG 智能助手** | 需 Supabase 就绪后实现 | Phase 3 |\n| **等保合规认证** | 
  架构设计预留，认证工作另行安排 | 独立项目 |\n| **公式智能提示（CodeMirror6）** | 二期规划功能
   | Phase 2.1 |\n| **错误定位/传播显示** | 二期规划功能 | Phase 2.3 |\n| **自动备份/恢复** | 
  二期规划功能 | Phase 2.4 |\n| **评论/标注/任务分配** | 二期规划功能 | Phase 2.5 
  |\n\n---\n\n## 4. 验收标准\n\n### 4.1 功能验收标准\n\n| 验收项 | 验收条件 | 检查方法 
  |\n|--------|----------|----------|\n| **模型列表** | 显示 3 
  个示例模型（五年财务预测、季度经营分析、年度预算） | 页面截图验证 |\n| **版本列表** | 显示 3 
  个版本（草稿/已提交/已锁定），状态标识清晰 | 页面截图验证 |\n| **单元格编辑** | 
  双击单元格进入编辑模式，回车确认，ESC 取消 | 操作测试 |\n| **虚拟滚动** | 1000 
  行数据滚动流畅，无卡顿 | 性能测试 |\n| **SUM 公式** | 计算结果正确，与 Excel 核对 | 单元测试 
  |\n| **XIRR 公式** | 与 v1 算法结果一致（Newton-Raphson + Bisection） | 回归测试 |\n| **XNPV 
  公式** | 与 v1 算法结果一致（日期加权净现值） | 单元测试 |\n| **NPV 公式** | 支持日期数组，与
   v1 结果一致（禁用 HF 版本） | 单元测试 |\n| **IRR 公式** | 与 v1 算法结果一致（禁用 HF 
  版本） | 回归测试 |\n| **版本状态机** | 草稿→已提交→已锁定流转正确 | 状态转换测试 |\n| 
  **锁定版本保护** | 锁定者不可编辑本人锁定版本；其他用户不可编辑；管理员可解锁 | 权限测试 |\n|
   **Excel 导入** | 解析标准 Excel 模板，数据正确入库 | 导入测试 |\n| **Excel 导出** | 
  生成标准格式 Excel，公式和数据正确 | 导出测试 |\n| **数据格式化** | 
  千分位（1,234,567.00）、百分比（12.34%）、绝对值显示正确 | 格式测试 |\n\n### 4.2 
  性能验收标准\n\n| 指标 | 标准 | 测试方法 |\n|------|------|----------|\n| **表格加载** | < 
  2s（1000 行数据） | 性能测试 |\n| **公式计算** | < 100ms（100 个公式） | 性能测试 |\n| 
  **虚拟滚动** | 滚动流畅无卡顿，FPS ≥ 30 | 性能测试 |\n| **页面响应** | 操作反馈 < 200ms | 
  用户体验测试 |\n\n### 4.3 安全验收标准\n\n| 验收项 | 验收条件 | 检查方法 
  |\n|--------|----------|----------|\n| **权限矩阵** | 集团用户/锁定者/其他用户权限正确生效 | 
  权限测试 |\n| **锁定保护** | 锁定版本不可编辑（除锁定者本人和管理员） | 权限测试 |\n| 
  **操作日志** | 关键操作（提交/锁定）记录日志 | 日志审查 |\n| **敏感数据脱敏** | 
  敏感字段全程脱敏处理 | 安全测试 |\n\n### 4.4 集成验收标准\n\n| 验收项 | 验收条件 | 检查方法 
  |\n|--------|----------|----------|\n| **项目可运行** | `npm install` + `npm run dev` 成功 | 
  构建测试 |\n| **单元测试覆盖率** | ≥ 70%（核心模块） | 覆盖率报告 |\n| **文档就绪** | README 
  + 部署文档完整 | 文档审查 |\n\n---\n\n## 5. 里程碑计划\n\n| 里程碑 | 计划日期 | 交付物 | 
  验收条件 |\n|--------|----------|--------|----------|\n| **M0: 项目初始化** | Day 1 | 
  可运行空项目、Mock 数据就位 | npm install/dev 正常；页面可访问 |\n| **M1: 表格渲染** | Day 5 
  | VxeTableWrapper 组件、Mock Service、模型列表页、版本列表页 | 显示 3 个模型；显示 3 
  个版本；列表分页正常 |\n| **M2: 编辑功能** | Day 10 | FormulaEngine（HyperFormula + v1 
  财务函数）、单元格编辑、公式自动计算、依赖图+循环检测 | vxe-table 
  渲染正确；可编辑单元格；SUM/XIRR/XNPV 计算正确 |\n| **M3: 版本管理** | Day 15 | 
  版本状态机、版本保存/加载、权限控制 | 可创建/编辑/删除版本；状态流转正确；锁定版本不可编辑 
  |\n| **M4: 导入导出** | Day 18 | Excel 导入、Excel 导出、数据格式化 | Excel 
  模板导入正常；Excel 导出正常；数据格式化正确 |\n| **M5: MVP 完成** | Day 23 | v2 
  可演示版本、单元测试（覆盖率≥70%）、文档 | 核心流程演示正常；测试通过；文档就绪 |\n\n### 
  详细阶段计划\n\n#### Phase 0: 项目初始化（1 天）\n\n| 任务 | 时长 | 验收标准 
  |\n|------|------|---------|\n| 初始化 Monorepo 项目（pnpm workspace） | 0.5h | pnpm 
  workspace 正常 |\n| 配置 Vite + Vue3 + TypeScript | 0.5h | npm run dev 可运行 |\n| 配置 
  Tailwind CSS | 0.5h | 样式正常 |\n| 配置 ESLint + Prettier | 0.5h | 代码格式化正常 |\n| 配置 
  Vitest | 0.5h | 测试可运行 |\n| 导入 v1 Mock 数据（3 模型 + 3 版本） | 0.5h | 数据文件就位 
  |\n\n#### Phase 1: 核心功能开发（3 周）\n\n**Week 1: 表格组件 + 数据层**\n\n| 任务 | 时长 | 
  验收标准 |\n|------|------|---------|\n| 封装 VxeTableWrapper | 1d | 组件可配置；支持双击编辑
   |\n| 实现 Mock Service | 1d | 数据可 CRUD |\n| 模型列表页 | 1d | 显示模型列表 |\n| 
  版本列表页 | 1d | 显示版本列表 |\n\n**Week 2: 公式引擎 + 编辑功能**\n\n| 任务 | 时长 | 
  验收标准 |\n|------|------|---------|\n| 集成 HyperFormula | 1d | 引擎正常运行 |\n| 补充 v1 
  财务函数（XNPV/NPV/IRR） | 1d | 函数测试通过 |\n| 单元格编辑功能 | 1d | 可编辑单元格 |\n| 
  公式计算触发 | 1d | 公式自动计算 |\n| 依赖图 + 循环检测 | 1d | 依赖关系正确 |\n\n**Week 3: 
  版本管理 + 状态机 + 导入导出**\n\n| 任务 | 时长 | 验收标准 |\n|------|------|---------|\n| 
  版本状态机实现 | 1d | 草稿→已提交→已锁定正常 |\n| 版本保存/加载 | 1d | 数据持久化到 
  localStorage |\n| 导入功能 | 1d | Excel 模板导入 |\n| 导出功能 | 1d | Excel 导出 |\n| 
  数据格式化 | 0.5d | 千分位/百分比正常 |\n| 权限控制 | 0.5d | 权限矩阵生效 |\n\n#### Phase 2: 
  完善与优化（1 周）\n\n| 任务 | 时长 | 验收标准 |\n|------|------|---------|\n| 集成测试 | 1d 
  | 核心流程测试通过 |\n| 性能优化 | 1d | 表格渲染 < 2s |\n| 虚拟滚动验证 | 1d | 大数据量测试 
  |\n| 单元测试补充 | 1d | 覆盖率 ≥ 70% |\n| 文档完善 | 1d | README + 部署文档 |\n\n#### Phase 
  3-4: 后续扩展（可选）\n\n| 功能 | 工期 | 前置条件 |\n|------|------|----------|\n| Yjs 
  多人协作 | 2周 | Phase 1-2 完成 |\n| Supabase 后端 | 2周 | Yjs 协作验证 |\n| RAG 智能助手 | 
  4周 | Supabase 就绪 |\n\n---\n\n## 6. 风险评估\n\n### 高风险\n\n| 风险 | 影响 | 应对方案 | 
  责任人 |\n|------|------|----------|--------|\n| **HyperFormula 与 v1 公式语法不兼容** | 
  公式无法迁移；计算结果与 v1 不一致 | ① 逐一验证每个财务函数（SUM/XIRR/XNPV/NPV/IRR）；② 
  编写兼容层；③ 禁用 HF 中与 v1 冲突的 NPV/IRR 函数；④ 全面回归测试 | 【待指定】 |\n| **Yjs 
  CRDT 状态管理复杂度** | 开发周期延长；协作功能不稳定 | ① 第一阶段先做单人功能；② 使用 spec-03
   明确的设计；③ 预留 2 天预研时间 | 【待指定】 |\n| **循环依赖算法复杂度** | 
  功能延期；计算结果不准确 | ① 参考 Floyd 快慢指针算法；② 参考 Excel 迭代计算原理；③ 预留 3 
  天实现时间 | 【待指定】 |\n\n### 中风险\n\n| 风险 | 影响 | 应对方案 | 责任人 
  |\n|------|------|----------|--------|\n| **Mock 数据与真实业务差异** | 
  测试不充分；上线后发现问题 | 复用 v1 的 Excel 模板数据（3 模型 + 3 版本）作为测试基准 | 
  【待指定】 |\n| **vxe-table 与 HyperFormula 绑定** | 集成复杂度；样式冲突 | 参考 spec-02 
  的实现方案；使用 VxeTableWrapper 封装隔离 | 【待指定】 |\n| **等保合规要求** | 
  额外工作量；架构调整 | 预研 spec-09；架构设计预留合规接口 | 【待指定】 |\n| **Excel 
  导入解析异常** | 功能不稳定；数据丢失 | 使用 exceljs 稳定版；编写详细解析测试；错误提示友好 |
   【待指定】 |\n\n### 低风险\n\n| 风险 | 影响 | 应对方案 | 责任人 
  |\n|------|------|----------|--------|\n| **v1 原型页面过时** | UI 参考价值降低 | 直接基于 v2
   spec 设计；减少对 v1 UI 的依赖 | 【待指定】 |\n| **技术栈学习成本** | 开发效率降低 | 
  使用熟悉的 Vue 3 + vxe-table；预留"
              },
              "startTime": "2026-05-12T13:31:39.933Z",
              "isGenerating": false,
              "endTime": "2026-05-12T13:34:53.464Z"
          },
          {
              "id": "requirement",
              "name": "需求",
              "label": "Requirement",
              "status": "completed",
              "steps": [
                  "step-requirement"
              ],
              "feedbackLoop": false,
              "proposalContent": {
                  "name": "需求文档 (PRD)",
                  "fullText": "<think>\nLet me analyze the input document carefully to generate
   a formal project initiation document (立项书).\n\n**Project Type Determination:**\nBased on 
  the input:\n- ① Based on existing system (v1) architecture upgrade\n- ② Multiple new 
  technology selections (HyperFormula, Yjs CRDT, Supabase)\n- ③ Complete product roadmap 
  (P0/P1/P2) and feature planning\n- ④ Clear R&D phase planning and technical 
  milestones\n\n**Project Type:** 内部研发项目 (Internal R&D Project)\n**Judgment Basis:** This
   is an architecture upgrade project for an existing internal economic model system (v1), with
   clear technical milestones, MVP scope, and subsequent expansion phases. It's not a 
  customer-facing project but an internal product evolution.\n\n**Project Information:**\n- 
  Project Period: 4-6 weeks (first phase MVP), subsequent optional expansion 2-4 
  weeks/feature\n- Document Version: v1.0.0\n- Creation Date: 2026-05-09\n- Baseline Documents:
   v1_v2_analysis.md, v1_v2_upgrade_requirements.md, v2_init_plan.md, v2_product_roadmap.md\n- 
  Project Manager: 【待补充】\n- Project Lead: 【待补充】\n\nLet me structure the document 
  according to the requirements:\n\n1. **项目基本信息** - Basic project info\n2. 
  **项目背景与目标** - Background and objectives\n3. **项目范围** - Scope (P0/P1/P2 + Out of 
  Scope)\n4. **验收标准** - Acceptance criteria (functionality/performance/security)\n5. 
  **里程碑计划** - Milestone plan\n6. **风险评估** - Risk assessment\n7. **Human Gate** - 
  Decision gates\n8. **ADR** - Architecture Decision Records\n\n\n9. **附录** - Supporting 
  materials and references\n</think>\n\n## 1. 项目基本信息\n\n| 字段 | 内容 
  |\n|------|------|\n| **项目名称** | 经济模型系统 v1 → v2 架构升级项目 |\n| **项目类型** | 
  内部研发项目 |\n| **类型判断依据** | ① 基于已有系统(v1)的架构升级；② 
  涉及多项新技术选型（HyperFormula、Yjs CRDT、Supabase）；③ 
  包含完整产品路线图(P0/P1/P2)和功能规划；④ 明确的研发阶段规划和技术里程碑 |\n| **项目负责人** 
  | 【待补充】 |\n| **项目经理** | 【待补充】 |\n| **项目周期** | 4-6 周（第一阶段 
  MVP），后续可选扩展 2-4 周/功能 |\n| **文档版本** | v1.0.0 |\n| **创建日期** | 2026-05-09 
  |\n| **基线文档** | 
  v1_v2_analysis.md、v1_v2_upgrade_requirements.md、v2_init_plan.md、v2_product_roadmap.md 
  |\n\n---\n\n## 2. 项目背景与目标\n\n### 2.1 
  项目背景\n\n当前系统（v1）已实现经济模型系统的核心功能，包括模型管理、版本控制、公式计算和 
  Excel 导入导出。但存在以下局限：\n\n| 局限项 | 说明 | 业务影响 
  |\n|--------|------|----------|\n| 公式引擎自研 | FunctionCore + Kahn 拓扑排序 | 
  维护成本高，XIRR 等复杂函数算法不精确 |\n| 单人编辑 | 无实时协作能力 | 多部门协作效率低 |\n| 
  后端 Mock | 基于 Nitro | 无法支持真实业务扩展 |\n| 安全机制 | 前端权限控制 | 
  无法满足等保合规要求 |\n\n### 2.2 项目目标\n\n| 目标类型 | 具体目标 
  |\n|----------|----------|\n| **技术升级** | 引入 HyperFormula 
  替代自研公式引擎，提升计算精度和稳定性 |\n| **功能增强** | 
  实现完整的版本状态机（草稿→已提交→已锁定） |\n| **性能提升** | 支持 1000+ 
  行数据虚拟滚动，加载时间 < 2s |\n| **架构演进** | 为后续多端协作（Yjs 
  CRDT）和真实后端（Supabase）预留架构基础 |\n| **安全合规** | 
  架构设计预留等保二级/三级合规接口 |\n\n### 2.3 成功标准\n\n- P0 核心功能 100% 交付\n- 
  单元测试覆盖率 ≥ 70%\n- 表格加载性能 < 2s（1000 行数据）\n- 公式计算性能 < 100ms（100 
  个公式）\n- 可演示 MVP 版本交付\n\n---\n\n## 3. 项目范围\n\n### In Scope\n\n#### P0 
  核心功能（必须实现）\n\n| 功能项 | 描述 | v1 复用量 | 验收标准 
  |\n|--------|------|-----------|----------|\n| **表格编辑** | vxe-table 
  封装，支持双击编辑、虚拟滚动（1000+行流畅） | 40% | 
  双击单元格可编辑，回车确认；1000行数据加载<2s |\n| **公式引擎** | HyperFormula + v1 
  财务函数(XNPV/NPV/IRR)混合方案 | 30% | SUM/XIRR/XNPV/NPV/IRR 计算正确，与 v1 结果一致 |\n| 
  **版本管理** | 模型版本 CRUD + 状态机(草稿→已提交→已锁定) | 80% | 
  可创建/编辑/删除版本；状态流转正确；锁定版本不可编辑 |\n| **Mock 数据层** | localStorage 
  替代真实后端 | 90% | 数据可 CRUD；页面加载正常；3个模型+3个版本初始数据就位 |\n\n#### P1 
  重要功能（重要）\n\n| 功能项 | 描述 | v1 复用量 | 验收标准 
  |\n|--------|------|-----------|----------|\n| **导入导出** | Excel 模板导入/导出 | 50% | 
  Excel 模板导入正常；Excel 导出正常；与 v1 格式兼容 |\n| **树形表格** | 指标层级展示与折叠 | 
  70% | 父子指标层级正确显示；展开/折叠功能正常 |\n| **数据格式化** | 千分位/百分比/绝对值显示 
  | 90% | 千分位、百分比显示正确；格式化配置可调整 |\n| **权限控制（RBAC）** | 
  集团用户/锁定者/其他用户权限矩阵 | 100% | 权限矩阵生效；锁定者不可编辑他人锁定版本 |\n\n#### 
  P2 扩展功能（后续阶段）【可裁剪】\n\n| 功能项 | 描述 | 工期 | 前置条件 
  |\n|--------|------|------|----------|\n| **Yjs 多人协作** | 多人实时编辑、冲突解决、光标同步
   | 2周 | Phase 1-2 完成 |\n| **Supabase 后端** | PostgreSQL + Auth + Realtime | 2周 | Yjs 
  协作验证 |\n| **RAG 智能助手** | 向量检索 + LLM 自然语言查询 | 4周 | Supabase 就绪 |\n\n### 
  Out of Scope\n\n| 功能项 | 排除原因 | 后续阶段 |\n|--------|----------|----------|\n| 
  **实时多人协作** | 第一阶段仅实现单人编辑功能 | Phase 2（Yjs） |\n| **真实后端服务** | 
  第一阶段使用 localStorage Mock | Phase 2（Supabase） |\n| **RAG 智能助手** | 需 Supabase 
  就绪后实现 | Phase 3 |\n| **等保合规认证** | 架构设计预留，认证工作另行安排 | 独立项目 |\n| 
  **公式智能提示（CodeMirror6）** | 二期规划功能 | Phase 2.1 |\n| **错误定位/传播显示** | 
  二期规划功能 | Phase 2.3 |\n| **自动备份/恢复** | 二期规划功能 | Phase 2.4 |\n| 
  **评论/标注/任务分配** | 二期规划功能 | Phase 2.5 |\n\n---\n\n## 4. 验收标准\n\n### 4.1 
  功能验收标准\n\n| 验收项 | 验收条件 | 检查方法 |\n|--------|----------|----------|\n| 
  **模型列表** | 显示 3 个示例模型（五年财务预测、季度经营分析、年度预算） | 页面截图验证 |\n| 
  **版本列表** | 显示 3 个版本（草稿/已提交/已锁定），状态标识清晰 | 页面截图验证 |\n| 
  **单元格编辑** | 双击单元格进入编辑模式，回车确认，ESC 取消 | 操作测试 |\n| **虚拟滚动** | 
  1000 行数据滚动流畅，无卡顿 | 性能测试 |\n| **SUM 公式** | 计算结果正确，与 Excel 核对 | 
  单元测试 |\n| **XIRR 公式** | 与 v1 算法结果一致（Newton-Raphson + Bisection） | 回归测试 
  |\n| **XNPV 公式** | 与 v1 算法结果一致（日期加权净现值） | 单元测试 |\n| **NPV 公式** | 
  支持日期数组，与 v1 结果一致（禁用 HF 版本） | 单元测试 |\n| **IRR 公式** | 与 v1 
  算法结果一致（禁用 HF 版本） | 回归测试 |\n| **版本状态机** | 草稿→已提交→已锁定流转正确 | 
  状态转换测试 |\n| **锁定版本保护** | 
  锁定者不可编辑本人锁定版本；其他用户不可编辑；管理员可解锁 | 权限测试 |\n| **Excel 导入** | 
  解析标准 Excel 模板，数据正确入库 | 导入测试 |\n| **Excel 导出** | 生成标准格式 
  Excel，公式和数据正确 | 导出测试 |\n| **数据格式化** | 
  千分位（1,234,567.00）、百分比（12.34%）、绝对值显示正确 | 格式测试 |\n| **树形表格** | 
  父子指标层级正确显示；展开/折叠功能正常 | 功能测试 |\n| **权限矩阵** | 
  集团用户/锁定者/其他用户权限正确生效 | 权限测试 |\n| **操作日志** | 
  关键操作（提交/锁定）记录日志 | 日志审查 |\n| **敏感数据脱敏** | 敏感字段全程脱敏处理 | 
  安全测试 |\n\n### 4.2 性能验收标准\n\n| 指标 | 标准 | 测试方法 
  |\n|------|------|----------|\n| **表格加载** | < 2s（1000 行数据） | 性能测试 |\n| 
  **公式计算** | < 100ms（100 个公式） | 性能测试 |\n| **虚拟滚动** | 滚动流畅无卡顿，FPS ≥ 30 
  | 性能测试 |\n| **页面响应** | 操作反馈 < 200ms | 用户体验测试 |\n\n### 4.3 安全验收标准\n\n|
   验收项 | 验收条件 | 检查方法 |\n|--------|----------|----------|\n| **权限矩阵** | 
  集团用户/锁定者/其他用户权限正确生效 | 权限测试 |\n| **锁定保护** | 
  锁定版本不可编辑（除锁定者本人和管理员） | 权限测试 |\n| **操作日志** | 
  关键操作（提交/锁定）记录日志 | 日志审查 |\n| **敏感数据脱敏** | 敏感字段全程脱敏处理 | 
  安全测试 |\n\n---\n\n## 5. 里程碑计划\n\n### 里程碑总览\n\n| 里程碑 | 计划日期 | 交付物 | 
  验收标准 |\n|--------|----------|--------|----------|\n| **M0: 项目初始化** | Day 1 | 
  可运行空项目、Mock 数据就位 | npm install/dev 正常；页面可访问 |\n| **M1: 表格渲染** | Day 5 
  | VxeTableWrapper 组件、Mock Service、模型列表页、版本列表页 | 显示 3 个模型；显示 3 
  个版本；列表分页正常 |\n| **M2: 编辑功能** | Day 10 | FormulaEngine（HyperFormula + v1 
  财务函数）、单元格编辑、公式自动计算、依赖图+循环检测 | vxe-table 
  渲染正确；可编辑单元格；SUM/XIRR/XNPV 计算正确 |\n| **M3: 版本管理** | Day 15 | 
  版本状态机、版本保存/加载、权限控制 | 可创建/编辑/删除版本；状态流转正确；锁定版本不可编辑 
  |\n| **M4: 导入导出** | Day 18 | Excel 导入、Excel 导出、数据格式化 | Excel 
  模板导入正常；Excel 导出正常；数据格式化正确 |\n| **M5: MVP 完成** | Day 23 | v2 
  可演示版本、单元测试（覆盖率≥70%）、文档 | 核心流程演示正常；测试通过；文档就绪 |\n\n### 
  详细迭代计划\n\n#### Phase 1: 核心功能开发（3 周）\n\n**Week 1: 表格组件 + 数据层**\n\n| 任务
   | 时长 | 验收标准 |\n|------|------|---------|\n| 封装 VxeTableWrapper | 1d | 
  组件可配置；支持双击编辑 |\n| 实现 Mock Service | 1d | 数据可 CRUD |\n| 模型列表页 | 1d | 
  显示模型列表 |\n| 版本列表页 | 1d | 显示版本列表 |\n\n**Week 2: 公式引擎 + 编辑功能**\n\n| 
  任务 | 时长 | 验收标准 |\n|------|------|---------|\n| 集成 HyperFormula | 1d | 引擎正常运行 
  |\n| 补充 v1 财务函数（XNPV/NPV/IRR） | 1d | 函数测试通过 |\n| 单元格编辑功能 | 1d | 
  可编辑单元格 |\n| 公式计算触发 | 1d | 公式自动计算 |\n| 依赖图 + 循环检测 | 1d | 依赖关系正确
   |\n\n**Week 3: 版本管理 + 状态机 + 导入导出**\n\n| 任务 | 时长 | 验收标准 
  |\n|------|------|---------|\n| 版本状态机实现 | 1d | 草稿→已提交→已锁定正常 |\n| 
  版本保存/加载 | 1d | 数据持久化到 localStorage |\n| 导入功能 | 1d | Excel 模板导入 |\n| 
  导出功能 | 1d | Excel 导出 |\n| 数据格式化 | 0.5d | 千分位/百分比正常 |\n| 权限控制 | 0.5d | 
  权限矩阵生效 |\n\n#### Phase 2: 优化与测试（1 周）\n\n| 任务 | 时长 | 验收标准 
  |\n|------|------|---------|\n| 性能优化 | 1d | 表格渲染 < 2s |\n| 虚拟滚动验证 | 1d | 
  大数据量测试 |\n| 单元测试补充 | 1d | 覆盖率 ≥ 70% |\n| 文档完善 | 1d | README + 部署文档 
  |\n\n### Human Gate 检查点\n\n| Gate | 时机 | 检查项 |\n|------|------|--------|\n| **Gate 
  1** | M1 完成（Day 5） | 表格组件可运行；Mock 数据正确加载 |\n| **Gate 2** | M2 完成（Day 
  10） | 公式引擎计算正确；循环依赖检测正常 |\n| **Gate 3** | M3 完成（Day 15） | 
  版本状态机完整；权限控制生效 |\n| **Gate 4** | M5 完成（Day 23） | MVP 
  功能完整；测试通过；文档就绪 |\n\n---\n\n## 6. 风险评估\n\n### 高风险\n\n| 风险项 | 影响 | 
  应对方案 | 负责人 |\n|--------|------|----------|--------|\n| **Yjs CRDT 状态管理复杂度** | 
  开发周期延长；协作功能不稳定 | ① 第一阶段先做单人功能；② 使用 spec-03 明确的设计；③ 预留 2 
  天预研时间 | 【待指定】 |\n| **循环依赖算法复杂度** | 功能延期；计算结果不准确 | ① 参考 Floyd
   快慢指针算法；② 参考 Excel 迭代计算原理；③ 预留 3 天实现时间 | 【待指定】 |\n\n### 
  中风险\n\n| 风险项 | 影响 | 应对方案 | 负责人 |\n|--------|------|----------|--------|\n| 
  **Mock 数据与真实业务差异** | 测试不充分；上线后发现问题 | 复用 v1 的 Excel 模板数据（3 模型 
  + 3 版本）作为测试基准 | 【待指定】 |\n| **vxe-table 与 HyperFormula 绑定** | 
  集成复杂度；样式冲突 | 参考 spec-02 的实现方案；使用 VxeTableWrapper 封装隔离 | 【待指定】 
  |\n| **等保合规要求** | 额外工作量；架构调整 | 预研 spec-09；架构设计预留合规接口 | 
  【待指定】 |\n| **Excel 导入解析异常** | 功能不稳定；数据丢失 | 使用 exceljs 
  稳定版；编写详细解析测试；错误提示友好 | 【待指定】 |\n\n### 低风险\n\n| 风险项 | 影响 | 
  应对方案 | 负责人 |\n|--------|------|----------|--------|\n| **技术选型变化** | 返工成本高 |
   关键选型（HyperFormula/Yjs）已在 spec 中验证 | 【待指定】 |\n| **人员知识缺口** | 
  学习曲线影响效率 | 组织内部技术分享；指定技术负责人 | 【待指定】 |\n\n---\n\n## 7. Human 
  Gate\n\n### Gate 1: 项目初始化检查\n\n| 字段 | 内容 |\n|------|------|\n| **Gate 类型** | 
  项目初始化检查点 |\n| **提交时间** | Day 1 |\n| **决策** | **待评审** |\n| **决策依据** | 
  检查项：① 项目骨架搭建完成；② Mock 数据就位（3 模型 + 3 版本）；③ 开发环境可运行（npm 
  install/dev 正常）；④ 基础目录结构符合规范 |\n| **整改要求（如有）** | 【待补充】 |\n| 
  **整改期限（如有）** | 【待补充】 |\n\n### Gate 2: 表格组件检查\n\n| 字段 | 内容 
  |\n|------|------|\n| **Gate 类型** | 核心功能检查点 |\n| **提交时间** | Day 5 |\n| **决策** 
  | **待评审** |\n| **决策依据** | 检查项：① VxeTableWrapper 组件可配置；② 双击单元格可编辑；③ 
  模型列表页显示正确；④ 版本列表页显示正确；⑤ localStorage CRUD 正常 |\n| **整改要求（如有）** 
  | 【待补充】 |\n| **整改期限（如有）** | 【待补充】 |\n\n### Gate 3: 公式引擎检查\n\n| 字段 |
   内容 |\n|------|------|\n| **Gate 类型** | 核心技术检查点 |\n| **提交时间** | Day 10 |\n| 
  **决策** | **待评审** |\n| **决策依据** | 检查项：① HyperFormula 集成成功；② 
  SUM/XIRR/XNPV/NPV/IRR 计算正确（与 v1 结果一致）；③ 单元格编辑功能正常；④ 
  公式自动计算触发正常；⑤ 循环依赖检测正常 |\n| **整改要求（如有）** | 【待补充】 |\n| 
  **整改期限（如有）** | 【待补充】 |\n\n### Gate 4: 版本管理检查\n\n| 字段 | 内容 
  |\n|------|------|\n| **Gate 类型** | 核心功能检查点 |\n| **提交时间** | Day 15 |\n| **决策**
   | **待评审** |\n| **决策依据** |",
                  "background": "需求分析报告\n\n",
                  "scope": {
                      "inScope": [],
                      "outScope": []
                  },
                  "acceptance": ""
              },
              "startTime": "2026-05-12T13:35:00.632Z",
              "endTime": "2026-05-12T21:45:26.662Z"
          },
          {
              "id": "architecture",
              "name": "架构",
              "label": "Architecture",
              "status": "pending",
              "steps": [],
              "feedbackLoop": false,
              "proposalContent": null
          },
          {
              "id": "initialization",
              "name": "初始化",
              "label": "Init Project",
              "status": "pending",
              "steps": [],
              "feedbackLoop": false,
              "proposalContent": null
          },
          {
              "id": "development",
              "name": "开发",
              "label": "Development",
              "status": "pending",
              "steps": [],
              "feedbackLoop": false,
              "proposalContent": null
          },
          {
              "id": "testing",
              "name": "测试",
              "label": "Testing",
              "status": "pending",
              "steps": [],
              "feedbackLoop": false,
              "proposalContent": null
          },
          {
              "id": "acceptance",
              "name": "验收",
              "label": "Acceptance",
              "status": "pending",
              "steps": [],
              "feedbackLoop": false,
              "proposalContent": null
          },
          {
              "id": "packaging",
              "name": "打包",
              "label": "Packaging",
              "status": "pending",
              "steps": [],
              "feedbackLoop": false,
              "proposalContent": null
          },
          {
              "id": "deployment",
              "name": "部署",
              "label": "Deployment",
              "status": "pending",
              "steps": [],
              "feedbackLoop": false,
              "proposalContent": null
          },
          {
              "id": "operation",
              "name": "运维",
              "label": "Operation",
              "status": "pending",
              "steps": [],
              "feedbackLoop": false,
              "proposalContent": null
          },
          {
              "id": "iteration",
              "name": "迭代",
              "label": "Iteration",
              "status": "pending",
              "steps": [],
              "feedbackLoop": false,
              "proposalContent": null
          }
      ],
      "currentStageId": "architecture"
  }