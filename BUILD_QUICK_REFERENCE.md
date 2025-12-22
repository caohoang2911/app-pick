# ⚡ Build Quick Reference

## 🚀 Common Build Commands

### Development Builds

```bash
# Android (Cloud)
npm run build:android:dev

# Android (Local)
npm run build:android:dev:local

# iOS (Cloud)
npm run build:ios:dev

# iOS (Local)
npm run build:ios:dev:local
```

### Production Builds

```bash
# Set environment
export EAS_BUILD_PROFILE=prod

# Android
eas build --platform android --profile prod

# iOS
eas build --platform ios --profile prod
```

---

## 🔄 OTA Updates (CodePush)

```bash
# Development
npm run codepush:dev

# Production
npm run codepush:prod

# Without version increment
npm run codepush:dev:no-version
```

---

## 🛠️ Local Development

```bash
# Start dev server
npm run start:dev

# Run on Android device
npm run android:dev

# Run on iOS device
npm run ios:dev
```

---

## 📦 Prebuild

```bash
# Prebuild all platforms
npm run prebuild

# Prebuild iOS (dev)
npm run prebuild:ios:dev

# Prebuild Android (dev)
npm run prebuild:android:dev
```

---

## 🔍 Build Status

```bash
# List recent builds
npm run list:build
# or
eas build:list
```

---

## 📋 Build Profiles

| Profile | Bundle ID (iOS)                         | Package (Android)             | Channel       |
| ------- | --------------------------------------- | ----------------------------- | ------------- |
| `dev`   | `com.caohoang2911.seedcom-app-pick-dev` | `com.caohoang2911.AppPickDev` | `development` |
| `prod`  | `com.caohoang2911.seedcom-app-pick`     | `com.caohoang2911.AppPick`    | `production`  |

---

## 🔧 Environment Setup

```bash
# Setup dev environment
npm run env:dev

# This creates .env file with:
# - EAS_BUILD_PROFILE=dev
# - API_BASE_URL=https://oms-api-dev.seedcom.vn/
# - etc.
```

---

## 📱 Google Services Files

| Environment | iOS File                        | Android File                |
| ----------- | ------------------------------- | --------------------------- |
| Dev         | `GoogleService-Info-dev.plist`  | `google-services-dev.json`  |
| Prod        | `GoogleService-Info-prod.plist` | `google-services-prod.json` |

**Auto-copied during prebuild** via `commands/copy-google-services.sh`

---

## 🎯 Build Flow Summary

```
1. Set EAS_BUILD_PROFILE=dev|prod
2. Run prebuild (auto-copies Google Services)
3. Run eas build
4. Download .apk/.ipa
5. (Optional) Deploy OTA update
```

---

**See `BUILD_SYSTEM_EXPLAINED.md` for detailed explanation.**
