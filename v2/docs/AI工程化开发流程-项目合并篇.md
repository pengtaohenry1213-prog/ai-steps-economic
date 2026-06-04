# AI 工程化开发流程 — 项目合并篇

> 基于 2026-06-04 项目A(B→A)合并实践提炼
> 用途：项目合并/迁移/现代化改造的通用 SOP

---

## 一、流程概览

### 1.1 核心流程图

```
需求评审
    ↓
🔴 Human Gate 1（执行前审查）
    ↓
W1 摸底 → W2 评估 → W3 PoC → W4 执行
    ↓           ↓           ↓           ↓
  merge-status  6R+ADR#001  strangler  ADR#002
                +评估表       path+POC  +代码+retro
    ↓
🟢 Human Gate 2（执行后验收）
    ↓
Git 提交
```

### 1.2 四阶段产出物

| 阶段 | 产出物 | 检验标准 |
|------|--------|---------|
| W1 基础概念 + 项目摸底 | `docs/projects/merge-status.md` | 能 3 分钟讲清楚两个项目的核心差异 |
| W2 6R 评估 + ADR #001 | `docs/projects/merge-6r-evaluation.md` + `docs/adr/001-merge-direction.md` | 任何工程师 5 分钟内看懂为什么选 B→A |
| W3 Strangler Fig + PoC | `docs/projects/merge-strangler-path.md` + `docs/projects/poc-report.md` | PoC 本地跑通，B UI 走新数据模型 |
| W4 执行 + 复盘 + ADR #002 | 可运行代码 + `docs/adr/002-*.md` + `docs/personal/retro-w1w4.md` | ADR #002 比 #001 写得更快更聚焦 |

---

## 二、每阶段详细说明

### W1：基础概念 + 项目摸底

**学什么**
- Martin Fowler StranglerFigApplication（10分钟）
- Michael Nygard ADR 原文（10分钟）
- 1 个真实案例（Thoughtworks Tech Radar）

**做什么**
- 把 A 和 B 的代码各过一遍
- 重点摸清：数据模型、核心流程、对外接口
- 画一张「现状对比图」

**产出物**
```
docs/projects/merge-status.md
├── 一、项目概览（定位/核心能力/生命周期对比表）
├── 二、数据模型对比（A vs B 的核心数据结构）
├── 三、核心流程对比（流程图）
├── 四、技术栈对比
├── 五、对外接口对比
├── 六、合并关键差异点（6条合并建议）
└── 七、3分钟陈述稿
```

**检验标准**：能向别人 3 分钟讲清楚两个项目的核心差异

---

### W2：6R 评估 + 第一份 ADR

**学什么**
- AWS Prescriptive Guidance 6R 介绍（20分钟）
- 重点是 6R 的使用方式，不是定义本身

**做什么**
- 列功能模块清单（颗粒度：能独立交付）
- 给每个模块打 6R 标签
- 写 ADR #001

**产出物**
```
docs/projects/merge-6r-evaluation.md
├── 一、评估背景
├── 二、6R 定义速查
├── 三、功能模块 6R 评估表
│   ├── Retain（核心差异化能力，不动）
│   ├── Replatform（迁移到新项目）
│   ├── Refactor（合并到统一结构）
│   ├── Repurchase（换新工具/平台）
│   └── Rehost（直接迁移）
├── 四、6R 汇总
└── 五、工作量估算

docs/adr/001-merge-direction.md
├── 状态
├── 上下文（项目现状/数据结构差异/合并诉求）
├── 决策（B→A 方向 + 具体模块策略）
├── 后果（正面/负面影响）
└── 替代方案（A→B/共存/新建项目，逐一否决）
```

**检验标准**：把 ADR #001 拿给任何工程师，5 分钟内说"哦我懂了为什么"

---

### W3：Strangler Fig 路径设计 + PoC

**学什么**
- 重读 Fowler "如何识别绞杀点"
- Anti-Corruption Layer（防腐层）
- Branch by Abstraction
- Parallel Run（并行运行）

**做什么**
- 设计合并路径：先合什么、后合什么、绞杀点在哪层
- 挑最小模块做 PoC（建议：立项书生成）
- PoC 跑通：旧 UI → ACL → 新数据模型 → 旧数据落库

