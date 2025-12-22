# 🔧 Build System Refactor Summary

## ✅ Đã Fix

### 1. **Security: Google Services Files**

**Vấn đề:**

- Google Services files đang được track trong git
- Chứa Firebase credentials

**Fix:**

- ✅ Added to `.gitignore`:
  ```
  google-services-*.json
  GoogleService-Info-*.plist
  android/app/google-services.json
  ios/**/GoogleService-Info.plist
  ```
- ✅ Removed from git tracking (files vẫn còn local)
- ✅ Files sẽ được copy tự động trong prebuild process

---

### 2. **Android Build Type cho Production**

**Vấn đề:**

- Production build dùng `apk` thay vì `aab`

**Fix:**

- ✅ Changed `eas.json` → `prod.android.buildType`: `apk` → `aab`
- ✅ Changed `gradleCommand`: `:app:assembleRelease` → `:app:bundleRelease`

**Before:**

```json
"android": {
  "buildType": "apk",
  "gradleCommand": ":app:assembleRelease"
}
```

**After:**

```json
"android": {
  "buildType": "aab",
  "gradleCommand": ":app:bundleRelease"
}
```

---

### 3. **Prebuild Script Error Handling**

**Vấn đề:**

- Script chỉ warn khi Google Services files không tồn tại
- Không fail build khi thiếu critical files

**Fix:**

- ✅ Added `set -e` trong `prebuild.sh` để exit on error
- ✅ Changed warnings thành errors trong `copy-google-services.sh`
- ✅ Script sẽ fail build nếu files không tồn tại

**Before:**

```bash
echo "⚠️  Android: File not found: $ANDROID_SOURCE"
```

**After:**

```bash
echo "❌ Error: Android Google Services file not found: $ANDROID_SOURCE"
exit 1
```

---

### 4. **Android Build Config Documentation**

**Vấn đề:**

- Hardcoded namespace/applicationId trong `build.gradle` không có comment

**Fix:**

- ✅ Added comment giải thích:
  - Values được set bởi Expo prebuild từ `app.config.ts`
  - Values hiện tại cho dev builds
  - Production sẽ dùng values khác

---

## 📋 Files Changed

1. **`.gitignore`**
   - Added Google Services files patterns

2. **`eas.json`**
   - Changed prod buildType: `apk` → `aab`
   - Changed prod gradleCommand: `:app:assembleRelease` → `:app:bundleRelease`

3. **`commands/prebuild.sh`**
   - Added `set -e` for error handling
   - Added file verification after copy

4. **`commands/copy-google-services.sh`**
   - Changed warnings to errors
   - Exit on missing files

5. **`android/app/build.gradle`**
   - Added documentation comments

---

## ⚠️ Important Notes

### Google Services Files

**Files đã được remove khỏi git:**

- `google-services-dev.json`
- `google-services-prod.json`
- `GoogleService-Info-dev.plist`
- `GoogleService-Info-prod.plist`

**Files vẫn còn local** - không bị xóa.

**Để setup cho developers mới:**

1. Copy Google Services files từ secure storage
2. Place vào root directory:
   - `google-services-dev.json`
   - `google-services-prod.json`
   - `GoogleService-Info-dev.plist`
   - `GoogleService-Info-prod.plist`
3. Files sẽ được auto-copy trong prebuild process

---

### Android Build Type

**Production builds giờ sẽ tạo `.aab` files:**

- ✅ Suitable cho Play Store submission
- ✅ Smaller file size
- ✅ Better optimization

**Development builds vẫn dùng `.apk`:**

- ✅ Easier to install for testing
- ✅ No need for Play Store

---

## 🚀 Next Steps (Optional)

### 1. Move Credentials to EAS Secrets

**Current:**

```json
"submit": {
  "prod": {
    "ios": {
      "appleId": "hongchanphat@gmail.com",
      "appleTeamId": "4DT5296LMZ"
    }
  }
}
```

**Recommended:**

```bash
eas secret:create --scope project --name APPLE_ID
eas secret:create --scope project --name APPLE_TEAM_ID
```

---

### 2. Version Management

**Consider:**

- Centralize version management
- Auto-sync versions between `app.json` và `src/core/version.ts`

---

## ✅ Testing

**Verify changes:**

```bash
# Test prebuild
npm run prebuild:android:dev

# Verify Google Services files copied
ls android/app/google-services.json
ls ios/AppPick/GoogleService-Info.plist

# Test build (will use new config)
npm run build:android:dev
```

---

**Last Updated:** Dec 22, 2025
