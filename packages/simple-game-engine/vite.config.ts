import path from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const resolve = (p: string): string => path.resolve(__dirname, p)

const outputName = 'simple-game-engine.es.js'

export default defineConfig({
  assetsInclude: /\.(pdf|jpg|png|webm|mp4|svg|wasm)$/,
  plugins: [dts({ rollupTypes: true })],
  worker: {
    format: 'es',
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: true,
    lib: {
      formats: ['es'],
      entry: [resolve('./src/index.ts')],
      name: '@sampullman/simple-game-engine',
      fileName: () => outputName,
    },
    rollupOptions: {
      // externalize deps that shouldn't be bundled
      external: [],
      output: {
        format: 'es',
        dir: 'dist',
      },
    },
  },
})
