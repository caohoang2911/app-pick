/**
 * Navigation Helper Utilities
 *
 * Centralized navigation functions with error handling and logging.
 * Use these helpers instead of calling router directly for better maintainability.
 */

import { router } from 'expo-router';
import { showMessage } from 'react-native-flash-message';
import { ROUTES } from '../constants/routes';

/**
 * Safe navigation with error handling
 */
const safeNavigate = (
  action: () => void,
  fallbackRoute?: string,
  errorMessage?: string,
) => {
  try {
    action();
  } catch (error) {
    console.error('[Navigation] Error:', error);

    if (errorMessage) {
      showMessage({
        message: errorMessage,
        type: 'danger',
      });
    }

    // Fallback to safe route
    if (fallbackRoute) {
      try {
        router.navigate(fallbackRoute as any);
      } catch (fallbackError) {
        console.error(
          '[Navigation] Fallback navigation failed:',
          fallbackError,
        );
      }
    }
  }
};

/**
 * Navigate to login screen
 */
export const navigateToLogin = () => {
  safeNavigate(
    () => router.replace(ROUTES.AUTH.LOGIN as any),
    undefined,
    'Không thể chuyển đến trang đăng nhập',
  );
};

/**
 * Navigate to authorize screen
 */
export const navigateToAuthorize = () => {
  safeNavigate(
    () => router.push(ROUTES.AUTH.AUTHORIZE as any),
    ROUTES.AUTH.LOGIN,
    'Không thể chuyển đến trang xác thực',
  );
};

/**
 * Navigate to orders list
 */
export const navigateToOrders = () => {
  safeNavigate(
    () => router.navigate(ROUTES.APP.ORDERS as any),
    undefined,
    'Không thể chuyển đến danh sách đơn hàng',
  );
};

/**
 * Replace current route with orders list
 */
// export const replaceWithOrders = () => {
//   safeNavigate(
//     () => router.replace(ROUTES.APP.ORDERS as any),
//     undefined,
//     'Không thể chuyển đến danh sách đơn hàng',
//   );
// };

/**
 * Navigate to order pick screen
 */
export const navigateToOrderPick = (
  orderCode: string,
  params?: { status?: string },
) => {
  const route = ROUTES.APP.ORDER_PICK(orderCode);

  safeNavigate(
    () => {
      if (params) {
        router.push({ pathname: route as any, params });
      } else {
        router.push(route as any);
      }
    },
    ROUTES.APP.ORDERS,
    'Không thể mở chi tiết đơn hàng',
  );
};

/**
 * Replace current route with order pick screen
 */
export const replaceWithOrderPick = (orderCode: string) => {
  safeNavigate(
    () => router.replace(ROUTES.APP.ORDER_PICK(orderCode) as any),
    ROUTES.APP.ORDERS,
    'Không thể mở chi tiết đơn hàng',
  );
};

/**
 * Navigate to order invoice screen
 */
export const navigateToOrderInvoice = (orderCode: string) => {
  const route = ROUTES.APP.ORDER_INVOICE(orderCode);

  safeNavigate(
    () => router.push(route as any),
    ROUTES.APP.ORDERS,
    'Không thể mở phiếu xuất kho',
  );
};

/**
 * Replace current route with order invoice screen
 */
export const replaceWithOrderInvoice = (orderCode: string) => {
  safeNavigate(
    () => router.replace(ROUTES.APP.ORDER_INVOICE(orderCode) as any),
    ROUTES.APP.ORDERS,
    'Không thể mở phiếu xuất kho',
  );
};

/**
 * Navigate to order bags screen
 */
export const navigateToOrderBags = (orderCode: string) => {
  const route = ROUTES.APP.ORDER_BAGS(orderCode);

  safeNavigate(
    () => router.push(route as any),
    ROUTES.APP.ORDERS,
    'Không thể mở danh sách túi hàng',
  );
};

/**
 * Navigate to order scan to delivery screen
 */
