import { defineConfig } from 'vite'
import { resolve } from 'path'
import { readFileSync } from 'fs'

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
