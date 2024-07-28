import { signOut, useAuth } from '@/core';
import { useRouter } from 'expo-router';
import React from 'react';
import { Button, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Style = () => {
  const router = useRouter();

  const onSubmit = () => {
    signOut();
    router.push('/');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Button title="Logout" onPress={onSubmit} />
    </SafeAreaView>
  );
};

export default Style;
