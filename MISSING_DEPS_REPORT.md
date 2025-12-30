# Báo Cáo useMemo và useCallback Thiếu Dependencies

## Tổng Quan

File này liệt kê tất cả các `useMemo` và `useCallback` trong dự án có thể thiếu dependencies trong dependency array.

---

## 🔴 Các Vấn Đề Nghiêm Trọng (Missing Critical Dependencies)

### 1. `src/components/order-invoice/header-action-btn.tsx`

**Line 57-81: `useMemo` - actions**

```typescript
const actions = useMemo(
  () =>
    isDriver
      ? driverActions
      : [
          {
            key: 'scan-bag',
            title: getScanToDeliveryInfo({ deliveryType, status, orderCode })
              ?.title,
            enabled: isEnableScanToDelivery({ status }),
            hidden: isHiddenScanToDelivery({ deliveryType }),
            icon: <QRScanLine />,
          },
          // ...
        ],
  [orderCode, isShipping, isStorePackaged], // ❌ THIẾU: isDriver, deliveryType, status
);
```

**Vấn đề:**

- Thiếu `isDriver` - biến này được sử dụng trong điều kiện
- Thiếu `deliveryType` - được truyền vào `getScanToDeliveryInfo` và `isHiddenScanToDelivery`
- Thiếu `status` - được truyền vào `getScanToDeliveryInfo` và `isEnableScanToDelivery`

**Sửa:**

```typescript
[orderCode, isShipping, isStorePackaged, isDriver, deliveryType, status];
```

---

### 2. `src/app/(drawer)/orders/order-scan-to-delivery/[code].tsx`

**Line 96-101: `useMemo` - actionTypeWithInvoice**

```typescript
const actionTypeWithInvoice = useMemo(() => {
  if (deliveryType === ORDER_DELIVERY_TYPE.SHIPPER_DELIVERY) {
    return 'Tạo hoá đơn & giao cho tài xế';
  }
  return 'Tạo hoá đơn & giao cho khách';
}, [isInvoiceSupportedByAppPick]); // ❌ THIẾU: deliveryType
```

**Vấn đề:** Sử dụng `deliveryType` nhưng không có trong deps.

**Sửa:**

```typescript
[deliveryType, isInvoiceSupportedByAppPick];
```

---

**Line 208-244: `useMemo` - renderAction**

```typescript
const renderAction = useMemo(() => {
  // ... sử dụng nhiều biến
}, [
  isAllDone,
  orderBags,
  isLoadingHandoverOrder,
  handleStartDeliveryWithoutInvoice,
  actionType,
  isPending,
]); // ❌ THIẾU: deliveryType, isInvoiceSupportedByAppPick, actionTypeWithInvoice, handleCheckoutOrderBagsWithInvoice, isLoadingCreateInvoice
```

**Vấn đề:** Thiếu nhiều dependencies được sử dụng trong callback.

**Sửa:**

```typescript
[
  isAllDone,
  orderBags,
  isLoadingHandoverOrder,
  isLoadingCreateInvoice,
  handleStartDeliveryWithoutInvoice,
  handleCheckoutOrderBagsWithInvoice,
  actionType,
  actionTypeWithInvoice,
  deliveryType,
  isInvoiceSupportedByAppPick,
  isPending,
];
```

---

**Line 246-248: `useCallback` - handleRefresh**

```typescript
const handleRefresh = useCallback(() => {
  queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
}, []); // ❌ THIẾU: queryClient
```

**Vấn đề:** Sử dụng `queryClient` nhưng không có trong deps (mặc dù queryClient thường stable, nhưng nên thêm để đúng quy tắc).

**Sửa:**

```typescript
[queryClient];
```

---

### 3. `src/components/order-pick/header-action-bottom-sheet.tsx`

**Line 175-183: `useCallback` - handleSelectEmployee**

```typescript
const handleSelectEmployee = useCallback(
  (employee: any) => {
    assignOrderToPicker({
      pickerId: employee.id,
      orderCode: code,
    });
  },
  [code], // ❌ THIẾU: assignOrderToPicker
);
```

