/**
 * Ollama Routes
 * REST API endpoints for Ollama service
 */

import { Router } from 'express'
import {
  generateText,
  generateTextOpenAI,
  testConnection,
  getModels,
} from '../services/ollama.js'
import { buildPrompt, getPromptTypeByStageId, getPromptName, getJsonSchema } from '../services/prompt.js'
import { normalizeResponse, createErrorResponse } from '../services/normalizer.js'
import type {
  GenerateRequest,
  GenerateByStageRequest,
  GenerateByStageResponse,
  HealthStatus,
  ModelsResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
  StandardResponse,
} from '../types/index.js'

const router = Router()

// Helper to create success response
function successResponse<T>(data: T): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }
}

// Helper to create error response
function errorResponse(error: string, code?: string): ApiErrorResponse {
  return {
    success: false,
    error,
    code,
    timestamp: new Date().toISOString(),
  }
}

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/api/health', async (_req, res) => {
  try {
    const ollamaConnected = await testConnection()

    const status: HealthStatus = {
      status: ollamaConnected ? 'ok' : 'error',
      ollamaConnected,
      timestamp: new Date().toISOString(),
    }

    res.json(successResponse(status))
  } catch (error) {
    res.status(500).json(errorResponse('Health check failed'))
  }
})

/**
 * POST /api/generate
 * Generate text using Ollama
 */
router.post('/api/generate', async (req, res) => {
  try {
    const { model, prompt, options } = req.body as GenerateRequest

    if (!model || !prompt) {
      res.status(400).json(errorResponse('Missing required fields: model, prompt', 'INVALID_REQUEST'))
      return
    }

    const response = await generateText({ model, prompt, options })

    res.json(
      successResponse({
        response,
        model,
      })
    )
  } catch (error) {
    console.error('Generate error:', error)
    res.status(500).json(errorResponse(error instanceof Error ? error.message : 'Generation failed'))
  }
})

/**
 * POST /api/generate-by-stage
 * Generate content based on stage type (integrated with prompt builder)
 * Supports both Ollama (local) and OpenAI-compatible (external) models
 * Returns normalized StandardResponse format
 */
router.post('/api/generate-by-stage', async (req, res) => {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(2, 8)

  try {
    const {
      stageId,
      files,
      model = 'deepseek-r1',
      provider = 'ollama',
      baseUrl,
      apiKey,
      responseFormat = 'both'
    } = req.body as GenerateByStageRequest

    if (!stageId || !files) {
      res.status(400).json(
        createErrorResponse('Missing required fields: stageId, files')
      )
      return
    }

    // Get prompt type for the stage
    const promptType = getPromptTypeByStageId(stageId)
    const promptName = getPromptName(promptType)

    // Mask API key for logging
    const maskedApiKey = apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(-4)}` : 'N/A'

    console.log(`[${requestId}] [START] Generating ${promptName}`)
    console.log(`[${requestId}]   stageId: ${stageId}`)
    console.log(`[${requestId}]   model: ${model}`)
    console.log(`[${requestId}]   provider: ${provider}`)
    if (provider === 'openai') {
      console.log(`[${requestId}]   baseUrl: ${baseUrl}`)
      console.log(`[${requestId}]   apiKey: ${maskedApiKey}`)
    }

    // Build prompt
    const prompt = buildPrompt(promptType, files, responseFormat)
    console.log(`[${requestId}]   promptLength: ${prompt.length} chars`)
    console.log(`[${requestId}]   responseFormat: ${responseFormat}`)

    // Get expected JSON schema for this prompt type
    const jsonSchema = getJsonSchema(promptType)

    // Generate content based on provider
    let response: string
    let genDuration: number

    if (provider === 'openai' && baseUrl && apiKey) {
      console.log(`[${requestId}]   calling: OpenAI-compatible API (${baseUrl})`)
      const callStart = Date.now()
      response = await generateTextOpenAI(model, prompt, baseUrl, apiKey)
      genDuration = Date.now() - callStart
      console.log(`[${requestId}]   [COMPLETE] OpenAI API response: ${response.length} chars in ${genDuration}ms`)
    } else {
      console.log(`[${requestId}]   calling: Ollama (${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'})`)
      const callStart = Date.now()
      response = await generateText({ model, prompt })
      genDuration = Date.now() - callStart
      console.log(`[${requestId}]   [COMPLETE] Ollama response: ${response.length} chars in ${genDuration}ms`)
    }

    // Normalize the response to standard format
    const normalized = normalizeResponse(response, jsonSchema, model, genDuration, responseFormat)

    const totalDuration = Date.now() - startTime
    console.log(`[${requestId}] [TOTAL] ${totalDuration}ms (model: ${model})`)

    // Return normalized response
    res.json(normalized)
  } catch (error) {
    const totalDuration = Date.now() - startTime
    console.error(`[${requestId}] [ERROR] after ${totalDuration}ms:`, error instanceof Error ? error.message : error)
    res.status(500).json(createErrorResponse(error instanceof Error ? error.message : 'Generation failed'))
  }
})

/**
 * GET /api/models
 * Get available Ollama models
 */
router.get('/api/models', async (_req, res) => {
  try {
    const models = await getModels()

    const result: ModelsResponse = { models }

    res.json(successResponse(result))
  } catch (error) {
    console.error('Get models error:', error)
    res.status(500).json(errorResponse(error instanceof Error ? error.message : 'Failed to get models'))
  }
})

/**
 * GET /api/prompt-types
 * Get all supported prompt types
 */
router.get('/api/prompt-types', (_req, res) => {
  const types = [
    { type: 'proposal', name: '立项书生成' },
    { type: 'requirement', name: '需求文档生成' },
    { type: 'architecture', name: '架构设计文档生成' },
    { type: 'prd', name: 'PRD 文档生成' },
    { type: 'test_plan', name: '测试计划生成' },
    { type: 'acceptance', name: '验收报告生成' },
    { type: 'deployment', name: '部署方案生成' },
  ]

  res.json(successResponse(types))
})

export default router
