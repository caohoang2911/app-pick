# 🔧 Gradle Build Commands - Giải Thích

## 📦 `assembleRelease` vs `bundleRelease`

### `assembleRelease` → Tạo `.apk`

**Command:**

```bash
./gradlew :app:assembleRelease
```

**Output:**

- File: `.apk` (Android Package)
- Location: `android/app/build/outputs/apk/release/app-release.apk`

**Đặc điểm:**

- ✅ **Có thể cài trực tiếp** trên device
- ✅ Có thể share và install qua USB/email
- ✅ Phù hợp cho testing, internal distribution
- ❌ File size lớn hơn (chứa tất cả resources cho mọi device)
- ❌ Không được optimize cho từng device type

**Use cases:**

- Development testing
- Internal testing
- Direct installation
- Beta testing outside Play Store

---

### `bundleRelease` → Tạo `.aab`

**Command:**

```bash
./gradlew :app:bundleRelease
```

**Output:**

- File: `.aab` (Android App Bundle)
- Location: `android/app/build/outputs/bundle/release/app-release.aab`

**Đặc điểm:**

- ❌ **Không thể cài trực tiếp** trên device
- ✅ File size nhỏ hơn (chỉ chứa base resources)
- ✅ Play Store sẽ generate optimized `.apk` cho từng device
- ✅ Better optimization (smaller downloads for users)
- ✅ Required format cho Play Store (từ 2021)

**Use cases:**

- Play Store submission
- Production releases
- Public distribution

---

## 🔄 So Sánh Chi Tiết

| Feature              | `assembleRelease`     | `bundleRelease`         |
| -------------------- | --------------------- | ----------------------- |
| **Output format**    | `.apk`                | `.aab`                  |
| **Cài trực tiếp**    | ✅ Yes                | ❌ No                   |
| **File size**        | Larger                | Smaller                 |
| **Installation**     | `adb install app.apk` | Upload to Play Store    |
| **Optimization**     | Basic                 | Advanced (per device)   |
| **Play Store**       | ✅ Accepted           | ✅ **Required** (2021+) |
| **Internal testing** | ✅ Perfect            | ❌ Not suitable         |
| **Direct sharing**   | ✅ Yes                | ❌ No                   |

---

## 📊 File Structure

### `.apk` File Structure

```
app-release.apk
├── AndroidManifest.xml
├── classes.dex
├── resources.arsc
├── res/ (all resources)
├── lib/ (all architectures: arm64, x86, etc.)
└── assets/
```

**Size:** ~50-100MB (chứa tất cả)

---

### `.aab` File Structure

```
app-release.aab
├── base/
│   ├── manifest/
│   ├── dex/
│   ├── res/ (base resources)
│   └── assets/
├── feature1/ (optional)
└── metadata/
```

**Size:** ~30-60MB (base only)

**Play Store processing:**

```
.aab uploaded
    ↓
Play Store analyzes device
    ↓
Generates optimized .apk
    ├─ Only ARM64 libs (for ARM device)
    ├─ Only needed resources
    └─ Smaller download (~20-40MB)
```

---

## 🎯 Khi Nào Dùng Gì?

### Dùng `assembleRelease` (`.apk`) Khi:

1. ✅ **Internal testing**
   - Test trên device trực tiếp
   - Share với team qua email/USB
   - Không qua Play Store

2. ✅ **Development builds**
   - Quick testing
   - Debug builds
   - Local development

3. ✅ **Beta testing ngoài Play Store**
   - Firebase App Distribution
   - Direct distribution
   - Enterprise distribution

---

### Dùng `bundleRelease` (`.aab`) Khi:

1. ✅ **Play Store submission**
   - Production releases
   - Public app distribution
   - Required format (2021+)

2. ✅ **Optimized distribution**
   - Smaller downloads
   - Better user experience
   - Play Store optimization

---

## 🔧 Trong Dự Án Này

### Current Configuration

**Development (`dev`):**

```json
{
  "buildType": "apk",
  "gradleCommand": ":app:assembleRelease"
}
```

✅ Phù hợp - có thể cài trực tiếp để test

**Production (`prod`):**

```json
{
  "buildType": "apk", // Đã revert về apk
  "gradleCommand": ":app:assembleRelease"
}
```

✅ Phù hợp - vì dùng internal testing, không upload Play Store

---

## 📝 Nếu Sau Này Cần Play Store

**Khi cần upload lên Play Store:**

1. Change `eas.json`:

```json
"prod": {
  "android": {
    "buildType": "aab",
    "gradleCommand": ":app:bundleRelease"
  }
}
```

2. Build:

```bash
eas build --platform android --profile prod
# → Tạo .aab file
```

3. Upload to Play Store:
   - Download `.aab` từ EAS dashboard
   - Upload lên Play Console
   - Play Store sẽ process và generate `.apk` cho users

---

## 🔄 Convert `.aab` → `.apk` (Nếu Cần)

**Nếu đã build `.aab` nhưng cần test:**

```bash
# Install bundletool
# Download: https://github.com/google/bundletool/releases

# Convert
bundletool build-apks \
  --bundle=app-release.aab \
  --output=app.apks \
  --mode=universal

# Extract
unzip app.apks
# → universal.apk (có thể cài)
```

---

## 📚 Technical Details

### `assembleRelease` Process

```
Source code
    ↓
Compile (Java/Kotlin → DEX)
    ↓
Package resources
    ↓
Include all native libs (arm64, x86, etc.)
    ↓
Create single .apk
    ↓
Sign
    ↓
app-release.apk (ready to install)
```

---

### `bundleRelease` Process

```
Source code
    ↓
Compile (Java/Kotlin → DEX)
    ↓
Package base resources
    ↓
Split native libs by architecture
    ↓
Create .aab with splits
    ↓
Sign
    ↓
app-release.aab (needs Play Store processing)
```

---

## ✅ Summary

**`assembleRelease`:**

- ✅ Tạo `.apk` - cài trực tiếp được
- ✅ Phù hợp cho internal testing
- ✅ File lớn hơn nhưng đơn giản hơn

**`bundleRelease`:**

- ✅ Tạo `.aab` - không cài trực tiếp
- ✅ Phù hợp cho Play Store
- ✅ File nhỏ hơn, optimized hơn

**Cho dự án này (internal testing):**

- ✅ Dùng `assembleRelease` → `.apk` là đúng
- ✅ Có thể cài trực tiếp để test
- ✅ Không cần Play Store

---

**Last Updated:** Dec 22, 2025