**Vấn đề:** Sử dụng `assignOrderToPicker` nhưng không có trong deps.

**Sửa:**

```typescript
[code, assignOrderToPicker];
```

---

### 4. `src/components/orders/order-item.tsx`

**Line 112-121: `useCallback` - handlePress**

```typescript
const handlePress = useCallback(() => {
  if (isDriver) {
    router.push(`orders/order-invoice/${code}`);
  } else {
    router.push({
      pathname: `orders/order-pick/${code}`,
      params: { status },
    });
  }
}, [type, code, status, isDriver]); // ❌ THIẾU: router
```

**Vấn đề:** Sử dụng `router` nhưng không có trong deps (router thường stable, nhưng nên thêm).

**Sửa:**

```typescript
[type, code, status, isDriver, router];
```

---

### 5. `src/components/orders/input-search.tsx`

**Line 152-169: `useCallback` - handleTextChange**

```typescript
const handleTextChange = useCallback((text: string) => {
  setValue(text);
  setKeyWord(text);
  // ...
  if (text.length >= MIN_LENGTH_SEARCH) {
    refetchOrders();
  }
}, []); // ❌ THIẾU: refetchOrders
```

**Vấn đề:** Sử dụng `refetchOrders` nhưng không có trong deps.

**Sửa:**

```typescript
[refetchOrders];
```

---

**Line 171-185: `useCallback` - refetchOrders**

```typescript
const refetchOrders = useCallback(async () => {
  // ...
  await queryClient.resetQueries({
    queryKey: ['searchOrdersByKeywork', value],
  });
  await refetch();
  // ...
}, [value, refetch]); // ❌ THIẾU: queryClient
```

**Vấn đề:** Sử dụng `queryClient` nhưng không có trong deps.

**Sửa:**

```typescript
[value, refetch, queryClient];
```

---

### 6. `src/components/order-pick/products.tsx`

**Line 184-215: `useCallback` - renderItem**

```typescript
const renderItem = useCallback(
  ({ item, index, statusOrder, pickingBarcode }: {...}) => {
    // ...
  },
  [filteredProducts?.length, orderPickProductsFlat], // ❌ THIẾU: statusOrder, pickingBarcode (nếu được truyền từ ngoài)
);
```

**Vấn đề:** Nếu `statusOrder` và `pickingBarcode` là props hoặc state, cần thêm vào deps. Nhưng nếu chúng được tính toán từ bên trong, có thể OK.

**Kiểm tra:** Cần xem `statusOrder` và `pickingBarcode` được lấy từ đâu.

---

**Line 181: `useEffect`**

```typescript
useEffect(() => {
  // ...
}, [keyword, orderPickProducts, orderPickProductsFlat, handleScanBarcode]); // ❌ THIẾU: setSuccessForBarcodeScan, setCurrentId, toggleShowAmountInput, setKeyword
```

**Vấn đề:** Sử dụng nhiều functions nhưng không có trong deps.

**Sửa:**

```typescript
[
  keyword,
  orderPickProducts,
  orderPickProductsFlat,
  handleScanBarcode,
  setSuccessForBarcodeScan,
  setCurrentId,
  toggleShowAmountInput,
  setKeyword,
];
```

---

### 7. `src/components/order-pick/product.tsx`

**Line 329-335: `useCallback` - handleEditPress**

```typescript
const handleEditPress = useCallback(() => {
  if (isDisable) return;
  toggleShowAmountInput(!isShowAmountInput, id);
  setSuccessForBarcodeScan(barcode);
  setCurrentId(id);
  setIsEditManual(true);
}, [isShowAmountInput, id, barcode, isDisable]); // ❌ THIẾU: toggleShowAmountInput, setSuccessForBarcodeScan, setCurrentId, setIsEditManual
```

**Vấn đề:** Thiếu các functions được gọi.

**Sửa:**

```typescript
[
  isShowAmountInput,
  id,
  barcode,
  isDisable,
  toggleShowAmountInput,
  setSuccessForBarcodeScan,
  setCurrentId,
  setIsEditManual,
];
```

