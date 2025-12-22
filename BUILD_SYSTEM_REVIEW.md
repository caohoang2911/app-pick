# 🔍 Build System Review

## ✅ Điểm Mạnh

### 1. **Dynamic Configuration**

- ✅ `app.config.ts` tự động chọn Google Services files theo environment
- ✅ Bundle IDs và package names được quản lý tập trung
- ✅ Environment detection logic rõ ràng

### 2. **Build Profiles**

- ✅ Tách biệt rõ ràng giữa dev và prod
- ✅ Auto-increment build numbers
- ✅ Separate channels cho OTA updates

### 3. **Prebuild Automation**

- ✅ Script tự động copy Google Services files
- ✅ Prebuild command được config trong `eas.json`

### 4. **OTA Updates**

- ✅ Runtime version management
- ✅ Separate channels (development/production)
- ✅ Auto-check on app launch

---

## ⚠️ Vấn Đề Cần Fix

### 🔴 **HIGH PRIORITY**

#### 1. **Google Services Files Không Được Ignore**

**Vấn đề:**

- Google Services files đang được commit vào git
- Chứa Firebase credentials và có thể bị lộ

**Files:**

- `google-services-dev.json`
- `google-services-prod.json`
- `GoogleService-Info-dev.plist`
- `GoogleService-Info-prod.plist`
- `android/app/google-services.json` (generated)
- `ios/AppPick/GoogleService-Info.plist` (generated)

**Fix:**

```gitignore
# Google Services files (contain Firebase credentials)
google-services-*.json
GoogleService-Info-*.plist
android/app/google-services.json
ios/**/GoogleService-Info.plist
```

**Recommendation:**

- Move sensitive files to EAS Secrets hoặc private repo
- Hoặc encrypt và decrypt trong CI/CD

---

#### 2. **Hardcoded Credentials trong `eas.json`**

**Vấn đề:**

- Apple ID và Team ID hardcoded trong `eas.json`
- Có thể bị lộ nếu repo public

**Current:**

```json
{
  "submit": {
    "prod": {
      "ios": {
        "appleId": "hongchanphat@gmail.com",
        "ascAppId": "6680199998",
        "appleTeamId": "4DT5296LMZ"
      }
    }
  }
}
```

**Fix:**

- Sử dụng EAS Secrets:

```bash
eas secret:create --scope project --name APPLE_ID --value "hongchanphat@gmail.com"
eas secret:create --scope project --name APPLE_TEAM_ID --value "4DT5296LMZ"
```

- Hoặc move vào environment variables

---

#### 3. **Android Build Config Conflict**

**Vấn đề:**

- `android/app/build.gradle` có hardcoded namespace và applicationId
- Có thể conflict với `app.config.ts` khi prebuild

**Current:**

```gradle
namespace 'com.caohoang2911.AppPickDev'
applicationId 'com.caohoang2911.AppPickDev'
```

**Fix:**

- Remove hardcoded values, để Expo prebuild tự generate
- Hoặc sync với `app.config.ts` logic

---

### 🟡 **MEDIUM PRIORITY**

#### 4. **Development Client Configuration**

**Vấn đề:**

- `eas.json` có `developmentClient: false`
- Nhưng `app.config.ts` có `developmentClient: { silentLaunch: true }` cho dev
- Có thể gây confusion

**Current:**

```json
// eas.json
"developmentClient": false

// app.config.ts
developmentClient: isDev ? { silentLaunch: true } : undefined
```

**Fix:**

- Clarify: Dev builds không dùng dev client, chỉ dùng cho local development
- Hoặc enable dev client cho dev builds nếu cần

---

#### 5. **Prebuild Script Error Handling**

**Vấn đề:**

- `copy-google-services.sh` có thể fail nếu:
  - iOS folder chưa tồn tại
  - Google Services files không tồn tại
- Script chỉ warn nhưng không fail build

**Fix:**

- Add proper error handling
- Fail build nếu files không tồn tại (critical)
- Hoặc create placeholder files

---

#### 6. **Android Build Type**

**Vấn đề:**

- Cả dev và prod đều dùng `apk`
- Production nên dùng `aab` cho Play Store

**Current:**

```json
"android": {
  "buildType": "apk"  // Should be "aab" for prod
}
```

**Fix:**

```json
"prod": {
  "android": {
    "buildType": "aab"  // For Play Store
  }
},
"dev": {
  "android": {
    "buildType": "apk"  // For testing
  }
}
```

---

### 🟢 **LOW PRIORITY**

#### 7. **Version Management**

**Vấn đề:**

- Version được manage ở nhiều nơi:
  - `app.json` → `version` và `ios.buildNumber`
  - `src/core/version.ts` → `CODEPUSH_VERSION`
  - Có thể không sync

**Fix:**

- Centralize version management
- Auto-sync versions

---

#### 8. **Build Scripts Organization**

**Vấn đề:**

- Nhiều scripts trong `package.json`
- Có thể khó maintain

**Fix:**

- Group related scripts
- Add descriptions
- Consider using a build script runner

---

## 📋 Recommendations

### Immediate Actions

1. **Add Google Services files to `.gitignore`**

   ```bash
   # Add to .gitignore
   google-services-*.json
   GoogleService-Info-*.plist
   android/app/google-services.json
   ios/**/GoogleService-Info.plist
   ```

2. **Move credentials to EAS Secrets**

   ```bash
   eas secret:create --scope project --name APPLE_ID
   eas secret:create --scope project --name APPLE_TEAM_ID
   ```

3. **Fix Android build type for production**
   - Change prod buildType to `aab`

---

### Best Practices

1. **Security:**
   - ✅ Never commit credentials
   - ✅ Use EAS Secrets for sensitive data
   - ✅ Rotate credentials regularly

2. **Configuration:**
   - ✅ Single source of truth cho bundle IDs
   - ✅ Validate configs before build
   - ✅ Document all environment variables

3. **Build Process:**
   - ✅ Fail fast on errors
   - ✅ Clear error messages
   - ✅ Build logs retention

---

## 🎯 Summary

### Overall Assessment: **🟡 GOOD với một số vấn đề cần fix**

**Strengths:**

- ✅ Dynamic configuration tốt
- ✅ Build profiles rõ ràng
- ✅ Automation scripts hoạt động tốt

**Issues:**

- 🔴 Security: Google Services files và credentials
- 🟡 Configuration: Một số conflicts và inconsistencies
- 🟢 Optimization: Có thể improve version management

**Priority Fixes:**

1. Add Google Services files to `.gitignore`
2. Move credentials to EAS Secrets
3. Fix Android build type for production
4. Resolve Android build config conflicts

---

**Last Updated:** Dec 22, 2025
