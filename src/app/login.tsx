import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import React from 'react';
import { useAuth } from '@/core';
import { Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Asset, useAssets } from 'expo-asset';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export default function Login() {
  const router = useRouter();
  const signIn = useAuth.use.signIn();

  const [assets, error] = useAssets([require('assets/logo.png')]);

  const onSubmit = () => {
    signIn({ access: 'access-token', refresh: 'refresh-token' });
    router.push('/');
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
        <Button onPress={onSubmit} label={'Đăng nhập bằng Harawork '} />
      </View>
    </View>
  );
}
