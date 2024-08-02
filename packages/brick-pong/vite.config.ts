import Vue from '@vitejs/plugin-vue'
import path from 'path'
import terser from '@rollup/plugin-terser'
import libAssetsPlugin from '@laynezh/vite-plugin-lib-assets'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { defineConfig } from 'vite'

const resolve = (p: string): string => path.resolve(__dirname, p)

const outputName = 'brick-pong.es.js'

export default defineConfig({
  assetsInclude: /\.(pdf|jpg|png|webm|mp4|svg|wasm)$/,
  plugins: [
    Vue(),
    libAssetsPlugin({
      limit: 1024 * 10,
      include: /\.(pdf|jpg|jpeg|png|webm|mp4|svg|ttf|woff|woff2|wasm)$/,
    }),
    cssInjectedByJsPlugin(),
  ],
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
      entry: [resolve('./src/index-export.ts')],
      name: 'brick-pong',
      fileName: () => outputName,
    },
    rollupOptions: {
      // externalize deps that shouldn't be bundled
      external: ['vue'],
      plugins: [terser()],
      output: {
        format: 'es',
        dir: 'dist',
      },
    },
  },
})
