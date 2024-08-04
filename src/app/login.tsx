import { Button } from '@/components/Button';
import { useAssets } from 'expo-asset';
import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useLogin } from '../api/auth';
import { setRedirectUrl } from '../core';
import { router } from 'expo-router';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export default function Login() {
  const { mutate: login, isPending } = useLogin();
  const [assets] = useAssets([require('assets/logo.png')]);

  const handleLogin = async () => {
    login(undefined, {
      onSuccess: (data: any) => {
        setRedirectUrl(data.data);
        router.push('/authorize');
      },
      onError: (err) => {
        console.log(err, 'err');
        // showErrorMessage('Error adding post');
      },
    });
  };
  return (
    <View className="h-full items-center justify-center">
      <View className="flex flex-col items-center gap-8">
        <Image
          placeholder={{ blurhash }}
          contentFit="cover"
          source={assets?.[0] as any}
          className="w-100"
          style={{ width: 230, height: 40 }}
        />
        <Button
          loading={isPending}
          onPress={handleLogin}
          label={'Đăng nhập bằng Harawork '}
        />
      </View>
    </View>
  );
}