**产出物**
```
docs/projects/merge-strangler-path.md
├── 一、绞杀点规划
├── 二、ACL 设计（三层适配器）
├── 三、合并时序图（Phase 1-N）
├── 四、Branch by Abstraction 策略
├── 五、Parallel Run 设计
└── 六、关键风险点

docs/projects/poc-report.md
├── 一、PoC 目标（成功标准/验证步骤）
├── 二、技术设计（ACL 适配器实现）
├── 三、PoC 执行记录（表格）
├── 四、PoC 结果（功能验证/数据一致性）
└── 五、结论（是否可扩展）
```

**检验标准**：PoC 能在本地跑起来，B 的 UI 走新数据模型正常工作

---

### W4：执行 + 复盘 + ADR #002

**学什么**
- 边做边学，遇到具体问题查相关模式
- refactoring.guru / martinfowler.com / Thoughtworks

**做什么**
- 完成第一个完整模块迁移
- 写 ADR #002（技术决策记录）
- 写个人复盘

**产出物**
```
可运行的合并代码
docs/adr/002-*.md（迁移过程中的技术决策）
docs/personal/retro-w1w4.md（私人复盘）
```

**检验标准**：ADR #002 比 #001 写得更快、更聚焦——说明你在内化方法

---

## 三、通用 Prompt 模板

### 3.1 W1 项目摸底 Prompt

```markdown
请探索 [项目路径] 的代码结构，重点关注：
1. 数据模型/类型定义（src/types 或类似目录）
2. 核心流程（stores、views、services 目录）
3. 对外接口（API 调用方式）

给我一份结构化发现：包含关键文件路径、数据模型字段列表、核心流程步骤。
```

### 3.2 W1 生成 merge-status.md Prompt

```markdown
根据以下两个项目的探索结果，生成 merge-status.md：

## 项目A 发现
[A 的结构化发现内容]

## 项目B 发现
[B 的结构化发现内容]

要求：
- 输出到 docs/projects/merge-status.md
- 包含：项目概览表、数据模型对比、核心流程对比、技术栈对比、对外接口对比
- 包含合并关键差异点（6条）
- 包含 3 分钟陈述稿
- 格式：Markdown，1~2 页
```

### 3.3 W2 生成 6R 评估 Prompt

```markdown
根据以下功能模块清单，生成 merge-6r-evaluation.md：

## 功能模块清单
| 模块 | 来自 | 初步判断 |
| [模块列表] |

要求：
- 输出到 docs/projects/merge-6r-evaluation.md
- 对每个模块给出 6R 标签（Retain/Rehost/Replatform/Refactor/Repurchase/Retire）
- 给出理由
- 汇总表 + 工作量估算
```

### 3.4 W2 生成 ADR #001 Prompt

```markdown
基于以下背景，生成 ADR #001：

## 上下文
[项目现状/数据结构差异/合并诉求]

## 6R 评估结果
[merge-6r-evaluation.md 的核心结论]

## 合并方向
[B→A 方向]

要求：
- 输出到 docs/adr/001-merge-direction.md
- 标准 5 段式：状态/上下文/决策/后果/替代方案
- 决策理由要自解释
- 替代方案要逐一否决并说明理由
```

### 3.5 W3 生成合并路径设计 Prompt

```markdown
根据以下信息，生成 merge-strangler-path.md：

## 6R 评估结论
[Retain 模块] → 保留
[Replatform 模块] → 迁移
[Refactor 模块] → 合并

## PoC 选择
[选择立项书生成作为 PoC 模块]

## ACL 设计要点
[防腐层切入点]

要求：
- 输出到 docs/projects/merge-strangler-path.md
- 包含：绞杀点规划、ACL 设计（3层适配器）、合并时序图（6个Phase）、Branch by Abstraction 策略、Parallel Run 设计、关键风险点
- 时序图要清晰：先合什么、后合什么
```

### 3.6 W3 生成 PoC 报告模板 Prompt

