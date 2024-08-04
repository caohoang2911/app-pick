import React from 'react';
import { Pressable } from 'react-native';
import { ArrowLeft } from '@/core/svgs';
import { router } from 'expo-router';

const ButtonBack = () => {
  const goBack = () => {
    router.back();
  };

  return (
    <Pressable onPress={goBack}>
      <ArrowLeft />
    </Pressable>
  );
};

export default ButtonBack;
