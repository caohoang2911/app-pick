# 🏗️ Build System Explained

## Tổng Quan

Dự án sử dụng **Expo** với **EAS Build** để build native apps cho iOS và Android. Build system hỗ trợ multiple environments (dev/prod) và OTA updates qua Expo Updates.

---

## 📋 Build Architecture

```
┌─────────────────────────────────────────────────┐
│           Build Process Flow                     │
└─────────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  app.config.ts        │
        │  (Dynamic Config)      │
        └───────────┬────────────┘
                    │
        ┌───────────▼────────────┐
        │  EAS_BUILD_PROFILE     │
        │  (dev/prod)            │
        └───────────┬────────────┘
                    │
        ┌───────────▼────────────┐
        │  Prebuild Process      │
        │  - Copy Google Services│
        │  - Generate native code│
        └───────────┬────────────┘
                    │
        ┌───────────▼────────────┐
        │  EAS Build             │
        │  - Cloud build         │
        │  - Local build         │
        └───────────┬────────────┘
                    │
        ┌───────────▼────────────┐
        │  Native Apps           │
        │  - iOS (.ipa)          │
        │  - Android (.apk)      │
        └───────────────────────┘
```

---

## 🎯 Build Profiles

### 1. **Development Profile** (`dev`)

**File:** `eas.json` → `build.dev`

**Đặc điểm:**

- ✅ Development client: `false` (production build)
- ✅ Build type: `apk` (Android)
- ✅ Distribution: `store` (iOS)
- ✅ Channel: `development` (for OTA updates)
- ✅ Auto-increment build numbers

**Environment:**

```json
{
  "EAS_BUILD_PROFILE": "dev"
}
```

**Bundle IDs:**

- iOS: `com.caohoang2911.seedcom-app-pick-dev`
- Android: `com.caohoang2911.AppPickDev`

**Google Services:**

- iOS: `GoogleService-Info-dev.plist`
- Android: `google-services-dev.json`

---

### 2. **Production Profile** (`prod`)

**File:** `eas.json` → `build.prod`

**Đặc điểm:**

- ✅ Development client: `false`
- ✅ Build type: `apk` (Android)
- ✅ Distribution: `store` (iOS)
- ✅ Channel: `production` (for OTA updates)
- ✅ Auto-increment build numbers

**Environment:**

```json
{
  "EAS_BUILD_PROFILE": "prod"
}
```

**Bundle IDs:**

- iOS: `com.caohoang2911.seedcom-app-pick`
- Android: `com.caohoang2911.AppPick`

**Google Services:**

- iOS: `GoogleService-Info-prod.plist`
- Android: `google-services-prod.json`

---

## 🔧 Build Configuration Files

### 1. **`app.config.ts`** - Dynamic Configuration

**Chức năng:**

- Đọc `EAS_BUILD_PROFILE` từ environment
- Tự động chọn Google Services files
- Set bundle IDs và package names
- Configure app name, scheme, etc.

**Key Logic:**

```typescript
const profile = getProfile(); // "dev" | "prod"
const isDev = profile === 'dev';

// Auto-select Google Services files
googleServicesFile: isDev
  ? './GoogleService-Info-dev.plist'
  : './GoogleService-Info-prod.plist';
```

---

### 2. **`eas.json`** - EAS Build Configuration

**Build Profiles:**

- `dev`: Development builds
- `prod`: Production builds

**Prebuild Commands:**

```json
{
  "prebuildCommand": "./commands/prebuild.sh"
}
```

**Build Settings:**

- Node version: `22.9.0`
- iOS image: `macos-sonoma-14.6-xcode-16.1`
- Android gradle command: `:app:assembleRelease`

---

### 3. **`app.json`** - Static Configuration

**Chứa:**

- App metadata (name, version, icon, splash)
- Native permissions
- Deep linking configuration
- Expo plugins
- Updates configuration

---

## 🚀 Build Commands

### Development Builds

#### Android (Cloud)

```bash
npm run build:android:dev
# → eas build --platform android --profile dev
```

#### Android (Local)

```bash
npm run build:android:dev:local
# → prebuild + eas build --local
```

#### iOS (Cloud)

```bash
npm run build:ios:dev
# → eas build --platform ios --profile dev --auto-submit
```

#### iOS (Local)

```bash
npm run build:ios:dev:local
# → prebuild + eas build --local
```

---

### Production Builds

Tương tự như dev nhưng dùng profile `prod`:

```bash
# Set environment
export EAS_BUILD_PROFILE=prod

# Build
eas build --platform android --profile prod
eas build --platform ios --profile prod
```

---

## 📦 Prebuild Process

### Step 1: Copy Google Services Files

**Script:** `commands/copy-google-services.sh`

**Chức năng:**

1. Đọc `EAS_BUILD_PROFILE` từ environment
2. Xác định file cần copy (dev/prod)
3. Copy vào native folders:
   - Android: `android/app/google-services.json`
   - iOS: `ios/AppPick/GoogleService-Info.plist`

**Flow:**

```
EAS_BUILD_PROFILE=dev
    ↓
google-services-dev.json → android/app/google-services.json
GoogleService-Info-dev.plist → ios/AppPick/GoogleService-Info.plist
```

---

### Step 2: Generate Native Code

**Command:** `expo prebuild`

**Chức năng:**

- Generate `android/` và `ios/` folders từ Expo config
- Apply plugins (Firebase, Camera, Notifications, etc.)
- Configure native settings

**Khi nào chạy:**

- Trước local builds
- Khi thay đổi native config
- Khi add/remove Expo plugins

---

## 🏭 EAS Build Process

### Cloud Build (Recommended)

**Workflow:**

```
1. Developer runs: eas build --platform android --profile dev
2. EAS uploads code to cloud
3. EAS builds native app in cloud
4. Download .apk/.ipa file
```

