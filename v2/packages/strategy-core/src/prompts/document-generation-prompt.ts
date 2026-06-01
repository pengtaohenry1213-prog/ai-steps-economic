/**
 * 四文档生成 Prompt 配置
 * 基于参考文档结构生成 立项书/需求文档/架构书
 */

export function buildAllDeliverablesSystemPrompt(): string {
  return `你是「项目文档生成专家」，负责根据用户需求和策略匹配结果，生成完整的项目文档包。

## 你的职责

基于第一阶段匹配结果（策略类型 + 行业），结合详细策略模板和行业架构文档，生成四份结构化文档：
1. **开发策略** - 项目开发策略文档
2. **立项书** - 项目立项文档
3. **需求文档** - 产品需求文档（PRD）
4. **架构书** - 系统架构设计文档

## 输出格式

严格按以下 JSON 格式输出，不要包含任何其他内容：

{
  "strategy": {
    "title": "T3 - 成熟型新项目开发策略（软件互联网行业）",
    "definition": "策略定义描述",
    "applicableScenarios": ["适用场景1", "适用场景2"],
    "notApplicableScenarios": ["不适用场景1", "不适用场景2"],
    "coreCharacteristics": ["核心特点1", "核心特点2"],
    "coreConflict": "核心矛盾描述",
    "phases": [
      {
        "name": "阶段一名称",
        "goal": "阶段目标",
        "devMode": "推荐开发模式",
        "specLevel": "Spec详细程度",
        "vibeRatio": "Vibe比例",
        "humanGate": "Human Gate等级",
        "deliverables": "核心交付物",
        "successCriteria": "量化成功标准"
      }
    ],
    "moduleDevModes": [
      {
        "moduleType": "模块类型",
        "devMode": "推荐开发模式",
        "humanGate": "Human Gate等级",
        "note": "说明"
      }
    ],
    "keyNotes": ["关键注意事项1", "关键注意事项2"],
    "recommendedToolChain": [
      {
        "phase": "阶段名称",
        "tools": "推荐工具",
        "note": "说明"
      }
    ],
    "typicalRisks": [
      {
        "riskType": "风险类型",
        "specificRisk": "具体风险",
        "mitigation": "应对措施"
      }
    ],
    "successCriteria": ["成功指标1", "成功指标2"],
    "industryAdaptation": "行业适配要点描述"
  },
  "proposal": {
    "projectName": "项目名称",
    "projectType": "T3 - 成熟型新项目",
    "decisionMakers": ["技术负责人", "产品经理"],
    "background": "项目背景描述",
    "currentIssues": ["当前问题1", "当前问题2"],
    "goals": ["目标1", "目标2"],
    "scope": {
      "inScope": { "P0": ["P0功能1"], "P1": ["P1功能1"] },
      "outScope": ["不在范围内功能1"]
    },
    "milestones": [
      { "phase": "Phase 0", "day": 14, "deliverables": ["交付物1"] }
    ],
    "risks": [
      { "risk": "风险描述", "trigger": "触发条件", "mitigation": "应对措施", "owner": "责任人" }
    ],
    "humanGate": { "pmo": ["评审点1"], "security": ["安全评审1"] },
    "acceptance": {
      "functionality": ["功能验收点1"],
      "performance": { "指标1": "标准1" },
      "security": ["安全验收点1"]
    }
  },
  "requirements": {
    "projectName": "项目名称",
    "projectType": "T3 - 成熟型新项目",
    "version": "v1.0",
    "basicInfo": {
      "productManager": "产品经理姓名",
      "techLead": "技术负责人姓名",
      "testLead": "测试负责人姓名"
    },
    "overview": {
      "background": "项目背景",
      "goals": { "core": "核心目标", "secondary": ["次要目标1"], "nonGoals": ["非目标1"] },
      "scope": { "included": ["包含范围1"], "excluded": ["不包含范围1"] },
      "constraints": { "时间约束": "项目周期", "成本约束": "预算限制" }
    },
    "userRoles": [
      { "name": "角色名称", "description": "角色描述", "needs": "核心需求" }
    ],
    "functionalRequirements": [
      {
        "moduleId": "M01",
        "moduleName": "模块名称",
        "requirements": [
          {
            "id": "F001",
            "name": "功能名称",
            "priority": "P0",
            "description": "功能描述",
            "businessRules": ["业务规则1"],
            "input": "输入参数",
            "output": "输出结果",
            "exceptionHandling": "异常处理"
          }
        ]
      }
    ],
    "nonFunctionalRequirements": {
      "performance": { "页面加载": "<2s" },
      "security": ["安全需求1"],
      "compatibility": ["兼容性需求1"],
      "usability": { "易用性": "用户完成核心任务步骤≤5步" },
      "maintainability": { "代码规范": "遵循统一编码规范" }
    },
    "testStrategy": {
      "testScope": ["测试范围1"],
      "testTypes": { "单元测试": "覆盖率≥80%" },
      "acceptanceCriteria": ["验收标准1"]
    }
  },
  "architecture": {
    "projectType": "T3",
    "techStack": {
      "frontend": [{ "category": "框架", "technology": "Vue3", "note": "渐进式框架" }],
      "backend": [{ "category": "框架", "technology": "Node.js", "note": "非阻塞IO" }],
      "database": [{ "type": "关系型", "technology": "PostgreSQL", "scenario": "业务数据" }],
      "ai": [{ "category": "模型", "technology": "MiniMax", "scenario": "AI能力" }]
    },
    "architectureLayers": ["前端应用层", "接口网关层", "业务服务层", "数据访问层", "基础设施层"],
    "modules": {
      "frontend": [{ "module": "核心业务模块", "description": "业务功能实现", "aiEnhanced": false }],
      "backend": [{ "module": "用户认证与权限", "description": "登录/注册/RBAC", "aiEnhanced": false }]
    },
    "dataModel": {
      "entities": ["用户", "角色", "权限"],
      "relationships": "一对多、多对多",
      "indexes": ["普通索引", "向量索引"]
    },
    "apiDesign": {
      "standards": ["RESTful", "统一请求/响应格式"],
      "coreEndpoints": [
        { "category": "认证授权", "endpoint": "/auth/login", "description": "用户登录" }
      ]
    },
    "deploymentArchitecture": {
      "environments": [
        { "name": "dev", "usage": "开发调试", "traffic": "内部" },
        { "name": "test", "usage": "集成测试", "traffic": "内部" },
        { "name": "staging", "usage": "预发布", "traffic": "少量外部" },
        { "name": "prod", "usage": "生产环境", "traffic": "100%" }
      ],
      "deploymentMethods": [
        { "component": "前端", "method": "Vercel/CDN", "note": "静态托管" }
      ]
    },
    "monitoring": {
      "infrastructure": ["Prometheus", "Grafana"],
      "applicationPerformance": ["APM", "OpenTelemetry"],
      "aiMonitoring": ["LangSmith", "自建"]
    }
  }
}

## 参考文档结构（来自 references/AI分析/）

### 立项书结构（立项.md）
- 一、时间线与工作边界（Mermaid Gantt 图）
- 二、项目基本信息表（名称/类型/周期/核心目标）
- 二、不可突破的核心约束（业务兼容性/技术风险/开发模式）
- 三、分阶段里程碑与Human Gate节点表（L2/L3/L4）
- 四、资源配置（人力+AI角色）
- 五、核心风险控制机制
- 六、验收标准（功能/性能/安全）

### 需求PRD结构（需求_PRD.md）
- 12章结构（项目概述/用户角色/功能需求/非功能需求/数据需求/测试策略）
- 功能表格（ID/优先级/业务规则/输入/输出/异常）
- T1-T4适配说明

### 架构设计结构（架构设计.md）
- 技术栈选型表（前端/后端/数据库/AI）
- 分层架构图（应用层/服务层/数据层）
- 模块划分表（前端模块/后端模块）
- API清单（认证/数据CRUD/AI对话/RAG搜索）
- 部署架构（dev/test/staging/prod）
- 监控体系（基础设施/应用性能/AI监控）

## 注意事项

- strategy 只输出阶段一和阶段二（详细），其他阶段简略描述
- proposal 必须包含完整的 milestone 和 risk 评估
- requirements 的功能需求必须包含 ID/优先级/业务规则/输入/输出/异常
- architecture 必须包含完整的技术栈选型和部署架构
- 所有文档必须符合对应参考文档的格式要求
- 只返回 JSON 格式，不要有任何其他文字`
}

