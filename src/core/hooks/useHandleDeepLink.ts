import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { showMessage } from "react-native-flash-message";
import { useAuth } from "../store/auth";
import { DeepLinkPath } from "../utils/deepLink";

// Lưu trữ deeplink tạm thời khi chưa đăng nhập
let pendingDeepLinkCache: string | null = null;

// Hàm để lưu deeplink
export const savePendingDeepLink = (url: string) => {
  console.log("[DeepLink] Saving pending deep link:", url);
  pendingDeepLinkCache = url;
};

// Hàm để lấy và xóa deeplink đã lưu
export const consumePendingDeepLink = () => {
  const url = pendingDeepLinkCache;
  pendingDeepLinkCache = null;
  return url;
};

/**
 * Process a deep link URL and navigate to the appropriate screen
 * This can be called after login when a deep link was saved
 * 
 * @param url The deep link URL to process
 */
export function processDeepLink(url: string) {
  try {
    // Validate the URL
    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.error("[DeepLink] Invalid URL provided to processDeepLink:", url);
      return;
    }
    
    console.log("[DeepLink] Processing URL:", url);
    
    // Only process apppickdev:// URLs
    if (!url.startsWith('apppickdev://') && !url.includes('oms.seedcom.vn')) {
      console.log("[DeepLink] Skipping non-scheme URL:", url);
      return;
    }
    
    // Parse the URL into path and query parameters
    const parsedLink = Linking.parse(url);
    console.log("[DeepLink] Parsed:", parsedLink);
    
    // Get the path from the URL
    let path = "";
    if (url.startsWith('apppickdev://')) {
      // Remove the scheme and any trailing slashes
      path = url.replace('apppickdev://', '').split('?')[0];
    } else {
      try {
        // Use the URL API for standard URL parsing
        const urlObj = new URL(url);
        path = urlObj.pathname.replace(/^\/+/, '');
      } catch (e) {
        // If URL parsing fails, use simple string manipulation
        const withoutProtocol = url.replace(/^(https?:\/\/|[^:]+:\/\/)/, '');
        // Remove domain if present
        path = withoutProtocol.includes('/') 
          ? withoutProtocol.substring(withoutProtocol.indexOf('/') + 1) 
          : withoutProtocol;
        path = path.replace(/^\/+/, '').split('?')[0];
      }
    }

    console.log("[DeepLink] Extracted path:", path);
    
    // Handle cases where the domain is included in the URL path
    if (path.includes('oms.seedcom.vn/')) {
      path = path.split('oms.seedcom.vn/')[1];
      console.log("[DeepLink] Fixed path after domain removal:", path);
    }
    
    // Extract parameters from the query string
    const { orderCode, deliveryCode } = parsedLink.queryParams || {};
    console.log("[DeepLink] Query params:", { orderCode, deliveryCode });
    
    // Determine which path to route to
    if (path === '' || path === '/') {
      // Empty path, default to orders screen
      console.log("[DeepLink] Routing to default orders screen");
      router.navigate('/orders');
      return;
    }
    
    // Route based on path and required parameters
    if (path.includes(DeepLinkPath.ORDER_DETAIL) && orderCode) {
      console.log(`[DeepLink] Routing to order detail with code: ${orderCode}`);
      try {
        router.replace(`/orders/order-detail/${orderCode}`);
      } catch (error) {
        console.error('[DeepLink] Navigation error:', error);
        router.navigate('/orders');
      }
    } else if (path.includes(DeepLinkPath.ORDER_INVOICE) && orderCode) {
      console.log(`[DeepLink] Routing to order invoice with code: ${orderCode}`);
      try {
        router.replace(`/orders/order-invoice/${orderCode}`);
      } catch (error) {
        console.error('[DeepLink] Navigation error:', error);
        router.navigate('/orders');
      }
    } else if (path.includes(DeepLinkPath.SCAN_TO_DELIVERY) && deliveryCode) {
      console.log(`[DeepLink] Routing to scan to delivery with code: ${deliveryCode}`);
      try {
        router.replace(`/orders/order-scan-to-delivery/${deliveryCode}`);
      } catch (error) {
        console.error('[DeepLink] Navigation error:', error);
        router.navigate('/orders');
      }
    } else if (path.includes(DeepLinkPath.ORDERS)) {
      console.log('[DeepLink] Routing to orders list');
      try {
        router.navigate('/orders');
      } catch (error) {
        console.error('[DeepLink] Navigation error:', error);
      }
    } else {
      // If we have parsed query params but no matching path, try to use them
      if (orderCode) {
        console.log(`[DeepLink] Fallback: Routing to order detail with code: ${orderCode}`);
        try {
          router.replace(`/orders/order-detail/${orderCode}`);
        } catch (error) {
          console.error('[DeepLink] Navigation error:', error);
          router.navigate('/orders');
        }
      } else if (deliveryCode) {
        console.log(`[DeepLink] Fallback: Routing to scan to delivery with code: ${deliveryCode}`);
        try {
          router.replace(`/orders/order-scan-to-delivery/${deliveryCode}`);
        } catch (error) {
          console.error('[DeepLink] Navigation error:', error);
          router.navigate('/orders');
        }
      } else {
        // Fallback to orders screen if no matches
        console.log('[DeepLink] Fallback: Routing to orders list');
        router.navigate('/orders');
      }
    }
  } catch (error) {
    console.error('[DeepLink] Error processing deep link:', error);
    showMessage({
      message: "Không thể xử lý liên kết",
      type: "danger",
    });
    // Try to navigate to a safe location
    try {
      router.navigate('/orders');
    } catch (navError) {
      console.error('[DeepLink] Error navigating to fallback screen:', navError);
    }
  }
}