**Advantages:**

- ✅ Không cần setup local environment
- ✅ Consistent build environment
- ✅ Faster (parallel builds)
- ✅ Auto-submit to App Store (iOS)

---

### Local Build

**Workflow:**

```
1. Developer runs: eas build --local
2. Build runs on local machine
3. Requires: Xcode (iOS) / Android Studio (Android)
```

**Advantages:**

- ✅ Faster iteration
- ✅ Debug native code
- ✅ Test locally

**Disadvantages:**

- ❌ Cần setup native tools
- ❌ Platform-specific (macOS for iOS)

---

## 🔄 OTA Updates (CodePush)

### Expo Updates System

**Configuration:**

```json
{
  "runtimeVersion": "1.0.3",
  "updates": {
    "fallbackToCacheTimeout": 0,
    "checkAutomatically": "NEVER",
    "url": "https://u.expo.dev/58d442de-186f-4ce5-a7b4-664b666f2ac0"
  }
}
```

**Channels:**

- `development` - Dev builds
- `production` - Prod builds

---

### CodePush Commands

#### Development

```bash
npm run codepush:dev
# → Update version + deploy to development channel
```

#### Production

```bash
npm run codepush:prod
# → Update version + deploy to production channel
```

**Scripts:**

- `codepush-version.js` - Increment version
- `codepush-dev.js` - Deploy to dev
- `codepush-prod.js` - Deploy to prod

---

### Update Flow

```
App Launch
    ↓
useCodePush hook
    ↓
Updates.checkForUpdateAsync()
    ↓
Update available?
    ├─ Yes → Download & Reload
    └─ No → Continue
```

**Check Timing:**

- On app launch (via `useCodePush`)
- When app becomes active (via `useAppState`)

---

## 🌍 Environment Configuration

### Environment Detection

**File:** `env.ts`

**Logic:**

```typescript
const environment = getEnvironmentFromConfig();
// Reads from app.config.ts → extra.env
// "dev" | "prod"
```

**Configs:**

- `dev`: Development API, debug mode ON
- `prod`: Production API, debug mode OFF

---

### Environment Variables

**Setup:**

```bash
npm run env:dev
# → Creates .env file with dev variables
```

**Variables:**

- `EAS_BUILD_PROFILE`: Build profile
- `API_BASE_URL`: API endpoint
- `DEBUG_MODE`: Debug flag
- `ENABLE_ANALYTICS`: Analytics flag

---

## 📱 Native Build Details

### Android

**Build Tool:** Gradle

**Key Files:**

- `android/app/build.gradle` - App build config
- `android/build.gradle` - Project build config
- `android/app/google-services.json` - Firebase config

**Build Types:**

- `apk` - For development/testing
- `aab` - For Play Store (production)

**Gradle Command:**

```bash
:app:assembleRelease
```

---

### iOS

**Build Tool:** Xcode

**Key Files:**

- `ios/AppPick.xcodeproj` - Xcode project
- `ios/Podfile` - CocoaPods dependencies
- `ios/AppPick/GoogleService-Info.plist` - Firebase config

**Distribution:**

- `store` - App Store distribution
- `simulator` - Simulator builds (disabled)

**Xcode Version:**

- Image: `macos-sonoma-14.6-xcode-16.1`

---

## 🔄 Build Workflow

### Complete Build Flow

```
1. Set Environment
   export EAS_BUILD_PROFILE=dev

2. Prebuild
   ./commands/prebuild.sh
   ├─ Copy Google Services
   └─ expo prebuild

3. Build
   eas build --platform android --profile dev
   ├─ Upload code
   ├─ Build in cloud
   └─ Download .apk

4. Deploy Updates (Optional)
   npm run codepush:dev
   └─ Deploy OTA update
```

---

## 📊 Build Artifacts

### Android

**Output:**

- `.apk` file (for testing)
- `.aab` file (for Play Store)

**Location:**

- Cloud builds: Download from EAS dashboard
- Local builds: `android/app/build/outputs/`

---

### iOS

**Output:**

- `.ipa` file (for distribution)

**Location:**

- Cloud builds: Download from EAS dashboard
- Auto-submit to App Store (if configured)

---

## 🛠️ Development Workflow

### Local Development

```bash
# Start dev server
npm run start:dev

# Run on device
npm run android:dev
npm run ios:dev
```

**Uses:**

- Expo Dev Client
- Fast Refresh
- Hot Reload

---

### Build for Testing

```bash
# Build APK for testing
npm run build:android:dev:local

# Install on device
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔐 Security & Secrets

### Google Services Files

**Dev:**

- `google-services-dev.json`
- `GoogleService-Info-dev.plist`

**Prod:**

- `google-services-prod.json`
- `GoogleService-Info-prod.plist`

**Note:** These files contain Firebase credentials and should be kept secure.

---

## 📈 Version Management

### App Version

**File:** `app.json`

```json
{
  "version": "1.0.24",
  "ios": {
    "buildNumber": "69"
  }
}
```

### Runtime Version

**File:** `app.json`

```json
{
  "runtimeVersion": "1.0.3"
}
```

**Purpose:** OTA updates compatibility. Apps with same `runtimeVersion` can receive updates.

---

## 🐛 Troubleshooting

### Common Issues

1. **Google Services mismatch**
   - Check `app.config.ts` logic
   - Verify file names match

2. **Build fails**
   - Check `eas.json` configuration
   - Verify prebuild command works

3. **OTA updates not working**
   - Check `runtimeVersion` matches
   - Verify channel is correct

---

## 📚 References

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Updates Documentation](https://docs.expo.dev/versions/latest/sdk/updates/)

---

**Last Updated:** Dec 22, 2025
