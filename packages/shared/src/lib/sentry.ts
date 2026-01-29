import * as Sentry from '@sentry/react';

interface SentryConfig {
  dsn: string;
  environment: string;
  app: 'pos' | 'admin' | 'delivery' | 'portal' | 'marketing';
  release?: string;
}

export function initSentry(config: SentryConfig) {
  if (!config.dsn) {
    console.log('Sentry DSN not configured - error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release || `warehousepos-${config.app}@1.0.0`,
    
    // Performance Monitoring
    tracesSampleRate: config.environment === 'production' ? 0.1 : 1.0,
    
    // Session Replay (captures user interactions for error context)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Only send errors in production, log in development
    enabled: config.environment === 'production',
    
    // Filter out common non-actionable errors
    ignoreErrors: [
      // Network errors
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      'ChunkLoadError',
      // Browser extensions
      'Extension context',
      // User aborted
      'AbortError',
      'Request aborted',
      // Resize observer
      'ResizeObserver loop',
    ],
    
    // Add tags for filtering in Sentry dashboard
    initialScope: {
      tags: {
        app: config.app,
      },
    },
    
    // Capture console errors
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    
    // Before sending, add additional context
    beforeSend(event, _hint) {
      // Add user context if available
      const userStr = localStorage.getItem('warehousepos-user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          event.user = {
            id: user.id,
            email: user.email,
            username: user.full_name,
          };
          event.tags = {
            ...event.tags,
            tenant_id: user.tenant_id,
            store_id: user.store_id,
          };
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      return event;
    },
  });

  console.log(`✅ Sentry initialized for ${config.app} (${config.environment})`);
}

// Error boundary component for React
export const SentryErrorBoundary = Sentry.ErrorBoundary;

// Manual error capture
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
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
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

export { Sentry };
