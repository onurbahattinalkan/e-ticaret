import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Docker: container'ı tüm arayüzlere bağla; host makineden erişim için zorunlu.
    host: '0.0.0.0',
    watch: {
      // Windows Docker Desktop'ta inotify çalışmaz.
      // VITE_USE_POLLING=true ile polling devreye girer.
      usePolling: process.env.VITE_USE_POLLING === 'true',
    },
    hmr: {
      // HMR WebSocket'i tarayıcının bağlandığı host üzerinden kurar.
      // Container'ın iç IP'si yerine 'localhost' kullanılır.
      host: 'localhost',
    },
  },
})
