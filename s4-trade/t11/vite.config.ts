import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills({ include: ['buffer'], globals: { Buffer: true } })],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@okxweb3/coin-ethereum', '@okxweb3/crypto-lib', 'buffer'],
  },
})