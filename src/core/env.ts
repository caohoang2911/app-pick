/**
 * Environment utilities and configuration
 * This file provides utilities for working with environment variables
 */

import { Env } from '~/env';
import { Environment } from '~/src/types/env';

/**
 * Get the current environment
 */
export const getCurrentEnvironment = (): Environment => {
  return Env.ENVIRONMENT;
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return Env.IS_DEVELOPMENT;
};

/**
 * Check if running in staging mode
 */
export const isStaging = (): boolean => {
  return Env.IS_STAGING;
};

/**
 * Check if running in production mode
 */
export const isProduction = (): boolean => {
  return Env.IS_PRODUCTION;
};

/**
 * Get API base URL for current environment
 */
export const getApiBaseUrl = (): string => {
  return Env.API_BASE_URL;
};

/**
 * Get app name for current environment
 */
export const getAppName = (): string => {
  return Env.APP_NAME;
};

/**
 * Get app version for current environment
 */
export const getAppVersion = (): string => {
  return Env.APP_VERSION;
};

/**
 * Check if debug mode is enabled
 */
export const isDebugMode = (): boolean => {
  return Env.DEBUG_MODE;
};

/**
 * Check if analytics is enabled
 */
export const isAnalyticsEnabled = (): boolean => {
  return Env.ENABLE_ANALYTICS;
};

/**
 * Check if crash reporting is enabled
 */
export const isCrashReportingEnabled = (): boolean => {
  return Env.ENABLE_CRASH_REPORTING;
};

/**
 * Check if debug tools are enabled
 */
export const areDebugToolsEnabled = (): boolean => {
  return Env.ENABLE_DEBUG_TOOLS;
};

/**
 * Get log level for current environment
 */
export const getLogLevel = (): 'debug' | 'info' | 'warn' | 'error' => {
  return Env.LOG_LEVEL;
};


/**
 * Log environment info (only in development)
 */
export const logEnvironmentInfo = (): void => {
  if (isDevelopment()) {
    console.log('🌍 Environment Info:', {
      environment: getCurrentEnvironment(),
      apiBaseUrl: getApiBaseUrl(),
      appName: getAppName(),
      appVersion: getAppVersion(),
      debugMode: isDebugMode(),
      analyticsEnabled: isAnalyticsEnabled(),
      crashReportingEnabled: isCrashReportingEnabled(),
      debugToolsEnabled: areDebugToolsEnabled(),
    });
  }
};
