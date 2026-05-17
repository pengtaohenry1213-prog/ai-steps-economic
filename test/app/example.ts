/**
 * 策略匹配服务使用示例
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
  getAllIndustries
} from './src'

import dotenv from 'dotenv'
dotenv.config()

/**
 * 读取并合并多个需求文档的核心段落
 */
function loadAndMergeRequirements(): string {
  const basePath = resolve(__dirname, '../references/requirements')

  const files = [
    { name: 'v2_product_roadmap.md', extract: extractProjectVision },
    { name: 'v1_v2_upgrade_requirements.md', extract: extractUpgradeGoals },
    { name: 'v2_init_plan.md', extract: extractTechStack },
    { name: 'v1_v2_analysis.md', extract: extractReusableAssets }
  ]

  const mergedParts: string[] = []

  for (const file of files) {
    const filePath = resolve(basePath, file.name)
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

function extractProjectVision(content: string): string {
  const match = content.match(/## 一、项目愿景[\s\S]*?(?=---)/)
  return match ? `【项目愿景】\n${match[0]}` : ''
}

function extractUpgradeGoals(content: string): string {
  const match = content.match(/### 1\.2 升级目标[\s\S]*?(?=\|)/)
  return match ? `【升级目标】\n${match[0]}` : ''
}

function extractTechStack(content: string): string {
  const match = content.match(/### 1\.3 技术栈[\s\S]*?(?=---)/)
  return match ? `【技术栈】\n${match[0]}` : ''
}

function extractReusableAssets(content: string): string {
  const match = content.match(/### 2\.1 数据库设计[\s\S]*?(?=\*\*复用方式)/)
  return match ? `【复用资产】\n${match[0]}` : ''
}

const baseURL = process.env.VITE_OPENAI_BASE_URL || 'https://api.minimaxi.com/v1'
const apiKey = process.env.VITE_OPENAI_API_KEY || ''

const realLLMClient = {
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
        temperature: 0.1,
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
 * 运行示例
 */
async function main() {
  // 1. 配置 LLM 客户端
  configureLLMClient(realLLMClient)

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
  const mergedInput = loadAndMergeRequirements() // 合并多文件需求文档, 提取关键信息
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

      // 获取完整信息
      const fullStrategy = getFullStrategyInfo(result.data.strategy.id)
      const fullIndustry = getFullIndustryInfo(result.data.industry.id)
      console.log(`\n完整策略描述: ${fullStrategy?.description}`)
      console.log(`完整行业描述: ${fullIndustry?.description}`)
    } else {
      console.log(`\n匹配失败: ${result.error}`)
    }
  }
}

main().catch(console.error)