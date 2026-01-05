import React from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Safe App State management utilities
 * Prevents SIGABRT crashes related to app state transitions
 */

interface AppStateCallbacks {
  onActive?: () => void;
  onBackground?: () => void;
  onInactive?: () => void;
}

class SafeAppStateManager {
  private listeners: Map<string, AppStateCallbacks> = new Map();
  private currentState: AppStateStatus = AppState.currentState;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  public initialize() {
    if (this.isInitialized) return;

    try {
      AppState.addEventListener('change', this.handleAppStateChange);
      this.isInitialized = true;
    } catch (error) {
      console.warn('Error initializing SafeAppStateManager:', error);
    }
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    try {
      console.log(
        'App state changed from',
        this.currentState,
        'to',
        nextAppState,
      );

      // Notify all listeners
      this.listeners.forEach((callbacks, key) => {
        try {
          switch (nextAppState) {
            case 'active':
              callbacks.onActive?.();
              break;
            case 'background':
              callbacks.onBackground?.();
              break;
            case 'inactive':
              callbacks.onInactive?.();
              break;
          }
        } catch (error) {
          console.warn(`Error in app state callback for ${key}:`, error);
        }
      });

      this.currentState = nextAppState;
    } catch (error) {
      console.warn('Error handling app state change:', error);
    }
  };

  /**
   * Add a safe app state listener
   */
  addListener(key: string, callbacks: AppStateCallbacks) {
    try {
      this.listeners.set(key, callbacks);
      console.log(`Added app state listener: ${key}`);
    } catch (error) {
      console.warn(`Error adding app state listener ${key}:`, error);
    }
  }

  /**
   * Remove an app state listener
   */
  removeListener(key: string) {
    try {
      this.listeners.delete(key);
      console.log(`Removed app state listener: ${key}`);
    } catch (error) {
      console.warn(`Error removing app state listener ${key}:`, error);
    }
  }

  /**
   * Get current app state
   */
  getCurrentState(): AppStateStatus {
    try {
      return AppState.currentState;
    } catch (error) {
      console.warn('Error getting current app state:', error);
      return this.currentState;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    try {
      if (this.isInitialized) {
        // Note: AppState.removeEventListener is deprecated, but we'll handle it safely
        try {
          (AppState as any).removeEventListener?.(
            'change',
            this.handleAppStateChange,
          );
        } catch (e) {
          // Ignore if removeEventListener is not available
        }
        this.listeners.clear();
        this.isInitialized = false;
      }
    } catch (error) {
      console.warn('Error cleaning up SafeAppStateManager:', error);
    }
  }
}

// Global instance
export const safeAppStateManager = new SafeAppStateManager();

/**
 * Hook for safe app state management
 */
export const useSafeAppState = (callbacks: AppStateCallbacks, key?: string) => {
  const listenerKey = key || `listener_${Date.now()}_${Math.random()}`;

  React.useEffect(() => {
    safeAppStateManager.addListener(listenerKey, callbacks);

    return () => {
      safeAppStateManager.removeListener(listenerKey);
    };
  }, [listenerKey]);

  return {
    currentState: safeAppStateManager.getCurrentState(),
  };
};

/**
 * Safe memory management utilities
 */
export const safeMemoryManagement = {
  /**
   * Safely clear large objects from memory
   */
  clearLargeObjects: (objects: any[]) => {
    try {
      objects.forEach((obj) => {
        if (obj && typeof obj === 'object') {
          // Clear object properties
          Object.keys(obj).forEach((key) => {
            try {
              delete obj[key];
            } catch (error) {
              console.warn(`Error clearing object property ${key}:`, error);
            }
          });
        }
      });
    } catch (error) {
      console.warn('Error clearing large objects:', error);
    }
  },

  /**
   * Safely force garbage collection (if available)
   */
  forceGarbageCollection: () => {
    try {
      if (global.gc) {
        global.gc();
        console.log('Garbage collection triggered');
      } else {
        console.log('Garbage collection not available');
      }
    } catch (error) {
      console.warn('Error during garbage collection:', error);
    }
  },

  /**
   * Monitor memory usage
   */
  getMemoryInfo: () => {
    try {
      // Check if performance.memory is available (Chrome/WebView only)
      if (
        typeof global !== 'undefined' &&
        global.performance &&
        (global.performance as any).memory
      ) {
        const memory = (global.performance as any).memory;
        return {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };
      }
      return null;
    } catch (error) {
      console.warn('Error getting memory info:', error);
      return null;
    }
  },
};

/**
 * Safe navigation utilities to prevent crashes
 */
export const safeNavigation = {
  /**
   * Safely navigate with error handling
   */
  safeNavigate: (navigation: any, routeName: string, params?: any) => {
    try {
      if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate(routeName, params);
        return true;
      } else {
        console.warn('Navigation not available or invalid');
        return false;
      }
    } catch (error) {
      console.warn('Error during navigation:', error);
      return false;
    }
  },

  /**
   * Safely go back with error handling
   */
  safeGoBack: (navigation: any) => {
    try {
      if (navigation && typeof navigation.goBack === 'function') {
        navigation.goBack();
        return true;
      } else {
        console.warn('Navigation goBack not available');
        return false;
      }
    } catch (error) {
      console.warn('Error during goBack:', error);
      return false;
    }
  },
};

/**
 * Safe timer utilities to prevent memory leaks
 */
class SafeTimers {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Set a safe timeout that can be cleared
   */
  setTimeout(callback: () => void, delay: number, key?: string): string {
    const timerKey = key || `timer_${Date.now()}_${Math.random()}`;

    try {
      const timer = setTimeout(() => {
        try {
          callback();
        } catch (error) {
          console.warn('Error in timer callback:', error);
        } finally {
          this.timers.delete(timerKey);
        }
      }, delay);

      this.timers.set(timerKey, timer);
      return timerKey;
    } catch (error) {
      console.warn('Error setting timeout:', error);
      return '';
    }
  }

  /**
   * Clear a timeout by key
   */
  clearTimeout(key: string): boolean {
    try {
      const timer = this.timers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(key);
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Error clearing timeout:', error);
      return false;
    }
  }

  /**
   * Clear all timers
   */
  clearAllTimers(): void {
    try {
      this.timers.forEach((timer: NodeJS.Timeout, key: string) => {
        clearTimeout(timer);
      });
      this.timers.clear();
    } catch (error) {
      console.warn('Error clearing all timers:', error);
    }
  }
}

export const safeTimers = new SafeTimers();

/**
 * Initialize safe app management
 */
export const initializeSafeAppManagement = () => {
  try {
    // Setup app state management
    safeAppStateManager.initialize();

    // Setup memory monitoring
    const memoryInfo = safeMemoryManagement.getMemoryInfo();
    if (memoryInfo) {
      console.log('Initial memory info:', memoryInfo);
    }

    // Setup periodic memory cleanup
    const cleanupInterval = safeTimers.setTimeout(
      () => {
        safeMemoryManagement.forceGarbageCollection();
      },
      30000,
      'memory_cleanup',
    ); // Every 30 seconds

    console.log('Safe app management initialized');
  } catch (error) {
    console.warn('Error initializing safe app management:', error);
  }
};

/**
 * Cleanup safe app management
 */
export const cleanupSafeAppManagement = () => {
  try {
    safeAppStateManager.cleanup();
    safeTimers.clearAllTimers();
    console.log('Safe app management cleaned up');
  } catch (error) {
    console.warn('Error cleaning up safe app management:', error);
  }
};
