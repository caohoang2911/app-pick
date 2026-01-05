import React, { useEffect, useRef } from 'react';
import {
  Animated,
  DimensionValue,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { cn } from '../lib/utils';

type SkeletonVariant =
  | 'text'
  | 'circle'
  | 'rectangle'
  | 'card'
  | 'round-rectangle';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: ViewStyle;
  children?: React.ReactNode;
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangle',
  width,
  height,
  className,
  style,
  children,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    shimmerAnimation.start();

    return () => {
      shimmerAnimation.stop();
    };
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  const getVariantStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {};

    if (width !== undefined) {
      baseStyle.width = width as DimensionValue;
    }

    if (height !== undefined) {
      baseStyle.height = height as DimensionValue;
    }

    switch (variant) {
      case 'circle':
        return {
          ...baseStyle,
          borderRadius: 9999,
          aspectRatio: 1,
        };
      case 'round-rectangle':
        return {
          ...baseStyle,
          borderRadius: 16,
        };
      case 'text':
        return {
          ...baseStyle,
          height: height !== undefined ? (height as DimensionValue) : 16,
          borderRadius: 4,
        };
      case 'card':
        return {
          ...baseStyle,
          borderRadius: 8,
          padding: 16,
        };
      case 'rectangle':
      default:
        return {
          ...baseStyle,
          borderRadius: 4,
        };
    }
  };

  const getVariantClasses = (): string => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'text':
        return 'rounded';
      case 'card':
        return 'rounded-lg p-4';
      case 'rectangle':
      default:
        return 'rounded';
    }
  };

  const widthClass = typeof width === 'string' ? width : '';
  const heightClass = typeof height === 'string' ? height : '';

  return (
    <View
      className={cn(
        'bg-gray-200 overflow-hidden',
        getVariantClasses(),
        widthClass,
        heightClass,
        className,
      )}
      style={[getVariantStyles(), style]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            transform: [{ translateX }],
            opacity,
          },
        ]}
      />
      {children}
    </View>
  );
};

// Preset components for common use cases
export const SkeletonText: React.FC<
  Omit<SkeletonProps, 'variant'> & { lines?: number }
> = ({ lines = 1, width = '100%', height = 16, className, style }) => {
  if (lines === 1) {
    return (
      <Skeleton
        variant="text"
        width={width}
        height={height}
        className={className}
        style={style}
      />
    );
  }

  return (
    <View className="gap-2">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? '75%' : '100%'}
          height={height}
          className={className}
          style={style}
        />
      ))}
    </View>
  );
};

export const SkeletonAvatar: React.FC<Omit<SkeletonProps, 'variant'>> = ({
  width = 40,
  height = 40,
  className,
  style,
}) => {
  return (
    <Skeleton
      variant="circle"
      width={width}
      height={height}
      className={className}
      style={style}
    />
  );
};

export const SkeletonCard: React.FC<Omit<SkeletonProps, 'variant'>> = ({
  width = '100%',
  height = 120,
  className,
  style,
  children,
}) => {
  return (
    <Skeleton
      variant="card"
      width={width}
      height={height}
      className={className}
      style={style}
    >
      {children}
    </Skeleton>
  );
};

export default Skeleton;
