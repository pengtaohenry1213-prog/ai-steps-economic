import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'
import JSZip from 'jszip'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'save-project-middleware',
      configureServer(server) {
        server.middlewares.use(async (req: any, res: any, next: any) => {
          if (req.url === '/api/save-project') {
            try {
              const chunks: Buffer[] = []
              for await (const chunk of req) {
                chunks.push(chunk)
              }
              const body = JSON.parse(Buffer.concat(chunks).toString())
              const { files } = body as { files: Array<{ path: string; content: string }> }

              if (!files || !Array.isArray(files)) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Invalid files data' }))
                return
              }

              const targetPath = '/Users/taopeng/workspace/AI_2026/ai-steps-economic/v2/dev'
              // Determine project name from first file path (e.g., "my-project/package.json" -> "my-project")
              const projectName = files.length > 0 ? files[0].path.split('/')[0] : 'project'
              const projectCursorDir = '/Users/taopeng/workspace/AI_2026/ai-steps-economic/.cursor'

              // Read .cursor rules from project directory
              function readCursorRules(dirPath: string, basePath: string = ''): Array<{ path: string; content: string }> {
                const rules: Array<{ path: string; content: string }> = []
                if (!fs.existsSync(dirPath)) return rules

                const entries = fs.readdirSync(dirPath, { withFileTypes: true })
                for (const entry of entries) {
                  const fullPath = path.join(dirPath, entry.name)
                  const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name

                  if (entry.isDirectory()) {
                    rules.push(...readCursorRules(fullPath, relativePath))
                  } else if (entry.isFile()) {
                    // Copy all rule files and prompts
                    if (entry.name.endsWith('.mdc') || entry.name.endsWith('.md') || entry.name === 'settings.json' || basePath === 'prompts') {
                      const content = fs.readFileSync(fullPath, 'utf-8')
                      rules.push({ path: `${projectName}/.cursor/${relativePath}`, content })
                    }
                  }
                }
                return rules
              }

              const cursorRules = readCursorRules(projectCursorDir)

              const zip = new JSZip()
              for (const file of files) {
                zip.file(file.path, file.content)
              }
              // Add .cursor rules to zip
              for (const rule of cursorRules) {
                zip.file(rule.path, rule.content)
              }

              const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
              // Determine top-level folder name from zip entries (not file paths, which may have duplicates)
              const zipLoader = new JSZip()
              const loadedZip = await zipLoader.loadAsync(zipBuffer)
              const topLevelFolder = Object.keys(loadedZip.files)[0]?.split('/')[0] || 'project'
              const zipPath = path.join(targetPath, `${topLevelFolder}.zip`)
              const extractPath = path.join(targetPath, topLevelFolder)

              fs.writeFileSync(zipPath, zipBuffer)

              if (!fs.existsSync(extractPath)) {
                fs.mkdirSync(extractPath, { recursive: true })
              }

              // Extract: use projectName as the top-level folder name
              for (const [filename, file] of Object.entries(loadedZip.files)) {
                if (!file.dir) {
                  // Remove the project name from the path to get relative path
                  const relativePath = filename.replace(new RegExp(`^${projectName}/`), '')
                  if (!relativePath) continue // Skip if it's the project folder itself
                  const filePath = path.join(extractPath, relativePath)
                  const fileDir = path.dirname(filePath)
                  if (!fs.existsSync(fileDir)) {
                    fs.mkdirSync(fileDir, { recursive: true })
                  }
                  const content = await file.async('string')
                  fs.writeFileSync(filePath, content)
                }
              }

              res.statusCode = 200
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, zipPath, extractPath }))
            } catch (err: any) {
              console.error('Save project error:', err)
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err.message }))
            }
          } else {
            next()
          }
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src')
    }
  },
  server: {
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/rest/v1': {
        target: 'http://127.0.0.1:54321',
        changeOrigin: true
      },
      '/auth/v1': {
        target: 'http://127.0.0.1:54321',
        changeOrigin: true
      },
      '/storage/v1': {
        target: 'http://127.0.0.1:54321',
        changeOrigin: true
      }
    }
  }
})