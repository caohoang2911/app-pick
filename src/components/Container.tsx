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
  className?: string;
  [key: string]: any;
}) => {
  return (
    <View className={clsx('flex-1 px-4 bg-white', className)} {...rest}>
      {children}
    </View>
  );
};

export default Container;
