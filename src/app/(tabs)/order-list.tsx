import React from 'react';
import { Text, View } from 'react-native';
import { signOut } from '@/core';
import { router } from 'expo-router';
import { Button } from '@/components/Button';

const OrderList = () => {
  const onSubmit = () => {
    signOut();
    router.push('/login');
  };
  return (
    <View>
      <Button variant="default" label="Logout" onPress={onSubmit} />
    </View>
  );
};

export default OrderList;
