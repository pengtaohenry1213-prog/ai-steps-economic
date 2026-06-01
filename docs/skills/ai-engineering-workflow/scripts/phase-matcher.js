#!/usr/bin/env node

const phases = {
  1: {
    name: "立项",
    activities: ["可行性分析", "竞品调研", "收益评估"],
    docs: ["Prompt 模板库.md", "AI工程化团队规范.md"],
    rules: ["PM.mdc", "tech-lead.mdc"],
    gate: "HG1",
    outputs: ["可行性分析报告", "竞品分析文档"],
    checklist: [
      "完成市场可行性分析",
      "完成竞品调研",
      "评估项目收益",
      "确定项目目标"
    ]
  },
  2: {
    name: "需求",
    activities: ["PRD 生成", "需求整理", "业务方确认"],
    docs: ["Prompt 模板库.md", "AI工程化团队规范.md"],
    rules: ["PM.mdc", "PMO.mdc"],
    gate: "HG1",
    outputs: ["PRD 文档", "需求规格说明书"],
    checklist: [
      "生成完整 PRD",
      "整理需求清单",
      "确认业务需求",
      "定义验收标准"
    ]
  },
  3: {
    name: "架构",
    activities: ["系统架构设计", "AI 模块设计", "全栈方案设计"],
    docs: ["前端工程化 SOP.md", "后端工程化 SOP.md", "数据库设计规范.md", "安全工程规范.md"],
    rules: ["tech-lead.mdc", "frontend-vue3.mdc", "backend.mdc", "security-rules.md"],
    gate: "HG1",
    outputs: ["架构设计文档", "技术选型报告"],
    checklist: [
      "完成系统架构设计",
      "确定技术栈",
      "设计数据库结构",
      "评估安全风险"
    ]
  },
  4: {
    name: "初始化",
    activities: ["项目骨架搭建", "代码规范制定", "Cursor Rules 配置"],
    docs: ["前端工程化 SOP.md", "Cursor 使用规范.md", "Claude Code 工作流.md", "Git 规范.md"],
    rules: ["frontend-vue3.mdc", "backend.mdc", "database.mdc", "security-rules.md"],
    gate: null,
    outputs: ["可运行的项目骨架", "代码规范配置"],
    checklist: [
      "初始化项目仓库",
      "配置开发环境",
      "设置代码规范",
      "配置 Cursor Rules"
    ]
  },
  5: {
    name: "开发",
    activities: ["前端组件开发", "API 接口开发"],
    docs: ["前端工程化 SOP.md", "后端工程化 SOP.md", "数据库设计规范.md", "安全工程规范.md", "AI生成代码审查清单.md", "Bug 排查 SOP.md", "Git 规范.md"],
    rules: ["frontend-vue3.mdc", "backend.mdc", "database.mdc", "security-rules.md", "reviewer.mdc"],
    gate: null,
    outputs: ["功能代码", "单元测试"],
    checklist: [
      "完成组件开发",
      "完成 API 开发",
      "编写单元测试",
      "代码审查通过"
    ]
  },
  6: {
    name: "测试",
    activities: ["AI 专项测试", "单元测试", "集成测试"],
    docs: ["Bug 排查 SOP.md", "AI安全审查清单.md", "后端工程化 SOP.md"],
    rules: ["TEST.mdc", "security-rules.md"],
    gate: "HG2",
    outputs: ["测试报告", "Bug 修复记录"],
    checklist: [
      "完成单元测试（覆盖率>70%）",
      "完成集成测试",
      "完成安全测试",
      "修复所有 P0/P1 Bug"
    ]
  },
  7: {
    name: "验收",
    activities: ["验收文档生成", "用户手册"],
    docs: ["Prompt 模板库.md", "AI工程化团队规范.md"],
    rules: ["reviewer.mdc"],
    gate: "HG2",
    outputs: ["验收文档", "用户手册"],
    checklist: [
      "生成验收文档",
      "编写用户手册",
      "完成功能验收",
      "PMO + Security 复审"
    ]
  },
  8: {
    name: "打包",
    activities: ["Dockerfile 编写", "依赖安全扫描"],
    docs: ["安全工程规范.md", "Vercel 部署规范.md"],
    rules: ["security-rules.md", "deploy-rules.mdc"],
    gate: null,
    outputs: ["Docker 镜像", "依赖扫描报告"],
    checklist: [
      "编写 Dockerfile",
      "扫描依赖漏洞",
      "检查敏感信息",
      "构建可部署包"
    ]
  },
  9: {
    name: "部署",
    activities: ["多环境部署", "本地调试"],
    docs: ["Vercel 部署规范.md", "Git 规范.md"],
    rules: ["deploy-rules.mdc"],
    gate: null,
    outputs: ["部署配置", "环境变量文档"],
    checklist: [
      "配置多环境",
      "完成部署",
      "验证服务可用",
      "配置监控告警"
    ]
  },
  10: {
    name: "运维",
    activities: ["日志分析", "监控告警", "热更新"],
    docs: ["Bug 排查 SOP.md", "安全工程规范.md"],
    rules: ["troubleshoot-issues.mdc"],
    gate: null,
    outputs: ["运维手册", "监控配置"],
    checklist: [
      "配置日志收集",
      "设置监控告警",
      "建立故障响应流程",
      "定期安全巡检"
    ]
  },
  11: {
    name: "迭代",
    activities: ["需求收集", "优化方案", "开发实现"],
    docs: ["Git 规范.md", "Prompt 模板库.md"],
    rules: ["git-commit-rules.mdc"],
    gate: "HG1",
    outputs: ["迭代计划", "优化方案"],
    checklist: [
      "收集用户反馈",
      "制定迭代计划",
      "评估新需求",
      "新需求评审"
    ]
  }
};

function matchPhase(input) {
  const phaseNum = parseInt(input, 10);
  if (phases[phaseNum]) {
    return {
      success: true,
      phase: phases[phaseNum],
      nextPhase: phases[phaseNum + 1] || null
    };
  }
  
  const phaseNames = Object.values(phases).map(p => p.name);
  const matched = phaseNames.find(name => input.includes(name));
  if (matched) {
    const phase = Object.values(phases).find(p => p.name === matched);
    return {
      success: true,
      phase: phase,
      nextPhase: phases[phase.id + 1] || null
    };
  }
  
  return {
    success: false,
    error: `未找到匹配的阶段: ${input}`,
    availablePhases: Object.keys(phases).map(k => `${k}: ${phases[k].name}`)
  };
}

function getAllPhases() {
  return Object.entries(phases).map(([id, info]) => ({
    id: parseInt(id),
    name: info.name,
    gate: info.gate
  }));
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'list') {
    console.log(JSON.stringify(getAllPhases(), null, 2));
  } else if (command === 'match') {
    const input = args[1];
    if (!input) {
      console.error('Usage: node phase-matcher.js match <phase-number-or-name>');
      process.exit(1);
    }
    console.log(JSON.stringify(matchPhase(input), null, 2));
  } else {
    console.log(`Usage:
  node phase-matcher.js list
  node phase-matcher.js match <phase-number-or-name>`);
  }
}

module.exports = { matchPhase, getAllPhases, phases };
