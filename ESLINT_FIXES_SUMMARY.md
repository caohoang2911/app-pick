# Tóm Tắt Các Sửa Đổi ESLint Dependencies

## ✅ Đã Hoàn Thành

### 1. Cấu Hình ESLint

- ✅ Tạo file `.eslintrc.js` với rule `react-hooks/exhaustive-deps: 'warn'`
- ✅ Thêm ESLint dependencies vào `package.json`
- ✅ Thêm scripts `lint:eslint` và `lint:eslint:fix` vào `package.json`

### 2. Các File Đã Sửa

#### `src/components/order-invoice/header-action-btn.tsx`

- ✅ Fix `useMemo` actions: Thêm `isDriver`, `deliveryType`, `status` vào deps

#### `src/app/(drawer)/orders/order-scan-to-delivery/[code].tsx`

- ✅ Fix `useMemo` actionTypeWithInvoice: Thêm `deliveryType` vào deps
- ✅ Fix `useMemo` renderAction: Thêm `deliveryType`, `isInvoiceSupportedByAppPick`, `actionTypeWithInvoice`, `handleCheckoutOrderBagsWithInvoice`, `isLoadingCreateInvoice`, `handoverStatus`, `toggleScanQrCodeProduct` vào deps
- ✅ Fix `useCallback` handleRefresh: Thêm `queryClient` vào deps

#### `src/components/order-pick/header-action-bottom-sheet.tsx`

- ✅ Fix `useCallback` handleSelectEmployee: Thêm `assignOrderToPicker` vào deps

#### `src/components/orders/order-item.tsx`

- ✅ Fix `useCallback` handlePress: Thêm `router` vào deps

#### `src/components/orders/input-search.tsx`

- ✅ Fix `useCallback` handleTextChange: Thêm `refetchOrders` vào deps
- ✅ Fix `useCallback` refetchOrders: Thêm `queryClient` vào deps

#### `src/components/order-pick/product.tsx`

- ✅ Fix `useCallback` handleEditPress: Thêm `toggleShowAmountInput`, `setSuccessForBarcodeScan`, `setCurrentId`, `setIsEditManual` vào deps
- ✅ Fix `useCallback` handleReplaceProduct: Thêm `setReplacePickedProductId`, `id` vào deps

#### `src/components/order-pick/input-amount-popup.tsx`

- ✅ Fix `useCallback` onSubmit: Thêm `setOrderTemToPicked`, `reset` vào deps
- ✅ Fix `useCallback` reset: Thêm `toggleShowAmountInput`, `setCurrentId`, `setQuantityFromBarcode`, `setActionProduct` vào deps

#### `src/components/orders/tab-status.tsx`

- ✅ Fix `useMemo` dataStatusCounters: Thêm `role` vào deps

#### `src/core/hooks/useCheckShift.ts`

- ✅ Fix `useCallback` checkShift: Thêm `successCallback` vào deps

#### `src/core/hooks/usePushNotifications.tsx`

- ✅ Fix `useCallback` handleGoScreen: Thêm `router` vào deps

#### `src/components/shared/EmployeeSelection.tsx`

- ✅ Fix `useCallback` renderItem: Loại bỏ `isFetching`, `isPending` (không được sử dụng)

#### `src/components/order-pick/products.tsx`

- ✅ Fix `useEffect`: Thêm `setSuccessForBarcodeScan`, `setCurrentId`, `toggleShowAmountInput`, `setKeyword` vào deps

## 📝 Cách Sử Dụng

### Cài Đặt Dependencies

```bash
npm install
# hoặc
yarn install
```

### Chạy ESLint

```bash
# Kiểm tra lỗi
npm run lint:eslint

# Tự động sửa các lỗi có thể sửa được
npm run lint:eslint:fix
```

### Trong IDE (VS Code)

1. Cài đặt extension "ESLint"
2. ESLint sẽ tự động hiển thị warnings cho missing dependencies
3. Có thể tự động fix bằng cách click vào lightbulb icon

## ⚠️ Lưu Ý

1. **Stable Functions**: Một số functions như `router` từ expo-router, `queryClient` từ react-query thường là stable, nhưng vẫn nên thêm vào deps để tuân thủ quy tắc ESLint.

2. **Zustand Setters**: Các setters từ Zustand store thường là stable functions, nhưng vẫn nên thêm vào deps để đảm bảo.

3. **Import Functions**: Các functions được import từ utils (như `getScanToDeliveryInfo`, `isEnableScanToDelivery`) thường là stable, không cần thêm vào deps.

4. **Constants**: Các constants như `ORDER_STATUS`, `ORDER_DELIVERY_TYPE` không cần thêm vào deps.

## 🔄 Tiếp Theo

Sau khi cài đặt dependencies, chạy:

```bash
npm run lint:eslint
```

Để kiểm tra xem còn lỗi nào khác không. ESLint sẽ tự động phát hiện các missing dependencies trong tương lai.
