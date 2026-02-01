import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // 상위폴더 경로 읽어오기 env
  envDir: '../',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['sogething.com', 'www.sogething.com', 'localhost', '127.0.0.1'],
    fs: {
      // 상위 디렉토리 접근 허용 (envDir: '../' 때문에 필요)
      allow: ['..']
    }
  }
})
