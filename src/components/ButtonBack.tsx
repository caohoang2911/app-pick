import React from 'react';
import { Pressable } from 'react-native';
import { ArrowLeft } from '@/core/svgs';
import { router } from 'expo-router';

const ButtonBack = () => {
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <Pressable onPress={goBack} className="text-left">
      <ArrowLeft />
    </Pressable>
  );
};

export default ButtonBack;
