# v2 项目初始化计划

> **文档版本**: v1.0.0
> **创建日期**: 2026-05-09
> **预计工期**: 4-6 周（不含后续 Yjs/Supabase/RAG 阶段）

---

## 一、项目概述

### 1.1 目标

构建一个全栈在线表格协作系统（经济模型版），基于 Mock 数据实现核心编辑功能，为后续 Yjs 协作和 RAG 智能助手打好基础。

### 1.2 核心功能范围

| 优先级 | 功能 | 说明 |
|--------|------|------|
| P0 | 表格编辑 | vxe-table + 单元格编辑 |
| P0 | 公式引擎 | HyperFormula + v1 财务函数 |
| P0 | 版本管理 | 模型的版本 CRUD + 状态机 |
| P0 | Mock 数据层 | localStorage 替代真实后端 |
| P1 | 导入导出 | Excel 模板导入/导出 |
| P1 | 树形表格 | 指标层级展示 |
| P2 | Yjs 协作 | 第二阶段 |
| P2 | Supabase | 第三阶段 |
| P3 | RAG 助手 | 第四阶段 |

### 1.3 技术栈

```
框架:         Vue 3 + TypeScript + Vite
UI:           自封装 vxe-table + Tailwind CSS
状态:         Pinia (或 Zustand)
公式:         HyperFormula + v1 财务函数
Mock:         localStorage + Mock Service
构建:         Turborepo Monorepo
测试:         Vitest + Playwright
```

---

## 二、项目结构

```
v2/
├── apps/
│   └── web/                      # 主前端应用
│       ├── src/
│       │   ├── api/              # API 层
│       │   │   └── v1/           # v1 API 适配
│       │   ├── components/       # 组件
│       │   │   ├── table/        # vxe-table 封装
│       │   │   └── common/       # 通用组件
│       │   ├── views/            # 页面
│       │   │   ├── model/         # 模型管理
│       │   │   ├── instance/      # 版本编辑
│       │   │   └── dashboard/     # 工作台
│       │   ├── stores/           # Zustand stores
│       │   ├── hooks/            # 业务 hooks
│       │   ├── services/         # 服务层
│       │   │   └── mock/         # Mock 数据服务
│       │   ├── types/            # TypeScript 类型
│       │   └── utils/            # 工具函数
│       └── package.json
├── packages/
│   └── shared/                   # 共享包
│       └── types/               # 共享类型定义
├── v1_db/                       # v1 数据库资产（复用）
│   ├── sql/                    # SQL 建表脚本
│   ├── mock/                   # Mock 数据
│   └── api/                    # API 定义
├── specs/                      # v2 设计文档
│   ├── spec-01-architecture.md
│   ├── spec-02-vxe-table.md
│   └── ...
└── README.md
```

---

## 三、开发计划

### Phase 0: 项目初始化（1 天）

**目标**: 创建可运行的空项目 + 基础配置

| 任务 | 负责人 | 时长 | 验收标准 |
|------|--------|------|---------|
| 初始化 Monorepo 项目 | AI | 0.5h | pnpm workspace 正常 |
| 配置 Vite + Vue3 + TypeScript | AI | 0.5h | `npm run dev` 可运行 |
| 配置 Tailwind CSS | AI | 0.5h | 样式正常 |
| 配置 ESLint + Prettier | AI | 0.5h | 代码格式化正常 |
| 配置 Vitest | AI | 0.5h | 测试可运行 |
| 导入 v1 Mock 数据 | AI | 0.5h | 数据文件就位 |
| **里程碑** | | **2.5h** | 空项目运行正常 |

**输出**:
- `v2/apps/web/` 目录结构就绪
- 基础配置完成（Vite/Tailwind/ESLint）
- v1 Mock 数据已导入

---

### Phase 1: 核心功能开发（3 周）

#### Week 1: 表格组件 + 数据层

**目标**: vxe-table 渲染 + Mock API

