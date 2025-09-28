/*
 * Environment configuration for different environments
 * This file manages environment variables for dev and production
 * If you import `Env` from `@env`, this is the file that will be loaded.
 */

import Constants from 'expo-constants';

// Get environment from app.config.ts extra field
const getEnvironmentFromConfig = (): 'dev' | 'prod' => {
  const extra = Constants.expoConfig?.extra;
  return (extra?.env || 'dev') as 'dev' | 'prod';
};

const environment = getEnvironmentFromConfig();

// Environment configurations
const configs = {
  dev: {
    API_BASE_URL: 'https://oms-api-dev.seedcom.vn/',
    API_TIMEOUT: 30000,
    APP_NAME: 'App Pick Dev',
    APP_VERSION: '1.0.0-dev',
    DEBUG_MODE: true,
    LOG_LEVEL: 'debug',
    ENABLE_ANALYTICS: false,
    ENABLE_CRASH_REPORTING: false,
    ENABLE_DEBUG_TOOLS: true,
  },
  prod: {
    API_BASE_URL: 'https://oms-api.seedcom.vn/',
    API_TIMEOUT: 30000,
    APP_NAME: 'App Pick',
    APP_VERSION: '1.0.0',
    DEBUG_MODE: false,
    LOG_LEVEL: 'error',
    ENABLE_ANALYTICS: true,
    ENABLE_CRASH_REPORTING: true,
    ENABLE_DEBUG_TOOLS: false,
  }
};

const currentConfig = configs[environment as keyof typeof configs] || configs.dev;

/**
 * Environment configuration object
 */
export const Env = {
  ENVIRONMENT: environment === 'prod' ? 'production' : 'development',
  IS_DEVELOPMENT: environment !== 'prod',
  IS_STAGING: false,
  IS_PRODUCTION: environment === 'prod',
  API_BASE_URL: currentConfig.API_BASE_URL,
  API_TIMEOUT: currentConfig.API_TIMEOUT,
  APP_NAME: currentConfig.APP_NAME,
  APP_VERSION: currentConfig.APP_VERSION,
  DEBUG_MODE: currentConfig.DEBUG_MODE,
  LOG_LEVEL: currentConfig.LOG_LEVEL,
  ENABLE_ANALYTICS: currentConfig.ENABLE_ANALYTICS,
  ENABLE_CRASH_REPORTING: currentConfig.ENABLE_CRASH_REPORTING,
  ENABLE_DEBUG_TOOLS: currentConfig.ENABLE_DEBUG_TOOLS,
};