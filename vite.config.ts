import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        acr: resolve(__dirname, 'ACR.html'),
        nda: resolve(__dirname, 'nda.html'),
      },
    },
  },
})
