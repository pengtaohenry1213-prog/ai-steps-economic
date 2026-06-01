#!/usr/bin/env node

const semver = require('semver');

const upgradeMatrix = {
  formula: {
    v1: "自研 FunctionCore + Kahn 拓扑排序",
    v2: "HyperFormula",
    risk: "高",
    impact: "公式无法迁移",
    mitigation: "逐一验证，编写兼容层",
    effort: "2 人天"
  },
  collaboration: {
    v1: "单人编辑（无实时协作）",
    v2: "Yjs CRDT 多人实时协作",
    risk: "高",
    impact: "开发周期延长",
    mitigation: "使用 spec-03 明确的设计",
    effort: "5 人天"
  },
  backend: {
    v1: "Nitro Mock",
    v2: "Supabase 本地化",
    risk: "中",
    impact: "Mock 数据与真实业务差异",
    mitigation: "复用 v1 的 Excel 模板数据",
    effort: "3 人天"
  },
  state: {
    v1: "Pinia",
    v2: "Zustand + Yjs Y.Map",
    risk: "中",
    impact: "状态管理重构",
    mitigation: "状态结构复用",
    effort: "2 人天"
  },
  security: {
    v1: "前端权限控制",
    v2: "RBAC + RLS + 审计日志",
    risk: "中",
    impact: "额外工作量",
    mitigation: "预研 spec-09，架构设计预留",
    effort: "3 人天"
  }
};

const assetReuse = {
  direct: [
    { name: "数据库表结构", location: "v1/v1_db/sql/01_tables.sql", effort: "0.5 人天" },
    { name: "Mock 测试数据", location: "v1/v1_db/mock/01_core_data.json", effort: "0.5 人天" },
    { name: "API 接口定义", location: "v1/v1_db/api/02_api_definition.json", effort: "1 人天" },
    { name: "权限控制矩阵", location: "v1/权限控制矩阵.md", effort: "0.5 人天" },
    { name: "公式表达式格式", location: "v1/v1_db/03_business_logic.json", effort: "1 人天" },
    { name: "数据格式化逻辑", location: "v1/数据格式化模块.md", effort: "0.5 人天" },
    { name: "版本状态机", location: "v1/版本状态机.md", effort: "0.5 人天" }
  ],
  modified: [
    { name: "状态管理 Hooks", location: "v1/核心状态管理模块-Hooks.md", effort: "2 人天" },
    { name: "公式计算引擎", location: "v1/公式计算模块.md", effort: "2 人天" },
    { name: "vxe-table 配置", location: "v1/表格列配置模块.md", effort: "1 人天" },
    { name: "单元格样式规则", location: "v1/单元格组件模块.md", effort: "1 人天" }
  ],
  reference: [
    { name: "原型设计页面", location: "v1/参考/经济模型原型_v.1.0/", purpose: "UI 设计参考" },
    { name: "Excel 模板", location: "v1/参考/经济模型-导入数据-excel/", purpose: "数据格式参考" },
    { name: "后端 Mock 路由结构", location: "v1/v1_db/api/", purpose: "API 设计参考" }
  ]
};

