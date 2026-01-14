import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CrashlyticsService from './crashlytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component to catch and handle React errors
 * Prevents crashes from:
 * - ReactInstanceManager.onHostPause AssertionError
 * - JavaScript errors in components
 * - Unhandled component errors
 *  + Reports errors to Firebase Crashlytics
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Report to Firebase Crashlytics
    try {
      CrashlyticsService.log('ErrorBoundary caught error');
      CrashlyticsService.log(`Component Stack: ${errorInfo.componentStack}`);
      CrashlyticsService.recordError(error, 'ErrorBoundary');
    } catch (e) {
      console.warn('Failed to report error to Crashlytics:', e);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Log error details for debugging
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Có lỗi xảy ra</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Có lỗi xảy ra'}
          </Text>
          <Text style={styles.errorHint}>
            Vui lòng khởi động lại ứng dụng hoặc liên hệ hỗ trợ nếu vấn đề vẫn
            tiếp diễn.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

/**
 * Higher-order component that wraps a component with ErrorBoundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void,
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

/**
 * Hook for handling errors in functional components
 */
export const useErrorHandler = () => {
  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);

    // Report to Firebase Crashlytics
    CrashlyticsService.recordError(error, context || 'useErrorHandler');
  }, []);

  return { handleError };
};

/**
 * Safe component wrapper that catches errors
 */
export const SafeComponent: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}> = ({ children, fallback, onError }) => {
  const { handleError } = useErrorHandler();

  return (
    <ErrorBoundary
      fallback={fallback}
      onError={(error, errorInfo) => {
        handleError(error, 'SafeComponent');
        onError?.(error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
