import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      external: [], // Empty array - koi module external nahi
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-redux'],
          socket: ['socket.io-client']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['socket.io-client'] 
  }
})