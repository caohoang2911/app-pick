# 🔍 Giải Thích: `(drawer)` vs `drawer` trong Expo Router

## Câu Hỏi
**`(drawer)` khác gì với `drawer`?**

---

## 📚 Khái Niệm Cơ Bản

### Route Group `(drawer)` - Nhóm Routes
- **Ký hiệu:** Dấu ngoặc đơn `()`
- **Tên gọi:** Route Group (Nhóm routes)
- **URL:** ❌ **KHÔNG** tạo segment trong URL
- **Mục đích:** Organize code, share layout

### Route Segment `drawer` - Đoạn Route
- **Ký hiệu:** Không có dấu ngoặc
- **Tên gọi:** Route Segment (Đoạn route)
- **URL:** ✅ **CÓ** tạo segment trong URL
- **Mục đích:** Tạo segment thực sự trong URL path

---

## 🎯 So Sánh Trực Quan

### File Structure

```
src/app/
├── (drawer)/              ← Route Group
│   ├── _layout.tsx        ← Drawer layout
│   └── orders/
│       └── index.tsx      ← Orders screen
│
└── drawer/                ← Route Segment
    └── orders/
        └── index.tsx      ← Orders screen
```

### URLs Tương Ứng

| File Path | Route Path | URL Thực Tế | Có "drawer" trong URL? |
|-----------|------------|-------------|------------------------|
| `(drawer)/orders/index.tsx` | `/(drawer)/orders` | `/orders` | ❌ **KHÔNG** |
| `drawer/orders/index.tsx` | `/drawer/orders` | `/drawer/orders` | ✅ **CÓ** |

---

## 💡 Ví Dụ Cụ Thể

### Ví Dụ 1: Route Group `(drawer)`

```typescript
// File: src/app/(drawer)/orders/index.tsx
export default function Orders() {
  return <Text>Orders Screen</Text>;
}

// Navigation
router.navigate('/(drawer)/orders');
// → URL: '/orders'  ✅ (không có drawer)

// Hoặc từ bên ngoài drawer
router.navigate('/(drawer)/orders');
// → Vào drawer context, URL: '/orders'
```

**Kết quả:**
- ✅ URL sạch: `/orders`
- ✅ Vẫn trong drawer navigation context
- ✅ Có drawer menu, có thể swipe để mở

---

### Ví Dụ 2: Route Segment `drawer`

```typescript
// File: src/app/drawer/orders/index.tsx
export default function Orders() {
  return <Text>Orders Screen</Text>;
}

// Navigation
router.navigate('/drawer/orders');
// → URL: '/drawer/orders'  ❌ (có drawer)

// Hoặc
router.push('/drawer/orders');
// → URL: '/drawer/orders'
```

**Kết quả:**
- ❌ URL dài hơn: `/drawer/orders`
- ❌ Không tự động vào drawer context
- ❌ Phải setup drawer riêng

---

## 🔄 Tại Sao Dùng Route Group `(drawer)`?

### ✅ Ưu Điểm

1. **URL Sạch Hơn**
   ```typescript
   // Route Group
   '/(drawer)/orders' → URL: '/orders'  ✅
   
   // Route Segment
   '/drawer/orders' → URL: '/drawer/orders'  ❌
   ```

2. **Organize Code**
   ```
   src/app/
     ├── (drawer)/          ← Tất cả routes trong drawer
     │   ├── orders/
     │   ├── settings/
     │   └── profile/
     └── (auth)/            ← Tất cả routes auth
         ├── login/
         └── register/
   ```

3. **Shared Layout**
   ```typescript
   // src/app/(drawer)/_layout.tsx
   export default function DrawerLayout() {
     return (
       <Drawer>
         {/* Tất cả routes trong (drawer) dùng layout này */}
         <Stack>
           <Stack.Screen name="orders" />
           <Stack.Screen name="settings" />
         </Stack>
       </Drawer>
     );
   }
   ```

4. **Không Ảnh Hưởng URL Structure**
   - Route groups chỉ để organize code
   - Không thay đổi URL paths
   - Dễ refactor, dễ maintain

---

## 📊 Bảng So Sánh Chi Tiết

