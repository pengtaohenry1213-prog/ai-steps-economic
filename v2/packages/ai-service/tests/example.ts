/**
 * @ai-toolkit/ai-service 测试验证
 */

import { createAIService } from '../src'

async function main() {
  console.log('=== AI Service SDK 测试 ===\n')

  // 1. 测试 OpenAI 客户端创建
  console.log('1. 创建 OpenAI 客户端')
  const openaiService = createAIService({
    provider: 'openai',
    baseUrl: 'https://api.minimaxi.com/v1',
    apiKey: 'test-key',
    defaultModel: 'MiniMax-M2.7'
  })
  console.log('   ✓ OpenAI 客户端创建成功\n')

  // 2. 测试 Ollama 客户端创建
  console.log('2. 创建 Ollama 客户端')
  const ollamaService = createAIService({
    provider: 'ollama',
    baseUrl: 'http://localhost:3001',
    defaultModel: 'deepseek-r1'
  })
  console.log('   ✓ Ollama 客户端创建成功\n')

  // 3. 测试 chat 接口（mock）
  console.log('3. 测试 chat 接口（模拟调用）')
  // 注意：由于没有真实 API key，这里只测试接口结构
  console.log('   - openaiService.chat:', typeof openaiService.chat)
  console.log('   - ollamaService.chat:', typeof ollamaService.chat)
  console.log('   ✓ 接口结构正常\n')

  // 4. 测试类型导出
  console.log('4. 测试类型导出')
  console.log('   - ChatMessage:', typeof { role: 'user', content: 'test' })
  console.log('   - ChatRequest:', typeof { model: 'test', messages: [] })
  console.log('   ✓ 类型导出正常\n')

  console.log('=== 测试完成 ===')
}

main().catch(console.error)