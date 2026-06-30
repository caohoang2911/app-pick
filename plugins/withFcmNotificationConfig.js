/* eslint-disable */
// Config plugin: meta-data `default_notification_sound = ding` cho FCM — survive
// `expo prebuild --clean`. (File ding.mp3 do expo-notifications `sounds` bundle vào
// res/raw — xem app.json.)
//
// LƯU Ý:
//  - `default_notification_channel_id` KHÔNG đặt ở đây vì expo-notifications tự
//    quản (xoá meta-data app-level). Channel id được set qua `firebase.json`
//    (`react-native.messaging_android_notification_channel_id`) → RNFirebase resolve
//    ở gradle build, sạch và bền hơn.
//  - Sound meta-data không xung đột với lib nào nên KHÔNG cần tools:replace.
const {
  withAndroidManifest,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const pkg = { name: 'with-fcm-notification-config', version: '1.0.0' };

const META_NAME = 'com.google.firebase.messaging.default_notification_sound';
const META_VALUE = 'ding';

const withFcmNotificationConfig = (config) => {
  return withAndroidManifest(config, (cfg) => {
    const application =
      cfg.modResults.manifest.application &&
      cfg.modResults.manifest.application[0];
    if (!application) return cfg;
    application['meta-data'] = application['meta-data'] || [];
    const metaList = application['meta-data'];

    let item = metaList.find((m) => m.$ && m.$['android:name'] === META_NAME);
    if (!item) {
      item = { $: {} };
      metaList.push(item);
    }
    item.$['android:name'] = META_NAME;
    item.$['android:value'] = META_VALUE;

    return cfg;
  });
};

module.exports = createRunOncePlugin(
  withFcmNotificationConfig,
  pkg.name,
  pkg.version,
);
