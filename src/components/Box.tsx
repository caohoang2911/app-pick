import React from 'react';
import { View, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';

function Box({ children, style }: { children: React.ReactNode, style?: StyleProp<ViewStyle> }) {
  return <View className='bg-white mx-4 px-4 py-3' style={[styles.box, style]}>{children}</View>;
}

export default Box;

const styles = StyleSheet.create({
  box: {
    borderRadius: 5,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#222',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        shadowColor: '#222',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.4,
        shadowRadius: 5.46,
        elevation: 2,
      },
    }),
  },
});