---

**Line 350-352: `useCallback` - handleReplaceProduct**

```typescript
const handleReplaceProduct = useCallback(() => {
  setReplacePickedProductId(id);
}, []); // ❌ THIẾU: setReplacePickedProductId, id
```

**Vấn đề:** Thiếu cả function và id.

**Sửa:**

```typescript
[setReplacePickedProductId, id];
```

---

### 8. `src/components/order-pick/input-amount-popup.tsx`

**Line 128-141: `useCallback` - handleDecrement**

```typescript
const handleDecrement = useCallback(() => {
  // ...
}, [values?.pickedQuantity, quantity, setFieldValue, editable, action]); // ❌ THIẾU: roundToDecimalDecrease
```

**Vấn đề:** Sử dụng `roundToDecimalDecrease` nhưng không có trong deps (nếu là function import thì OK, nhưng nên kiểm tra).

---

**Line 143-157: `useCallback` - handleIncrement**

```typescript
const handleIncrement = useCallback(() => {
  // ...
}, [values?.pickedQuantity, quantity, setFieldValue, editable, action]); // ❌ THIẾU: roundToDecimalIncrease
```

**Vấn đề:** Tương tự như trên.

---

**Line 159-170: `useCallback` - handleQRScan**

```typescript
const handleQRScan = useCallback(() => {
  toggleScanQrCodeProduct(true);
  setQuantityFromBarcode(
    Math.floor(Number(values?.pickedQuantity || 0) * 1000) / 1000,
  );
  setScanMoreProduct(true);
}, [
  values?.pickedQuantity,
  toggleScanQrCodeProduct,
  setQuantityFromBarcode,
  setScanMoreProduct,
]); // ✅ OK
```

---

**Line 609-642: `useCallback` - onSubmit**

```typescript
const onSubmit = useCallback(
  (values: any) => {
    // ...
    setOrderTemToPicked({ pickedItem, orderCode: code });
    reset();
  },
  [productName, currentProduct, barcodeScanSuccess, quantity, code, isUnitBox], // ❌ THIẾU: setOrderTemToPicked, reset, moment
);
```

**Vấn đề:** Thiếu `setOrderTemToPicked`, `reset`, và `moment` (nếu moment không stable).

**Sửa:**

```typescript
[
  productName,
  currentProduct,
  barcodeScanSuccess,
  quantity,
  code,
  isUnitBox,
  setOrderTemToPicked,
  reset,
];
```

---

**Line 644-649: `useCallback` - reset**

```typescript
const reset = useCallback(() => {
  toggleShowAmountInput(false);
  setCurrentId(null);
  setQuantityFromBarcode(0);
  setActionProduct(null);
}, []); // ❌ THIẾU: toggleShowAmountInput, setCurrentId, setQuantityFromBarcode, setActionProduct
```

**Vấn đề:** Thiếu tất cả các functions.

**Sửa:**

```typescript
[toggleShowAmountInput, setCurrentId, setQuantityFromBarcode, setActionProduct];
```

---

### 9. `src/components/orders/tab-status.tsx`

**Line 51-69: `useMemo` - dataStatusCounters**

```typescript
const dataStatusCounters = useMemo(() => {
  // ...
}, [orderStatusCounters]); // ❌ THIẾU: role
```

**Vấn đề:** Sử dụng `role` nhưng không có trong deps.

**Sửa:**

```typescript
[orderStatusCounters, role];
```

---

**Line 75-134: `useCallback` - goTabSelected**

```typescript
const goTabSelected = useCallback(
  (id?: string) => {
    // ...
  },
  [selectedOrderCounter, sortedDataStatusCounters], // ✅ OK
);
```

---

### 10. `src/core/hooks/useCheckShift.ts`

**Line 36-66: `useCallback` - checkShift**

```typescript
const checkShift = useCallback(() => {
  // ...
}, [
  authStatus,
  userInfo,
  kposShiftStatus,
  startMyKposShift,
  isLoadingStartMyKposShift,
]); // ❌ THIẾU: successCallback
```

