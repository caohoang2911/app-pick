---
name: app-pick-build-update
description: >-
  Lập kế hoạch và thực hiện an toàn environment setup, Expo prebuild, EAS build,
  OTA expo-updates và GitHub native release cho App Pick. Dùng khi yêu cầu nhắc
  đến dev/prod profile, bundle ID, package name, Firebase config, runtimeVersion,
  CodePush, OTA, APK, TestFlight, build, deploy, release hoặc auto-update.
---

# Build và update App Pick

## Nguyên tắc an toàn

- Đọc `package.json`, `eas.json`, `app.config.ts`, `env.ts` và `app.json` trước
  khi chọn lệnh. Không dựa vào tài liệu cũ nếu script hiện tại khác.
- Truyền `EAS_BUILD_PROFILE=dev|prod` tường minh. Trước mọi build/publish, báo rõ
  platform, profile, channel/branch, runtime version và đích phát hành.
- Build, submit, OTA publish và tạo GitHub release là tác động bên ngoài. Chỉ chạy
  khi người dùng yêu cầu rõ; không suy ra quyền publish từ yêu cầu sửa code.
- `expo prebuild --clean` có thể tái tạo `ios/`/`android/`. Kiểm tra `git status`
  và diff native trước/sau; không làm mất thay đổi chưa commit.
- Không thay đổi version, signing, bundle ID, package hoặc Firebase config ngoài
  phạm vi yêu cầu.

## Chọn OTA hay native build

1. Phân loại diff:
   - JS/assets tương thích native runtime hiện tại: có thể là OTA.
   - Native dependency, config plugin, permission, local Expo module hoặc native
     config mới: cần native build; không phát OTA trước binary tương thích.
2. Xác nhận `runtimeVersion` và channel/branch khớp binary đích.
3. Startup phải giữ thứ tự `useCodepush` hoàn tất trước khi `useAutoUpdate` chạy.
   Không mở GitHub update khi OTA modal hoặc pending restart còn active.
4. iOS native update mở TestFlight/App Store; Android có thể tải APK và cần quyền
   unknown-sources. Không giả định hai platform có cùng flow.

## Lệnh hiện tại

```bash
# Development Metro/device
EAS_BUILD_PROFILE=dev yarn expo start --dev-client
EAS_BUILD_PROFILE=dev yarn expo run:android --device
EAS_BUILD_PROFILE=dev yarn expo run:ios --device

# EAS development build
eas build --platform android --profile dev
eas build --platform ios --profile dev

# Production scripts
yarn start:prod
yarn build:android:prod
yarn build:ios:prod

# OTA publish — chỉ khi đã xác nhận đích
node scripts/codepush-dev.js
yarn codepush:prod
```

EAS gọi `commands/prebuild.sh`, trong đó chạy `expo prebuild --clean` và copy
Google Services file. Không chạy script này như một bước kiểm tra read-only.

## Checklist trước bàn giao

- Profile trỏ đúng API, app name, scheme, Android package và iOS bundle ID.
- Google Services file đúng profile và không bị đưa credential mới vào diff.
- Type-check/quality gate pass hoặc baseline failure được báo rõ.
- Nếu build: artifact cài được trên thiết bị đích và native version đúng.
- Nếu OTA: update chỉ chứa thay đổi tương thích, tải được, yêu cầu restart đúng và
  không cho native auto-update chạy chồng.
- `git status` không có generated/native diff ngoài dự kiến.

## Nguồn sự thật

- `package.json`
- `eas.json`
- `app.config.ts`
- `env.ts`
- `src/core/hooks/useCodePush.ts`
- `src/core/hooks/useAutoUpdate.ts`
- `commands/prebuild.sh`
- `scripts/codepush-*.js`
