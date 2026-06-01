# @ai-toolkit/packages

AI 工程化开发 SDK 集合 - 框架无关的 TypeScript 包

## 包列表

| 包名 | 说明 | 状态 |
|------|------|------|
| `@ai-toolkit/strategy-core` | 开发策略智能匹配核心 SDK | ✅ 完成 |
| `@ai-toolkit/ai-service` | 统一 AI 服务 SDK（Ollama/OpenAI 兼容） | ✅ 完成 |
| `@ai-toolkit/lifecycle-core` | 项目生命周期管理核心 SDK | ✅ 完成 |

## 设计原则

1. **框架无关**：纯 TypeScript 实现，不依赖 Vue/React 等 UI 框架
2. **可独立测试**：每个包有自己的 tests/ 目录
3. **依赖注入**：通过构造函数注入依赖，方便 mock 测试
4. **可单独发布**：每个包可以独立 npm publish

## 目录结构

```
packages/
├── strategy-core/          # 开发策略匹配 SDK
│   ├── src/
│   │   ├── types/          # 类型定义
│   │   ├── constants/       # 常量（策略/行业定义）
│   │   ├── prompts/         # Prompt 模板
│   │   └── services/        # 核心服务
│   ├── tests/              # 单元测试
│   └── package.json
│
├── ai-service/             # AI 服务 SDK
│   ├── src/
│   │   ├── types/          # 类型定义
│   │   ├── clients/         # AI 客户端（OpenAI/Ollama）
│   │   └── services/        # 服务封装
│   ├── tests/
│   └── package.json
│
├── lifecycle-core/          # 生命周期管理 SDK
│   ├── src/
│   │   ├── types/          # 类型定义
│   │   ├── constants/       # 阶段定义
│   │   └── index.ts         # 主入口
│   ├── tests/
│   └── package.json
│
└── index.ts                # 统一导出
```

## 使用示例

### Strategy Core

```typescript
import {
  configureLLMClient,
  matchStrategy,
  getAllStrategies,
  getAllIndustries
} from '@ai-toolkit/strategy-core'

// 配置 LLM 客户端
const llmClient = {
  async chat(userPrompt, systemPrompt) {
    // 调用你的 LLM API
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt: systemPrompt + '\n\n' + userPrompt })
    })
    return response.json()
  }
}

configureLLMClient(llmClient)

// 执行匹配
const result = await matchStrategy({
  userInput: '我们要开发一个医院门诊管理系统'
})

if (result.success) {
  console.log(`策略: ${result.data.strategy.id}`)
  console.log(`行业: ${result.data.industry.id}`)
  console.log(`置信度: ${result.data.confidence}`)
  console.log(`判断依据: ${result.data.judgmentBasis}`)
}
```

### AI Service

```typescript
import { createAIService } from '@ai-toolkit/ai-service'

// 创建 AI 服务
const aiService = createAIService({
  provider: 'openai',
  baseUrl: 'https://api.minimaxi.com/v1',
  apiKey: process.env.API_KEY,
  defaultModel: 'MiniMax-M2.7'
})

// 调用
const result = await aiService.chat([
  { role: 'system', content: '你是一个助手' },
  { role: 'user', content: '你好' }
])

if (result.success) {
  console.log(result.data.content)
}
```

### Lifecycle Core

```typescript
import { createLifecycleCore } from '@ai-toolkit/lifecycle-core'

// 创建生命周期管理器
const lifecycle = createLifecycleCore({
  storageKey: 'my-app-lifecycle'
})

// 获取当前状态
const state = lifecycle.getState()
console.log('当前阶段:', state.currentStageId)
console.log('阶段列表:', state.stages.map(s => s.id))

// 更新阶段状态
lifecycle.updateStageStatus('requirement', 'in_progress')
lifecycle.setCurrentStage('requirement')
```

## 开发

```bash
# 构建所有包
cd packages
npm install

# 分别构建
cd strategy-core && npm run build
cd ../ai-service && npm run build
cd ../lifecycle-core && npm run build

# 测试
npm test
```

## 未来计划

- `@ai-toolkit/workflow-core` - 工作流状态管理
- `@ai-toolkit/project-generator` - 项目生成器
- `@ai-toolkit/document-core` - 文档处理核心