import * as Sentry from '@sentry/react';
import { env } from './env';

const SENTRY_DSN = env.SENTRY_DSN;
const APP_NAME = 'pos';
const APP_VERSION = '1.0.0'; // Should match package.json version

export function initSentry() {
  if (!SENTRY_DSN) {
    // Silent in production, no console.log
    if (env.IS_DEVELOPMENT) {
      console.log('📊 Sentry DSN not configured - error monitoring disabled');
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: env.IS_PRODUCTION ? 'production' : 'development',
    release: `warehousepos-${APP_NAME}@${APP_VERSION}`,
    
    // Performance Monitoring - lower sampling in production
    tracesSampleRate: env.IS_PRODUCTION ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: env.IS_PRODUCTION ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,
    
    // Only send errors in production
    enabled: env.IS_PRODUCTION,
    
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
      'Non-Error promise rejection',
      'Load failed',
      'cancelled',
    ],
    
    // Don't send from localhost
    denyUrls: [
      /localhost/,
      /127\.0\.0\.1/,
    ],
    
    initialScope: {
      tags: {
        app: APP_NAME,
      },
    },
    
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask all text and block all media in replay
        maskAllText: true,
        blockAllMedia: true,
      }),
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
        } catch {
          // Ignore parse errors
        }
      }
      
      // Remove sensitive data
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['apikey'];
      }
      
      return event;
    },
  });
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
