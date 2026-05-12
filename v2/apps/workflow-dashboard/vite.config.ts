import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src')
    }
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      // Supabase REST API proxy (avoids CORS) via Kong gateway
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