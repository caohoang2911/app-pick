# 📖 Routes Quick Reference Guide

> Tra cứu nhanh về routing trong app. Xem chi tiết đầy đủ tại `REFACTOR_NOTES.md`

---

## 🚀 Import

```typescript
import { ROUTES } from '@/core/constants/routes';
import { NavigationHelpers } from '@/core/utils/navigation';
```

---

## 📊 5 Loại Routes - So Sánh Nhanh

| Type          | Format             | Slash | Drawer | URL Thực           | Dùng khi         | Method           |
| ------------- | ------------------ | ----- | ------ | ------------------ | ---------------- | ---------------- |
| **AUTH**      | `/login`           | ✅    | ❌     | `/login`           | Auth screens     | navigate/replace |
| **MAIN**      | `/(drawer)/orders` | ✅    | ✅\*   | `/orders`          | Outside → Drawer | navigate/replace |
| **RELATIVE**  | `/orders`          | ✅    | ❌     | `/orders`          | Inside drawer    | push/navigate    |
| **NESTED**    | `orders/pick/ABC`  | ❌    | ❌     | `/orders/pick/ABC` | Same stack       | push             |
| **DEEP_LINK** | `order-pick`       | ❌    | ❌     | N/A                | Parse links      | N/A              |

> \*Lưu ý: `(drawer)` là Route Group, **KHÔNG** tạo segment trong URL. Xem `DRAWER_ROUTE_GROUP_EXPLAINED.md` để hiểu rõ.

---

## 🎯 Decision Trees

### Chọn Route Type

```
Đang ở đâu?
├─ Ngoài app (login) → MAIN_ROUTES
├─ Trong drawer
│  ├─ Cùng stack → NESTED_ROUTES
│  └─ Khác stack → RELATIVE_ROUTES
└─ Parse deep link → DEEP_LINK_PATHS
```

### Chọn Router Method

```
Muốn gì?
├─ User back được → push()
├─ Main navigation → navigate()
└─ Clear stack → replace()
```

---

## 💡 Use Cases Phổ Biến

### 1. Login → App

```typescript
// ✅ Clear login screen
router.replace(ROUTES.MAIN.ORDERS);
```

### 2. Orders List → Order Detail

```typescript
// ✅ Có back button
router.push(ROUTES.NESTED.ORDER_PICK('ABC123'));
```

### 3. Order → Settings (Cross-stack)

```typescript
// ✅ Navigate to another stack
router.navigate(ROUTES.RELATIVE.SETTINGS);
```

### 4. Deep Link Processing

```typescript
// ✅ Replace current screen
if (path.includes(ROUTES.DEEP_LINK.ORDER_PICK)) {
  router.replace(ROUTES.RELATIVE.ORDER_PICK(orderCode));
}
```

### 5. Back với Fallback

```typescript
// ✅ Safe back
NavigationHelpers.goBack(); // Auto fallback to orders
```

### 6. URL với Query Params

```typescript
// ✅ Build URL
const url = buildRouteWithParams(ROUTES.RELATIVE.PRINT_PREVIEW, {
  code: 'ABC123',
  type: 'bag',
});
// → '/orders/print-preview?code=ABC123&type=bag'
```

---

## 🔀 Router Methods Chi Tiết

### `router.push()`

- **Stack:** Add new screen
- **Back:** ✅ Có
- **Dùng:** Detail screens, sub-flows
- **Routes:** NESTED, RELATIVE

```typescript
router.push(ROUTES.NESTED.ORDER_PICK('ABC123'));
// Stack: [list, detail] ← có back
```

### `router.navigate()`

- **Stack:** Smart navigation
- **Back:** ✅ Có (conditional)
- **Dùng:** Main screens, cross-stack
- **Routes:** MAIN, RELATIVE

```typescript
router.navigate(ROUTES.RELATIVE.SETTINGS);
// Navigate to settings ← có back
```

### `router.replace()`

- **Stack:** Replace current
- **Back:** ❌ Không
- **Dùng:** After login, deep links
- **Routes:** MAIN, RELATIVE

```typescript
router.replace(ROUTES.MAIN.ORDERS);
// Replace login ← không back về login
```

---

## 📚 Routes Reference

### AUTH_ROUTES

```typescript
ROUTES.AUTH.LOGIN; // '/login'
ROUTES.AUTH.AUTHORIZE; // '/authorize'
```

### MAIN_ROUTES (Full Path)

```typescript
ROUTES.MAIN.ORDERS; // '/(drawer)/orders'
ROUTES.MAIN.ORDER_PICK(code); // '/(drawer)/orders/order-pick/[code]'
ROUTES.MAIN.ORDER_INVOICE(code); // '/(drawer)/orders/order-invoice/[code]'
ROUTES.MAIN.ORDER_BAGS(code); // '/(drawer)/orders/order-bags/[code]'
ROUTES.MAIN.ORDER_SCAN_TO_DELIVERY(code); // '/(drawer)/orders/order-scan-to-delivery/[code]'
ROUTES.MAIN.SETTINGS; // '/settings'
```

### RELATIVE_ROUTES (Có /)

