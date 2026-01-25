import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // разрешает соединения с любых хостов
    allowedHosts: [
      'dev.proxy.example.com',
      'localhost',
      '127.0.0.1',
      '0.0.0.0'
    ], // список разрешенных хостов
    port: 5174,
    hmr: { overlay: true },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
      },
    },
  },
})