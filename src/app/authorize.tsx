import { INJECTED_SCRIPT, parseEventData, signIn, useAuth, WebViewContentReader } from '@/core';
import { consumePendingDeepLink, processDeepLink } from '@/core/hooks/useHandleDeepLink';
import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { WebView } from 'react-native-webview';
import { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';
import { setLoading } from '../core/store/loading';
import RequestPermissionStore from '../components/shared/request-permission-store';
import { useSetAppVersionWithAutoInfo } from '../api/app-pick/use-set-app-version';
import { EmployeeRole } from '~/src/types/employee';

const WHITE_LIST_ROLE = [EmployeeRole.STORE, EmployeeRole.STORE_MANAGER, EmployeeRole.ADMIN, EmployeeRole.DRIVER  ];

const Authorize = () => {
  const urlRedirect = useAuth.use.urlRedirect();
  const [isRequestPermission, setIsRequestPermission] = useState(false)
  const [extractedCode, setExtractedCode] = useState<string | null>(null)

  const { setVersionWithAutoInfo } = useSetAppVersionWithAutoInfo();

  const intervalRef = useRef<NodeJS.Timeout>();

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

  // Function để đọc elementText khi cần
  const readElementText = useCallback((selector: string = 'body') => {
    if (!webViewRef.current) return;
    WebViewContentReader.getElementText(webViewRef.current, selector);
  }, []);

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
    
            // Add a small delay to ensure auth is completed
            setTimeout(() => {
              try {
                processDeepLink(savedDeepLink);
              } catch (error) {
                // Error processing deep link
                router.replace('/orders');
              }
            }, 500);
          } else {
            router.replace('/orders');
          }
          setVersionWithAutoInfo();
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
      
              hideAlert();
            }
          });
        }
        break;
      case 'content':
        // Xử lý content được gửi từ website
        const { type, data: contentData, timestamp } = dataParser;
        // console.log(`[WebView Content] ${type}:`, contentData);
        
        // Chỉ xử lý elementText
        switch (type) {
          case 'elementText':


            if (JSON.stringify(contentData).includes('HRV_REQUEST_PERMISSION')) {
              setIsRequestPermission(true)
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
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      readElementText('body');
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [readElementText]);



  if(isRequestPermission) {
    return <RequestPermissionStore code={extractedCode} />
  }

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={['*']}
      style={styles.container}
      source={{
        uri: currentUrl || '',
      }}
      onLoadStart={() => setLoading(true, 'Đang tải trang...')}
      onLoadEnd={() => {
        setLoading(false, 'Vui lòng đợi...');
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