| 任务 | 负责人 | 时长 | 验收标准 |
|------|--------|------|---------|
| 封装 VxeTableWrapper | AI | 1d | 组件可配置 |
| 实现 Mock Service | AI | 1d | 数据可 CRUD |
| 模型列表页 | AI | 1d | 显示模型列表 |
| 版本列表页 | AI | 1d | 显示版本列表 |
| **里程碑** | | **4d** | 模型/版本列表页面运行正常 |

**输出**:
- `VxeTableWrapper` 组件
- `MockService` 实现
- 模型管理页面
- 版本管理页面

#### Week 2: 公式引擎 + 编辑功能

**目标**: 公式计算 + 单元格编辑

| 任务 | 负责人 | 时长 | 验收标准 |
|------|--------|------|---------|
| 集成 HyperFormula | AI | 1d | 引擎正常运行 |
| 补充 v1 财务函数 (XNPV/NPV/IRR) | AI | 1d | 函数测试通过 |
| 单元格编辑功能 | AI | 1d | 可编辑单元格 |
| 公式计算触发 | AI | 1d | 公式自动计算 |
| 依赖图 + 循环检测 | AI | 1d | 依赖关系正确 |
| **里程碑** | | **5d** | 表格编辑 + 公式计算正常 |

**输出**:
- `FormulaEngine` (HyperFormula + v1 财务函数)
- 单元格编辑功能
- 公式自动计算

#### Week 3: 版本管理 + 状态机 + 导入导出

**目标**: 版本 CRUD + 状态机 + Excel 功能

| 任务 | 负责人 | 时长 | 验收标准 |
|------|--------|------|---------|
| 版本状态机实现 | AI | 1d | 草稿/已提交/已锁定 正常 |
| 版本保存/加载 | AI | 1d | 数据持久化 |
| 导入功能 | AI | 1d | Excel 模板导入 |
| 导出功能 | AI | 1d | Excel 导出 |
| 数据格式化 | AI | 0.5d | 千分位/百分比正常 |
| 权限控制 | AI | 0.5d | 权限矩阵生效 |
| **里程碑** | | **5d** | 版本管理完整功能 |

**输出**:
- 版本状态机
- 导入导出功能
- 数据格式化
- 权限控制

### Phase 2: 完善与优化（1 周）

**目标**: Bug 修复 + 性能优化 + 文档

| 任务 | 负责人 | 时长 | 验收标准 |
|------|--------|------|---------|
| 集成测试 | AI | 1d | 核心流程测试通过 |
| 性能优化 | AI | 1d | 表格渲染 < 2s |
| 虚拟滚动验证 | AI | 1d | 大数据量测试 |
| 单元测试补充 | AI | 1d | 覆盖率 ≥ 70% |
| 文档完善 | AI | 1d | README + 部署文档 |
| **里程碑** | | **5d** | v2 MVP 完成 |

### Phase 3: 后续扩展（可选，2-4 周/功能）

| 功能 | 工期 | 前置条件 |
|------|------|---------|
| Yjs 多人协作 | 2 周 | Phase 1-2 完成 |
| Supabase 后端 | 2 周 | Yjs 协作验证 |
| RAG 智能助手 | 4 周 | Supabase 就绪 |

---

## 四、数据初始化

### 4.1 v1 Mock 数据导入

直接复用 `v1/v1_db/mock/01_core_data.json`：

```
v1_db/mock/01_core_data.json
├── datamodel (3条)
├── datamodelversion (3条)
├── modelpage (3条)
├── modelmetric (10条)
├── modelformula (4条)
├── dataentry (9条)
├── currencydictionary (5条)
└── unitcategory (7条)
```

### 4.2 Mock Service 实现

```typescript
// services/mock/index.ts
class MockService {
  private store: Map<string, any[]>;

  constructor() {
    this.store = new Map();
    this.loadFromLocalStorage();
  }

  // 数据缓存在 localStorage
  save() { localStorage.setItem('v2_data', JSON.stringify(this.store)); }

  // 实现 CRUD 方法...
}

// 导出单例
export const mockService = new MockService();
```