export const navigateToOrderScanToDelivery = (orderCode: string) => {
  const route = ROUTES.APP.ORDER_SCAN_TO_DELIVERY(orderCode);

  safeNavigate(
    () => router.push(route as any),
    ROUTES.APP.ORDERS,
    'Không thể mở màn hình giao hàng',
  );
};

/**
 * Replace current route with scan to delivery screen
 */
export const replaceWithScanToDelivery = (deliveryCode: string) => {
  safeNavigate(
    () =>
      router.replace(ROUTES.APP.ORDER_SCAN_TO_DELIVERY(deliveryCode) as any),
    ROUTES.APP.ORDERS,
    'Không thể mở màn hình giao hàng',
  );
};

/**
 * Navigate to store start scan to delivery
 */
export const navigateToStoreStartScanToDelivery = (code: string) => {
  safeNavigate(
    () =>
      router.push(ROUTES.APP.STORE_START_ORDER_SCAN_TO_DELIVERY(code) as any),
    ROUTES.APP.ORDERS,
    'Không thể mở màn hình bắt đầu giao hàng',
  );
};

/**
 * Navigate to store complete scan to delivery
 */
export const navigateToStoreCompleteScanToDelivery = (code: string) => {
  safeNavigate(
    () =>
      router.push(
        ROUTES.APP.STORE_COMPLETE_ORDER_SCAN_TO_DELIVERY(code) as any,
      ),
    ROUTES.APP.ORDERS,
    'Không thể mở màn hình hoàn thành giao hàng',
  );
};

/**
 * Replace with store complete scan to delivery
 */
export const replaceWithStoreCompleteScanToDelivery = (code: string) => {
  safeNavigate(
    () =>
      router.replace(
        ROUTES.APP.STORE_COMPLETE_ORDER_SCAN_TO_DELIVERY(code) as any,
      ),
    ROUTES.APP.ORDERS,
    'Không thể chuyển đến màn hình hoàn thành',
  );
};

/**
 * Navigate to print preview screen
 */
export const navigateToPrintPreview = (params?: {
  code?: string;
  bagCode?: string;
  type?: string;
}) => {
  const route = params
    ? `${ROUTES.APP.PRINT_PREVIEW}?${new URLSearchParams(params as any).toString()}`
    : ROUTES.APP.PRINT_PREVIEW;

  safeNavigate(
    () => router.push(route as any),
    ROUTES.APP.ORDERS,
    'Không thể mở trang in',
  );
};

/**
 * Navigate to settings screen
 */
export const navigateToSettings = () => {
  safeNavigate(
    () => router.navigate(ROUTES.APP.SETTINGS as any),
    undefined,
    'Không thể mở cài đặt',
  );
};

/**
 * Go back to previous screen
 */
export const goBack = (fallbackRoute?: string) => {
  safeNavigate(
    () => {
      if (router.canGoBack()) {
        router.back();
      } else if (fallbackRoute) {
        router.navigate(fallbackRoute as any);
      } else {
        router.navigate(ROUTES.APP.ORDERS as any);
      }
    },
    undefined,
    'Không thể quay lại',
  );
};

/**
 * Navigation helpers object for export
 */
export const NavigationHelpers = {
  // Auth
  toLogin: navigateToLogin,
  toAuthorize: navigateToAuthorize,

  // Orders
  toOrders: navigateToOrders,
  // replaceWithOrders,

  // Order details
  toOrderPick: navigateToOrderPick,
  replaceWithOrderPick,
  toOrderInvoice: navigateToOrderInvoice,
  replaceWithOrderInvoice,
  toOrderBags: navigateToOrderBags,

  // Delivery
  toOrderScanToDelivery: navigateToOrderScanToDelivery,
  replaceWithScanToDelivery,
  toStoreStartScanToDelivery: navigateToStoreStartScanToDelivery,
  toStoreCompleteScanToDelivery: navigateToStoreCompleteScanToDelivery,
  replaceWithStoreCompleteScanToDelivery,

  // Other
  toPrintPreview: navigateToPrintPreview,
  toSettings: navigateToSettings,
  goBack,
};

export default NavigationHelpers;
