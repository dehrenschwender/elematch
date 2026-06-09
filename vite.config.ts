import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig(({ mode }) => {
  // Vite does not load .env files into process.env when evaluating this config.
  // loadEnv with an empty prefix returns ALL vars (including the unprefixed,
  // build-time-only Sentry secrets the plugin needs).
  const env = loadEnv(mode, process.cwd(), '')
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN

  return {
    build: {
      // Phaser is one large dependency; raise the chunk-size warning threshold so a
      // normal build doesn't print a spurious warning.
      chunkSizeWarningLimit: 4000,
      // Only emit source maps when we also have credentials to upload (and then
      // delete) them. "hidden" emits .map files but strips the sourceMappingURL
      // comment so browsers won't fetch them; without a token we emit none, so a
      // plain `vite build` never leaves maps in the deployed dist.
      sourcemap: sentryAuthToken ? 'hidden' : false,
    },
    plugins: [
      // Source-map upload runs ONLY when an auth token is present (production deploy
      // CI). Without it the plugin is omitted entirely, so local builds, PR CI and
      // `vitest` are completely unaffected and still succeed.
      ...(sentryAuthToken
        ? [
            sentryVitePlugin({
              org: env.SENTRY_ORG,
              project: env.SENTRY_PROJECT,
              authToken: sentryAuthToken,
              release: env.SENTRY_RELEASE ? { name: env.SENTRY_RELEASE } : undefined,
              sourcemaps: {
                // Delete the .map files from dist after upload so they're never
                // served by the Cloudflare Worker (it serves everything in dist).
                filesToDeleteAfterUpload: ['./dist/**/*.map'],
              },
            }),
          ]
        : []),
    ],
    // Vitest configuration (shares this Vite config).
    test: {
      environment: 'node',
      include: ['test/**/*.test.ts'],
      setupFiles: ['./test/setup.ts'],
    },
  }
})
