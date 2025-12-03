import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'src': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3400,
    // 0.0.0.0
    host: '0.0.0.0',
    proxy: {
      '/api': {
        // target: 'https://learn.gouhuoai.cn',
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        // 不重写路径
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/ws': {
        // target: 'https://learn.gouhuoai.cn',
        target: 'ws://127.0.0.1:8080',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
