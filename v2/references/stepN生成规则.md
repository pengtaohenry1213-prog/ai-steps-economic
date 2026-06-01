# Step N 文档生成规则

本文档定义如何从架构文档（Architecture）自动生成 stepN.md 开发任务文档。

---

## 1. 转换原理

```
架构文档 (architecture_YYYY-MM-DD.md)
         │
         ▼
┌─────────────────────────────────────┐
│  提取关键字段                         │
│  - scope.inScope.P0/P1              │
│  - milestones                       │
│  - acceptance                       │
│  - components (如存在)              │
│  - risks                            │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  按规则映射到 stepN.md               │
│  - P0[0] → step1.md                 │
│  - P0[1] + P0[2] → step2.md         │
│  - P0[3] + P1[0] → step3.md        │
│  - P1[1..3] → step4.md              │
└─────────────────────────────────────┘
```

---

## 2. 字段映射表

### 2.1 必填字段映射

| stepN.md 字段 | 架构文档来源 | 说明 |
|---------------|-------------|------|
| **任务目标** | `scope.inScope.P0[n]` 或 `scope.inScope.P1[n]` | 取前80字符精简描述 |
| **详细说明** | `scope.inScope.P0[n]` 完整内容 | 包含功能描述 + v1复用量 |
| **里程碑映射** | `milestones[n].phase` + `milestones[n].day` | M1 → Day 5 |
| **验收标准(功能)** | `acceptance.functionality` 相关条目 | 筛选与当前step相关的 |
| **验收标准(性能)** | `acceptance.performance` | 量化指标 |
| **约束条件** | `acceptance.security` 相关条目 | 安全要求 |

### 2.2 选填字段映射

| stepN.md 字段 | 架构文档来源 | 说明 |
|---------------|-------------|------|
| **涉及文件** | `components` 数组（如存在） | 组件路径 |
| **前置依赖** | 前一个 stepN.md | 依赖链 |
| **风险提示** | `risks` 中 level=high/medium 的相关项 | 需关注的风险 |
| **关联规范** | 固定引用 | 前端/后端 SOP |

---

## 3. Step 拆分规则

### 3.1 基础拆分原则

```
P0 核心功能数量 → Step 数量（尽量 1:1 映射）
P1 重要功能数量 → 合并到现有 Step 或新增 Step
```

### 3.2 推荐拆分映射

| 架构文档 scope | 生成 stepN.md |
|---------------|--------------|
| P0[0] 表格编辑 | step1.md |
| P0[1] 公式引擎 | step2.md |
| P0[2] 版本管理 | step3.md |
| P0[3] Mock数据层 | step1.md（合并到表格编辑） |
| P1[0] 导入导出 | step4.md |
| P1[1] 树形表格 | step1.md（合并到表格编辑） |
| P1[2] 数据格式化 | step2.md（合并到公式引擎） |
| P1[3] 权限控制 | step3.md（合并到版本管理） |

### 3.3 合并策略

以下情况应合并到同一个 step：

- 存在强依赖关系（A 必须依赖 B 才能开发）
- 属于同一业务模块
- v1 复用率 > 80%

---

## 4. 内容填充模板

```markdown
# Step {N}: {功能名称}

## 任务目标
{从 scope.inScope.P0[N-1] 或 P1[N-P0.length-4] 提取，限制80字符}

## 详细说明
{完整功能描述}
- v1复用量：{从架构文档提取}%
- 技术方案：{如 components 中有则提取，否则留空}

## 约束条件
- 遵循前端工程化 SOP（docs/AI工程化开发手册/前端工程化 SOP（Vue3 + TS + Vben Admin）.md）
- 遵循后端工程化 SOP（docs/AI工程化开发手册/后端工程化 SOP（Node.js + NestJS）.md）
- 遵循数据库设计规范（docs/AI工程化开发手册/数据库设计规范（AI 工程化版）.md）
- 遵循安全工程规范（docs/AI工程化开发手册/安全工程规范（AI 工程化版）.md）

## 验收标准
### 功能验收
{从 acceptance.functionality 筛选相关条目}

### 性能验收
| 指标 | 标准 |
|------|------|
{从 acceptance.performance 逐项填充}

### 安全验收
{从 acceptance.security 筛选相关条目}

## 涉及文件
{从 components 数组提取，或标注"待架构文档补充"}

## 前置依赖
{stepN-1.md 如有} / 无

## 风险提示
{从 risks 提取 level=high/medium 的相关项}

## 关联规范
- 前端工程化 SOP → {组件规范相关章节}
- 后端工程化 SOP → {API规范相关章节}
- 安全工程规范 → {安全要求相关章节}

## 里程碑映射
- {milestones[N].phase}（Day {milestones[N].day}）
```

---

## 5. 生成时机

| 阶段 | 是否生成 stepN.md | 说明 |
|------|-------------------|------|
| init | 否 | 立项阶段 |
| requirement | 否 | 需求阶段 |
| architecture | **是** | 架构阶段生成所有 stepN.md |
| initialization | 否 | 已由 architecture 阶段生成 |
| development | 否 | 执行已生成的 stepN.md |

---

## 6. 示例转换

### 6.1 输入（架构文档片段）

```json
{
  "scope": {
    "inScope": {
      "P0": [
        "表格编辑(vxe-table封装，双击编辑、虚拟滚动) - v1复用40%",
        "公式引擎(HyperFormula+财务函数XNPV/NPV/IRR混合方案) - v1复用30%"
      ]
    }
  },
  "milestones": [
    { "phase": "M1: 表格渲染", "day": 5 },
    { "phase": "M2: 编辑功能", "day": 10 }
  ],
  "acceptance": {
    "functionality": [
      "vxe-table表格渲染正确，支持树形展示",
      "公式计算正确(SUM/XIRR/XNPV/NPV/IRR等)"
    ],
    "performance": {
      "表格加载": "<2s(1000行数据)",
      "公式计算": "<100ms(100个公式)"
    }
  }
}
```

### 6.2 输出（step1.md）

```markdown
# Step 1: 表格编辑

## 任务目标
实现 vxe-table 封装，支持双击编辑、虚拟滚动

## 详细说明
- 功能描述：vxe-table封装，支持双击编辑、虚拟滚动
- v1复用量：40%

## 验收标准
### 功能验收
- [ ] vxe-table表格渲染正确，支持树形展示

### 性能验收
| 指标 | 标准 |
|------|------|
| 表格加载 | <2s(1000行数据) |

## 里程碑映射
- M1: 表格渲染（Day 5）
```

---

## 7. 检查清单

生成 stepN.md 后，检查以下内容是否填充：

- [ ] 任务目标（来自 scope.inScope）
- [ ] 详细说明（包含 v1 复用量）
- [ ] 约束条件（引用 SOP 文档）
- [ ] 验收标准（功能 + 性能 + 安全）
- [ ] 里程碑映射（来自 milestones）
- [ ] 风险提示（来自 risks，高危优先）
- [ ] 无 "待补充" 或 "如存在" 等模糊表述
