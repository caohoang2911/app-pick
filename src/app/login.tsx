import { useLogin } from '@/api/auth';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { setEnv, setRedirectUrl, signIn, useAuth } from '@/core';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Formik } from 'formik';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import * as Yup from 'yup';
import { useAuthorizeUserPassword } from '../api/auth/use-authorize-user-password';
import { Input } from '../components/Input';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export default function Login() {
  const { mutate: login, data, isPending } = useLogin();
  const env = useAuth.use.env();

  const { mutate: loginRegular, isPending: isPendingRegular } = useAuthorizeUserPassword((data) => {
    if (!data.error) {
      const userInfo = data.data || {};
      const { zas } = userInfo;

      if(!zas || userInfo) {
        return;
      }

      signIn({ token: zas as string, userInfo });
      router.replace('/orders');
    }
  });

  useEffect(() => {
    if (data) {
      setRedirectUrl(data?.data as string);
      router.push('/authorize');
    }
  }, [data]);

  const handleLogin = () => {
    login();
  };

  const handleLoginRegular = (values: any) => {
    loginRegular({
      username: values.username,
      password: values.password,
    });
  };

  return (
    <ScrollView style={{ flex: 1}} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="h-full bg-white items-center justify-center px-4">
        <View className="w-full justify-center items-center mb-2">
          <Image
            placeholder={{ blurhash }}
            contentFit="contain"
            source={'logo'}
            className="w-100"
            style={{ width: 200, height: 40 }}
          />
        </View>
        <View className="flex flex-col bg-white items-center gap-5 w-full px-4 pt-7 pb-10">
          <View className="w-full">
            <Formik
              initialValues={{
                username: '',
                password: ''
              }}
              validateOnChange
              onSubmit={handleLoginRegular}
              className="w-full bg-red-500"
              validationSchema={Yup.object({
                username: Yup.string().required('Vui lòng nhập tên đăng nhập'),
                password: Yup.string().required('Vui lòng nhập mật khẩu'),
              })}
            >
              {({ values, errors, isValid, handleBlur, setFieldValue, handleSubmit }) => {
                return (
                  <View className="gap-3">
                    <Input
                      selectTextOnFocus
                      labelClasses="font-medium w-full"
                      onChangeText={(value: string) => {
                        setFieldValue('username', value);
                      }}
                      placeholder="Tên đăng nhập"
                      error={errors.username}
                      name="username"
                      value={values?.username.toString()}
                      onBlur={handleBlur('username')}
                      defaultValue="0"
                    />
                    <Input
                      type="password"
                      placeholder="Mật khẩu"
                      value={values.password}
                      keyboardType="default"
                      error={errors.password}
                      handleBlur={handleBlur('password')}
                      onChangeText={(value: string) => {
                        setFieldValue('password', value);
                      }}
                    />  
                    <Button loading={isPendingRegular} onPress={handleSubmit as any} className="bg-orange-500 mt-3" size="lg" label="Đăng nhập" disabled={!isValid} />
                  </View>
              )}}
            </Formik>
          </View>
          <View className="w-full flex justify-center items-center py-3">
            <View className="border-b border-gray-200 w-full"></View>
            <View className="-mt-3 px-3 inline w-auto bg-white">
              <Text className="text-center text-sm text-gray-500">
                Hoặc đăng nhập bằng
              </Text>
            </View>
          </View>
          <Button
            loading={isPending}
            onPress={handleLogin}
            size="lg"
            className="w-full"
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
    </ScrollView>
  );
}