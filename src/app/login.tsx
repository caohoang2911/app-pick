import { useLogin } from '@/api/auth';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { setEnv, setRedirectUrl, useAuth } from '@/core';
import { useAssets } from 'expo-asset';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export default function Login() {
  const { mutate: login, data, isPending } = useLogin();
  const [assets] = useAssets([require('assets/logo.png')]);
  const env = useAuth.use.env();

  useEffect(() => {
    if (data) {
      setRedirectUrl(data?.data as string);
      router.push('/authorize');
    }
  }, [data]);

  const handleLogin = () => {
    login();
  };

  return (
    <View className="h-full items-center justify-center">
      <View className="flex flex-col items-center gap-8">
        <Image
          placeholder={{ blurhash }}
          contentFit="cover"
          source={'logo'}
          className="w-100"
          style={{ width: 230, height: 40 }}
        />

        <Button
          loading={isPending}
          onPress={handleLogin}
          label={'Đăng nhập bằng Harawork '}
        />
        <Pressable
          onPress={() => {
            setEnv();
          }}
        >
          <View className="flex flex-row gap-2">
            <Badge
              label={'Dev'}
              variant={env === 'dev' ? 'default' : 'secondary'}
              className="self-start"
            />
            <Badge
              label={'Prod'}
              variant={env === 'prod' ? 'default' : 'secondary'}
              className="self-start"
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
}
