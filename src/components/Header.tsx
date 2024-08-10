import React from 'react';
import { View } from 'react-native';

interface Props {
  headerRight?: React.ReactNode;
  headerLeft?: React.ReactNode;
  title?: string | React.ReactNode;
}

const Header = ({ headerLeft, headerRight, title }: Props) => {
  return (
    <View className="px-4 py-4 flex-row justify-between gap-3 bg-white">
      {headerLeft}
      {title}
      {headerRight}
    </View>
  );
};

export default Header;
