# EAS Workflows cho App Pick

Các workflow trong `.eas/workflows` dùng EAS Workflows làm CI/CD chính. Tên
“CodePush” trong UI/code cũ được giữ để tránh refactor ngoài phạm vi; kênh phân
phối thực tế là EAS Update.

## Nguyên tắc phát hành

- Pull request và push vào `main`, `dev-deploy`, `prod-deploy` chỉ tự động chạy
  quality workflow. Build và OTA luôn được kích hoạt thủ công.
- OTA workflow tự lấy full SHA của update thành công gần nhất có cùng branch và
  runtime từ EAS Update. Guard so diff từ SHA đó đến commit đang chạy và từ chối
  khi có native/config change.
- Production OTA phát hành 25%, dừng chờ approval, rồi mới rollout 100%.
- Native build dùng profile trong `eas.json`. Android tạo APK và đính kèm vào
  GitHub Release; iOS upload TestFlight trước rồi mới tạo release marker.
- Không dùng Expo Fingerprint trong repo này vì `ios/` và `android/` đang được
  commit.

## Thiết lập một lần trên Expo

1. Kết nối repository `caohoang2911/ap` trong GitHub settings của EAS project.
2. Tạo EAS environments `development` và `production`.
3. Trong mỗi environment, tạo hai file variables:
   - `GOOGLE_SERVICES_JSON`
   - `GOOGLE_SERVICES_PLIST`
4. Tạo secret `GITHUB_RELEASE_TOKEN` trong cả hai environment. Token cần quyền
   tạo release và upload asset cho `caohoang2911/ap`; không đặt tiền tố
   `EXPO_PUBLIC_` cho token.
5. Xác nhận Android/iOS signing credentials và App Store Connect connection đã
   được cấu hình cho các profile `dev`, `dev-device`, `prod`.

`commands/materialize-google-services.sh` chuyển EAS file variables từ đường dẫn
tạm về đúng tên mà `app.config.ts` và prebuild script đang sử dụng. Local build
vẫn dùng các file Google Services ở root như trước.

## Chạy workflow

Quality chạy tự động, hoặc có thể chạy thủ công từ EAS dashboard.

Development OTA:

```bash
yarn workflow:ota:dev
```

Development native build:

```bash
yarn workflow:build:dev
```

Lệnh sẽ hỏi target Android, iOS device, iOS TestFlight hoặc Android + iOS
TestFlight; sau đó hiển thị ref/runtime và yêu cầu xác nhận trước khi tạo build.
Muốn chạy không tương tác, truyền input cho launcher, ví dụ:

```bash
node scripts/ci/run-native-development-workflow.js \
  --target ios-device \
  --release-notes "Development iOS device build"
```

Production OTA:

```bash
yarn workflow:ota:prod
```

Production native build:

```bash
yarn workflow:build:prod
```

Khi CLI hỏi Git ref, chọn đúng commit/branch cần phát hành. Commit đích được lấy
từ Git ref; không cần nhập lại SHA. Workflow dùng `eas update:list` và
`eas update:view` để tự lấy `gitCommitHash` của OTA thành công gần nhất trên đúng
branch/runtime. Nếu runtime chưa từng có OTA, workflow dùng commit khai báo
runtimeVersion làm baseline. Rollback hoặc metadata thiếu SHA sẽ bị chặn để tránh
đoán sai source baseline.

`ota_version` là version hiển thị trong app, ví dụ `1.0.32` hoặc
`1.0.32-hotfix.1`. Workflow truyền giá trị này qua
`EXPO_PUBLIC_OTA_VERSION`; nó không sửa và không auto-commit
`src/core/version.ts` trên worker tạm.

OTA workflow không yêu cầu nhập release message. Khi `params.message` được bỏ
trống, EAS Update tự dùng message của commit đích; bước report cũng đọc cùng
commit message từ Git.

Mỗi OTA/native workflow có bước `Report release context`, lấy version và app
identifier từ Expo config đã resolve. Log bao gồm environment, profile, channel,
platform/target, app version, runtime version, OTA display version, rollout,
target/base commit, Android package, iOS bundle ID, EAS project ID, version source,
GitHub release repository và release message. Version được đọc từ source thay vì
thêm input trùng lặp, tránh nhập runtime không khớp binary.

## Phân loại OTA và native

Các thay đổi sau luôn yêu cầu native build:

- `android/**`, `ios/**`, `modules/**`, `plugins/**`, `patches/**`
- `package.json`, `yarn.lock`, `app.json`, `app.config.ts`, `eas.json`
- prebuild/Google Services scripts
- icon, splash và adaptive icon

Các file JavaScript/TypeScript và asset còn lại có thể đi OTA nếu type-check qua.
File chỉ phục vụ docs/workflow không tạo OTA.

Classifier cố ý bảo thủ: build native thừa an toàn hơn publish một bundle không
tương thích với binary đang cài.

## Quản lý app version và runtime version

`expo.version` và `expo.runtimeVersion` được quản lý độc lập. App version chỉ
tăng khi cần một release mới trên App Store/Play Store; runtime version phải tăng
khi native contract thay đổi, kể cả khi vẫn giữ nguyên app version.
Mỗi lần tăng app version cũng phải tăng runtime version; chiều ngược lại không
bắt buộc, nên có thể tạo runtime mới trong khi vẫn giữ app version chờ Apple
review.

```bash
# Xem hai version hiện tại
yarn runtime:show

# 1.0.5 -> 1.0.6, không đổi expo.version
yarn runtime:bump

# Hoặc đặt version cụ thể
yarn runtime:set 1.1.0
```

Commit thay đổi `app.json` cùng thay đổi native rồi mới chạy native build. Quality,
native build và OTA workflow đều chạy `yarn validate:runtime`; nếu có file
native/config thay đổi sau commit bump runtime gần nhất, workflow sẽ bị chặn.
Điều này giữ được app version trong lúc chờ Apple review nhưng ngăn binary khác
native contract dùng chung một runtime OTA.

## GitHub release convention

- `dev-android-<buildVersion>`
- `dev-ios-<buildVersion>`
- `prod-android-<buildVersion>`
- `prod-ios-<buildVersion>`

Prefix này khớp với `useAutoUpdate`. iOS release marker chỉ được tạo sau khi
TestFlight upload thành công; Android release luôn phải có asset `.apk`.

## Quality baseline

Workflow bắt buộc `yarn type-check` và format các file delivery mới bằng
`yarn lint:workflow`. Full-repo ESLint/Prettier hiện còn lỗi lịch sử trong code
nghiệp vụ, vì vậy chưa được dùng làm release gate cho tới khi baseline đó được
xử lý riêng.

## Giới hạn hiện tại

- Production Android profile tạo APK để phân phối qua GitHub, chưa submit Google
  Play. Muốn Play Store cần thêm profile AAB riêng.
- Multi-runtime OTA vẫn dùng `scripts/codepush-prod-multi.js` thủ công. Chỉ dùng
  khi bundle đã được xác nhận tương thích với mọi runtime được liệt kê.
- Runtime custom được giữ độc lập với app version; không bỏ qua
  `yarn validate:runtime` khi native contract thay đổi.
