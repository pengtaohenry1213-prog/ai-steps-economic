---

name: ai-steps-economic-v1
description: 经济模型系统 MVP - 基于 Vue 3 + TypeScript + Vite + Element Plus 的经济指标计算与可视化平台

---

# AI Steps Economic V1 - MVP

## 项目概述

V1 是经济模型系统的 **MVP（最小可行产品）** 版本，基于 2025 项目源码进行开发验证。

- **V2（新项目）**：全新架构，重新开发
- **V1（验证版）**：使用 V2 的框架设计，以 SDK 方式输出给 V2 做 MVP 验证

## 技术栈

| 分类 | 技术选型 |
|------|----------|
| 核心框架 | Vue 3 |
| 开发语言 | TypeScript |
| 构建工具 | Vite |
| UI 框架 | Element Plus |
| 表格组件 | VXE Table、vue-vben-admin |
| 状态管理 | Pinia |
| 路由管理 | Vue Router |
| 工具库 | VueUse、Dayjs、Decimal.js |
| 国际化 | 内置多语言支持 |
| 样式处理 | Tailwind CSS |

## 目录结构

```
apps/
├── web-ele/              # V1 前端
│   ├── src/
│   │   ├── api/          # API 接口定义
│   │   ├── components/   # 公共组件
│   │   ├── layouts/      # 布局组件
│   │   ├── router/       # 路由配置
│   │   ├── store/        # 状态管理
│   │   ├── views/        # 页面视图
│   │   ├── locales/      # 国际化资源
│   │   ├── formula/      # 公式计算核心
│   │   ├── f/            # 功能模块
│   │   └── utils/        # 工具函数
│   └── package.json
└── backend-mock/         # V1 Mock 服务
```

## 核心功能

### 1. 经济模型计算
- 支持复杂指标公式解析与计算
- 基于 Lua 脚本引擎执行计算公式
- 依赖关系图管理与拓扑排序

### 2. 公式特殊取数逻辑

| 类型 | 语法 | 说明 |
|------|------|------|
| 全局变量 | `global-*` | 取全局配置（日期、行业等） |
| 周期累计 | `periodAdd-*` | 从首周期累加到当前周期 |
| 上期数据 | `prev-*` | 取上一统计周期数据 |
| 总计 | `total-*` | 所有日期数据求和 |
| 往期累计 | `prevPeriodAdd-*` | 到当前周期减一的所有累计 |
| 后期累计 | `futurePeriodAdd-*` | 当期之后的所有期间累计 |
| 所在期数 | `var-everyPeriod` | 计算当前日期是第几期 |
| 年度累计 | `totalPeriod-*` | 当年累计到当月数据 |
| 年度总和 | `totalYear-*` | 年度/季度/月度数据求和 |

### 3. 数据可视化
- 经济指标图表展示
- 依赖关系可视化
- 多维度数据分析

### 4. Excel 导入导出
- 批量数据导入
- 计算结果导出

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发环境
pnpm dev

# 生产构建
pnpm build

# 类型检查
pnpm typecheck

# 构建分析
pnpm build:analyze
```

## 环境配置

```bash
.env              # 基础环境变量
.env.development  # 开发环境
.env.production   # 生产环境
```

## 相关文档

- [V1/V2 分析报告](./v1_v2_analysis.md)
- [升级计划](./v1_v2_upgrade_plan.md)
- [2025 项目源码参考](../参考/2025项目源码/README.md)

