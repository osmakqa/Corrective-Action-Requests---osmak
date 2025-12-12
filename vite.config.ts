
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.GOOGLE_SHEETS_WEBHOOK_URL': JSON.stringify(env.GOOGLE_SHEETS_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbygmUwgizSYFg-DXQU_0KsxjK-CGkj0py0lKUsEd-NylXV_0JTa2qdFWSg_NpBfXX5H/exec')
    },
    build: {
      outDir: 'dist',
    }
  }
})