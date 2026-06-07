import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const env = loadEnv('', process.cwd(), '')

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 3003,
    proxy: {
      '/api/ai': {
        target: 'https://api.minimaxi.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ai/, ''),
        headers: {
          'Authorization': `Bearer ${env.VITE_OPENAI_API_KEY || ''}`
        }
      }
    }
  }
})