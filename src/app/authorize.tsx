import {
  INJECTED_SCRIPT,
  parseEventData,
  signIn,
  useAuth,
  WebViewContentReader,
} from '@/core';
import {
  consumePendingDeepLink,
  processDeepLink,
} from '@/core/hooks/useHandleDeepLink';
import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { WebView } from 'react-native-webview';
import { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
import { EmployeeRole } from '~/src/types/employee';
import { authorizeAppPickClient } from '../api/auth/use-authorize-app-pick-client';
import AuthorizeLoadingOverlay from '../components/shared/authorize-loading-overlay';
import RequestPermissionStore from '../components/shared/request-permission-store';
import { setLoading } from '../core/store/loading';

/** Failsafe: quá lâu không login thì bỏ overlay (SSO chậm / kẹt trang). */
const AUTHORIZE_OVERLAY_TIMEOUT_MS = 60000;

const WHITE_LIST_ROLE = [
  EmployeeRole.STORE,
  EmployeeRole.STORE_MANAGER,
  EmployeeRole.ADMIN,
  EmployeeRole.DRIVER,
  EmployeeRole.STORE_SHIFT_SUPERVISOR,
];

const isAllowedAuthorizeRole = (role?: string) =>
  !!role &&
  (WHITE_LIST_ROLE.includes(role as EmployeeRole) || role.startsWith('STORE'));

/**
 * Đích redirect sau SSO (haravan.com) là trang seedcom.vn — chỉ nhận khi hostname
 * của trang đang mở đúng là seedcom.vn/*.seedcom.vn. Không dùng includes() trần
 * (dính redirect_uri=…seedcom.vn… trên URL SSO) hay phủ định !haravan.com
 * (dính about:blank / hop trung gian).
 */
const isSeedcomVnUrl = (url?: string) => {
  const host = url?.match(/^https?:\/\/([^/:?#]+)/i)?.[1]?.toLowerCase();
  return !!host && (host === 'seedcom.vn' || host.endsWith('.seedcom.vn'));
};

const Authorize = () => {
  const urlRedirect = useAuth.use.urlRedirect();
  const [isRequestPermission, setIsRequestPermission] = useState(false);
  const [extractedCode, setExtractedCode] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout>();

  const webViewRef: any = useRef();
  const flag = useRef(true);

  const [currentUrl, setCurrentUrl] = useState<string>();

  // Che UI web bằng overlay từ lúc điều hướng qua seedcom.vn đến khi bắt được event login.
  const [isMaskingWebUI, setIsMaskingWebUI] = useState(false);
  const isMaskingWebUIRef = useRef(false);

  const setMaskWebUI = useCallback((masking: boolean) => {
    isMaskingWebUIRef.current = masking;
    setIsMaskingWebUI(masking);
  }, []);

  useEffect(() => {
    setCurrentUrl(urlRedirect);
  }, [urlRedirect]);

  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  useEffect(() => {
    if (!isMaskingWebUI) return;
    const timeout = setTimeout(
      () => setMaskWebUI(false),
      AUTHORIZE_OVERLAY_TIMEOUT_MS,
    );
    return () => clearTimeout(timeout);
  }, [isMaskingWebUI, setMaskWebUI]);

  const handleNavigationStateChange = (data: any) => {
    if (
      isSeedcomVnUrl(data?.url) &&
      !data?.url?.includes?.('haravan.com') &&
      flag.current
    ) {
      flag.current = false;
      // Chỉ che UI, giữ nguyên điều hướng tự nhiên của web. KHÔNG setCurrentUrl/reload:
      // đổi key sẽ remount WebView (incognito) → mất session SSO vừa tạo → trang
      // seedcom.vn không còn đăng nhập → event login không bao giờ tới → kẹt overlay.
      setMaskWebUI(true);
      setLoading(false);
    }
  };

  // Function để đọc elementText khi cần
  const readElementText = useCallback((selector: string = 'body') => {
    if (!webViewRef.current) return;
    WebViewContentReader.getElementText(webViewRef.current, selector);
  }, []);

  const onMessage = useCallback(
    async (e: WebViewMessageEvent) => {
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

          // Giữ overlay đến khi signIn xong / lỗi / không đủ quyền — không tắt
          // ngay khi nhận event (user vẫn còn trên WebView một nhịp).
          if (isAllowedAuthorizeRole(role)) {
            let authorizedZas: string;
            try {
              const response = await authorizeAppPickClient({ zas });
              const newZas = response?.data?.zas;

              if (!newZas) {
                console.error(
                  '[Authorize] authorizeAppPickClient: missing zas in response',
                );
                setMaskWebUI(false);
                return;
              }
              authorizedZas = newZas;
            } catch (error) {
              console.error(
                '[Authorize] authorizeAppPickClient failed:',
                error,
              );
              setMaskWebUI(false);
              return;
            }

            signIn({
              token: authorizedZas,
              userInfo: { ...authInfo, zas: authorizedZas },
            });
            // Overlay có thể tắt sau signIn — ProtectedRoute sẽ rời authorize.
            setMaskWebUI(false);

            // Check if there's a pending deep link to navigate to
            const savedDeepLink = consumePendingDeepLink();
            if (savedDeepLink && typeof savedDeepLink === 'string') {
              // Add a small delay to ensure auth is completed
              setTimeout(() => {
                try {
                  processDeepLink(savedDeepLink);
                } catch (error) {
                  // Error processing deep link
                  // NavigationHelpers.replaceWithOrders();
                }
              }, 500);
            } else {
              // NavigationHelpers.replaceWithOrders();
            }
          } else {
            setMaskWebUI(false);
            router.back();
            showAlert({
              title: 'Chưa thể đăng nhập',
              message:
                'Bạn chưa được cấp quyền vào xem danh sách đơn hàng, vui lòng gửi yêu cầu để được mở quyền',
              onConfirm: () => {
                hideAlert();
                showMessage({
                  message: 'Đã gửi yêu cầu cấp quyền. Vui lòng đợi',
                  type: 'success',
                });
              },
            });
          }
          break;
        case 'content':
          // Xử lý content được gửi từ website
          const { type, data: contentData } = dataParser;
          // console.log(`[WebView Content] ${type}:`, contentData);

          // Chỉ xử lý elementText
          switch (type) {
            case 'elementText':
              if (
                JSON.stringify(contentData).includes('HRV_REQUEST_PERMISSION')
              ) {
                setMaskWebUI(false);
                setIsRequestPermission(true);
                // clearInterval(intervalRef.current);

                // Extract userId from the content data
                try {
                  let code = null;
                  let userName = null;
                  let userId = null;

                  if (contentData?.text) {
                    clearInterval(intervalRef.current);
                    // Parse the escaped JSON string
                    const parsedText = JSON.parse(contentData.text);
                    const errorMessage = parsedText.error;

                    // Extract code using regex (handles alphanumeric codes like sc000073)
                    const codeMatch = errorMessage.match(/code:\s*([^,\s]+)/);
                    if (codeMatch) {
                      code = codeMatch[1];
                      setExtractedCode(code); // Store in state
                    }

                    // Extract name using regex
                    const userNameMatch = errorMessage.match(/name:\s*([^,]+)/);
                    if (userNameMatch) {
                      userName = userNameMatch[1].trim();
                    }

                    // Extract id using regex
                    const userIdMatch = errorMessage.match(/id:\s*(\d+)/);
                    if (userIdMatch) {
                      userId = userIdMatch[1];
                    }
                  }
                } catch (error) {
                  // Error parsing content data
                }
              }
              break;
            default:
              // Bỏ qua các case khác
              break;
          }
          break;
        default:
          break;
      }
    },
    [setMaskWebUI],
  );

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      readElementText('body');
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [readElementText]);

  if (isRequestPermission) {
    return <RequestPermissionStore code={extractedCode} />;
  }

  return (
    <View style={styles.container}>
      <WebView
        key={currentUrl || urlRedirect || 'authorize'}
        ref={webViewRef}
        originWhitelist={['*']}
        style={styles.container}
        source={{
          uri: currentUrl || '',
          // Tránh dùng bản cache HTTP (Android + iOS vẫn tôn trọng cacheEnabled/incognito).
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
        }}
        onLoadStart={() => {
          if (isMaskingWebUIRef.current) return;
          setLoading(true, 'Đang tải trang...');
        }}
        onLoadEnd={() => {
          setLoading(false, 'Vui lòng đợi...');
        }}
        onError={() => {
          setLoading(false);
          // Không tắt overlay khi đang SSO — redirect OAuth hay báo lỗi giả.
        }}
        onHttpError={() => {
          setLoading(false);
          // Giống onError: giữ mask trong lúc còn trên WebView SSO.
        }}
        onNavigationStateChange={handleNavigationStateChange}
        injectedJavaScript={INJECTED_SCRIPT}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
        thirdPartyCookiesEnabled
        saveFormDataDisabled
        allowFileAccessFromFileURLs
        cacheEnabled={false}
        cacheMode="LOAD_NO_CACHE"
        incognito
        sharedCookiesEnabled={false}
        useSharedProcessPool={false}
        startInLoadingState={false}
        allowsBackForwardNavigationGestures={false}
      />
      {isMaskingWebUI && <AuthorizeLoadingOverlay />}
    </View>
  );
};

export default Authorize;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
