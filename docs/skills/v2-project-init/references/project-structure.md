# 项目结构规范

## 概述

v2 项目采用 Turborepo Monorepo 架构，包含主前端应用和共享包。

## 目录结构

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
│       │   │   ├── model/        # 模型管理
│       │   │   ├── instance/     # 版本编辑
│       │   │   └── dashboard/    # 工作台
│       │   ├── stores/           # Zustand stores
│       │   ├── hooks/            # 业务 hooks
│       │   ├── services/         # 服务层
│       │   │   └── mock/         # Mock 数据服务
│       │   ├── types/            # TypeScript 类型
│       │   └── utils/            # 工具函数
│       ├── public/               # 静态资源
│       ├── tests/                # 测试文件
│       ├── package.json
│       ├── vite.config.ts
│       └── tsconfig.json
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
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 关键目录说明

### apps/web/src/

| 目录 | 用途 |
|------|------|
| api/ | API 接口定义和适配层 |
| components/ | Vue 组件，按功能分类 |
| views/ | 页面级组件 |
| stores/ | 状态管理 (Zustand) |
| hooks/ | 可复用的业务逻辑 hooks |
| services/ | 服务层，包含 Mock 服务 |
| types/ | TypeScript 类型定义 |
| utils/ | 工具函数 |

### packages/shared/

共享代码包，供多个应用复用：
- 共享类型定义
- 共享工具函数
- 共享常量

### v1_db/

复用 v1 的数据库资产：
- SQL 建表脚本
- Mock 数据文件
- API 定义文档

## 文件命名规范

- 组件: PascalCase (e.g., `VxeTableWrapper.vue`)
- 工具: camelCase (e.g., `formatDate.ts`)
- 类型: PascalCase + .types.ts (e.g., `model.types.ts`)
- 常量: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
