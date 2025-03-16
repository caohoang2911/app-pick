import React from 'react';
import { Pressable, View } from 'react-native';
import { ArrowLeft } from '@/core/svgs';
import { router } from 'expo-router';

const ButtonBack = () => {
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <Pressable onPress={goBack} className="text-left -ml-3">
      <View className='p-1'>
        <ArrowLeft />
      </View>
    </Pressable>
  );
};

export default ButtonBack;
