import { Slot } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

const Container = ({ children, ...rest }: { children: React.ReactNode }) => {
  return (
    <View className="mx-5 flex-1" {...rest}>
      {children}
    </View>
  );
};

export default Container;