const migrationPlan = {
  phase0: {
    name: "项目初始化",
    duration: "1 天",
    tasks: [
      { name: "初始化 Monorepo 项目", duration: "0.5h", criteria: "pnpm workspace 正常" },
      { name: "配置 Vite + Vue3 + TypeScript", duration: "0.5h", criteria: "npm run dev 可运行" },
      { name: "导入 v1 Mock 数据", duration: "0.5h", criteria: "数据文件就位" }
    ]
  },
  phase1: {
    name: "核心功能开发",
    duration: "3 周",
    weeks: [
      {
        week: 1,
        focus: "表格组件 + 数据层",
        tasks: [
          { name: "封装 VxeTableWrapper", duration: "1d", criteria: "组件可配置" },
          { name: "实现 Mock Service", duration: "1d", criteria: "数据可 CRUD" },
          { name: "模型列表页", duration: "1d", criteria: "显示模型列表" },
          { name: "版本列表页", duration: "1d", criteria: "显示版本列表" }
        ]
      },
      {
        week: 2,
        focus: "公式引擎 + 编辑功能",
        tasks: [
          { name: "集成 HyperFormula", duration: "1d", criteria: "引擎正常运行" },
          { name: "补充 v1 财务函数", duration: "1d", criteria: "函数测试通过" },
          { name: "单元格编辑功能", duration: "1d", criteria: "可编辑单元格" },
          { name: "公式计算触发", duration: "1d", criteria: "公式自动计算" },
          { name: "依赖图 + 循环检测", duration: "1d", criteria: "依赖关系正确" }
        ]
      },
      {
        week: 3,
        focus: "版本管理 + 状态机 + 导入导出",
        tasks: [
          { name: "版本状态机实现", duration: "1d", criteria: "状态流转正常" },
          { name: "版本保存/加载", duration: "1d", criteria: "数据持久化" },
          { name: "导入功能", duration: "1d", criteria: "Excel 模板导入" },
          { name: "导出功能", duration: "1d", criteria: "Excel 导出" },
          { name: "数据格式化", duration: "0.5d", criteria: "千分位/百分比正常" },
          { name: "权限控制", duration: "0.5d", criteria: "权限矩阵生效" }
        ]
      }
    ]
  },
  phase2: {
    name: "完善与优化",
    duration: "1 周",
    tasks: [
      { name: "集成测试", duration: "1d", criteria: "核心流程测试通过" },
      { name: "性能优化", duration: "1d", criteria: "表格渲染 < 2s" },
      { name: "虚拟滚动验证", duration: "1d", criteria: "大数据量测试" },
      { name: "单元测试补充", duration: "1d", criteria: "覆盖率 ≥ 70%" },
      { name: "文档完善", duration: "1d", criteria: "README + 部署文档" }
    ]
  }
};

function analyzeUpgrade(fromVersion, toVersion) {
  if (!semver.valid(fromVersion) || !semver.valid(toVersion)) {
    return {
      success: false,
      error: "无效的版本号格式"
    };
  }
  
  const isUpgrade = semver.gt(toVersion, fromVersion);
  const diff = semver.diff(toVersion, fromVersion);
  
  return {
    success: true,
    from: fromVersion,
    to: toVersion,
    isUpgrade: isUpgrade,
    diffType: diff,
    matrix: upgradeMatrix,
    assetReuse: assetReuse,
    migrationPlan: migrationPlan,
    totalEffort: "~10.5 人天（直接复用）+ ~6 人天（改造复用）"
  };
}

function getRiskAssessment() {
  const highRisks = Object.entries(upgradeMatrix)
    .filter(([_, item]) => item.risk === "高")
    .map(([key, item]) => ({ key, ...item }));
  
  const mediumRisks = Object.entries(upgradeMatrix)
    .filter(([_, item]) => item.risk === "中")
    .map(([key, item]) => ({ key, ...item }));
  
  return {
    high: highRisks,
    medium: mediumRisks,
    recommendations: [
      "优先处理高风险项：公式引擎和协作机制",
      "预留缓冲时间应对技术难点",
      "建立每日站会跟踪风险项进展"
    ]
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'analyze') {
    const fromVersion = args[1] || '1.0.0';
    const toVersion = args[2] || '2.0.0';
    console.log(JSON.stringify(analyzeUpgrade(fromVersion, toVersion), null, 2));
  } else if (command === 'risk') {
    console.log(JSON.stringify(getRiskAssessment(), null, 2));
  } else if (command === 'assets') {
    console.log(JSON.stringify(assetReuse, null, 2));
  } else if (command === 'plan') {
    console.log(JSON.stringify(migrationPlan, null, 2));
  } else {
    console.log(`Usage:
  node upgrade-analyzer.js analyze [fromVersion] [toVersion]
  node upgrade-analyzer.js risk
  node upgrade-analyzer.js assets
  node upgrade-analyzer.js plan`);
  }
}

module.exports = { analyzeUpgrade, getRiskAssessment, assetReuse, migrationPlan, upgradeMatrix };