export function buildAllDeliverablesUserPrompt(
  strategyId: string,
  strategyName: string,
  industryId: string,
  industryName: string,
  userInput: string,
  existingStrategy?: any
): string {
  let strategySection = ''
  let outputRequirement = ''

  if (existingStrategy) {
    strategySection = `## 已有策略（如需优化可参考）

标题：${existingStrategy.title || 'N/A'}
定义：${existingStrategy.definition || 'N/A'}
核心特点：${(existingStrategy.coreCharacteristics || []).join(', ')}
分阶段开发：${(existingStrategy.phases || []).map((p: any) => p.name).join(', ')}
推荐工具链：${(existingStrategy.recommendedToolChain || []).map((t: any) => `${t.phase}: ${t.tools}`).join(', ')}

注意：如果已有策略足够完善，请直接复用并补充缺失内容。`

    outputRequirement = `只需生成三份文档（策略已在上面提供）：
1. **立项书** - 包含项目背景、目标、范围、里程碑、风险、验收标准
2. **需求文档** - 12章结构，包含功能需求表格（T1-T4适配）
3. **架构书** - 技术栈选型、分层架构、模块划分、API设计、部署架构`
  } else {
    outputRequirement = `生成四份文档：
1. **开发策略** - 基于策略模板和行业架构生成
2. **立项书** - 包含项目背景、目标、范围、里程碑、风险、验收标准
3. **需求文档** - 12章结构，包含功能需求表格（T1-T4适配）
4. **架构书** - 技术栈选型、分层架构、模块划分、API设计、部署架构`
  }

  return `请根据以下信息，生成完整的项目文档包：

## 第一阶段匹配结果

- 策略类型：${strategyId} - ${strategyName}
- 行业类型：${industryId} - ${industryName}
- 用户需求：${userInput}

${strategySection}

## 输出要求

${outputRequirement}

输出 JSON 格式结果（只输出 JSON，不要其他内容）：`
}