| Tiêu Chí | `(drawer)` Route Group | `drawer` Route Segment |
|----------|------------------------|-------------------------|
| **Ký hiệu** | Có dấu `()` | Không có dấu |
| **URL Segment** | ❌ Không tạo | ✅ Có tạo |
| **URL Example** | `/orders` | `/drawer/orders` |
| **Layout Sharing** | ✅ Shared layout | ❌ Phải setup riêng |
| **Code Organization** | ✅ Tốt | ⚠️ Bình thường |
| **Use Case** | Nhóm routes có chung layout | Route thực sự cần segment |
| **Navigation Path** | `/(drawer)/orders` | `/drawer/orders` |

---

## 🎯 Khi Nào Dùng Gì?

### Dùng Route Group `(drawer)` khi:
- ✅ Muốn nhóm routes lại (orders, settings, profile)
- ✅ Muốn share layout (Drawer navigation)
- ✅ Muốn URL sạch (không có `drawer` trong URL)
- ✅ Routes có chung navigation pattern

### Dùng Route Segment `drawer` khi:
- ✅ Thực sự cần `/drawer` trong URL
- ✅ Route độc lập, không share layout
- ✅ Cần segment rõ ràng trong URL structure

---

## 🔍 Trong Code Của Chúng Ta

### File Structure Hiện Tại
```
src/app/
├── (drawer)/              ← Route Group ✅
│   ├── _layout.tsx        ← Drawer layout
│   └── orders/
│       ├── _layout.tsx
│       ├── index.tsx
│       └── order-pick/
│           └── [code].tsx
├── login.tsx
└── authorize.tsx
```

### Routes Trong Code

```typescript
// MAIN_ROUTES - Dùng route group
ROUTES.MAIN.ORDERS = '/(drawer)/orders'
// → URL thực: '/orders'  ✅

// RELATIVE_ROUTES - Không có drawer prefix
ROUTES.RELATIVE.ORDERS = '/orders'
// → URL thực: '/orders'  ✅

// Cả hai đều trỏ đến cùng URL: '/orders'
// Vì (drawer) không tạo segment trong URL!
```

### Navigation Examples

```typescript
// ✅ Từ login vào app (dùng MAIN_ROUTES)
router.navigate('/(drawer)/orders');
// → URL: '/orders'
// → Vào drawer context

// ✅ Trong drawer (dùng RELATIVE_ROUTES)
router.push('/orders');
// → URL: '/orders'
// → Vẫn trong drawer context

// ❌ Nếu dùng route segment
router.navigate('/drawer/orders');
// → URL: '/drawer/orders'  ❌ (không đúng)
```

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Dùng Route Segment thay vì Route Group
```typescript
// ❌ SAI
router.navigate('/drawer/orders');
// → URL: '/drawer/orders' (không đúng)

// ✅ ĐÚNG
router.navigate('/(drawer)/orders');
// → URL: '/orders' (đúng)
```

### ❌ Mistake 2: Nhầm lẫn về URL
```typescript
// ❌ Nghĩ rằng (drawer) tạo segment
'/(drawer)/orders' → URL: '/drawer/orders'  // ❌ SAI

// ✅ Thực tế
'/(drawer)/orders' → URL: '/orders'  // ✅ ĐÚNG
```

### ❌ Mistake 3: Tạo folder `drawer` thay vì `(drawer)`
```
// ❌ SAI - Tạo folder drawer/
src/app/drawer/orders/

// ✅ ĐÚNG - Tạo folder (drawer)/
src/app/(drawer)/orders/
```

---

## 📝 Tóm Tắt

| Khái Niệm | Route Group `(drawer)` | Route Segment `drawer` |
|-----------|------------------------|------------------------|
| **Ký hiệu** | `()` | Không có |
| **URL** | `/orders` | `/drawer/orders` |
| **Mục đích** | Organize + Share layout | Tạo segment thực |
| **Dùng khi** | Nhóm routes có chung layout | Cần segment trong URL |

### ✅ Kết Luận

**`(drawer)` là Route Group:**
- Không tạo segment trong URL
- Dùng để organize code và share layout
- URL sạch hơn: `/orders` thay vì `/drawer/orders`

**`drawer` là Route Segment:**
- Tạo segment trong URL
- URL sẽ có `/drawer` trong path
- Dùng khi thực sự cần segment đó

**Trong app của chúng ta:**
- ✅ Dùng `(drawer)` route group
- ✅ URL: `/orders` (không có `drawer`)
- ✅ Routes trong `(drawer)` share Drawer layout
- ✅ Navigation: `/(drawer)/orders` → URL: `/orders`

---

**Last Updated:** Dec 22, 2025  
**Version:** 1.0.0

