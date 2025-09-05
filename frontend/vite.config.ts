import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    UnoCSS(),
    react(),
  ],
  server: {
    host: '0.0.0.0', // 允许外部访问
    port: 5173,
    strictPort: true,
    proxy: {
      // 代理所有API请求到后端
      '/api': {
        target: 'http://localhost:5250',
        changeOrigin: true,
        secure: false,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }
    }
  },
  preview: {
    host: '0.0.0.0', // 预览模式也允许外部访问
    port: 4173,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // 生产环境不生成sourcemap
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['echarts', 'echarts-for-react'],
          carbon: ['@carbon/react', '@carbon/icons-react']
        }
      }
    }
  }
})
