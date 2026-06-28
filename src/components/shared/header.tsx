import React from 'react';
import { Text, View } from 'react-native';
import ButtonBack from '../ButtonBack';

const Header = ({
  headerLeft,
  headerRight,
  title,
}: {
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  title?: React.ReactNode;
}) => {
  return (
    <View className="relative flex-row items-center justify-center py-3 bg-white border-b border-gray-200 px-4 min-h-[48px]">
      <View className="absolute left-4 z-10">
        {headerLeft ?? <ButtonBack />}
      </View>
      {typeof title === 'string' ? (
        <Text className="text-lg font-medium text-center px-10">{title}</Text>
      ) : (
        title
      )}
      <View className="absolute right-4 z-10">
        {headerRight ?? <View className="w-6" />}
      </View>
    </View>
  );
};

export default React.memo(Header);
