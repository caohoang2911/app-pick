/**
 * Type definitions for environment variables
 */

export type Environment = 'development' | 'production';

export interface ClientEnv {
  // Environment info
  ENVIRONMENT: Environment;
  IS_DEVELOPMENT: boolean;
  IS_STAGING: boolean;
  IS_PRODUCTION: boolean;
  
  // API Configuration
  API_BASE_URL: string;
  API_TIMEOUT: number;
  
  // App Configuration
  APP_NAME: string;
  APP_VERSION: string;
  DEBUG_MODE: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  
  // Firebase
  FIREBASE_PROJECT_ID: string;
  
  // Feature Flags
  ENABLE_ANALYTICS: boolean;
  ENABLE_CRASH_REPORTING: boolean;
  ENABLE_DEBUG_TOOLS: boolean;
  
  // Third-party services
  SENTRY_DSN: string;
  GOOGLE_ANALYTICS_ID: string;
}

export interface EnvironmentConfig {
  API_BASE_URL: string;
  API_TIMEOUT: number;
  APP_NAME: string;
  APP_VERSION: string;
  DEBUG_MODE: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  FIREBASE_PROJECT_ID: string;
  ENABLE_ANALYTICS: boolean;
  ENABLE_CRASH_REPORTING: boolean;
  ENABLE_DEBUG_TOOLS: boolean;
  SENTRY_DSN: string;
  GOOGLE_ANALYTICS_ID: string;
}
