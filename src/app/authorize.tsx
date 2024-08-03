import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import { StyleSheet, Text } from 'react-native';
import {
  WebViewErrorEvent,
  WebViewMessageEvent,
  WebViewNavigation,
} from 'react-native-webview/lib/WebViewTypes';
import { signIn, useAuth } from '../core';
import { INJECTED_SCRIPT, parseEventData } from './utils';
import { router } from 'expo-router';

const Authorize = () => {
  const urlRedirect = useAuth.use.urlRedirect();

  const webViewRef: any = useRef();
  const flag = useRef(true);

  const [currentUrl, setCurrentUrl] = useState<string>();

  useEffect(() => {
    setCurrentUrl(urlRedirect);
  }, [urlRedirect]);

  const handleNavigationStateChange = (data: any) => {
    if (data?.url?.startsWith?.('https://oms.seedcom.vn/') && flag.current) {
      flag.current = false;
      console.log(data?.url, 'data?.url');
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
        const { zas } = authInfo || {};

        signIn({ token: zas, userInfo: authInfo });
        router.replace('/orders');
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
        uri:
          currentUrl ||
          'https://80f5-2402-800-637c-9211-7585-5dd5-b592-700e.ngrok-free.app',
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
    />
  );
};

export default Authorize;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight,
  },
});

const EventHandler: any = {
  setItem: async ({ key, value }: any) => {},
};