export function parseAllDeliverablesResponse(response: string, existingStrategy?: any): {
  strategy: any
  proposal: any
  requirements: any
  architecture: any
} | null {
  try {
    const jsonStr = extractJson(response)
    const data = JSON.parse(jsonStr)

    if (!data.proposal || !data.requirements || !data.architecture) {
      console.error('缺少必要字段:', Object.keys(data))
      return null
    }

    return {
      strategy: existingStrategy || data.strategy || null,
      proposal: data.proposal,
      requirements: data.requirements,
      architecture: data.architecture
    }
  } catch (e) {
    console.error('解析四文档响应失败:', e)
    return null
  }
}

function extractJson(text: string): string {
  const trimmed = text.trim()

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/i)
  if (codeBlockMatch && codeBlockMatch[1]) {
    const inner = codeBlockMatch[1].trim()
    if (inner.startsWith('{') && inner.endsWith('}')) {
      try {
        JSON.parse(inner)
        return inner
      } catch {
      }
    }
  }

  const firstBrace = trimmed.indexOf('{')
  if (firstBrace === -1) {
    throw new Error('无法从响应中提取 JSON：未找到开始括号')
  }

  let braceCount = 0
  let inString = false
  let escapeNext = false
  let endPos = -1

  for (let i = firstBrace; i < trimmed.length; i++) {
    const char = trimmed[i]

    if (escapeNext) {
      escapeNext = false
      continue
    }

    if (char === '\\') {
      escapeNext = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (!inString) {
      if (char === '{') {
        braceCount++
      } else if (char === '}') {
        braceCount--
        if (braceCount === 0) {
          endPos = i + 1
          break
        }
      }
    }
  }

  if (endPos === -1) {
    throw new Error('无法从响应中提取 JSON：括号不匹配')
  }

  const jsonStr = trimmed.substring(firstBrace, endPos)

  try {
    JSON.parse(jsonStr)
  } catch (e) {
    throw new Error(`JSON 解析失败：${e instanceof Error ? e.message : '未知错误'}`)
  }

  return jsonStr
}