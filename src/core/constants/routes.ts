/**
 * Application Route Constants
 *
 * Centralized route definitions for type safety and maintainability.
 * All routes should use these constants instead of hardcoded strings.
 */

/**
 * Authentication routes
 */
export const AUTH_ROUTES = {
  LOGIN: '/login',
  AUTHORIZE: '/authorize',
} as const;

/**
 * Main application routes (authenticated routes)
 *
 * These are the main routes of the app that require authentication.
 * They are organized in the `(drawer)` route group for shared layout,
 * but the name doesn't imply drawer-specific usage.
 *
 * Note: `(drawer)` is a route group and doesn't create a URL segment.
 * Both `/(drawer)/orders` and `/orders` resolve to the same route.
 * We use `/orders` format (without drawer prefix) for simplicity.
 *
 * Use these routes for:
 * - From login/authorize into app
 * - Deep link navigation
 * - Cross-stack navigation
 * - Stack navigation with router.push()
 */
export const APP_ROUTES = {
  // Orders listing
  ORDERS: '/orders',

  // Order detail screens
  ORDER_PICK: (code: string) => `/orders/order-pick/${code}`,
  ORDER_INVOICE: (code: string) => `/orders/order-invoice/${code}`,
  ORDER_DETAIL: (code: string) => `/orders/order-detail/${code}`,
  ORDER_BAGS: (code: string) => `/orders/order-bags/${code}`,

  // Delivery screens
  ORDER_SCAN_TO_DELIVERY: (code: string) =>
    `/orders/order-scan-to-delivery/${code}`,
  STORE_START_SCAN_TO_DELIVERY: (code: string) =>
    `/orders/store-start-order-scan-to-delivery/${code}`,
  STORE_COMPLETE_SCAN_TO_DELIVERY: (code: string) =>
    `/orders/store-complete-order-scan-to-delivery/${code}`,

  // Other screens
  PRINT_PREVIEW: '/orders/print-preview',

  // Settings
  SETTINGS: '/settings',
} as const;

/**
 * Deep link path segments (without domain/scheme)
 */
export const DEEP_LINK_PATHS = {
  ORDER_PICK: 'order-pick',
  ORDER_INVOICE: 'order-invoice',
  SCAN_TO_DELIVERY: 'scan-to-delivery',
  ORDERS: 'orders',
} as const;

/**
 * Route parameter names
 */
export const ROUTE_PARAMS = {
  ORDER_CODE: 'orderCode',
  DELIVERY_CODE: 'deliveryCode',
  CODE: 'code',
  BAG_CODE: 'bagCode',
  TYPE: 'type',
  STATUS: 'status',
} as const;

/**
 * Type helpers for route parameters
 */
export type RouteParams = {
  orderCode?: string;
  deliveryCode?: string;
  code?: string;
  bagCode?: string;
  type?: string;
  status?: string;
};

/**
 * Helper function to build route with params
 */
export const buildRouteWithParams = (
  path: string,
  params?: Record<string, string | number | undefined>,
): string => {
  if (!params || Object.keys(params).length === 0) {
    return path;
  }

  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');

  return queryString ? `${path}?${queryString}` : path;
};

/**
 * Export all routes as a single object for convenience
 */
export const ROUTES = {
  AUTH: AUTH_ROUTES,
  APP: APP_ROUTES,
  DEEP_LINK: DEEP_LINK_PATHS,
  PARAMS: ROUTE_PARAMS,
} as const;

/**
 * @deprecated Use ROUTES.APP instead. DRAWER_ROUTES has been renamed to APP_ROUTES.
 */
export const DRAWER_ROUTES = APP_ROUTES;

/**
 * @deprecated Use ROUTES.APP instead. MAIN_ROUTES and RELATIVE_ROUTES have been merged.
 */
export const MAIN_ROUTES = APP_ROUTES;

/**
 * @deprecated Use ROUTES.APP instead. MAIN_ROUTES and RELATIVE_ROUTES have been merged.
 */
export const RELATIVE_ROUTES = APP_ROUTES;

export default ROUTES;
