# Luckysheet MVTP - 多人协作表格

基于 Luckysheet + Vue3 + Supabase 的 MVTP 试点项目，验证 Excel 导入导出、自定义公式、多人实时协作三大核心功能。

## 技术栈

| 模块 | 技术栈 | 版本 |
|---|---|---|
| 前端框架 | Vue 3 + TypeScript | ^3.5 / ^5.3 |
| 表格引擎 | Luckysheet | ^2.1.13 |
| Excel 处理 | xlsx | ^0.18.5 |
| UI 组件 | Element Plus | ^2.14.0 |
| 数据库 | Supabase (PostgreSQL) | - |
| 构建工具 | Vite | ^6.0 |

## 快速开始

```bash
# 安装依赖（根目录执行）
cd ../..
pnpm install --filter @ai-toolkit/luckysheet-demo

# 开发模式（端口 3003）
pnpm run dev

# 类型检查
pnpm run typecheck

# 生产构建
pnpm run build
```

## 项目结构

```
luckysheet-demo/
├── src/
│   ├── components/
│   │   └── LuckysheetWrapper.vue    # Luckysheet 封装组件
│   ├── services/
│   │   ├── excelImport.ts            # Excel → Luckysheet celldata
│   │   ├── excelExport.ts            # Luckysheet → Excel 文件导出
│   │   └── supabaseClient.ts         # Supabase 客户端
│   ├── algorithms/
│   │   ├── topologicalSort.ts        # 拓扑排序（公式依赖排序）
│   │   ├── cyclicDetect.ts           # DFS 循环引用检测
│   │   └── gaussSeidel.ts            # 不动点迭代（循环收敛控制）
│   ├── types/
│   │   └── spreadsheet.ts            # Luckysheet 数据结构类型定义
│   ├── App.vue
│   └── main.ts
├── supabase/schema/ # 数据库 DDL
│   ├── 01_create_cells.sql           # cells 单元格表
│   ├── 02_create_formulas.sql        # formulas 公式表
│   ├── 03_create_documents.sql # documents 文档表
│   └── 04_enable_realtime.sql        # RLS + Realtime 策略
├── index.html                         # Luckysheet CDN 资源加载
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 核心功能

### ✅ Phase 1 -基础能力（已完成）

- **Excel 导入**：`xlsx` 解析 `.xlsx/.xls` 文件，转换为 Luckysheet `celldata` 格式
- **Excel 导出**：Luckysheet 数据通过 `xlsx` 生成 `.xlsx` 文件触发浏览器下载
- **Luckysheet 渲染**：CDN 引入 Luckysheet，通过 Vue3 组件封装隔离 DOM 依赖

### ✅ Phase 2 - 算法模块（已完成）

- **拓扑排序**（`topologicalSort.ts`）：对公式单元格按依赖层级排序，确保被依赖单元格先计算
- **DFS 循环检测**（`cyclicDetect.ts`）：追踪公式引用路径，定位循环节点（如 A1→B1→A1）
- **Gauss-Seidel 不动点迭代**（`gaussSeidel.ts`）：循环计算收敛控制，差值 < 阈值（默认1e-6）时终止

### ⏳ Phase 3 - 实时协作（待实现）

- [ ] Supabase Realtime Channel 配置
- [ ] OT（Operation Transformation）协作算法
- [ ] 多用户光标同步
- [ ] cells/formulas 表 DDL 初始化

## 数据流

```
Excel 文件 (.xlsx)
    ↓ xlsx 解析
Workbook JSON
    ↓ importExcel()
Luckysheet celldata[]
    ↓ luckysheet.create()
Luckysheet 表格渲染

Luckysheet 数据
    ↓ exportExcel() + xlsx
Excel 文件下载
```

## 数据库 Schema

```
documents # 协作文档
    ├── id (PK)
    ├── name
    └── owner_id

cells           # 单元格数据
    ├── id (PK)
    ├── document_id (FK)
    ├── sheet_id
    ├── r, c (行列)
    ├── value (JSONB)
    ├── formula
    ├── is_cyclic, cycle_path
    └── updated_at

formulas        # 自定义公式定义
    ├── id (PK)
    ├── document_id (FK)
    ├── func_name
    ├── formula_str
    └── parameters
```

## 环境变量

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=your-anon-key
```

本地 Supabase 启动：
```bash
supabase start # 首次启动约5分钟
supabase status
```

## 依赖说明

- **Luckysheet**：通过 npm 安装（`^2.1.13`），依赖 `jQuery` 作为运行时依赖
- **xlsx**：`0.18.5`，支持 Excel 文件解析和生成
- **jQuery**：`^4.0.1`（`@types/jquery`），Luckysheet 插件链依赖
- **Element Plus**：`^2.14.0`，UI 组件库

## 注意事项

1. **Luckysheet DOM 依赖**：Luckysheet 直接操作 DOM，必须通过 `id` 选择器挂载（不能用 `ref`）
2. **jQuery**：Luckysheet 插件链依赖 jQuery，需确保在 Luckysheet 加载前引入
3. **循环引用**：Phase 2 算法模块提供检测框架，实际收敛计算由 Luckysheet 内置引擎执行
4. **协作模式**：Phase 3 推荐使用 `yjs` + `y-supabase`，避免手写 OT 算法

## 后续优化方向

- 引入 Web Worker 隔离公式计算（如果解析效率低）
- Supabase Realtime + yjs OT 算法实现多人协作
- 添加 `updated_at` 乐观锁解决协作冲突