# 🔧 Build Issues - Action Items

## 🔴 CRITICAL - Security Issues

### 1. Google Services Files Đang Được Track trong Git

**Status:** ❌ **CRITICAL**

**Files đang được track:**

- `google-services-dev.json`
- `google-services-prod.json`
- `GoogleService-Info-dev.plist`
- `GoogleService-Info-prod.plist`

**Vấn đề:**

- Chứa Firebase credentials
- Có thể bị lộ nếu repo public
- Security risk cao

**Fix ngay:**

```bash
# 1. Add to .gitignore
echo "
# Google Services files (Firebase credentials)
google-services-*.json
GoogleService-Info-*.plist
android/app/google-services.json
ios/**/GoogleService-Info.plist" >> .gitignore

# 2. Remove from git (keep local files)
git rm --cached google-services-dev.json
git rm --cached google-services-prod.json
git rm --cached GoogleService-Info-dev.plist
git rm --cached GoogleService-Info-prod.plist

# 3. Commit
git commit -m "security: remove Google Services files from git"
```

---

### 2. Credentials Hardcoded trong `eas.json`

**Status:** ⚠️ **HIGH PRIORITY**

**Vấn đề:**

- Apple ID và Team ID hardcoded
- Có thể bị lộ

**Fix:**

- Option 1: Move to EAS Secrets (Recommended)
- Option 2: Use environment variables
- Option 3: Keep in private config file (not in git)

---

## 🟡 MEDIUM - Configuration Issues

### 3. Android Build Config Hardcoded

**File:** `android/app/build.gradle`

**Vấn đề:**

```gradle
namespace 'com.caohoang2911.AppPickDev'
applicationId 'com.caohoang2911.AppPickDev'
```

Hardcoded cho dev, có thể conflict với prod builds.

**Fix:**

- Remove hardcoded values
- Let Expo prebuild generate từ `app.config.ts`

---

### 4. Android Build Type

**Vấn đề:**

- Production vẫn dùng `apk` thay vì `aab`

**Fix:**

```json
// eas.json
"prod": {
  "android": {
    "buildType": "aab"  // For Play Store
  }
}
```

---

## ✅ Summary

**Immediate Actions:**

1. ✅ Remove Google Services files from git
2. ✅ Add to .gitignore
3. ⚠️ Move credentials to EAS Secrets
4. 🔧 Fix Android build config

**Overall Build System:** 🟡 **GOOD** với security issues cần fix ngay
