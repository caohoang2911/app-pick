import { useRouter } from 'expo-router';
import React from 'react';
import { useAuth } from '@/core';
import { Text, View } from 'react-native';
import { Button } from '@/components/Button';

export default function Login() {
  const router = useRouter();
  const signIn = useAuth.use.signIn();

  const onSubmit = () => {
    signIn({ access: 'access-token', refresh: 'refresh-token' });
    router.push('/');
  };
  return (
    <View className="h-full items-center justify-center">
      <Button variant="default" label="Button" />
      <Text>423423</Text>
    </View>
  );
}
