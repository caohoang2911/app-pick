# Quét mã bằng máy PDA (đầu đọc laser)

Tài liệu cho tính năng nhận sự kiện quét mã vạch từ **đầu đọc laser tích hợp của
máy PDA Android** (Urovo, Zebra, Honeywell, Chainway, Newland, Unitech, iData…),
song song với luồng quét bằng **camera** (`ScannerBox`) sẵn có.

> TL;DR: bóp cò laser trên máy PDA → app nhận mã ngay ở màn đang mở, **không cần
> mở camera, không cần focus ô nhập**. Dùng lại đúng handler quét của camera.

---

## 1. Cơ chế

Hầu hết máy PDA **không cho truy cập trực tiếp tia laser**. Dịch vụ quét của
hãng giải mã mã vạch rồi phát một **Android Broadcast Intent**. App đăng ký một
`BroadcastReceiver` ở runtime để nhận Intent đó rồi bắn xuống JS.

```
Bóp cò laser
     ↓
Dịch vụ quét của hãng giải mã
     ↓ (Broadcast Intent — đa hãng)
PdaScannerModule.kt  (registerReceiver ở runtime, KHÔNG khai báo trong Manifest)
     ↓ sendEvent("onScan", { data, action, type })
usePdaScan()          (mount 1 lần ở AuthWrapper, chỉ Android, có chống double-fire)
     ↓ dispatchPdaScan({ type, data })
pda-scan-registry     (stack handler của màn ĐANG focus)
     ↓
handler của màn đang focus  (== onSuccessBarcodeScanned của ScannerBox)
```

Vì mã được đưa vào bằng **Intent** (không phải keystroke), nó **không bị các ô
tìm kiếm đang focus "nuốt" mất** — đây là lý do chọn Intent thay vì Keyboard
Wedge.

## 2. Các file liên quan

| File                                                  | Vai trò                                                                                                                                 |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `modules/pda-scanner/`                                | Local Expo module (Android). Autolink tự động (thư mục `modules/`), **sống ngoài `android/` nên không bị `expo prebuild --clean` xoá**. |
| `modules/pda-scanner/android/.../PdaScannerModule.kt` | Đăng ký `BroadcastReceiver` đa hãng ở runtime → bắn event `onScan`. Danh sách action/extra ở `companion object`.                        |
| `modules/pda-scanner/index.ts`                        | Cầu JS: `addPdaScanListener`, `isPdaScannerAvailable`. No-op trên iOS.                                                                  |
| `src/core/hooks/usePdaScan.ts`                        | Listener toàn cục (mount ở `AuthWrapper`), chống double-fire 400ms, route tới registry.                                                 |
| `src/core/hooks/usePdaScanTarget.ts`                  | Hook cho từng màn: đăng ký handler khi màn **focus**.                                                                                   |
| `src/core/utils/pda-scan-registry.ts`                 | Stack handler của các màn đang focus.                                                                                                   |

Các màn đã bật quét PDA: `order-pick`, `order-scan-to-delivery`,
`store-start-order-scan-to-delivery`, danh sách đơn (`orders`).

## 3. Bật quét PDA cho một màn mới

Thêm 1 dòng cạnh nơi màn định nghĩa handler quét (dùng chung với `ScannerBox`):

```tsx
import { usePdaScanTarget } from '~/src/core/hooks/usePdaScanTarget';

// handler y hệt onSuccessBarcodeScanned của ScannerBox: (result) => { ...result.data... }
usePdaScanTarget(handleSuccessBarCode);
```

Lưu ý: gọi hook **trước mọi early-return** (quy tắc hook của React). Hook tự gate
theo `useIsFocused`, nên chỉ màn đang focus mới nhận mã.

## 4. Output mode và cấu hình máy PDA

App nhận scan ổn định nhất qua **Intent / Broadcast** (không phải Keyboard/HID).
Với **Urovo**, App Pick tự kiểm tra output mode bằng `android.device.ScanManager`
khi listener khởi động:

