import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/extension.ts'),
      name: 'SynthoraExtension',
      fileName: 'extension',
      formats: ['cjs']
    },
    rollupOptions: {
      external: ['kiro'],
      output: {
        globals: {
          kiro: 'kiro'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})