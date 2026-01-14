import crashlytics from '@react-native-firebase/crashlytics';
import { isDevelopment } from '../env';

/**
 * Crashlytics utility for error reporting
 * Wraps Firebase Crashlytics với error handling
 */

export const CrashlyticsService = {
  /**
   * Log non-fatal error to Crashlytics
   */
  recordError: (error: Error, context?: string) => {
    try {
      if (isDevelopment()) {
        console.warn('[Crashlytics] Error:', context, error);
        return;
      }

      if (context) {
        crashlytics().log(`Context: ${context}`);
      }

      crashlytics().recordError(error);
    } catch (e) {
      console.warn('[Crashlytics] Failed to record error:', e);
    }
  },

  /**
   * Set user identifier
   */
  setUserId: (userId: string) => {
    try {
      if (isDevelopment()) {
        console.log('[Crashlytics] Set user ID:', userId);
        return;
      }

      crashlytics().setUserId(userId);
    } catch (e) {
      console.warn('[Crashlytics] Failed to set user ID:', e);
    }
  },

  /**
   * Set custom attribute
   */
  setAttribute: (key: string, value: string) => {
    try {
      if (isDevelopment()) {
        console.log(`[Crashlytics] Set attribute: ${key}=${value}`);
        return;
      }

      crashlytics().setAttribute(key, value);
    } catch (e) {
      console.warn('[Crashlytics] Failed to set attribute:', e);
    }
  },

  /**
   * Log custom message
   */
  log: (message: string) => {
    try {
      if (isDevelopment()) {
        console.log('[Crashlytics] Log:', message);
        return;
      }

      crashlytics().log(message);
    } catch (e) {
      console.warn('[Crashlytics] Failed to log message:', e);
    }
  },

  /**
   * Set crash collection enabled/disabled
   */
  setCrashlyticsCollectionEnabled: (enabled: boolean) => {
    try {
      crashlytics().setCrashlyticsCollectionEnabled(enabled);
    } catch (e) {
      console.warn('[Crashlytics] Failed to set collection enabled:', e);
    }
  },

  /**
   * Check if crash collection is enabled
   */
  isCrashlyticsCollectionEnabled: async (): Promise<boolean> => {
    try {
      // Note: isCrashlyticsCollectionEnabled is a property, not a method
      return crashlytics().isCrashlyticsCollectionEnabled;
    } catch (e) {
      console.warn('[Crashlytics] Failed to check collection enabled:', e);
      return false;
    }
  },

  /**
   * Send unhandled exception crash (use sparingly)
   */
  crash: () => {
    try {
      if (!isDevelopment()) {
        crashlytics().crash();
      } else {
        console.warn('[Crashlytics] Crash called in development mode');
      }
    } catch (e) {
      console.warn('[Crashlytics] Failed to crash:', e);
    }
  },
};

/**
 * Safe wrapper for try-catch with automatic Crashlytics reporting
 */
export const withCrashlytics = async <T>(
  fn: () => Promise<T> | T,
  context?: string,
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    CrashlyticsService.recordError(err, context);
    console.error(`Error in ${context}:`, error);
    return null;
  }
};

/**
 * Safe null/undefined check with Crashlytics reporting
 */
export const assertNotNull = <T>(
  value: T | null | undefined,
  errorMessage: string,
  context?: string,
): T => {
  if (value === null || value === undefined) {
    const error = new Error(errorMessage);
    CrashlyticsService.recordError(error, context);
    throw error;
  }
  return value;
};

export default CrashlyticsService;
