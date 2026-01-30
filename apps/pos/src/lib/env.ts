/**
 * Environment Configuration & Validation
 * 
 * Validates required environment variables at startup
 * Provides typed access to environment configuration
 */

// Environment types
interface EnvConfig {
  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  
  // App URLs (optional in dev)
  APP_URL?: string;
  
  // Sentry (optional)
  SENTRY_DSN?: string;
  
  // Feature flags
  IS_PRODUCTION: boolean;
  IS_DEVELOPMENT: boolean;
}

// Required variables that must be present
const REQUIRED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

// Validation errors collector
const validationErrors: string[] = [];

/**
 * Validate that all required environment variables are present
 */
function validateRequiredVars(): void {
  for (const varName of REQUIRED_VARS) {
    const value = import.meta.env[varName];
    if (!value || value === 'undefined' || value === '') {
      validationErrors.push(`Missing required environment variable: ${varName}`);
    }
  }
}

/**
 * Validate URL format
 */
function validateUrl(url: string, varName: string): void {
  if (!url) return;
  try {
    new URL(url);
  } catch {
    validationErrors.push(`Invalid URL format for ${varName}: ${url}`);
  }
}

// Run validations
validateRequiredVars();
validateUrl(import.meta.env.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL');

// Log validation errors in development
if (validationErrors.length > 0) {
  const errorMessage = `Environment validation failed:\n${validationErrors.map(e => `  - ${e}`).join('\n')}`;
  
  if (import.meta.env.PROD) {
    // In production, throw error to prevent app from running with missing config
    throw new Error(errorMessage);
  } else {
    // In development, log warning
    console.error('⚠️', errorMessage);
  }
}

/**
 * Typed environment configuration
 */
export const env: EnvConfig = {
  // Supabase
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  
  // App URLs
  APP_URL: import.meta.env.VITE_APP_URL,
  
  // Sentry
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  
  // Feature flags
  IS_PRODUCTION: import.meta.env.PROD,
  IS_DEVELOPMENT: import.meta.env.DEV,
};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: 'sentry' | 'pwa' | 'offline'): boolean {
  switch (feature) {
    case 'sentry':
      return !!env.SENTRY_DSN && env.IS_PRODUCTION;
    case 'pwa':
      return env.IS_PRODUCTION;
    case 'offline':
      return true; // Always enabled
    default:
      return false;
  }
}

/**
 * Get the appropriate API URL based on environment
 */
export function getApiUrl(): string {
  return env.SUPABASE_URL;
}

// Export validation status
export const isValidEnv = validationErrors.length === 0;
export const envErrors = validationErrors;
