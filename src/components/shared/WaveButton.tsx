import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, TouchableOpacityProps, StyleSheet, View } from 'react-native';

interface WaveButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  waveColor?: string;
  waveDuration?: number;
  waveSize?: number;
}

const WaveButton: React.FC<WaveButtonProps> = ({
  children,
  waveColor = 'rgba(255, 255, 255, 0.3)',
  waveDuration = 500,
  waveSize = 100,
  style,
  onPress,
  ...props
}) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePress = (e: any) => {
    // Reset animations
    scale.setValue(0);
    opacity.setValue(1);

    // Start wave animation
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: waveDuration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: waveDuration,
        useNativeDriver: true,
      }),
    ]).start();

    // Call original onPress if provided
    if (onPress) {
      onPress(e);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={styles.touchable}
        {...props}
      >
        <View style={styles.childrenContainer}>
          {children}
        </View>
        <Animated.View
          style={[
            styles.wave,
            {
              backgroundColor: waveColor,
              opacity,
              width: waveSize,
              height: waveSize,
              borderRadius: waveSize / 2,
              marginLeft: -waveSize / 2,
              marginTop: -waveSize / 2,
              transform: [
                {
                  scale: scale.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            },
          ]}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  touchable: {
    position: 'relative',
  },
  childrenContainer: {
    zIndex: 1,
  },
  wave: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderRadius: 0,
    top: '50%',
    left: '50%',
    marginLeft: 0,
    marginTop: 0,
    zIndex: 0,
  },
});

export default WaveButton; 