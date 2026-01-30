/**
 * Production-ready logging utility
 * 
 * Uses Sentry for error tracking in production
 * Falls back to console in development
 */

import { captureError, captureMessage } from './sentry';

const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEV = import.meta.env.DEV;

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  /**
   * Debug level - only logs in development
   */
  debug(message: string, ...args: unknown[]): void {
    if (IS_DEV) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Info level - logs in development, sends to Sentry in production for important events
   */
  info(message: string, context?: LogContext): void {
    if (IS_DEV) {
      console.info(`[INFO] ${message}`, context || '');
    } else if (IS_PRODUCTION && context?.important) {
      captureMessage(message, 'info');
    }
  }

  /**
   * Warning level - logs in development, sends to Sentry in production
   */
  warn(message: string, context?: LogContext): void {
    if (IS_DEV) {
      console.warn(`[WARN] ${message}`, context || '');
    } else if (IS_PRODUCTION) {
      captureMessage(message, 'warning');
    }
  }

  /**
   * Error level - always logs and sends to Sentry in production
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    if (IS_DEV) {
      console.error(`[ERROR] ${message}`, error || '', context || '');
    }
    
    if (IS_PRODUCTION) {
      if (error instanceof Error) {
        captureError(error, { message, ...context });
      } else {
        captureMessage(`${message}: ${String(error)}`, 'error');
      }
    }
  }

  /**
   * Track user actions for analytics (only in production)
   */
  track(event: string, properties?: LogContext): void {
    if (IS_DEV) {
      console.log(`[TRACK] ${event}`, properties || '');
    }
    // In production, you could send to analytics service
  }

  /**
   * Performance timing
   */
  time(label: string): void {
    if (IS_DEV) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (IS_DEV) {
      console.timeEnd(label);
    }
  }
}

export const logger = new Logger();

// Named exports for convenience
export const { debug, info, warn, error, track, time, timeEnd } = logger;
