import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const APP_NAME = 'portal';
const ENVIRONMENT = import.meta.env.MODE;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.log('📊 Sentry DSN not configured - error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: `warehousepos-${APP_NAME}@1.0.0`,
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enabled: ENVIRONMENT === 'production',
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      'ChunkLoadError',
      'Extension context',
      'AbortError',
      'Request aborted',
      'ResizeObserver loop',
    ],
    initialScope: { tags: { app: APP_NAME } },
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    beforeSend(event) {
      const storeSlug = window.location.hostname.split('.')[0];
      event.tags = { ...event.tags, store_slug: storeSlug };
      return event;
    },
  });

  console.log(`✅ Sentry initialized for ${APP_NAME} (${ENVIRONMENT})`);
}

export const SentryErrorBoundary = Sentry.ErrorBoundary;
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
}
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}
export { Sentry };
