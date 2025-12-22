import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { showMessage } from "react-native-flash-message";
import { useAuth } from "../store/auth";
import { DeepLinkPath } from "../utils/deepLink";
import { ROUTES } from "../constants/routes";
import { NavigationHelpers } from "../utils/navigation";

let pendingDeepLinkCache: string | null = null;

export const savePendingDeepLink = (url: string) => {
  console.log("[DeepLink] Saving pending deep link:", url);
  pendingDeepLinkCache = url;
};

export const consumePendingDeepLink = () => {
  const url = pendingDeepLinkCache;
  pendingDeepLinkCache = null;
  return url;
};

/**
 * Process deep link and navigate to appropriate screen
 */
export function processDeepLink(url: string) {
  try {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      console.error("[DeepLink] Invalid URL provided to processDeepLink:", url);
      return;
    }
    
    console.log("[DeepLink] Processing URL:", url);
    
    if (!url.startsWith('apppick://') && !url.includes('oms.seedcom.vn')) {
      console.log("[DeepLink] Skipping non-scheme URL:", url);
      return;
    }
    
    const parsedLink = Linking.parse(url);
    console.log("[DeepLink] Parsed:", parsedLink);
    
    // Extract path from URL
    let path = extractPathFromUrl(url);
    console.log("[DeepLink] Extracted path:", path);
    
    const { orderCode, deliveryCode } = parsedLink.queryParams || {};
    console.log("[DeepLink] Query params:", { orderCode, deliveryCode });
    
    // Route to appropriate screen based on path
    routeByPath(path, orderCode as string, deliveryCode as string);
    
  } catch (error) {
    console.error('[DeepLink] Error processing deep link:', error);
    showMessage({
      message: "Không thể xử lý liên kết",
      type: "danger",
    });
    NavigationHelpers.toOrders();
  }
}

/**
 * Extract clean path from deep link URL
 */
function extractPathFromUrl(url: string): string {
  let path = "";
  
  if (url.startsWith('apppick://')) {
    path = url.replace('apppick://', '').split('?')[0];
  } else {
    try {
      const urlObj = new URL(url);
      path = urlObj.pathname.replace(/^\/+/, '');
    } catch (e) {
      const withoutProtocol = url.replace(/^(https?:\/\/|[^:]+:\/\/)/, '');
      path = withoutProtocol.includes('/') 
        ? withoutProtocol.substring(withoutProtocol.indexOf('/') + 1) 
        : withoutProtocol;
      path = path.replace(/^\/+/, '').split('?')[0];
    }
  }
  
  // Remove domain from path if present
  if (path.includes('oms.seedcom.vn/')) {
    path = path.split('oms.seedcom.vn/')[1];
    console.log("[DeepLink] Fixed path after domain removal:", path);
  }
  
  return path;
}

/**
 * Route to screen based on path and parameters
 */
function routeByPath(path: string, orderCode?: string, deliveryCode?: string) {
  // Empty path - go to orders
  if (path === '' || path === '/') {
    console.log("[DeepLink] Routing to default orders screen");
    NavigationHelpers.toOrders();
    return;
  }
  
  // Route mapping with constants
  const routeMap: Record<string, () => void> = {
    [ROUTES.DEEP_LINK.ORDER_PICK]: () => {
      if (orderCode) {
        console.log(`[DeepLink] Routing to order pick with code: ${orderCode}`);
        NavigationHelpers.replaceWithOrderPick(orderCode);
      } else {
        NavigationHelpers.toOrders();
      }
    },
    [ROUTES.DEEP_LINK.ORDER_INVOICE]: () => {
      if (orderCode) {
        console.log(`[DeepLink] Routing to order invoice with code: ${orderCode}`);
        NavigationHelpers.replaceWithOrderInvoice(orderCode);
      } else {
        NavigationHelpers.toOrders();
      }
    },
    [ROUTES.DEEP_LINK.SCAN_TO_DELIVERY]: () => {
      if (deliveryCode) {
        console.log(`[DeepLink] Routing to scan to delivery with code: ${deliveryCode}`);
        NavigationHelpers.replaceWithScanToDelivery(deliveryCode);
      } else {
        NavigationHelpers.toOrders();
      }
    },
    [ROUTES.DEEP_LINK.ORDERS]: () => {
      console.log('[DeepLink] Routing to orders list');
      NavigationHelpers.toOrders();
    },
  };
  
  // Find matching route
  for (const [key, handler] of Object.entries(routeMap)) {
    if (path.includes(key)) {
      handler();
      return;
    }
  }
  
  // Fallback logic
  console.log('[DeepLink] No specific route matched, using fallback logic');
  if (orderCode) {
    console.log(`[DeepLink] Fallback: Routing to order pick with code: ${orderCode}`);
    NavigationHelpers.replaceWithOrderPick(orderCode);
  } else if (deliveryCode) {
    console.log(`[DeepLink] Fallback: Routing to scan to delivery with code: ${deliveryCode}`);
    NavigationHelpers.replaceWithScanToDelivery(deliveryCode);
  } else {
    console.log('[DeepLink] Fallback: Routing to orders list');
    NavigationHelpers.toOrders();
  }
}

const useHandleDeepLink = () => {
  const [data, setData] = useState<any>(null);
  const status = useAuth.use.status();
  const isRedirectingToLogin = useRef(false);

  useEffect(() => {
    if (status === 'signIn') {
      const pendingUrl = consumePendingDeepLink();
      if (pendingUrl) {
        console.log("[DeepLink] Found pending deeplink after login:", pendingUrl);
        setTimeout(() => {
          try {
            processDeepLink(pendingUrl);
          } catch (error) {
            console.error('[DeepLink] Error processing pending deep link:', error);
          }
        }, 500);
      }
      isRedirectingToLogin.current = false;
    }
  }, [status]);

  function handleDeepLink(event: { url: string }) {
    try {
      if (!event || !event.url) {
        console.log("[DeepLink] Invalid event or missing URL");
        return;
      }
      
      const url = event.url;
      console.log("[DeepLink] Received URL:", url);
      
      if (!url.startsWith('apppick://') && !url.includes('oms.seedcom.vn')) {
        console.log("[DeepLink] Skipping non-dev scheme URL:", url);
        return;
      }
      
      if (status === 'signOut') {
        if (isRedirectingToLogin.current) {
          console.log("[DeepLink] Already redirecting to login, skipping duplicate redirect");
          return;
        }
        
        try {
          console.log("[DeepLink] User not authenticated, saving deep link for later");
          savePendingDeepLink(url);
          isRedirectingToLogin.current = true;
          
          setTimeout(() => {
            try {
              NavigationHelpers.toLogin();
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
      
      processDeepLink(url);
    } catch (error) {
      console.error('[DeepLink] Error in handleDeepLink:', error);
      isRedirectingToLogin.current = false;
    }
  }

  useEffect(() => {
    console.log("[DeepLink] Setting up listeners for apppick:// scheme");
    
    const initializeInitialUrl = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url) {
          console.log("[DeepLink] Processing initial URL after app start/reload:", url);
          setTimeout(() => {
            handleDeepLink({ url });
          }, 500);
        }
      } catch (error) {
        console.error('[DeepLink] Error getting initial URL:', error);
      }
    };
    
    setTimeout(() => {
      initializeInitialUrl();
    }, 200);

    const subscription = Linking.addEventListener("url", (event) => {
      console.log("[DeepLink] Received event from listener:", event);
      handleDeepLink(event);
    });
    
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