- Nếu đang là Keyboard Wedge, app gọi `switchOutputMode(0)` để chuyển sang Intent.
- Nếu đã là Intent, app giữ nguyên output mode.
- App đọc read-only `com.ubx.datawedge.provider` để tự nhận action, category và
  tên extra hiện tại; không ép các field này về giá trị riêng của App Pick.
- Nếu API/provider Urovo không tồn tại, module tự quay về mapping broadcast đa
  hãng có sẵn.

Vì vậy máy Urovo không còn bắt buộc phải chỉnh action/extra thủ công. Với hãng
khác chưa có SDK adapter, vào app cấu hình quét của máy (tên theo hãng):

| Hãng             | App cấu hình                         | Ghi chú                                                                                                                                                                                                             |
| ---------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Urovo            | **ScanSettings / ScanWedge**         | App tự chuyển sang Intent và tự đọc action/extra; màn hình này chủ yếu dùng để chẩn đoán.                                                                                                                           |
| Zebra            | **DataWedge**                        | Tạo/sửa Profile → **Intent Output = Enabled**, Intent action đặt = một trong các action app đang nghe (ví dụ `com.scanner.broadcast`), Category `android.intent.category.DEFAULT`, **Intent delivery = Broadcast**. |
| Honeywell        | **Scanner/Settings**                 | Bật Intent/Broadcast output.                                                                                                                                                                                        |
| Chainway/Newland | **Scanner Settings / Scan Settings** | Output → Broadcast/Intent.                                                                                                                                                                                          |

Danh sách action + tên extra fallback nằm ở `companion object` trong
`PdaScannerModule.kt`. Riêng Urovo, action/extra tùy chỉnh được discover lúc
runtime nên không cần thêm hard-code rồi build lại.

### Cách kiểm tra máy đang ở chế độ nào (không cần app)

1. Mở Chrome, chạm vào ô địa chỉ, bóp cò quét một mã.
   - **Hiện ra chữ trong ô** → máy đang ở **Keyboard Wedge** (cần đổi sang Intent).
   - **Không hiện gì** → nhiều khả năng đang ở **Intent/SDK** (đúng cái app cần).
2. Xem model máy: **Settings → About phone** hoặc sticker sau lưng máy.

### ⭐ Urovo dùng "ScanWedge" (đã kiểm chứng trên máy thật)

Nhiều máy Urovo (vd model có gói `com.ubx.datawedge`) không dùng "ScanSettings"
mà dùng app **ScanWedge** (bản DataWedge-clone của Urovo) — đây là service quét
**duy nhất**, **KHÔNG được disable** (tắt là chết luôn đầu đọc).

Đường đi để kiểm tra cấu hình đã được xác minh:
`ScanWedge → profile (ScanWedge) → Default → **Output mode**`:

- **Output Mode** = **Intent output** (App Pick tự áp nếu máy đang là keystroke).
- **Intent action** = `com.scanner.broadcast` (mặc định — app đã nghe) hoặc `android.intent.ACTION_DECODE_DATA`.
- **Intent delivery** = **Broadcast**.
- **Intent string extra** = `data` (app đã trích; máy còn gửi kèm `com.ubx.datawedge.data_string`).
- **Intent category** = **để TRỐNG** ⚠️ (xem cảnh báo dưới).

> Nếu ScanWedge không có icon ngoài app drawer: mở bằng
> `adb shell am start -n com.ubx.datawedge/.settings.activity.DataWedgeSettings`.

### ⚠️ Cạm bẫy "Intent category" (nguyên nhân im lặng khó thấy nhất)

ScanWedge mặc định gắn **`Intent category = android.intent.category.DEFAULT`**
vào broadcast. Theo luật khớp của Android: **Intent CÓ category thì
`IntentFilter` phải khai báo category đó, nếu không sẽ bị LOẠI** — dù action &
extra khớp hoàn toàn. Đây là lý do "quét mà app im re" dù mọi thứ trông đúng.

