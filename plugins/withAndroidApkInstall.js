/* eslint-disable */
/**
 * Native bits for in-app APK update (survive `expo prebuild`):
 * - REQUEST_INSTALL_PACKAGES
 * - <queries> so Android 11+ can resolve package-installer intents
 *
 * Không có permission này → màn “Cho phép từ nguồn này” hiện nhưng toggle bị khóa.
 */
const {
  AndroidConfig,
  withAndroidManifest,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const pkg = { name: 'with-android-apk-install', version: '1.0.0' };

const INSTALL_PERMISSION = 'android.permission.REQUEST_INSTALL_PACKAGES';

const PACKAGE_ARCHIVE_QUERIES = [
  {
    action: 'android.intent.action.VIEW',
    mimeType: 'application/vnd.android.package-archive',
  },
  {
    action: 'android.intent.action.INSTALL_PACKAGE',
    mimeType: 'application/vnd.android.package-archive',
  },
];

function ensureQueryIntent(manifest, { action, mimeType }) {
  if (!manifest.queries) {
    manifest.queries = [{}];
  }
  const queries = manifest.queries[0];
  queries.intent = queries.intent || [];

  const exists = queries.intent.some((intent) => {
    const actions = intent.action || [];
    const data = intent.data || [];
    const hasAction = actions.some((a) => a.$?.['android:name'] === action);
    const hasMime = data.some((d) => d.$?.['android:mimeType'] === mimeType);
    return hasAction && hasMime;
  });

  if (!exists) {
    queries.intent.push({
      action: [{ $: { 'android:name': action } }],
      data: [{ $: { 'android:mimeType': mimeType } }],
    });
  }
}

const withAndroidApkInstall = (config) => {
  config = AndroidConfig.Permissions.withPermissions(config, [
    INSTALL_PERMISSION,
  ]);

  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    for (const q of PACKAGE_ARCHIVE_QUERIES) {
      ensureQueryIntent(manifest, q);
    }
    return cfg;
  });
};

module.exports = createRunOncePlugin(
  withAndroidApkInstall,
  pkg.name,
  pkg.version,
);
