import React, { forwardRef, useCallback } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';

interface SafeScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
}

/**
 * Safe ScrollView wrapper that handles touch events safely to prevent crashes
 * Fixes the "invalid pointerIndex -1 for MotionEvent" crash
 */
export const SafeScrollView = forwardRef<ScrollView, SafeScrollViewProps>(
  (
    {
      children,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
      ...props
    },
    ref,
  ) => {
    // Safe touch event handlers that prevent crashes
    const safeOnTouchStart = useCallback(
      (event: any) => {
        try {
          // Validate touch event before processing
          if (event && event.nativeEvent && event.nativeEvent.touches) {
            const touches = event.nativeEvent.touches;
            // Check if all touch indices are valid
            for (let i = 0; i < touches.length; i++) {
              if (touches[i].identifier < 0) {
                console.warn(
                  'Invalid touch identifier detected, ignoring touch event',
                );
                return;
              }
            }
          }
          onTouchStart?.(event);
        } catch (error) {
          console.warn('Error in onTouchStart:', error);
        }
      },
      [onTouchStart],
    );

    const safeOnTouchMove = useCallback(
      (event: any) => {
        try {
          // Validate touch event before processing
          if (event && event.nativeEvent && event.nativeEvent.touches) {
            const touches = event.nativeEvent.touches;
            // Check if all touch indices are valid
            for (let i = 0; i < touches.length; i++) {
              if (touches[i].identifier < 0) {
                console.warn(
                  'Invalid touch identifier detected, ignoring touch move event',
                );
                return;
              }
            }
          }
          onTouchMove?.(event);
        } catch (error) {
          console.warn('Error in onTouchMove:', error);
        }
      },
      [onTouchMove],
    );

    const safeOnTouchEnd = useCallback(
      (event: any) => {
        try {
          // Validate touch event before processing
          if (event && event.nativeEvent && event.nativeEvent.changedTouches) {
            const changedTouches = event.nativeEvent.changedTouches;
            // Check if all touch indices are valid
            for (let i = 0; i < changedTouches.length; i++) {
              if (changedTouches[i].identifier < 0) {
                console.warn(
                  'Invalid touch identifier detected, ignoring touch end event',
                );
                return;
              }
            }
          }
          onTouchEnd?.(event);
        } catch (error) {
          console.warn('Error in onTouchEnd:', error);
        }
      },
      [onTouchEnd],
    );

    const safeOnTouchCancel = useCallback(
      (event: any) => {
        try {
          // Validate touch event before processing
          if (event && event.nativeEvent && event.nativeEvent.changedTouches) {
            const changedTouches = event.nativeEvent.changedTouches;
            // Check if all touch indices are valid
            for (let i = 0; i < changedTouches.length; i++) {
              if (changedTouches[i].identifier < 0) {
                console.warn(
                  'Invalid touch identifier detected, ignoring touch cancel event',
                );
                return;
              }
            }
          }
          onTouchCancel?.(event);
        } catch (error) {
          console.warn('Error in onTouchCancel:', error);
        }
      },
      [onTouchCancel],
    );

    return (
      <ScrollView
        ref={ref}
        onTouchStart={safeOnTouchStart}
        onTouchMove={safeOnTouchMove}
        onTouchEnd={safeOnTouchEnd}
        onTouchCancel={safeOnTouchCancel}
        {...props}
      >
        {children}
      </ScrollView>
    );
  },
);

SafeScrollView.displayName = 'SafeScrollView';

/**
 * Safe BottomSheetScrollView wrapper that handles touch events safely
 */
export const SafeBottomSheetScrollView = forwardRef<any, any>(
  (
    {
      children,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
      ...props
    },
    ref,
  ) => {
    // Safe touch event handlers that prevent crashes
    const safeOnTouchStart = useCallback(
      (event: any) => {
        try {
          // Validate touch event before processing
          if (event && event.nativeEvent && event.nativeEvent.touches) {
            const touches = event.nativeEvent.touches;
            // Check if all touch indices are valid
            for (let i = 0; i < touches.length; i++) {
              if (touches[i].identifier < 0) {
                console.warn(
                  'Invalid touch identifier detected, ignoring touch event',
                );
                return;
              }
            }
          }
          onTouchStart?.(event);
        } catch (error) {
          console.warn('Error in onTouchStart:', error);
        }
      },
      [onTouchStart],
    );

    const safeOnTouchMove = useCallback(
      (event: any) => {
        try {
          // Validate touch event before processing
          if (event && event.nativeEvent && event.nativeEvent.touches) {
            const touches = event.nativeEvent.touches;
            // Check if all touch indices are valid
            for (let i = 0; i < touches.length; i++) {
              if (touches[i].identifier < 0) {
                console.warn(
                  'Invalid touch identifier detected, ignoring touch move event',
                );
                return;
              }
            }
          }
          onTouchMove?.(event);
        } catch (error) {
          console.warn('Error in onTouchMove:', error);
        }
      },
      [onTouchMove],
    );

    const safeOnTouchEnd = useCallback(
      (event: any) => {
        try {
          // Validate touch event before processing
          if (event && event.nativeEvent && event.nativeEvent.changedTouches) {
            const changedTouches = event.nativeEvent.changedTouches;
            // Check if all touch indices are valid
            for (let i = 0; i < changedTouches.length; i++) {
              if (changedTouches[i].identifier < 0) {
                console.warn(
                  'Invalid touch identifier detected, ignoring touch end event',
                );
                return;
              }
            }
          }
          onTouchEnd?.(event);
        } catch (error) {
          console.warn('Error in onTouchEnd:', error);
        }
      },
      [onTouchEnd],
    );

    const safeOnTouchCancel = useCallback(
      (event: any) => {
        try {
          // Validate touch event before processing
          if (event && event.nativeEvent && event.nativeEvent.changedTouches) {
            const changedTouches = event.nativeEvent.changedTouches;
            // Check if all touch indices are valid
            for (let i = 0; i < changedTouches.length; i++) {
              if (changedTouches[i].identifier < 0) {
                console.warn(
                  'Invalid touch identifier detected, ignoring touch cancel event',
                );
                return;
              }
            }
          }
          onTouchCancel?.(event);
        } catch (error) {
          console.warn('Error in onTouchCancel:', error);
        }
      },
      [onTouchCancel],
    );

    return (
      <BottomSheetScrollView
        ref={ref}
        onTouchStart={safeOnTouchStart}
        onTouchMove={safeOnTouchMove}
        onTouchEnd={safeOnTouchEnd}
        onTouchCancel={safeOnTouchCancel}
        {...props}
      >
        {children}
      </BottomSheetScrollView>
    );
  },
);

SafeBottomSheetScrollView.displayName = 'SafeBottomSheetScrollView';
