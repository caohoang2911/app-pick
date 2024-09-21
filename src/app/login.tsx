import { useLogin } from '@/api/auth';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { setEnv, setRedirectUrl, signIn, useAuth } from '@/core';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Formik } from 'formik';
import React, { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import * as Yup from 'yup';
import { useAuthorizeUserPassword } from '../api/auth/use-authorize-user-password';
import { Input } from '../components/Input';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export default function Login() {
  const { mutate: login, data, isPending } = useLogin();
  const env = useAuth.use.env();

  const { mutate: loginRegular, isPending: isPendingRegular } = useAuthorizeUserPassword((data) => {
    console.log('data', data);
    if (!data.error) {
      const userInfo = data.data || {};
      const { zas } = userInfo;

      if(!zas || !userInfo) {
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="flex flex-col gap-4 px-8 h-full justify-center bg-white">
        <View className="flex flex-col gap-4">
          <View className="w-full flex justify-center items-center mb-4">
            <Image
              placeholder={{ blurhash }}
              contentFit="contain"
              source={'logo'}
              style={{ width: 200, height: 40 }}
            />
          </View>
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
                <View className="flex flex-col gap-3">
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
                    secureTextEntry={true}
                    placeholder="Mật khẩu"
                    value={values.password}
                    keyboardType="default"
                    error={errors.password}
                    handleBlur={handleBlur('password')}
                    onChangeText={(value: string) => {
                      setFieldValue('password', value);
                    }}
                  />  
                  <View className="mt-3">
                    <Button loading={isPendingRegular} variant={'warning'} onPress={handleSubmit as any} size="lg" label="Đăng nhập" />
                  </View>
                </View>
            )}}
            </Formik>
          </View>
        </View>
        <View className="flex flex-col gap-2 mt-6">
          <View className="px-3 w-auto " style={{ marginTop: -11 }}>
            <View className="flex flex-row gap-2 border-b border-gray-200" />
            <Text className="text-center w-auto text-sm bg-white self-center px-3 text-gray-500" style={{ marginTop: -11 }}>
              Hoặc đăng nhập bằng
            </Text>
          </View>
        </View>
        <View className="w-full">
          <Button
            loading={isPending}
            onPress={handleLogin}
            size="lg"
            className="w-full"
            label={'Đăng nhập bằng Harawork '}
          />
        </View>
        <View className="w-full flex flex-row gap-2 justify-center">
          <Pressable onPress={() => setEnv()}>
            <Badge
              label="Dev"
              variant={env === 'dev' ? 'default' : 'secondary'}
              className="self-start"
            />
          </Pressable>
          <Pressable onPress={() => setEnv()}>
            <Badge
              label="Prod"
              variant={env === 'prod' ? 'default' : 'secondary'}
              className="self-start"
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}