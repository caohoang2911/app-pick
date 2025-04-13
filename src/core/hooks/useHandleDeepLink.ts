import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { DeepLinkPath } from "../utils/deepLink";
import { showMessage } from "react-native-flash-message";
import { Platform } from "react-native";

/**
 * Hook to handle deep links in the app
 * This enables the app to respond to links from other apps and browser URLs
 */
const useHandleDeepLink = () => {
  const [data, setData] = useState<any>(null);

  /**
   * Extract the path from a URL accounting for different formats across platforms
   */
  function extractPathFromUrl(url: string): string {
    console.log("[DeepLink] Extracting path from URL:", url);
    
    // Only handle apppickdev:// scheme
    if (url.startsWith('apppickdev://')) {
      // Remove the scheme and any trailing slashes
      const path = url.replace('apppickdev://', '').split('?')[0];
      console.log("[DeepLink] Extracted path from apppickdev:// URL:", path);
      return path;
    }
    
    try {
      // Use the URL API for standard URL parsing
      const urlObj = new URL(url);
      const path = urlObj.pathname.replace(/^\/+/, '');
      console.log("[DeepLink] Extracted path using URL API:", path);
      return path;
    } catch (e) {
      // If URL parsing fails, use simple string manipulation
      // Remove the protocol and domain parts
      const withoutProtocol = url.replace(/^(https?:\/\/|[^:]+:\/\/)/, '');
      // Remove domain if present
      const pathPart = withoutProtocol.includes('/') 
        ? withoutProtocol.substring(withoutProtocol.indexOf('/') + 1) 
        : withoutProtocol;
        
      const path = pathPart.replace(/^\/+/, '').split('?')[0];
      console.log("[DeepLink] Extracted path using fallback method:", path);
      return path;
    }
  }

  /**
   * Handle incoming deep links and route to appropriate screens
   */
  function handleDeepLink(event: { url: string }) {
    try {
      const url = event.url;
      console.log("[DeepLink] Received URL:", url);
      
      // Only process apppickdev:// URLs in the dev environment
      if (!url.startsWith('apppickdev://') && !url.includes('oms.seedcom.vn')) {
        console.log("[DeepLink] Skipping non-dev scheme URL:", url);
        return;
      }
      
      // Print additional debug info
      if (__DEV__) {
        console.log("[DeepLink DEBUG] Current app configuration:");
        console.log("- Using scheme: apppickdev:// (Development)");
        console.log("- Bundle ID (iOS): com.caohoang2911.seedcom-app-pick-dev");
        console.log("- Package (Android): com.caohoang2911.AppPickDev");
      }
      
      // Parse the URL into path and query parameters
      const parsedLink = Linking.parse(url);
      console.log("[DeepLink] Parsed:", parsedLink);
      
      // Get the path using our custom extractor that works across platforms
      let path = extractPathFromUrl(url);
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
      console.error('[DeepLink] Error handling deep link:', error);
      showMessage({
        message: "Không thể xử lý liên kết",
        type: "danger",
      });
      router.navigate('/orders');
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
