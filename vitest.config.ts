import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // v2 レンダラーは CSS を ?inline で文字列として取り込むため、テストでも実際の内容を処理させる
    css: { include: [/renderer-v2/] },
  },
})