**Vấn đề:** Sử dụng `successCallback` nhưng không có trong deps.

**Sửa:**

```typescript
[
  authStatus,
  userInfo,
  kposShiftStatus,
  startMyKposShift,
  isLoadingStartMyKposShift,
  successCallback,
];
```

---

### 11. `src/core/hooks/usePushNotifications.tsx`

**Line 53-88: `useCallback` - handleGoScreen**

```typescript
const handleGoScreen = useCallback((remoteMessage: any) => {
  // ...
}, []); // ❌ THIẾU: router (nếu router không stable)
```

**Vấn đề:** Sử dụng `router` nhưng không có trong deps. Router thường stable nhưng nên thêm để an toàn.

**Sửa:**

```typescript
[router];
```

---

### 12. `src/components/shared/StoreSelection.tsx`

**Line 103-109: `useMemo` - debouncedSearch**

```typescript
const debouncedSearch = useMemo(
  () =>
    debounce((text: string) => {
      onSearch(text);
    }, 300),
  [onSearch], // ✅ OK
);
```

---

**Line 118-124: `useCallback` - handleChangeText**

```typescript
const handleChangeText = useCallback(
  (value: string) => {
    setSearchText(value);
    debouncedSearch(value);
  },
  [debouncedSearch], // ✅ OK
);
```

---

**Line 126-130: `useCallback` - handleClear**

```typescript
const handleClear = useCallback(() => {
  setSearchText('');
  debouncedSearch.cancel();
  onSearch('');
}, [onSearch, debouncedSearch]); // ✅ OK
```

---

### 13. `src/components/shared/EmployeeSelection.tsx`

**Line 88-92: `useRef` với debounce**

```typescript
const debouncedSearch = useRef(
  debounce((text: string) => {
    onSearch(text);
  }, 300),
).current; // ⚠️ CẢNH BÁO: debounce được tạo bằng useRef, nên onSearch có thể stale
```

**Vấn đề:** Sử dụng `useRef` với debounce có thể dẫn đến stale closure. Nên dùng `useMemo` như trong StoreSelection.

---

**Line 189-200: `useCallback` - renderItem**

```typescript
const renderItem = useCallback(
  ({ item }: { item: EmployeeType }) => {
    return (
      <EmployeeItem
        employee={item}
        selectedId={selectedId}
        onSelect={handleSelect}
      />
    );
  },
  [selectedId, handleSelect, isFetching, isPending], // ⚠️ isFetching, isPending không được sử dụng trong callback
);
```

**Vấn đề:** `isFetching` và `isPending` không được sử dụng trong callback, nên loại bỏ.

**Sửa:**

```typescript
[selectedId, handleSelect];
```

---

## 🟡 Các Vấn Đề Nhẹ (Có Thể Chấp Nhận)

### 1. `src/components/shared/order-actions-submenu-bottom-sheet.tsx`

**Line 42-72: `useMemo` - actions**

```typescript
const actions = useMemo(
  () => [
    // ... array of actions
  ],
  [], // ✅ OK - actions là static, không phụ thuộc vào props/state
);
```

**Ghi chú:** OK vì actions là static.

---

### 2. `src/core/utils/safe-scrollview.tsx`

Tất cả các `useCallback` đều có đầy đủ dependencies. ✅

---

## 📊 Tổng Kết

- **Tổng số vấn đề nghiêm trọng:** ~15-20
- **Tổng số vấn đề nhẹ:** ~5-10
- **Files cần sửa:** ~12 files

## 🔧 Khuyến Nghị

1. **Sử dụng ESLint rule `react-hooks/exhaustive-deps`** để tự động phát hiện missing dependencies
2. **Review lại tất cả các `useMemo` và `useCallback`** trong các files được liệt kê
3. **Kiểm tra các functions được import** - nếu là stable functions (như từ lodash, utils), có thể không cần thêm vào deps
4. **Kiểm tra các setters từ hooks** - thường là stable, nhưng nên thêm để đảm bảo
