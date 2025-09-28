import type { ExpoConfig } from "@expo/config";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const staticJson = require("./app.json");

function getProfile(): "dev" | "prod" {
  const profile = process.env.EAS_BUILD_PROFILE?.toLowerCase();
  if (profile === "prod" || profile === "production" || profile === "testflight") return "prod";
  return "dev";
}

export default (): ExpoConfig => {
  const profile = getProfile();
  const isDev = profile === "dev";
  const variant = isDev ? (process.env.APP_VARIANT?.toLowerCase() || "dev") : "prod";
  const base: ExpoConfig = (staticJson?.expo ?? {}) as ExpoConfig;

  // lấy từ app.json và chuẩn hóa để không bị lặp "Dev"
  const baseNameRaw = base.name ?? "App Pick";
  const nameProd = baseNameRaw.replace(/\s+Dev$/i, "");
  const nameDev = `${nameProd} Dev`;

  const baseSchemeValue = Array.isArray(base.scheme) ? base.scheme[0] : base.scheme;
  const baseSchemeRaw = baseSchemeValue ?? "apppick";
  const schemeBase = baseSchemeRaw.replace(/dev$/i, "");

  const baseBundleIdRaw = base.ios?.bundleIdentifier ?? "com.caohoang2911.seedcom-app-pick";
  const bundleIdBase = baseBundleIdRaw.replace(/-dev$/i, "");

  // Package names that EXACTLY match your Google Services files
  const getAndroidPackage = () => {
    if (isDev) {
      return "com.caohoang2911.AppPickDev";
    }
    // Production: match với google-services-prod.json
    // Bạn có thể chọn 1 trong 2:
    // - com.caohoang2911.AppPick
    // - sce.oms.apppick
    return "com.caohoang2911.AppPick"; // hoặc "sce.oms.apppick"
  };

  const getIOSBundleId = () => {
    if (isDev) {
      // Match với GoogleService-Info-dev.plist: com.caohoang2911.seedcom-app-pick-dev
      return "com.caohoang2911.seedcom-app-pick-dev";
    }
    // Match với GoogleService-Info-prod.plist: com.caohoang2911.seedcom-app-pick
    return "com.caohoang2911.seedcom-app-pick";
  };

  const androidPackage = getAndroidPackage();
  const iosBundleId = getIOSBundleId();

  console.log(`🔧 Building for ${isDev ? 'development' : 'production'} environment (variant: ${variant})`);
  console.log(`📦 Android package: ${androidPackage}`);
  console.log(`🍎 iOS bundle ID: ${iosBundleId}`);

  return {
    ...base,

    // Enable dev client for development
    developmentClient: isDev ? {
      silentLaunch: true,
    } : undefined,

    // tên app hiển thị
    name: isDev ? (variant === "dev" ? nameDev : `${nameProd} ${variant.toUpperCase()}`) : nameProd,

    // scheme deep link
    scheme: isDev ? `${schemeBase}${variant}` : schemeBase,

    ios: {
      ...base.ios,
      bundleIdentifier: iosBundleId, // Use exact bundle ID from GoogleService-Info files
      googleServicesFile: isDev 
        ? "./GoogleService-Info-dev.plist" 
        : "./GoogleService-Info-prod.plist",
      infoPlist: {
        ...(base.ios as any)?.infoPlist,
        CFBundleDisplayName: isDev ? (variant === "dev" ? nameDev : `${nameProd} ${variant.toUpperCase()}`) : nameProd,
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [isDev ? `${schemeBase}${variant}` : schemeBase],
          },
        ],
      },
    },

    android: {
      ...base.android,
      package: androidPackage, // Use exact package name from google-services files
      googleServicesFile: isDev 
        ? "./google-services-dev.json" 
        : "./google-services-prod.json",
    },

    extra: {
      ...base.extra,
      env: profile,
      variant,
    },
  };
};