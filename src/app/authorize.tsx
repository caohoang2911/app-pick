import { INJECTED_SCRIPT, parseEventData, signIn, useAuth } from '@/core';
import { consumePendingDeepLink, processDeepLink } from '@/core/hooks/useHandleDeepLink';
import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { WebView } from 'react-native-webview';
import { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
import { setLoading } from '../core/store/loading';

const WHITE_LIST_ROLE = ['STORE', 'STORE_MANAGER', 'ADMIN'];

const Authorize = () => {
  const urlRedirect = useAuth.use.urlRedirect();

  const webViewRef: any = useRef();
  const flag = useRef(true);

  const [currentUrl, setCurrentUrl] = useState<string>();

  useEffect(() => {
    setCurrentUrl(urlRedirect);
  }, [urlRedirect]);

  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

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

        if (WHITE_LIST_ROLE.includes(role)) {
          signIn({ token: zas, userInfo: authInfo });
          
          // Check if there's a pending deep link to navigate to
          const savedDeepLink = consumePendingDeepLink();
          if (savedDeepLink && typeof savedDeepLink === 'string') {
            console.log('[Authorize] Processing saved deep link:', savedDeepLink);
            // Add a small delay to ensure auth is completed
            setTimeout(() => {
              try {
                processDeepLink(savedDeepLink);
              } catch (error) {
                console.error('[Authorize] Error processing deep link:', error);
                router.replace('/orders');
              }
            }, 500);
          } else {
            router.replace('/orders');
          }
        } else {
          router.back();
          showAlert({
            title: 'Chưa thể đăng nhập',
            message: 'Bạn chưa được cấp quyền vào xem danh sách đơn hàng, vui lòng gửi yêu cầu để được mở quyền',
            onConfirm: () => {
              hideAlert();
              showMessage({
                message: 'Đã gửi yêu cầu cấp quyền. Vui lòng đợi',
                type: 'success',
              });
            },
            onCancel: () => {
              console.log('Cance3l');
              hideAlert();
            }
          });
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
      onLoadStart={() => setLoading(true, 'Đang tải trang...')}
      onLoadEnd={() => setLoading(false, 'Vui lòng đợi...')}
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