```markdown
生成 PoC 报告模板到 docs/projects/poc-report.md：

## PoC 目标
验证 [立项书生成] 模块的 B→A 合并可行性

## ACL 适配器设计
[Adapter 实现要点]

## 验证步骤
[从用户输入到 Supabase 存储的完整链路]

要求：
- 包含：目标描述、成功标准、验证步骤、技术设计、执行记录表格、结果验证表格
- 执行记录和结果留空供实际执行时填充
- 包含快速检查清单
```

---

## 四、角色定义

### 4.1 AI 全栈开发工程师（主角色）

**职责**：
- 执行 W1-W4 的所有产出物生成
- 写代码（ACL 适配器、合并代码）
- 维护文档（merge-status / 6R 评估 / ADR）

**工作模式**：
```
用户提出需求 → AI 分析 → 生成文档/代码 → 用户确认 → 继续
```

### 4.2 项目负责人（Human Gate）

**职责**：
- W1 前：确认需求和方向
- W1 后：审查 merge-status 是否准确
- W2 后：审查 ADR #001 是否合理
- W3 后：审查 PoC 结果是否可扩展
- W4 后：验收合并代码

**工作模式**：
```
🔴 Human Gate 1（执行前审查）→ AI 执行 → 🔴 Human Gate 2（执行后验收）
```

---

## 五、技能清单

### 5.1 必学模式

| 模式 | 原文 | 学习时间 | 适用场景 |
|------|------|----------|----------|
| Strangler Fig | martinfowler.com/bliki/StranglerFigApplication.html | 10 分钟 | 项目合并/替换 |
| ADR | cognitect.com/blog/2011/11/15/documenting-architecture-decisions | 10 分钟 | 架构决策记录 |
| 6R | aws.amazon.com/migration-hub → Prescriptive Guidance | 20 分钟 | 迁移策略评估 |
| Anti-Corruption Layer | martinfowler.com → 搜索 ACL | 15 分钟 | 跨系统数据转换 |
| Branch by Abstraction | martinfowler.com → 搜索 | 10 分钟 | 渐进式切换 |

### 5.2 工具链

| 工具 | 用途 | 链接 |
|------|------|------|
| adr-tools | ADR 模板生成 | GitHub 搜 adr-tools |
| refactoring.guru | 设计模式/重构模式 | refactoring.guru |
| Thoughtworks Tech Radar | 技术趋势 | github.com/Thoughtworks/technology-radar |

---

## 六、文件结构模板

项目合并的标准产出物目录结构：

```
docs/
├── projects/
│   ├── merge-status.md        # W1：现状对比
│   ├── merge-6r-evaluation.md # W2：6R 评估
│   ├── merge-strangler-path.md # W3：合并路径
│   ├── poc-report.md         # W3：PoC 报告
│   └── poc-checklist.md      # W3：PoC 执行清单
├── adr/
│   ├── 001-merge-direction.md # W2：合并方向决策
│   └── 002-*.md              # W4：技术决策记录
└── personal/
    └── retro-w1w4.md         # W4：个人复盘
```

---

## 七、复用检查清单

当遇到新的项目合并/迁移任务时，按此清单启动：

- [ ] 确认是 B→A 还是 A→B（用"骨不能削足适履，皮能包骨"判断）
- [ ] 启动 W1：读 Fowler + Nygard + 做现状摸底
- [ ] 确认 W1 产出物：merge-status.md + 3 分钟陈述
- [ ] 启动 W2：列功能模块 + 打 6R 标签 + 写 ADR #001
- [ ] 确认 W2 产出物：6R 评估表 + ADR #001
- [ ] 启动 W3：设计合并路径 + 做 PoC
- [ ] 确认 W3 产出物：strangler path + PoC 报告
- [ ] 启动 W4：执行第一个模块 + 写 ADR #002 + 复盘
- [ ] 确认 W4 产出物：可运行代码 + ADR #002 + retro

---

## 八、注意事项

1. **不要一次性迁移整个系统** — 用 Strangler Fig 渐进式包裹
2. **ADR 要解决真实决策** — 不是模板填充，是决策记录
3. **PoC 要选风险最低的模块** — 立项书生成是最佳切入点
4. **检验标准要可操作** — "3 分钟讲清楚"比"文档要完整"更有价值
5. **复盘是给未来的自己** — 写下来，下次少踩坑