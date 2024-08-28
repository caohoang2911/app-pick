import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import { Alert, StyleSheet, Text } from 'react-native';
import { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
import { INJECTED_SCRIPT, parseEventData, signIn, useAuth } from '@/core';
import { router } from 'expo-router';
import { showMessage } from 'react-native-flash-message';

const Authorize = () => {
  const urlRedirect = useAuth.use.urlRedirect();

  const webViewRef: any = useRef();
  const flag = useRef(true);

  const [currentUrl, setCurrentUrl] = useState<string>();

  useEffect(() => {
    setCurrentUrl(urlRedirect);
  }, [urlRedirect]);

  const handleNavigationStateChange = (data: any) => {
    if (data?.url?.startsWith?.('seedcom.vn') && flag.current) {
      flag.current = false;
      setCurrentUrl(data?.url);
      webViewRef.current.reload();
    }
  };

  const onMessage = useCallback(async (e: WebViewMessageEvent) => {
    const message = e.nativeEvent.data;
    const { event, data }: any = parseEventData(message);

    let dataParser: any = {};
    try {
      if (data) dataParser = JSON.parse(data);
    } catch (e) {}

    switch (event) {
      case 'login':
        const { authInfo } = dataParser.data || {};
        const { zas, role } = authInfo || {};

        if (role === 'STORE') {
          signIn({ token: zas, userInfo: authInfo });
          router.replace('/orders');
        } else {
          router.back();
          Alert.alert(
            'Chưa thể đăng nhập',
            'Bạn chưa được cấp quyền vào xem danh sách đơn hàng, vui lòng gửi yêu cầu để được mở quyền',
            [
              {
                text: 'Quay lại',
                style: 'cancel',
              },
              {
                text: 'Yêu cầu mở quyền',
                onPress: () => {
                  showMessage({
                    message: 'Đã gửi yêu cầu cấp quyền. Vui lòng đợi',
                    type: 'success',
                  });
                },
                style: 'cancel',
              },
            ],
            { cancelable: false }
          );
        }
        break;
      default:
        break;
    }
  }, []);

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={['*']}
      style={styles.container}
      source={{
        uri: currentUrl || '',
      }}
      onNavigationStateChange={handleNavigationStateChange}
      injectedJavaScript={INJECTED_SCRIPT}
      onMessage={onMessage}
      javaScriptEnabled
      domStorageEnabled
      allowFileAccess
      allowUniversalAccessFromFileURLs
      thirdPartyCookiesEnabled
      sharedCookiesEnabled
      saveFormDataDisabled
      allowFileAccessFromFileURLs
      useSharedProcessPool
      startInLoadingState={false}
      allowsBackForwardNavigationGestures={false}
      incognito={true}
    />
  );
};

export default Authorize;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
