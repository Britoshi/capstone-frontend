import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:7002',   // your ASP.NET API
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')  // <— strip "/api"
      }
    }
  }
})