/**
 * Hook to handle deep links in the app
 * This enables the app to respond to links from other apps and browser URLs
 */
const useHandleDeepLink = () => {
  const [data, setData] = useState<any>(null);
  const status = useAuth.use.status();
  // Track if we've already handled redirection to login
  const isRedirectingToLogin = useRef(false);

  // Check for pending deeplink when authentication status changes
  useEffect(() => {
    if (status === 'signIn') {
      const pendingUrl = consumePendingDeepLink();
      if (pendingUrl) {
        console.log("[DeepLink] Found pending deeplink after login:", pendingUrl);
        // Allow some time for navigation to settle
        setTimeout(() => {
          try {
            processDeepLink(pendingUrl);
          } catch (error) {
            console.error('[DeepLink] Error processing pending deep link:', error);
          }
        }, 500);
      }
      // Reset redirect flag
      isRedirectingToLogin.current = false;
    }
  }, [status]);

  /**
   * Handle incoming deep links and route to appropriate screens
   */
  function handleDeepLink(event: { url: string }) {
    try {
      // Safety check - ensure url exists
      if (!event || !event.url) {
        console.log("[DeepLink] Invalid event or missing URL");
        return;
      }
      
      const url = event.url;
      console.log("[DeepLink] Received URL:", url);
      
      // Only process apppickdev:// URLs
      if (!url.startsWith('apppickdev://') && !url.includes('oms.seedcom.vn')) {
        console.log("[DeepLink] Skipping non-dev scheme URL:", url);
        return;
      }
      
      // Check if user is authenticated
      if (status === 'signOut') {
        // Avoid multiple redirects
        if (isRedirectingToLogin.current) {
          console.log("[DeepLink] Already redirecting to login, skipping duplicate redirect");
          return;
        }
        
        try {
          console.log("[DeepLink] User not authenticated, saving deep link for later");
          savePendingDeepLink(url);
          isRedirectingToLogin.current = true;
          
          // Wrap in setTimeout to avoid navigation race conditions
          setTimeout(() => {
            try {
              router.navigate('/login');
            } catch (navError) {
              console.error("[DeepLink] Error navigating to login:", navError);
              isRedirectingToLogin.current = false;
            }
          }, 100);
        } catch (error) {
          console.error("[DeepLink] Error handling unauthenticated deeplink:", error);
          isRedirectingToLogin.current = false;
        }
        return;
      }
      
      // User is authenticated, process the deep link
      processDeepLink(url);
    } catch (error) {
      console.error('[DeepLink] Error in handleDeepLink:', error);
      // Reset flag on error to allow future attempts
      isRedirectingToLogin.current = false;
    }
  }

  useEffect(() => {
    console.log("[DeepLink] Setting up listeners for apppickdev:// scheme");
    
    // Handle deep links when app is opened from a link (cold start)
    const initializeInitialUrl = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          console.log("[DeepLink] Processing initial URL after app start/reload:", url);
          // Add a small delay to ensure navigation is ready
          setTimeout(() => {
            handleDeepLink({ url });
          }, 500);
        }
      } catch (error) {
        console.error('[DeepLink] Error getting initial URL:', error);
      }
    };
    
    // Execute with a slight delay to ensure app is fully initialized
    setTimeout(() => {
      initializeInitialUrl();
    }, 200);

    // Handle deep links when app is already open (warm start)
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("[DeepLink] Received event from listener:", event);
      handleDeepLink(event);
    });
    
    // Force check if there are pending URLs that were missed
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log("[DeepLink] Found pending URL on listener setup:", url);
        handleDeepLink({ url });
      }
    });
    
    return () => {
      console.log("[DeepLink] Removing listeners");
      subscription.remove();
    };
  }, []);

  return { data };
};

export default useHandleDeepLink;
