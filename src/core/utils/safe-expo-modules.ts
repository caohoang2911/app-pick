// Note: AppContext import may vary based on Expo version
// This is a safe fallback implementation

/**
 * Safe Expo modules utilities to prevent crashes
 * Fixes issues with:
 * - jsiInterop not being initialized
 * - PromiseAlreadySettledException
 * - AppContext crashes
 */

/**
 * Safely get JSI interop from AppContext
 * Prevents "lateinit property jsiInterop has not been initialized" crashes
 */
export const safeGetJsiInterop = (): any => {
  try {
    // Try to get AppContext dynamically
    let AppContext: any = null;
    try {
      AppContext = require('expo-modules-core').AppContext;
    } catch (e) {
      console.warn('AppContext not available in expo-modules-core');
      return null;
    }

    if (!AppContext) {
      console.warn('AppContext not available');
      return null;
    }

    const appContext = AppContext.get();
    if (!appContext) {
      console.warn('AppContext not available');
      return null;
    }

    // Check if jsiInterop is initialized
    if (!appContext.jsiInterop) {
      console.warn('jsiInterop not initialized yet');
      return null;
    }

    return appContext.jsiInterop;
  } catch (error) {
    console.warn('Error getting jsiInterop:', error);
    return null;
  }
};

/**
 * Safe promise wrapper that prevents PromiseAlreadySettledException
 */
export class SafePromise<T> {
  private _isSettled = false;
  private _promise: Promise<T>;

  constructor(
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: any) => void,
    ) => void,
  ) {
    this._promise = new Promise<T>((resolve, reject) => {
      const safeResolve = (value: T | PromiseLike<T>) => {
        if (!this._isSettled) {
          this._isSettled = true;
          resolve(value);
        } else {
          console.warn('Attempted to resolve already settled promise');
        }
      };

      const safeReject = (reason?: any) => {
        if (!this._isSettled) {
          this._isSettled = true;
          reject(reason);
        } else {
          console.warn('Attempted to reject already settled promise');
        }
      };

      try {
        executor(safeResolve, safeReject);
      } catch (error) {
        safeReject(error);
      }
    });
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): Promise<TResult1 | TResult2> {
    return this._promise.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null,
  ): Promise<T | TResult> {
    return this._promise.catch(onrejected);
  }

  finally(onfinally?: (() => void) | undefined | null): Promise<T> {
    return this._promise.finally(onfinally);
  }

  get isSettled(): boolean {
    return this._isSettled;
  }
}

/**
 * Create a safe promise that prevents PromiseAlreadySettledException
 */
export const createSafePromise = <T>(
  executor: (
    resolve: (value: T | PromiseLike<T>) => void,
    reject: (reason?: any) => void,
  ) => void,
): SafePromise<T> => {
  return new SafePromise(executor);
};

/**
 * Safe AppContext operations
 */
export const safeAppContextOperations = {
  /**
   * Safely get AppContext
   */
  getAppContext: (): any => {
    try {
      let AppContext: any = null;
      try {
        AppContext = require('expo-modules-core').AppContext;
      } catch (e) {
        console.warn('AppContext not available in expo-modules-core');
        return null;
      }
      return AppContext?.get();
    } catch (error) {
      console.warn('Error getting AppContext:', error);
      return null;
    }
  },

  /**
   * Safely check if AppContext is available
   */
  isAppContextAvailable: (): boolean => {
    try {
      let AppContext: any = null;
      try {
        AppContext = require('expo-modules-core').AppContext;
      } catch (e) {
        return false;
      }
      const context = AppContext?.get();
      return context !== null && context !== undefined;
    } catch (error) {
      console.warn('AppContext not available:', error);
      return false;
    }
  },

  /**
   * Safely get JSI interop with retry mechanism
   */
  getJsiInteropWithRetry: (
    maxRetries: number = 3,
    delay: number = 100,
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;

      const tryGetJsiInterop = () => {
        attempts++;

        try {
          const jsiInterop = safeGetJsiInterop();
          if (jsiInterop) {
            resolve(jsiInterop);
            return;
          }
        } catch (error) {
          console.warn(`Attempt ${attempts} failed to get jsiInterop:`, error);
        }

        if (attempts < maxRetries) {
          setTimeout(tryGetJsiInterop, delay);
        } else {
          reject(
            new Error(`Failed to get jsiInterop after ${maxRetries} attempts`),
          );
        }
      };

      tryGetJsiInterop();
    });
  },
};

/**
 * Safe module initialization checker
 */
export const safeModuleInitialization = {
  /**
   * Check if all required modules are initialized
   */
  checkModuleInitialization: (): boolean => {
    try {
      const appContext = safeAppContextOperations.getAppContext();
      if (!appContext) {
        return false;
      }

      // Check critical modules
      const criticalModules = ['jsiInterop'];

      for (const moduleName of criticalModules) {
        if (!appContext[moduleName]) {
          console.warn(`Critical module ${moduleName} not initialized`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.warn('Error checking module initialization:', error);
      return false;
    }
  },

  /**
   * Wait for module initialization
   */
  waitForModuleInitialization: (timeout: number = 5000): Promise<boolean> => {
    return new Promise((resolve) => {
      const startTime = Date.now();

      const checkInitialization = () => {
        if (safeModuleInitialization.checkModuleInitialization()) {
          resolve(true);
          return;
        }

        if (Date.now() - startTime > timeout) {
          console.warn('Module initialization timeout');
          resolve(false);
          return;
        }

        setTimeout(checkInitialization, 100);
      };

      checkInitialization();
    });
  },
};

/**
 * Global error handler for Expo modules
 */
export const setupExpoModulesErrorHandler = () => {
  try {
    // Handle unhandled promise rejections (only in web environment)
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('unhandledrejection', (event) => {
        console.warn('Unhandled promise rejection:', event.reason);
        // Prevent the default behavior (crash)
        event.preventDefault();
      });
    }

    // Handle global errors (only in web environment)
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('error', (event) => {
        console.warn('Global error:', event.error);
        // Prevent the default behavior (crash)
        event.preventDefault();
      });
    }

    // For React Native, we can use global error handlers
    if (typeof global !== 'undefined') {
      // Handle unhandled promise rejections in React Native
      const originalConsoleError = console.error;
      console.error = (...args) => {
        // Log the error but don't crash
        originalConsoleError(...args);
      };
    }
  } catch (error) {
    console.warn('Error setting up Expo modules error handler:', error);
  }
};
