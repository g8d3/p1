import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), dts()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'BrowserWalletCrud',
      fileName: 'index'
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'ethers', 'idb', 'crypto-js'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          ethers: 'ethers',
          idb: 'idb',
          'crypto-js': 'CryptoJS'
        }
      }
    }
  }
})