---

## 五、里程碑与验收

### 5.1 里程碑

| 里程碑 | 日期 | 交付物 |
|--------|------|--------|
| M0: 项目初始化 | Day 1 | 可运行空项目 |
| M1: 表格渲染 | Day 5 | 模型/版本列表 |
| M2: 编辑功能 | Day 10 | 单元格编辑 + 公式计算 |
| M3: 版本管理 | Day 15 | 版本 CRUD + 状态机 |
| M4: 导入导出 | Day 18 | Excel 导入导出 |
| M5: MVP 完成 | Day 23 | v2 可演示版本 |

### 5.2 验收检查清单

**M0 验收**:
- [ ] `npm install` 成功
- [ ] `npm run dev` 启动无报错
- [ ] 页面可访问 (localhost:5173)

**M1 验收**:
- [ ] 显示 3 个模型
- [ ] 显示 3 个版本
- [ ] 列表分页正常

**M2 验收**:
- [ ] vxe-table 渲染正确
- [ ] 可编辑单元格
- [ ] SUM 公式计算正确
- [ ] XIRR/XNPV 计算正确

**M3 验收**:
- [ ] 可创建/编辑/删除版本
- [ ] 状态流转正确（草稿→已提交→已锁定）
- [ ] 锁定版本不可编辑

**M4 验收**:
- [ ] Excel 模板导入正常
- [ ] Excel 导出正常
- [ ] 数据格式化正确（千分位、百分比）

**M5 验收**:
- [ ] 核心流程演示正常
- [ ] 单元测试覆盖率 ≥ 70%
- [ ] 文档就绪

---

## 六、技术决策

### 6.1 状态管理选型

**决策**: 使用 Zustand（轻量、Yjs 友好）

```typescript
// stores/modelStore.ts
import { create } from 'zustand';

interface ModelState {
  modelList: Model[];
  currentModel: Model | null;
  fetchModels: () => Promise<void>;
}

export const useModelStore = create<ModelState>((set) => ({
  modelList: [],
  currentModel: null,
  fetchModels: async () => {
    const data = await mockService.getModels();
    set({ modelList: data });
  },
}));
```

### 6.2 公式引擎配置

**决策**: HyperFormula + v1 财务函数混合

```typescript
// services/formula/index.ts
import { HyperFormula } from 'hyperformula';
import { v1_npv, v1_irr, v1_xnpv } from './v1-financial';

const hf = HyperFormula.buildEmpty({
  licenseKey: 'gpl-v3',
  functions: {
    'NPV': { internal: false },
    'IRR': { internal: false },
  },
});

hf.registerFunction('XNPV', v1_xnpv);
hf.registerFunction('NPV', v1_npv);
hf.registerFunction('IRR', v1_irr);

export { hf };
```

### 6.3 Mock 数据存储

**决策**: localStorage 优先，暂不使用真实数据库

```typescript
// services/mock/storage.ts
const STORAGE_KEY = 'v2_mock_data';

export function saveToStorage(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadFromStorage(): any {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}
```

---

## 七、风险与应对

| 风险 | 影响 | 应对 |
|------|------|------|
| HyperFormula 学习曲线 | 开发延期 | 预留 1d 学习时间 |
| v1 财务函数移植复杂性 | 测试不充分 | 单元测试覆盖 |
| Excel 导入解析 bug | 功能不稳定 | 使用 exceljs 稳定版 |
| localStorage 容量限制 | 大数据量失败 | 考虑 IndexedDB |

---

## 八、附录

### 8.1 快速启动命令

```bash
# 克隆项目
git clone <repo>
cd v2

# 安装依赖
pnpm install

# 启动开发
pnpm dev

# 运行测试
pnpm test

# 构建
pnpm build
```

### 8.2 相关文档

- v1 → v2 升级方案: `v1/v1_v2_upgrade_plan.md`
- v1/v2 复用分析: `v1/v1_v2_analysis.md`
- v2 系统设计: `v2/specs/*.md`