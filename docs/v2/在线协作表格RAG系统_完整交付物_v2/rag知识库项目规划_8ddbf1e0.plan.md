---
name: RAG知识库项目规划
overview: 基于 README.md 和 .cursor 规则分析，规划企业级 RAG 知识库项目的功能模块、技术架构和实施路线
todos:
  - id: analyze
    content: 分析 README.md 与 .cursor 规则的映射关系
    status: completed
  - id: design-arch
    content: 设计项目功能架构
    status: pending
  - id: roadmap
    content: 制定实施路线
    status: pending
isProject: false
---

# 企业级智能体 RAG 知识库 - 项目规划

## 一、README.md 分析

### 当前状态

README.md 是一个**技术方案文档**，描述了：

- 项目背景：构建 RAG 向量知识库，整合 Excel/PDF/Word/PPT 多模态数据
- 目标：解决国企内部数据检索效率低、跨文档关联难的问题
- 当前阶段：数据摸底与策略定义，向量库未正式启动

### 缺失内容（需补充）

1. **项目目录结构** - 尚未创建 `packages/` 等代码目录
2. **Step 文件** - 无 `doc/steps/stepN.md` 执行计划
3. **具体实现代码** - 仅有技术选型，无实际代码

---

## 二、.cursor 角色映射到项目功能

### Rules → 功能模块对应


| Rule 文件          | 对应功能模块              | 说明                                  |
| ---------------- | ------------------- | ----------------------------------- |
| `backend.mdc`    | `packages/backend`  | Node.js/Express + TypeScript API 服务 |
| `frontend.mdc`   | `packages/frontend` | Vue3 + TypeScript 前端（Monorepo）      |
| `fullstack.mdc`  | 架构设计层               | 前后端分层、技术选型决策                        |
| `TechLeader.mdc` | 技术负责人职责             | CR、任务拆解、风险兜底                        |
| `PM.mdc`         | PRD/需求管理            | 产品需求文档、验收标准                         |
| `PMO.mdc`        | 项目治理                | 里程碑、风险登记、复盘                         |
| `TEST.mdc`       | QA/测试模块             | 功能测试、性能测试                           |


### Commands → 工具/技能对应


| Command 文件    | 对应功能       | 说明                  |
| ------------- | ---------- | ------------------- |
| `xlsx.md`     | Excel 处理模块 | PaddleOCR + 表格还原    |
| `pdf.md`      | PDF 解析模块   | pdfjs-dist + OCR    |
| `docx.md`     | Word 解析模块  | mammoth 库           |
| `pptx.md`     | PPT 解析模块   | 文本提取                |
| `postgres.md` | 向量库/元数据存储  | Qdrant + PostgreSQL |


### Prompts → 执行流程对应


| Prompt 文件        | 对应流程         | 说明                 |
| ---------------- | ------------ | ------------------ |
| `00-run-all.md`  | **总控 Agent** | Tech Lead 自动执行完整流程 |
| `01-planner.md`  | Plan 生成      | 读取 step → 生成 plan  |
| `02-frontend.md` | 前端开发         | 前端任务执行             |
| `03-backend.md`  | 后端开发         | 后端任务执行             |
| `04-test.md`     | 测试执行         | 实测测试 + 报告          |
| `05-reviewer.md` | 代码审查         | CR + 验收            |


---

## 三、项目功能架构

```mermaid
graph TB
    subgraph "文档解析层"
        Excel[Excel解析<br/>xlsx command]
        PDF[PDF解析<br/>pdf command]
        DOCX[Word解析<br/>docx command]
        PPTX[PPT解析<br/>pptx command]
    end

    subgraph "数据处理层"
        OCR[OCR识别<br/>PaddleOCR]
        Chunk[智能切片<br/>结构化分级]
        Embed[向量化<br/>bge-m3]
    end

    subgraph "存储层"
        VectorDB[(向量库<br/>Qdrant/Milvus)]
        PGDB[(元数据库<br/>PostgreSQL)]
        KG[知识图谱<br/>远期)]
    end

    subgraph "检索层"
        Hybrid[混合检索<br/>向量+关键词]
        Rerank[重排序<br/>bge-reranker]
        Filter[三层标签过滤]
    end

    subgraph "LLM层"
        LocalLLM[本地LLM<br/>Qwen2.5-72B]
        QA[问答生成]
    end

    subgraph "前端展示层"
        Frontend[Vue3前端<br/>packages/frontend]
        Chart[AntV/ECharts]
        Auth[权限控制<br/>动态脱敏]
    end

    Excel --> OCR
    PDF --> OCR
    DOCX --> Chunk
    PPTX --> Chunk
    OCR --> Chunk
    Chunk --> Embed
    Embed --> VectorDB
    Hybrid --> Rerank
    Rerank --> QA
    QA --> Frontend
    VectorDB <--> PGDB
```



