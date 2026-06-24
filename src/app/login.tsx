import { useLogin } from '@/api/auth';
import { Button } from '@/components/Button';
import { setRedirectUrl, signIn } from '@/core';
import {
  consumePendingDeepLink,
  processDeepLink,
} from '@/core/hooks/useHandleDeepLink';
import { NavigationHelpers } from '@/core/utils/navigation';
import { Image } from 'expo-image';
import { Formik } from 'formik';
import React, { useEffect, useRef } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import * as Yup from 'yup';
import { authorizeAppPickClient } from '../api/auth/use-authorize-app-pick-client';
import { useAuthorizeUserPassword } from '../api/auth/use-authorize-user-password';
import { Input } from '../components/Input';
import { setLoading } from '../core/store/loading';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

export default function Login() {
  const {
    mutate: login,
    data,
    isPending,
    reset: resetLoginMutation,
  } = useLogin();
  const loginTimeoutRef = useRef<NodeJS.Timeout>();

  const { mutate: loginRegular, isPending: isPendingRegular } =
    useAuthorizeUserPassword(async (data) => {
      if (data.error) {
        Keyboard.dismiss();
        showMessage({
          message: data.error,
          type: 'danger',
        });
        return;
      }

      const userInfo = data.data || {};
      const { zas } = userInfo;

      if (!zas || !userInfo) {
        return;
      }

      let authorizedZas: string;
      try {
        const response = await authorizeAppPickClient({ zas });

        const newZas = response?.data?.zas;

        if (!newZas) {
          console.error(
            '[Login] authorizeAppPickClient: missing zas in response',
          );
          return;
        }
        authorizedZas = newZas;
      } catch (error) {
        console.error('[Login] authorizeAppPickClient failed:', error);
        return;
      }

      signIn({
        token: authorizedZas,
        userInfo: { ...userInfo, zas: authorizedZas },
      });

      const savedDeepLink = consumePendingDeepLink();
      if (savedDeepLink && typeof savedDeepLink === 'string') {
        console.log('[Login] Processing saved deep link:', savedDeepLink);
        setTimeout(() => {
          try {
            processDeepLink(savedDeepLink);
          } catch (error) {
            console.error('[Login] Error processing deep link:', error);
            // NavigationHelpers.replaceWithOrders();
          }
        }, 500);
      } else {
        // NavigationHelpers.replaceWithOrders();
      }
    });

  useEffect(() => {
    if (data) {
      setRedirectUrl(data?.data as string);
      NavigationHelpers.toAuthorize();
    }
  }, [data]);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isPending) {
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
      }
      return;
    }

    loginTimeoutRef.current = setTimeout(() => {
      resetLoginMutation();
      showMessage({
        message: 'Đăng nhập quá thời gian, vui lòng thử lại',
        type: 'danger',
      });
    }, 15000);

    return () => {
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
      }
    };
  }, [isPending, resetLoginMutation]);

  const handleLogin = () => {
    Keyboard.dismiss();
    login();
  };

  const handleLoginRegular = (values: any) => {
    Keyboard.dismiss();
    loginRegular({
      username: values.username,
      password: values.password,
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bounces={false}
        className="bg-white"
      >
        <Pressable
          style={{ flexGrow: 1, justifyContent: 'center' }}
          onPress={Keyboard.dismiss}
          accessible={false}
        >
          <View className="flex flex-col gap-4 px-8 py-8">
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
                    password: '',
                  }}
                  validateOnChange
                  onSubmit={handleLoginRegular}
                  className="w-full bg-red-500"
                  validationSchema={Yup.object({
                    username: Yup.string().required(
                      'Vui lòng nhập tên đăng nhập',
                    ),
                    password: Yup.string().required('Vui lòng nhập mật khẩu'),
                  })}
                >
                  {({
                    values,
                    errors,
                    handleBlur,
                    setFieldValue,
                    handleSubmit,
                  }) => {
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
                          <Button
                            loading={isPendingRegular}
                            variant={'warning'}
                            onPress={handleSubmit as any}
                            size="md"
                            label="Đăng nhập"
                          />
                        </View>
                      </View>
                    );
                  }}
                </Formik>
              </View>
            </View>
            <View className="flex flex-col gap-2 mt-6">
              <View className="px-3 w-auto " style={{ marginTop: -11 }}>
                <View className="flex flex-row gap-2 border-b border-gray-200" />
                <Text
                  className="text-center w-auto text-xs bg-white self-center px-3 text-gray-500"
                  style={{ marginTop: -11 }}
                >
                  Hoặc đăng nhập bằng
                </Text>
              </View>
            </View>
            <View className="w-full">
              <Button
                loading={isPending}
                onPress={handleLogin}
                size="md"
                className="w-full"
                label={'Đăng nhập bằng Harawork '}
              />
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
