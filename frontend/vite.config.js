// frontend/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  define: {
    'global': 'globalThis',
  },

  optimizeDeps: {
    exclude: ['mapbox-gl'],
    esbuildOptions: {
      target: 'esnext',
      define: {
        global: 'globalThis'
      }
    }
  },

  ssr: {
    noExternal: ['react-map-gl']
  }
})