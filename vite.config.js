import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: true
  },
  preview: {
    allowedHosts: [
      'dailybloom-management-portal.onrender.com',
      '.onrender.com'
    ]
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
