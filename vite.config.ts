import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    // Phaser is one large dependency; raise the chunk-size warning threshold so a
    // normal build doesn't print a spurious warning.
    chunkSizeWarningLimit: 4000,
  },
  // Vitest configuration (shares this Vite config).
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
  },
})
