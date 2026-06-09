import * as Sentry from '@sentry/browser'

// The DSN is a VITE_-prefixed (public) value: it is safe to ship in the client
// bundle. When it is unset — e.g. local dev, or a build without Sentry configured —
// we skip init entirely so the SDK adds zero runtime overhead and never attempts to
// send events. See .env.example for the full set of Sentry variables.
const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

if (dsn) {
  Sentry.init({
    dsn,
    // Tie events to a build so the source maps uploaded by @sentry/vite-plugin (which
    // uses the same release name) resolve the minified production stack traces.
    release: import.meta.env.VITE_SENTRY_RELEASE as string | undefined,
    environment: import.meta.env.MODE,
    // Stream the game's console output to Sentry as structured logs.
    enableLogs: true,
    integrations: [
      // Forward every console.* call (log/info/warn/error/debug/trace/assert) to
      // Sentry's Logs. Merged with the default integrations (which include
      // globalHandlers), so uncaught errors and rejections are still captured.
      Sentry.consoleLoggingIntegration(),
      // Also surface console.error as a Sentry issue (not just a log), so every
      // error — thrown OR explicitly logged — reaches Sentry as an event.
      Sentry.captureConsoleIntegration({ levels: ['error'] }),
    ],
    // Tracing and Session Replay are intentionally left off (no tracesSampleRate /
    // replay integration) to keep the footprint minimal for a game.
  })
}