```typescript
ROUTES.RELATIVE.ORDERS; // '/orders'
ROUTES.RELATIVE.ORDER_PICK(code); // '/orders/order-pick/[code]'
ROUTES.RELATIVE.ORDER_INVOICE(code); // '/orders/order-invoice/[code]'
ROUTES.RELATIVE.ORDER_BAGS(code); // '/orders/order-bags/[code]'
ROUTES.RELATIVE.ORDER_SCAN_TO_DELIVERY(code); // '/orders/order-scan-to-delivery/[code]'
ROUTES.RELATIVE.STORE_START_SCAN_TO_DELIVERY(code);
ROUTES.RELATIVE.STORE_COMPLETE_SCAN_TO_DELIVERY(code);
ROUTES.RELATIVE.PRINT_PREVIEW; // '/orders/print-preview'
ROUTES.RELATIVE.SETTINGS; // '/settings'
```

### NESTED_ROUTES (Không /)

```typescript
ROUTES.NESTED.ORDER_PICK(code); // 'orders/order-pick/[code]'
ROUTES.NESTED.ORDER_INVOICE(code); // 'orders/order-invoice/[code]'
ROUTES.NESTED.ORDER_BAGS(code); // 'orders/order-bags/[code]'
ROUTES.NESTED.ORDER_SCAN_TO_DELIVERY(code); // 'orders/order-scan-to-delivery/[code]'
```

### DEEP_LINK_PATHS (Segments)

```typescript
ROUTES.DEEP_LINK.ORDER_PICK; // 'order-pick'
ROUTES.DEEP_LINK.ORDER_INVOICE; // 'order-invoice'
ROUTES.DEEP_LINK.SCAN_TO_DELIVERY; // 'scan-to-delivery'
ROUTES.DEEP_LINK.ORDERS; // 'orders'
```

---

## 🛠️ Navigation Helpers

### Authentication

```typescript
NavigationHelpers.toLogin();
NavigationHelpers.toAuthorize();
```

### Orders

```typescript
NavigationHelpers.toOrders();
NavigationHelpers.replaceWithOrders();
```

### Order Details

```typescript
NavigationHelpers.toOrderPick(code, params?)
NavigationHelpers.toOrderInvoice(code)
NavigationHelpers.toOrderBags(code)
NavigationHelpers.replaceWithOrderPick(code)
NavigationHelpers.replaceWithOrderInvoice(code)
```

### Delivery

```typescript
NavigationHelpers.toOrderScanToDelivery(code);
NavigationHelpers.toStoreStartScanToDelivery(code);
NavigationHelpers.toStoreCompleteScanToDelivery(code);
NavigationHelpers.replaceWithScanToDelivery(code);
NavigationHelpers.replaceWithStoreCompleteScanToDelivery(code);
```

### Utilities

```typescript
NavigationHelpers.toPrintPreview(params?)
NavigationHelpers.toSettings()
NavigationHelpers.goBack(fallbackRoute?)
```

---

## ✅ Do's and ❌ Don'ts

### ✅ DO

```typescript
// ✅ Use constants
router.push(ROUTES.NESTED.ORDER_PICK('ABC123'));

// ✅ Use helpers with error handling
NavigationHelpers.toOrderPick('ABC123');

// ✅ Replace after login
router.replace(ROUTES.MAIN.ORDERS);

// ✅ Push for details (có back)
router.push(ROUTES.NESTED.ORDER_PICK(code));

// ✅ Navigate for cross-stack
router.navigate(ROUTES.RELATIVE.SETTINGS);
```

### ❌ DON'T

```typescript
// ❌ Hardcoded strings
router.push('/orders/order-pick/ABC123');

// ❌ No error handling
router.push(`/orders/${code}`);

// ❌ Push after login (user có thể back!)
router.push(ROUTES.MAIN.ORDERS);

// ❌ Replace cho details (không có back!)
router.replace(ROUTES.NESTED.ORDER_PICK(code));

// ❌ Wrong route type
router.push('/(drawer)/orders'); // Dùng NESTED thay vì MAIN
```

---

## 🆘 Common Issues

### Issue 1: Navigation không work

```typescript
// ❌ Problem
router.push('/(drawer)/orders');

// ✅ Solution
router.navigate(ROUTES.MAIN.ORDERS);
// Hoặc
router.push(ROUTES.NESTED.ORDER_PICK(code));
```

### Issue 2: Back button không có

```typescript
// ❌ Problem: Dùng replace cho detail screen
router.replace(ROUTES.NESTED.ORDER_PICK(code));

// ✅ Solution: Dùng push
router.push(ROUTES.NESTED.ORDER_PICK(code));
```

### Issue 3: User back về login

```typescript
// ❌ Problem: Dùng push sau login
router.push(ROUTES.MAIN.ORDERS);

// ✅ Solution: Dùng replace
router.replace(ROUTES.MAIN.ORDERS);
```

### Issue 4: Deep link navigation fails

```typescript
// ❌ Problem: Dùng push
router.push(ROUTES.RELATIVE.ORDER_PICK(code));

// ✅ Solution: Dùng replace
router.replace(ROUTES.RELATIVE.ORDER_PICK(code));
```

---

## 📞 Need Help?

1. Check this quick reference
2. Read `REFACTOR_NOTES.md` for details
3. Look at code examples in `navigation.ts`
4. Test locally before deploying

---

**Last Updated:** Dec 22, 2025  
**Version:** 1.0.0
