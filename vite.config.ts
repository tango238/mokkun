import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// v2 の CSS（DADS + v2）を dist/mokkun-v2.css として出す。
// src/renderer-v2/styles.ts が ?inline で取り込む CSS（@import 解決・圧縮済み）をそのまま集めるので、
// MOKKUN_V2_CSS と同じ中身になる（DADS の CSS は要素セレクタを含むため mokkun.css には入れない）。
function emitV2Css(): Plugin {
  const inlined = new Map<string, string>()
  return {
    name: 'mokkun-emit-v2-css',
    enforce: 'post',
    transform(code: string, id: string) {
      if (!/renderer-v2\/(dads|mokkun-v2)\.css\?.*inline/.test(id)) return null
      const m = /^export default (".*")\s*;?\s*$/s.exec(code)
      if (m) inlined.set(id.includes('/dads.css') ? 'dads' : 'v2', JSON.parse(m[1]) as string)
      return null
    },
    generateBundle() {
      const dads = inlined.get('dads')
      const v2 = inlined.get('v2')
      if (dads === undefined || v2 === undefined) throw new Error('[mokkun] v2 の CSS を取得できませんでした')
      this.emitFile({ type: 'asset', fileName: 'mokkun-v2.css', source: `${dads}\n${v2}` })
    },
  }
}

// Read version from package.json
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig(({ mode }) => {
  const isLibraryBuild = mode === 'library'

  // Base configuration (shared between SPA and library builds)
  const baseConfig = {
    root: '.',
    publicDir: 'public',
    server: {
      port: 3000,
      open: false,
    },
    define: {
      __VERSION__: JSON.stringify(pkg.version),
    },
  }

  if (isLibraryBuild) {
    // Library build configuration
    return {
      ...baseConfig,
      plugins: [emitV2Css()],
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        lib: {
          entry: resolve(__dirname, 'src/lib.ts'),
          name: 'Mokkun',
          formats: ['umd', 'es'] as const,
          fileName: (format: string) => (format === 'umd' ? 'mokkun.js' : 'mokkun.esm.js'),
        },
        rollupOptions: {
          // No external dependencies - bundle everything including js-yaml
          external: [],
          output: {
            globals: {},
            // Use named exports only to avoid consumer confusion
            exports: 'named' as const,
            // Ensure CSS is extracted with proper name
            assetFileNames: (assetInfo: { name?: string }) =>
              assetInfo.name === 'style.css' ? 'mokkun.css' : assetInfo.name ?? 'asset',
          },
        },
        // Generate sourcemaps for debugging
        sourcemap: true,
        // Minify for production
        minify: 'esbuild' as const,
        // CSS handling - extract to separate file
        cssCodeSplit: false,
      },
    }
  }

  // Default SPA build configuration (preserves existing behavior)
  return {
    ...baseConfig,
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  }
})
