import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { fileURLToPath, URL } from 'node:url'

/**
 * npm 发包构建配置（组件库包体）：
 * - 入口：src/keditor/index.ts
 * - 产物：ES + CJS 双格式 + 类型声明由 vue-tsc 产出
 * - vue 声明为 external，不打进包体
 * 运行：npm run build:lib
 */
export default defineConfig({
  plugins: [vue(), vueJsx()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/keditor/index.ts', import.meta.url)),
      name: 'KCodeEditor',
      formats: ['es', 'cjs'],
      fileName: (format) => `k-code-editor.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
        assetFileNames: (assetInfo) => (assetInfo.name === 'style.css' ? 'k-code-editor.css' : assetInfo.name ?? ''),
      },
    },
  },
})
