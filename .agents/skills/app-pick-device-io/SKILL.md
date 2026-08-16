---
name: app-pick-device-io
description: >-
  Hướng dẫn thay đổi tích hợp thiết bị của App Pick: Vision Camera, barcode/QR,
  máy PDA Android, Firebase/FCM, native module và máy in TCP Rongta/X-Printer.
  Dùng khi yêu cầu liên quan scanner, camera, PDA, Broadcast Intent, notification,
  printer, TCP socket, Expo module, config plugin hoặc quyền native.
---

# Tích hợp thiết bị App Pick

## Phân loại thay đổi

Trước khi sửa, xác định thay đổi thuộc JS-only, config plugin, local Expo module
hay native generated code. Ưu tiên `app.config.ts`, plugin trong `plugins/` hoặc
module trong `modules/` để thay đổi còn tồn tại sau `expo prebuild --clean`.

Không chạy prebuild, native build hoặc thay đổi quyền ký app nếu người dùng chưa
yêu cầu rõ. Development build mới là nguồn xác minh; Expo Go/web không đại diện
cho native integration.

## Camera và PDA scanner

- Tái sử dụng callback có shape `BarcodeScanningResult` cho cả camera và PDA;
  không tạo hai nhánh nghiệp vụ khác nhau.
- Listener PDA global chỉ mount một lần ở `AuthWrapper`. Screen đăng ký qua
  `usePdaScanTarget(handler, enabled)` và hook phải nằm trước mọi early return.
- Registry dùng stack + focus gate để chỉ screen hiện hành nhận scan. Không thay
  bằng một global callback đơn nếu chưa xử lý trường hợp nhiều `[code]` screen.
- Giữ dedupe scan trong `usePdaScan`; kiểm tra continuous scan và hai broadcast
  cho cùng một mã.
- Tôn trọng platform split của camera và iOS no-op của PDA. Việc thêm/sửa local
  module cần prebuild + cài development build mới.

## Printer và network I/O

- Lấy printer host bằng utility/storage hiện có; validate IP và hiển thị lỗi kết
  nối bằng helper chung.
- Giữ thứ tự print queue, kiểu byte `Uint8Array`, timeout/disconnect cleanup và
  chỉ mark printed sau khi điều kiện thành công của flow được đáp ứng.
- Không navigate/unmount trước khi invoice, COD receipt hoặc label queue hoàn tất
  nếu callback hiện tại còn phụ thuộc screen lifecycle.
- Kiểm tra printer unreachable, disconnect giữa queue, response rỗng và retry.

## Firebase, notification và native config

- Kiểm tra cả foreground, background và quit-state khi sửa FCM.
- Giữ package/bundle ID khớp Google Services file theo profile.
- Cross-platform behavior phải nêu rõ Android/iOS; PDA chỉ Android.
- Không log token FCM, auth token hoặc payload nhạy cảm.

## Ma trận xác minh tối thiểu

- Android camera scan và PDA Intent scan; mã trùng/scan nhanh.
- iOS camera scan và bảo đảm PDA path là no-op.
- Permission denied, app background/foreground và screen chuyển focus.
- Printer kết nối được, sai IP, mất mạng và nhiều print job liên tiếp.
- Nếu có native/config change: clean development build trên platform bị ảnh
  hưởng, sau khi đã kiểm tra diff native.

## Nguồn sự thật

- `docs/camera-optimization.md`
- `docs/pda-scanner.md`
- `docs/fcm-notifications.md`
- `modules/pda-scanner/`
- `src/core/hooks/usePdaScan.ts`
- `src/core/utils/printer-connection.ts`
