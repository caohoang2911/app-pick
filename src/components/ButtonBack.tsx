import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { ArrowLeft } from '@/core/svgs';
import { router } from 'expo-router';

const ButtonBack = ({
  title,
  className,
}: {
  title?: string | React.ReactNode;
  className?: string;
}) => {
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <Pressable onPress={goBack} className="text-left -ml-3">
      <View className='p-1 flex flex-row items-center gap-2'>
        <ArrowLeft />
        {title && <View className='-ml-2'>
          {typeof title == 'string' ?<Text className="font-semibold text-gray-500 text-sm">{title}</Text> : title}    
        </View>}
      </View>
    </Pressable>
  );
};

export default ButtonBack;
