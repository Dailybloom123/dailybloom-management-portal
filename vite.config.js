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
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'i18n-vendor': ['i18next', 'react-i18next']
        }
      }
    }
  },
  assetsInclude: ['**/*.svg', '**/*.json', '**/*.ico']
})
