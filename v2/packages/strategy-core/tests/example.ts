/**
 * 策略匹配服务使用示例
 * 迁移自 test/app/example.ts
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)


import {
  configureLLMClient,
  matchStrategy,
  getFullStrategyInfo,
  getFullIndustryInfo,
  getAllStrategies,
  getAllIndustries,
  enhanceStrategy
} from '../src'

/**
 * 读取并合并多个需求文档的核心段落
 */
export function loadAndMergeRequirements(basePath?: string): string {
  const testDataPath = basePath || getTestDataPath()

  if (!testDataPath) {
    console.warn('警告: 无法找到测试数据路径')
    return ''
  }

  const files = [
    { name: 'v2_product_roadmap.md', extract: extractProjectVision },
    { name: 'v1_v2_upgrade_requirements.md', extract: extractUpgradeGoals },
    { name: 'v2_init_plan.md', extract: extractTechStack },
    { name: 'v1_v2_analysis.md', extract: extractReusableAssets }
  ]

  const mergedParts: string[] = []

  for (const file of files) {
    const filePath = resolve(testDataPath, file.name)
    try {
      const content = readFileSync(filePath, 'utf-8')
      const extracted = file.extract(content)
      if (extracted) {
        mergedParts.push(extracted)
      }
    } catch {
      console.warn(`警告: 无法读取文件 ${file.name}`)
    }
  }

  return mergedParts.join('\n\n')
}

