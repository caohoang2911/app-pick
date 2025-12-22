# 🎯 Route Constants Simplification

## Thay Đổi

**Ngày:** Dec 22, 2025  
**Lý do:** Đơn giản hóa code, loại bỏ duplicate routes

---

## ✅ Đã Merge Tất Cả Routes Thành DRAWER_ROUTES

### Trước đây (3 constants duplicate):

```typescript
// Duplicate routes - cả ba đều resolve đến cùng URL
MAIN_ROUTES.ORDER_PICK(code) = '/(drawer)/orders/order-pick/${code}'; // → URL: '/orders/order-pick/ABC'
RELATIVE_ROUTES.ORDER_PICK(code) = '/orders/order-pick/${code}'; // → URL: '/orders/order-pick/ABC'
NESTED_ROUTES.ORDER_PICK(code) = 'orders/order-pick/${code}'; // → URL: '/orders/order-pick/ABC'
```

### Sau khi đơn giản hóa:

```typescript
// Một constant duy nhất
DRAWER_ROUTES.ORDER_PICK(code) = '/orders/order-pick/${code}'; // → URL: '/orders/order-pick/ABC'
```

**Lý do:** Trong Expo Router, cả relative path (không có `/`) và absolute path (có `/`) đều hoạt động giống nhau với `router.push()`.

---

## 📝 Migration Guide

### Code Cũ:

```typescript
// ❌ Cũ
router.navigate(ROUTES.MAIN.ORDERS);
router.push(ROUTES.RELATIVE.ORDERS);
router.push(ROUTES.NESTED.ORDER_PICK('ABC123'));
```

### Code Mới:

```typescript
// ✅ Mới - Tất cả đều dùng DRAWER_ROUTES
router.navigate(ROUTES.DRAWER.ORDERS);
router.push(ROUTES.DRAWER.ORDERS);
router.push(ROUTES.DRAWER.ORDER_PICK('ABC123'));
```

---

## 🔄 Backward Compatibility

Đã thêm deprecated exports để code cũ vẫn hoạt động:

```typescript
/**
 * @deprecated Use ROUTES.DRAWER instead
 */
export const MAIN_ROUTES = DRAWER_ROUTES;

/**
 * @deprecated Use ROUTES.DRAWER instead
 */
export const RELATIVE_ROUTES = DRAWER_ROUTES;

/**
 * @deprecated Use ROUTES.DRAWER instead
 */
export const NESTED_ROUTES = {
  ORDER_PICK: (code: string) =>
    DRAWER_ROUTES.ORDER_PICK(code).replace(/^\//, ''),
  // ... (computed from DRAWER_ROUTES)
};
```

**Lưu ý:** Code cũ vẫn chạy được nhưng nên migrate sang `ROUTES.DRAWER`.

---

## 📊 Files Đã Update

1. ✅ `src/core/constants/routes.ts` - Merge MAIN + RELATIVE + NESTED → DRAWER
2. ✅ `src/core/hooks/useProtectedRoute.ts` - MAIN → DRAWER
3. ✅ `src/core/utils/navigation.ts` - Tất cả MAIN/RELATIVE/NESTED → DRAWER

---

## 🎯 Lợi Ích

1. ✅ **Đơn giản hơn** - Chỉ 1 constant thay vì 3 (MAIN + RELATIVE + NESTED)
2. ✅ **Ít duplicate** - Không còn routes trùng lặp
3. ✅ **Dễ maintain** - Ít code hơn, dễ hiểu hơn
4. ✅ **Backward compatible** - Code cũ vẫn chạy (có deprecated exports)
5. ✅ **Consistent** - Tất cả navigation đều dùng cùng một constant

---

## 📚 Constants Hiện Tại

```typescript
ROUTES = {
  AUTH: AUTH_ROUTES, // '/login', '/authorize'
  DRAWER: DRAWER_ROUTES, // '/orders', '/orders/order-pick/[code]', ...
  DEEP_LINK: DEEP_LINK_PATHS, // 'order-pick', 'order-invoice', ... (for parsing)
  PARAMS: ROUTE_PARAMS, // 'orderCode', 'deliveryCode', ...
};
```

**Đã xóa:**

- ❌ `MAIN_ROUTES` → ✅ `DRAWER_ROUTES`
- ❌ `RELATIVE_ROUTES` → ✅ `DRAWER_ROUTES`
- ❌ `NESTED_ROUTES` → ✅ `DRAWER_ROUTES`

---

**Last Updated:** Dec 22, 2025  
**Version:** 2.0.0
