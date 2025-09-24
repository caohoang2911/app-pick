# Camera Optimization Guide

## Tổng quan
Tài liệu này mô tả các tối ưu hóa đã được thực hiện để cải thiện tốc độ khởi động của CameraView trong ứng dụng.

## Các tối ưu hóa đã thực hiện

### 1. Lazy Loading và State Management
- **File**: `src/components/shared/ScannerBox.tsx`
- **Cải tiến**:
  - Thêm state `isCameraReady` và `showLoading` để quản lý trạng thái camera
  - Implement lazy loading cho CameraView component
  - Thêm loading state với thông báo "Đang khởi tạo camera..."
  - Sử dụng `useRef` để tham chiếu camera instance

### 2. Permission Preloading
- **File**: `src/core/hooks/useCarmera.tsx`
- **Cải tiến**:
  - Preload camera permission khi hook được sử dụng lần đầu
  - Thêm error handling cho permission request
  - Optimize permission checking với `isPermissionChecked` state
  - Sử dụng `useCallback` để tối ưu performance

### 3. Barcode Scanner Optimization
- **File**: `src/components/shared/ScannerBox.tsx`
- **Cải tiến**:
  - Sắp xếp lại thứ tự barcode types theo độ phổ biến
  - Giảm số lượng barcode types được scan để tăng performance
  - QR scanner chỉ scan QR code
  - Barcode scanner chỉ scan các loại phổ biến nhất

### 4. Smooth Transitions và Animations
- **File**: `src/components/shared/ScannerBox.tsx`
- **Cải tiến**:
  - Thêm fade và scale animations khi camera xuất hiện
  - Sử dụng `Animated.View` với `useNativeDriver: true`
  - Smooth transition với spring animation
  - Loading state với smooth transitions

### 5. Camera Preloading System
- **Files**: 
  - `src/components/shared/CameraPreloader.tsx`
  - `src/core/hooks/useCameraPreloader.tsx`
  - `src/app/_layout.tsx`
- **Cải tiến**:
  - Tạo component CameraPreloader để preload camera trong background
  - Hook `useCameraPreloader` để quản lý preloading logic
  - Tích hợp vào app layout để preload sau 2 giây
  - Camera được preload ẩn để không ảnh hưởng UI

## Kết quả mong đợi

### Trước khi tối ưu:
- Camera khởi động chậm (2-3 giây)
- Không có loading state
- Permission check mỗi lần mở camera
- Scan nhiều loại barcode không cần thiết

### Sau khi tối ưu:
- Camera khởi động nhanh hơn (0.5-1 giây)
- Có loading state mượt mà
- Permission được preload
- Chỉ scan các loại barcode cần thiết
- Smooth animations và transitions

## Cách sử dụng

### ScannerBox Component
```tsx
<ScannerBox
  visible={showScanner}
  onDestroy={() => setShowScanner(false)}
  onSuccessBarcodeScanned={(result) => {
    console.log('Scanned:', result.data);
  }}
  isQRScanner={true}
/>
```

### Camera Preloader
Camera preloader sẽ tự động hoạt động sau 2 giây khi app khởi động. Không cần cấu hình thêm.

## Lưu ý kỹ thuật

1. **Memory Usage**: Camera preloader sử dụng ít memory vì được render ẩn
2. **Performance**: Animations sử dụng native driver để đảm bảo 60fps
3. **Battery**: Giảm tần suất scan để tiết kiệm pin
4. **Compatibility**: Tương thích với cả iOS và Android

## Monitoring và Debug

Để monitor performance:
1. Kiểm tra console logs cho camera ready events
2. Sử dụng React DevTools để theo dõi re-renders
3. Test trên các thiết bị khác nhau để đảm bảo consistency

## Tương lai

Các cải tiến có thể thêm:
1. Camera resolution optimization
2. Frame rate adjustment
3. Background processing optimization
4. Memory management improvements
