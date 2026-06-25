/*
 * Environment configuration for different environments
 * This file manages environment variables for dev and production
 * If you import `Env` from `@env`, this is the file that will be loaded.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get environment from app.config.ts extra field
const getEnvironmentFromConfig = (): 'dev' | 'prod' => {
  const extra = Constants.expoConfig?.extra;
  return (extra?.env || 'dev') as 'dev' | 'prod';
};

const environment = getEnvironmentFromConfig();

type NativeGithubDefaults = { ios: boolean; android: boolean };

/**
 * `EXPO_PUBLIC_NATIVE_GITHUB_UPDATE` ghi đè cả iOS + Android.
 * `EXPO_PUBLIC_NATIVE_GITHUB_UPDATE_IOS` / `_ANDROID` ghi đè từng nền (khi global không set).
 */
function resolveNativeGithubUpdates(defaults: NativeGithubDefaults): {
  ios: boolean;
  android: boolean;
} {
  const global =
    process.env.EXPO_PUBLIC_NATIVE_GITHUB_UPDATE?.trim().toLowerCase();
  if (global === 'false' || global === '0' || global === 'off') {
    return { ios: false, android: false };
  }
  if (global === 'true' || global === '1' || global === 'on') {
    return { ios: true, android: true };
  }

  let ios = defaults.ios;
  let android = defaults.android;

  const iosEnv =
    process.env.EXPO_PUBLIC_NATIVE_GITHUB_UPDATE_IOS?.trim().toLowerCase();
  if (iosEnv === 'false' || iosEnv === '0' || iosEnv === 'off') {
    ios = false;
  }
  if (iosEnv === 'true' || iosEnv === '1' || iosEnv === 'on') {
    ios = true;
  }

  const androidEnv =
    process.env.EXPO_PUBLIC_NATIVE_GITHUB_UPDATE_ANDROID?.trim().toLowerCase();
  if (androidEnv === 'false' || androidEnv === '0' || androidEnv === 'off') {
    android = false;
  }
  if (androidEnv === 'true' || androidEnv === '1' || androidEnv === 'on') {
    android = true;
  }

  return { ios, android };
}

// Environment configurations
const configs = {
  dev: {
    API_BASE_URL: 'https://oms-api-dev.seedcom.vn/',
    INVOICE_API_URL: 'https://oms-api-dev.seedcom.vn/share/getInvoiceImage',
    API_TIMEOUT: 30000,
    APP_NAME: 'App Pick Dev',
    APP_VERSION: '1.0.0-dev',
    DEBUG_MODE: true,
    LOG_LEVEL: 'debug',
    ENABLE_ANALYTICS: false,
    ENABLE_CRASH_REPORTING: false,
    ENABLE_DEBUG_TOOLS: true,
    /** Check/tải bản native qua GitHub — tách theo nền (ghi đè bằng EXPO_PUBLIC_*). */
    NATIVE_GITHUB_UPDATE_IOS: true,
    NATIVE_GITHUB_UPDATE_ANDROID: false,
  },
  prod: {
    API_BASE_URL: 'https://oms-api.seedcom.vn/',
    INVOICE_API_URL: 'https://oms-api.seedcom.vn/share/getInvoiceImage',
    API_TIMEOUT: 30000,
    APP_NAME: 'App Pick',
    APP_VERSION: '1.0.0',
    DEBUG_MODE: false,
    LOG_LEVEL: 'error',
    ENABLE_ANALYTICS: true,
    ENABLE_CRASH_REPORTING: true,
    ENABLE_DEBUG_TOOLS: false,
    NATIVE_GITHUB_UPDATE_IOS: true,
    NATIVE_GITHUB_UPDATE_ANDROID: false,
  },
};

const currentConfig =
  configs[environment as keyof typeof configs] || configs.dev;

const nativeGithubResolved = resolveNativeGithubUpdates({
  ios: currentConfig.NATIVE_GITHUB_UPDATE_IOS,
  android: currentConfig.NATIVE_GITHUB_UPDATE_ANDROID,
});

/**
 * Environment configuration object
 */
export const Env = {
  ENVIRONMENT: environment === 'prod' ? 'production' : 'development',
  IS_DEVELOPMENT: environment !== 'prod',
  IS_STAGING: false,
  IS_PRODUCTION: environment === 'prod',
  API_BASE_URL: currentConfig.API_BASE_URL,
  INVOICE_API_URL: currentConfig.INVOICE_API_URL,
  API_TIMEOUT: currentConfig.API_TIMEOUT,
  APP_NAME: currentConfig.APP_NAME,
  APP_VERSION: currentConfig.APP_VERSION,
  DEBUG_MODE: currentConfig.DEBUG_MODE,
  LOG_LEVEL: currentConfig.LOG_LEVEL,
  ENABLE_ANALYTICS: currentConfig.ENABLE_ANALYTICS,
  ENABLE_CRASH_REPORTING: currentConfig.ENABLE_CRASH_REPORTING,
  ENABLE_DEBUG_TOOLS: currentConfig.ENABLE_DEBUG_TOOLS,
  NATIVE_GITHUB_UPDATE_IOS: nativeGithubResolved.ios,
  NATIVE_GITHUB_UPDATE_ANDROID: nativeGithubResolved.android,
  /** Theo Platform hiện tại; dùng chung cho hook auto-update. */
  NATIVE_GITHUB_UPDATE:
    Platform.OS === 'ios'
      ? nativeGithubResolved.ios
      : Platform.OS === 'android'
        ? nativeGithubResolved.android
        : false,
};
