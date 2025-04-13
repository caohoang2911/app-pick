import { Platform } from 'react-native';

/**
 * Deep link paths available in the app
 */
export enum DeepLinkPath {
  ORDER_DETAIL = 'order-detail',
  ORDER_INVOICE = 'order-invoice',
  SCAN_TO_DELIVERY = 'scan-to-delivery',
  ORDERS = 'orders'
}

/**
 * Generate a deep link URL that can be used from other apps
 * 
 * @param path - The path for the deep link
 * @param params - Query parameters to include in the URL
 * @param useDevScheme - Use development scheme instead of production
 * @returns A deep link URL that can be used to open this app
 * 
 */

const host = 'oms.seedcom.vn';
export const generateDeepLink = (
  path: DeepLinkPath, 
  params: Record<string, string> = {},
  useDevScheme: boolean = true // Default to true to always use dev scheme
): string => {
  // App scheme for direct deep links - always use dev scheme
  const scheme = 'apppick://';
  
  // Build query string from params
  const queryString = Object.keys(params).length 
    ? '?' + Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    : '';
  
  return `${scheme}${host}/${path}${queryString}`;
};

/**
 * Generate a web link URL that can be used from browsers or other apps
 * which will redirect to the app if installed
 * 
 * @param path - The path for the deep link
 * @param params - Query parameters to include in the URL
 * @returns A web link URL that can redirect to this app
 */
export const generateWebDeepLink = (
  path: DeepLinkPath, 
  params: Record<string, string> = {}
): string => {
  // Web domain for universal/app links
  const webDomain = 'https://oms.seedcom.vn/';
  
  // Build query string from params
  const queryString = Object.keys(params).length 
    ? '?' + Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    : '';
  
  return `${webDomain}${path}${queryString}`;
};

/**
 * Examples:
 * 
 * // Direct app link to order detail
 * const orderDetailLink = generateDeepLink(DeepLinkPath.ORDER_DETAIL, { orderCode: '123456' });
 * // Result: "apppick://order-detail?orderCode=123456"
 * 
 * // Web link to order invoice (universal/app link)
 * const orderInvoiceWebLink = generateWebDeepLink(DeepLinkPath.ORDER_INVOICE, { orderCode: '123456' });
 * // Result: "https://oms.seedcom.vn/order-invoice?orderCode=123456"
 */ 