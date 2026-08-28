import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// API 直连 http://localhost:5173/admin（见 src/api/http.ts），跨域由 API 的 HttpHeaders 中间件处理
export default defineConfig({
  plugins: [vue()],
  base: '/backend/',
})
