# App Pick

Ứng dụng React Native/Expo cho quy trình hoàn tất đơn hàng của Seedcom OMS.
Dự án dùng EAS Workflows để phát hành OTA và native build.

## Kiểm tra trước release

```bash
yarn runtime:show
yarn validate:runtime
yarn type-check
yarn lint:workflow
```

OTA chỉ dành cho thay đổi JavaScript/TypeScript/assets tương thích với native
runtime hiện tại. Thay đổi native module, dependency, config plugin, permission,
`ios/`, `android/`, `app.json`, `app.config.ts` hoặc `eas.json` phải tạo native
build mới.

## Cờ chung của EAS Workflow

- `--ref <branch|tag|full-sha>`: Git ref chứa source muốn build/publish. Luôn
  truyền cờ này để EAS checkout source đã commit trên GitHub thay vì upload
  working tree local.
- `--non-interactive`: không hiển thị prompt; phải truyền đủ input bằng `-F`.
- `-F key=value`: truyền một `workflow_dispatch` input. Có thể dùng nhiều lần.

Ví dụ chọn commit cụ thể:

```bash
yarn workflow:ota:dev \
  --ref e2c4c7809132f359b7f9088880b54b4d69ce22ce
```

## OTA development

Development workflow luôn publish lên environment/channel `development`, cho
cả Android và iOS. Workflow tự lấy:

- Base commit từ OTA development thành công gần nhất có cùng runtime.
- Target commit từ `--ref`.
- Update message từ commit message của target.

Chạy có prompt; chỉ cần nhập `ota_version`:

```bash
yarn workflow:ota:dev --ref dev-deploy
```

Chạy non-interactive:

```bash
yarn workflow:ota:dev \
  --ref dev-deploy \
  --non-interactive \
  -F ota_version=1.0.34-dev
```

`ota_version` là version hiển thị, không thay đổi `expo.version` hoặc
`expo.runtimeVersion`.

## OTA production

Production workflow publish lên environment/channel `production`: rollout 25%,
chờ approval, sau đó mới rollout 100%.

Chạy có prompt:

```bash
yarn workflow:ota:prod --ref prod-deploy
```

Chạy non-interactive:

```bash
yarn workflow:ota:prod \
  --ref prod-deploy \
  --non-interactive \
  -F ota_version=1.0.34 \
  -F platform=all
```

Giá trị `platform` hợp lệ: `all`, `android`, `ios`.

## Native build development

Development có launcher riêng, cố định Git ref `dev-deploy`. Lệnh interactive sẽ
hỏi target, release notes và yêu cầu xác nhận:

```bash
yarn workflow:build:dev
```

Hoặc chọn thẳng platform; mỗi lệnh vẫn hỏi release notes và xác nhận:

```bash
yarn workflow:build:dev:android
yarn workflow:build:dev:ios         # iOS TestFlight
yarn workflow:build:dev:ios:device  # iOS internal device
yarn workflow:build:dev:both        # Android + iOS TestFlight
```

Chạy non-interactive:

```bash
yarn workflow:build:dev \
  --target android \
  --release-notes "Development native build"
```

Các cờ của launcher:

- `--target android`: build Android APK, profile `dev`.
- `--target ios-device`: build iOS internal cho thiết bị, profile `dev-device`.
- `--target ios-testflight`: build iOS profile `dev` và upload TestFlight.
- `--target android-ios-testflight`: Android APK và iOS TestFlight.
- `--release-notes "..."`: release notes truyền vào build/TestFlight/GitHub
  Release.
- `--dry-run`: chỉ in lệnh EAS dự kiến, không tạo build.

Trước khi chạy thật, launcher yêu cầu working tree clean và `HEAD` phải khớp
`origin/dev-deploy`.

## Native build production

Production workflow yêu cầu approval trước khi build. Android tạo APK/GitHub
Release; iOS build và upload TestFlight.

Production cố định Git ref `prod-deploy`. Chạy có prompt chọn platform:

```bash
yarn workflow:build:prod
```

Hoặc chọn thẳng platform:

```bash
yarn workflow:build:prod:android
yarn workflow:build:prod:ios
yarn workflow:build:prod:both
```

Chạy non-interactive:

```bash
yarn workflow:build:prod \
  --target android-ios \
  --release-notes "Production native build"
```

Giá trị `target` hợp lệ: `android`, `ios`, `android-ios`.

Trước khi chạy thật, launcher yêu cầu working tree clean và `HEAD` phải khớp
`origin/prod-deploy`.

## Runtime version

```bash
# Xem app version và runtime version
yarn runtime:show

# Tăng patch runtime, ví dụ 1.0.5 -> 1.0.6
yarn runtime:bump

# Đặt runtime cụ thể
yarn runtime:set 1.1.0
```

Tăng runtime khi native contract thay đổi và commit cùng native changes trước khi
build. App version có thể giữ nguyên; app version chỉ tăng khi cần phát hành bản
mới lên store.

Xem thêm quy trình và cấu hình EAS tại [docs/eas-workflows.md](docs/eas-workflows.md).
