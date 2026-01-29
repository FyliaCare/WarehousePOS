import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const APP_NAME = 'pos';
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
    
    // Performance Monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Only send errors in production
    enabled: ENVIRONMENT === 'production',
    
    // Filter out common non-actionable errors
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
    
    initialScope: {
      tags: {
        app: APP_NAME,
      },
    },
    
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    
    beforeSend(event) {
      // Add user context from localStorage
      const userStr = localStorage.getItem('warehousepos-auth');
      if (userStr) {
        try {
          const auth = JSON.parse(userStr);
          if (auth.state?.user) {
            event.user = {
              id: auth.state.user.id,
              email: auth.state.user.email,
              username: auth.state.user.full_name,
            };
            event.tags = {
              ...event.tags,
              tenant_id: auth.state.user.tenant_id,
              store_id: auth.state.user.store_id,
            };
          }
        } catch (e) {}
      }
      return event;
    },
  });

  console.log(`✅ Sentry initialized for ${APP_NAME} (${ENVIRONMENT})`);
}

// Error boundary component
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Manual error capture
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
}

// Manual message capture
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}

// Set user context (call after login)
export function setUser(user: { id: string; email?: string; name?: string; tenant_id?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
  if (user.tenant_id) {
    Sentry.setTag('tenant_id', user.tenant_id);
  }
}

// Clear user context (call after logout)
export function clearUser() {
  Sentry.setUser(null);
}

// Add breadcrumb for debugging
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({ message, category, data, level: 'info' });
}

export { Sentry };
