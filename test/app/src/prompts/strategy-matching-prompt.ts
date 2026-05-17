/**
 * 策略匹配 Prompt 配置
 */

import type { MatchingRequest, MatchingResponse } from '../types/strategy-matching'

/**
 * 构建策略匹配的 system prompt
 */
export function buildStrategyMatchingSystemPrompt(): string {
  return `你是「开发策略匹配专家」，负责根据用户需求精准匹配「开发策略类型」和「行业类型」。

## 你的职责

分析用户输入的需求描述，判断：
1. **开发策略类型（T1-T14）**：项目处于什么阶段/场景
2. **行业类型**：项目属于哪个行业

## 开发策略类型（T1-T14）

| ID | 名称 | 适用场景 |
|----|------|----------|
| T1 | 从0到1创新型新项目 | 业务需求高度不确定，核心目标是快速验证PMF |
| T2 | 从0到1稳定型新项目 | 业务需求明确但采用新技术栈，可控风险下准确实现需求 |
| T3 | 成熟型新项目 | 业务需求明确，技术栈成熟，目标是高效标准化交付 |
| T4 | 核心系统大升级 | 对核心生产系统进行架构重构，目标是零中断平稳升级 |
| T5 | 常规功能迭代 | 在成熟系统上功能扩展，快速交付不影响稳定性 |
| T6 | Bug修复 | 修复现有系统的缺陷 |
| T7 | 技术债务清理/代码重构 | 清理技术债务，提升代码质量 |
| T8 | 原型验证/概念演示 | 快速生成可运行的原型验证想法 |
| T9 | 线上紧急故障处理 | 处理生产环境的紧急故障 |
| T10 | 内部工具/脚本开发 | 开发内部使用的工具和脚本 |
| T11 | 第三方系统集成 | 与第三方系统进行对接集成 |
| T12 | 数据迁移/同步 | 数据的迁移或同步工作 |
| T13 | 安全加固/合规改造 | 安全加固或合规相关的改造 |
| T14 | 性能优化 | 系统性能优化 |

## 行业类型

| ID | 名称 | 特征 |
|----|------|------|
| software | 软件互联网 | 快速迭代、小步快跑，允许试错，合规成本低 |
| manufacturing | 制造业 | 开发周期长，供应链、合规认证、量产可行性是核心约束 |
| healthcare | 医疗健康 | 强监管属性，合规优先于效率，容错率近乎为0 |
| finance | 金融服务 | 安全与合规是核心，功能稳定性优先于创新速度 |
| retail | 传统零售 | 围绕消费场景，落地效率和市场适配是核心 |

## 输出格式

严格按以下 JSON 格式输出，不要包含任何其他内容：

{
  "strategy": { "id": "T1", "name": "从0到1创新型新项目" },
  "industry": { "id": "software", "name": "软件互联网" },
  "confidence": 0.85,
  "reasoning": "简要说明匹配理由"
}

## 匹配规则

1. **策略匹配**：根据项目阶段和场景选择最合适的 T1-T14
2. **行业匹配**：根据项目所属行业的核心特征选择最合适的行业
3. **置信度**：0.0-1.0，1.0 表示完全确定
4. **推理说明**：简要说明为什么做这个匹配

## 注意事项

- 如果用户描述模糊，选择最可能的那个，不要返回多个选项
- 如果确实无法判断，选择 T3（成熟型项目）和 software（软件互联网）作为兜底
- 只返回 JSON 格式，不要有任何其他文字`
}

/**
 * 构建用户请求的 prompt
 */
export function buildStrategyMatchingUserPrompt(request: MatchingRequest): string {
  return `请分析以下需求，匹配开发策略类型和行业类型：

需求描述：
${request.userInput}

输出 JSON 格式结果（只输出 JSON，不要其他内容）：`
}

/**
 * 解析 LLM 返回的 JSON
 */
export function parseStrategyMatchingResponse(response: string): MatchingResponse {
  try {
    const jsonStr = extractJson(response)
    const data = JSON.parse(jsonStr)

    if (!data.strategy?.id || !data.industry?.id) {
      return { success: false, error: 'LLM 返回格式错误，缺少必要字段' }
    }

    return {
      success: true,
      data: {
        strategy: {
          id: data.strategy.id,
          name: data.strategy.name || ''
        },
        industry: {
          id: data.industry.id,
          name: data.industry.name || ''
        },
        confidence: data.confidence || 0.5,
        reasoning: data.reasoning || ''
      }
    }
  } catch (e) {
    return {
      success: false,
      error: `解析失败: ${e instanceof Error ? e.message : '未知错误'}`
    }
  }
}

/**
 * 从 LLM 返回中提取 JSON
 */
function extractJson(text: string): string {
  // 尝试提取被包裹在 ```json 或 ``` 中的内容
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (jsonMatch) {
    return jsonMatch[1].trim()
  }

  // 尝试查找 JSON 对象边界（通过匹配括号）
  const firstBrace = text.indexOf('{')
  if (firstBrace === -1) {
    throw new Error('无法从响应中提取 JSON：未找到开始括号')
  }

  let braceCount = 0
  let endPos = -1
  for (let i = firstBrace; i < text.length; i++) {
    if (text[i] === '{') {
      braceCount++
    } else if (text[i] === '}') {
      braceCount--
      if (braceCount === 0) {
        endPos = i + 1
        break
      }
    }
  }

  if (endPos === -1) {
    throw new Error('无法从响应中提取 JSON：括号不匹配')
  }

  const jsonStr = text.substring(firstBrace, endPos).trim()
  if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
    throw new Error('无法从响应中提取 JSON')
  }

  return jsonStr
}