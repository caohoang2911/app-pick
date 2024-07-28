import { signOut, useAuth } from '@/core';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '~/src/components/Button';

const Settings = () => {
  const router = useRouter();

  const onSubmit = () => {
    signOut();
    router.push('/');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Button label={'3333'} />
    </SafeAreaView>
  );
};

export default Settings;