---

## 四、建议的项目结构

```
rag/
├── packages/
│   ├── frontend/              # Vue3 前端 (frontend.mdc)
│   │   ├── src/
│   │   │   ├── views/         # 页面
│   │   │   ├── components/    # 组件
│   │   │   └── stores/        # 状态
│   │   └── package.json
│   │
│   ├── backend/               # Node.js 后端 (backend.mdc)
│   │   ├── src/
│   │   │   ├── api/           # 路由
│   │   │   ├── service/       # 业务逻辑
│   │   │   ├── model/         # 数据访问
│   │   │   └── middleware/     # 中间件
│   │   └── package.json
│   │
│   ├── parser/                # 文档解析服务
│   │   ├── src/
│   │   │   ├── xlsx/          # Excel 解析 (xlsx command)
│   │   │   ├── pdf/           # PDF 解析 (pdf command)
│   │   │   ├── docx/          # Word 解析 (docx command)
│   │   │   └── pptx/          # PPT 解析 (pptx command)
│   │   └── package.json
│   │
│   └── shared/                # 共享类型定义
│       └── types/
│
├── doc/
│   ├── steps/                 # Step 执行文件 (01-planner.md)
│   │   ├── step1-环境搭建.md
│   │   ├── step2-后端基础服务.md
│   │   ├── step3-文档解析模块.md
│   │   ├── step4-向量库集成.md
│   │   ├── step5-检索与问答.md
│   │   ├── step6-前端界面.md
│   │   └── step7-测试与验收.md
│   └── PRD/                   # 产品需求文档 (PM.mdc)
│
├── .cursor/
│   ├── rules/                 # 角色规则
│   ├── commands/              # 技能命令
│   ├── prompts/               # 执行流程 (00-run-all.md)
│   └── plans/                 # 生成的 Plan
│
└── README.md
```

---

## 五、实施路线（基于 PMO 规则）

### Phase 1: 基础设施 (2周)


| Step  | 任务     | 依赖    | 产出                |
| ----- | ------ | ----- | ----------------- |
| step1 | 环境搭建   | -     | Monorepo 结构、CI/CD |
| step2 | 后端基础服务 | step1 | Express API 骨架    |
| step3 | 前端基础框架 | step1 | Vue3 项目初始化        |


### Phase 2: 核心功能 (4周)


| Step  | 任务     | 依赖    | 产出                     |
| ----- | ------ | ----- | ---------------------- |
| step4 | 文档解析模块 | step2 | xlsx/pdf/docx/pptx 解析器 |
| step5 | 向量库集成  | step4 | Qdrant 接入、Embedding    |
| step6 | 检索与问答  | step5 | 混合检索 + LLM 问答          |


### Phase 3: 前端与集成 (3周)


| Step  | 任务     | 依赖          | 产出        |
| ----- | ------ | ----------- | --------- |
| step7 | 前端界面开发 | step2+step6 | 数据展示、权限控制 |
| step8 | 安全与脱敏  | step7       | 动态脱敏、权限体系 |


### Phase 4: 测试与验收 (1周)


| Step   | 任务    | 依赖    | 产出        |
| ------ | ----- | ----- | --------- |
| step9  | 测试与验收 | step8 | 功能测试、性能测试 |
| step10 | 私有化部署 | step9 | 内网部署文档    |


---

## 六、关键 TODO

- 创建 `packages/` Monorepo 目录结构
- 创建 `doc/steps/step1.md` 作为首个执行文件
- 补充技术方案中缺失的接口设计文档
- 创建 `.cursor/plans/` 目录存储 Plan
- 确认业务部门对 "第八节待确认信息" 的回复

