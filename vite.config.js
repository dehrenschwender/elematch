import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // Phaser is one large dependency; raise the chunk-size warning threshold so a
    // normal build doesn't print a spurious warning.
    chunkSizeWarningLimit: 4000,
  },
  // Vitest configuration (shares this Vite config).
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    setupFiles: ['./test/setup.js'],
  },
})