export function extractProjectVision(content: string): string {
  const match = content.match(/## 一、项目愿景[\s\S]*?(?=---)/)
  return match ? `【项目愿景】\n${match[0]}` : ''
}

export function extractUpgradeGoals(content: string): string {
  const match = content.match(/### 1\.2 升级目标[\s\S]*?(?=\|)/)
  return match ? `【升级目标】\n${match[0]}` : ''
}

export function extractTechStack(content: string): string {
  const match = content.match(/### 1\.3 技术栈[\s\S]*?(?=---)/)
  return match ? `【技术栈】\n${match[0]}` : ''
}

export function extractReusableAssets(content: string): string {
  const match = content.match(/### 2\.1 数据库设计[\s\S]*?(?=\*\*复用方式)/)
  return match ? `【复用资产】\n${match[0]}` : ''
}

function getTestDataPath(): string {
  const absolutePath = './requirements'
  const relativePaths = [
    resolve(__dirname, './requirements'),
    resolve(__dirname, './requirements'),
  ]
  const { statSync } = require('fs')
  for (const p of [absolutePath, ...relativePaths]) {
    try {
      const stats = statSync(p)
      if (stats.isDirectory()) return p
    } catch {}
  }
  return ''
}

function loadEnv(path: string): void {
  try {
    const content = readFileSync(path, 'utf-8')
    for (const line of content.split('\n')) {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        process.env[match[1]] = match[2]
      }
    }
  } catch {}
}

loadEnv(resolve(__dirname, './../../../.env'))

const baseURL = process.env.VITE_OPENAI_BASE_URL || 'https://api.minimaxi.com/v1'
const apiKey = process.env.VITE_OPENAI_API_KEY || ''

/**
 * 真实 LLM 客户端
 */
export const realLLMClient = {
  async chat(userPrompt: string, systemPrompt: string): Promise<string> {
    console.log('=== LLM 调用 (真实API) ===')

    const combinedPrompt = `${systemPrompt}\n\n用户需求: ${userPrompt}`

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.7',
        messages: [{ role: 'user', content: combinedPrompt }],
        temperature: 0,
        max_tokens: 4096
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 调用失败: ${response.status} ${errorText}`)
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> }
    return data.choices[0]?.message?.content || ''
  }
}

/**
 * Mock LLM 客户端（用于不需要真实 API 的测试）
 */
export const mockLLMClient = {
  async chat(userPrompt: string, systemPrompt: string): Promise<string> {
    console.log('=== LLM 调用 (Mock) ===')
    console.log('User Prompt:', userPrompt.substring(0, 100) + '...')

    return JSON.stringify({
      strategy: { id: 'T2', name: '从0到1稳定型新项目' },
      industry: { id: 'software', name: '软件互联网' },
      confidence: 0.85,
      reasoning: '项目业务需求明确，采用新技术栈，属于稳定型新项目',
      judgmentBasis: '选T2而非T1：需求明确但采用Vue3等新技术；选T2而非T3：技术栈较新，非完全成熟'
    })
  }
}

/**
 * 运行示例
 */
async function main() {
  // 1. 配置 LLM 客户端
  const useMock = process.env.USE_MOCK_LLM === 'true'
  configureLLMClient(useMock ? mockLLMClient : realLLMClient)

  // 2. 打印所有可用策略和行业
  console.log('\n=== 可用开发策略 ===')
  getAllStrategies().forEach(s => {
    console.log(`  ${s.id}: ${s.name} - ${s.description}`)
  })

  console.log('\n=== 可用行业 ===')
  getAllIndustries().forEach(i => {
    console.log(`  ${i.id}: ${i.name} - ${i.description}`)
  })

  // 3. 测试匹配
  const testCases = [
    '我们是个三甲医院，要开发一个门诊管理系统',
    '电商公司要做秒杀功能',
    '创业公司要做一个社交App，验证市场需求',
    '银行要升级核心交易系统'
  ]

  // 4. 测试：合并多文件需求文档
  console.log('\n\n========== 多文件合并测试 ==========')
  const mergedInput = loadAndMergeRequirements()
  if (mergedInput) {
    console.log('合并后的测试输入:')
    console.log(mergedInput.substring(0, 500) + '...')

    const result = await matchStrategy({ userInput: mergedInput })

    if (result.success && result.data) {
      console.log(`\n匹配结果:`)
      console.log(`  策略: ${result.data.strategy.id} - ${result.data.strategy.name}`)
      console.log(`  行业: ${result.data.industry.id} - ${result.data.industry.name}`)
      console.log(`  置信度: ${(result.data.confidence * 100).toFixed(0)}%`)
      console.log(`  推理: ${result.data.reasoning}`)
      console.log(`  判断依据: ${result.data.judgmentBasis}`)
    } else {
      console.log(`\n匹配失败: ${result.error}`)
    }
  } else {
    console.log('警告: 无法加载合并后的测试输入')
  }

  // 5. 原有单条测试
  console.log('\n\n========== 单条测试 ==========')
  for (const input of testCases) {
    console.log(`\n=== 测试输入 ===`)
    console.log(`需求: ${input}`)

    const result = await matchStrategy({ userInput: input })

    if (result.success && result.data) {
      console.log(`\n匹配结果:`)
      console.log(`  策略: ${result.data.strategy.id} - ${result.data.strategy.name}`)
      console.log(`  行业: ${result.data.industry.id} - ${result.data.industry.name}`)
      console.log(`  置信度: ${(result.data.confidence * 100).toFixed(0)}%`)
      console.log(`  推理: ${result.data.reasoning}`)
      console.log(`  判断依据: ${result.data.judgmentBasis}`)

      const fullStrategy = getFullStrategyInfo(result.data.strategy.id)
      const fullIndustry = getFullIndustryInfo(result.data.industry.id)
      console.log(`\n完整策略描述: ${fullStrategy?.description}`)
      console.log(`完整行业描述: ${fullIndustry?.description}`)

      const enhanced = await enhanceStrategy(result.data, input)
      if (enhanced) {
        console.log(`\n=== 增强后的开发策略 ===`)
        console.log(`标题: ${enhanced.enhancedStrategy.title}`)
        console.log(`定义: ${enhanced.enhancedStrategy.definition}`)
        console.log(`适用场景:`)
        enhanced.enhancedStrategy.applicableScenarios.forEach((s, i) => {
          console.log(`  ${i + 1}. ${s}`)
        })
        console.log(`核心特点:`)
        enhanced.enhancedStrategy.coreCharacteristics.forEach((c, i) => {
          console.log(`  ${i + 1}. ${c}`)
        })
        console.log(`分阶段开发:`)
        enhanced.enhancedStrategy.phases.slice(0, 2).forEach((p: any) => {
          console.log(`  - ${p.name}: ${p.goal}`)
        })
        console.log(`Human Gate审查:`)
        enhanced.enhancedStrategy.phases.slice(0, 2).forEach((p: any) => {
          console.log(`  - ${p.name}: ${p.humanGate}`)
        })
        console.log(`推荐工具链:`)
        enhanced.enhancedStrategy.recommendedToolChain.slice(0, 3).forEach((t: any) => {
          console.log(`  - ${t.phase}: ${t.tools}`)
        })
        console.log(`典型风险:`)
        enhanced.enhancedStrategy.typicalRisks.slice(0, 2).forEach((r: any, i) => {
          console.log(`  ${i + 1}. ${r.riskType}: ${r.specificRisk}`)
        })
        console.log(`成功指标:`)
        enhanced.enhancedStrategy.successCriteria.slice(0, 3).forEach((s, i) => {
          console.log(`  ${i + 1}. ${s}`)
        })
        console.log(`行业适配: ${enhanced.enhancedStrategy.industryAdaptation.substring(0, 100)}...`)
      } else {
        console.log(`\n增强策略失败`)
      }
    } else {
      console.log(`\n匹配失败: ${result.error}`)
    }
  }
}

main().catch(console.error)