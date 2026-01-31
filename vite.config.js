import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 搬到 Vercel/Netlify 時，這行要移除，或是改成 base: '/'
  // base: '/studio0808/',  <-- 這一行刪掉或是註解起來
})