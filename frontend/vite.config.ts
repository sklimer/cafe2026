
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Define isProduction variable
const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
   server: !isProduction ? {
    allowedHosts: ['dev.proxy.example.com'], // добавьте сюда ваш хост
    host: '0.0.0.0',
    port: 5173,
    hmr: { overlay: true },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
      },
    },
  } : undefined,

})