**Đã fix trong code**: `PdaScannerModule.kt` thêm
`filter.addCategory(Intent.CATEGORY_DEFAULT)` → nhận được cả broadcast
có-category (Urovo) lẫn không-category. Vì vậy **sau khi build lại**, cứ để
category = DEFAULT trên máy cũng chạy. (Cách chữa cháy không cần build: **xoá
trống** ô Intent category trong ScanWedge.)

**Triggering Mode — BẮT BUỘC đặt "Decode or Time-out"** (ScanWedge → Default →
Triggering Modes): bóp cò một lần quét đúng một mã rồi dừng → đếm số lượng chuẩn.

**KHÔNG** để "Hand-free continuous": khi thao tác thật, máy re-decode cùng một mã
cách nhau ~0.75–1.4s (đo thực tế), **vượt** cửa sổ throttle 400ms → order-pick
**cộng dồn số lượng nhiều lần** (sai tồn/sai đơn). Throttle 2 lớp cửa sổ trượt
(`usePdaScan.ts` JS + `PdaScannerModule.kt` native) chỉ gom được 1 loạt decode
sát nhau (chống lag/spam), **không thay** được việc đặt đúng trigger mode — nới
cửa sổ đủ để chặn Hand-free sẽ phá luôn tính năng đếm nhiều (quét N lần = +N).

## 5. Build & test (BẮT BUỘC build lại)

Đây là **thay đổi native** → **không** đẩy được qua OTA ("CodePush"). Phải tạo
bản dev/EAS build mới:

```bash
EAS_BUILD_PROFILE=dev yarn expo run:android --device

# Chỉ khi cần đồng bộ lại native project từ Expo config:
EAS_BUILD_PROFILE=dev yarn expo prebuild --platform android

# Hoặc build APK qua EAS:
yarn eas build --platform android --profile dev
```

Test trên **máy PDA thật** (emulator không có đầu đọc):

1. Mở màn `order-pick` của một đơn.
2. Bóp cò laser quét mã sản phẩm trong đơn — **không mở camera**.
3. App phải xử lý y như quét bằng camera (cập nhật số lượng / báo lỗi nếu mã
   không thuộc đơn).

## 6. Xử lý sự cố

- **Không có phản ứng gì khi quét:**
  - Trên Urovo, tìm log `Urovo output mode` và `Urovo ScanWedge config` để biết
    app đã chuyển mode và discover action/extra chưa.
  - Xem log native: `adb logcat -s PdaScanner:D '*:S'` để biết máy có phát
    broadcast không, action/extra tên gì.
  - Với hãng khác, kiểm tra máy đã ở **Intent/Broadcast** chưa (mục 4). Nếu đang
    Keyboard Wedge, mã đi vào ô focus chứ không vào receiver.
  - `isPdaScannerAvailable` phải là `true` (đã build lại sau khi thêm module).
- **Quét ra 2 lần / nhân đôi số lượng:** đã có chống double-fire 400ms trong
  `usePdaScan.ts` (`DEDUPE_WINDOW_MS`). Máy nào bắn cách nhau > 400ms thì tăng số
  này.
- **Quét vào nhầm màn:** registry chỉ gửi tới màn **đang focus**. Nếu 2 màn
  `[code]` cùng mount (mở từ push notification), hook đã gate theo `useIsFocused`.

## 7. Giới hạn / mở rộng

- Chỉ Android (máy PDA là thiết bị Android); trên iOS module không tồn tại và mọi
  API thành no-op.
- Chỉ chạy khi app đang foreground (receiver đăng ký runtime, gắn vòng đời JS
  listener) — đúng nhu cầu quét trong app.
- Màn `employee-management` (quét QR token) **chưa** bật quét PDA: nhiều đầu đọc
  laser 1D không đọc được QR. Nếu máy là imager 2D, thêm `usePdaScanTarget` như
  mục 3.
