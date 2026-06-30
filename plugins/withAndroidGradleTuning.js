/* eslint-disable */
// Config plugin: gradle.properties tuning (tăng RAM build + parallel/daemon/caching)
// — survive `expo prebuild --clean`. Trước đây hand-edit vào android/gradle.properties
// nên bị --clean reset về mặc định (Xmx 2048m) ⇒ dễ OOM khi build app lớn (local).
const {
  withGradleProperties,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const pkg = { name: 'with-android-gradle-tuning', version: '1.0.0' };

const PROPERTIES = {
  'org.gradle.jvmargs':
    '-Xmx4096m -XX:MaxMetaspaceSize=1024m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8',
  'org.gradle.parallel': 'true',
  'org.gradle.daemon': 'true',
  'org.gradle.caching': 'true',
  'org.gradle.configureondemand': 'false',
};

const withAndroidGradleTuning = (config) => {
  return withGradleProperties(config, (cfg) => {
    Object.entries(PROPERTIES).forEach(([key, value]) => {
      const existing = cfg.modResults.find(
        (item) => item.type === 'property' && item.key === key,
      );
      if (existing) {
        existing.value = value;
      } else {
        cfg.modResults.push({ type: 'property', key, value });
      }
    });
    return cfg;
  });
};

module.exports = createRunOncePlugin(
  withAndroidGradleTuning,
  pkg.name,
  pkg.version,
);
