import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // El mapa y las gráficas pesan; subimos el límite del aviso de tamaño.
    chunkSizeWarningLimit: 1000,
  },
})
