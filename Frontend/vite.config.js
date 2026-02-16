import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-redux'],
          'socket.io-client': ['socket.io-client']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['socket.io-client', 'react', 'react-dom', 'react-redux'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  ssr: {
    noExternal: ['socket.io-client']
  },
  define: {
    global: 'globalThis'
  }
})