/**
 * Ollama Server
 * HTTP API service for Ollama AI integration
 * 
 * Usage:
 *   npm run dev    - Development mode with hot reload
 *   npm run build  - Build for production
 *   npm start      - Run production server
 */

import express from 'express'
import cors from 'cors'
import ollamaRouter from './routes/ollama.js'
import { testConnection } from './services/ollama.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/', ollamaRouter)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  })
})

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  })
})

// Start server
async function start() {
  console.log('Starting Ollama Server...')
  console.log(`Port: ${PORT}`)
  console.log(`Ollama URL: ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}`)

  // Test Ollama connection
  const connected = await testConnection()
  if (connected) {
    console.log('Ollama connection: OK')
  } else {
    console.warn('Ollama connection: FAILED (server will start anyway)')
  }

  app.listen(PORT, () => {
    console.log(`\nOllama Server running at http://localhost:${PORT}`)
    console.log('\nAvailable endpoints:')
    console.log('  GET  /api/health        - Health check')
    console.log('  GET  /api/models        - List available models')
    console.log('  GET  /api/prompt-types  - List prompt types')
    console.log('  POST /api/generate      - Generate text')
    console.log('  POST /api/generate-by-stage - Generate by stage type')
    console.log('')
  })
}

start().catch(console.error)
