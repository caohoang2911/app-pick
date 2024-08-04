import clsx from 'clsx';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Container = ({
  children,
  className,
  ...rest
}: {
  children: React.ReactNode;
  [key: string]: any;
}) => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className={clsx('flex-1 px-4 bg-white', className)} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
};

export default Container;
