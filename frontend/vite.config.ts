import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // no ambiente de dev o front roda na 5173 e o back na 3000,
    // esse proxy evita problemas de CORS/URL absoluta nas chamadas fetch("/api/...")
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
