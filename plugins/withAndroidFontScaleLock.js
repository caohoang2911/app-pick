/* eslint-disable */
// Config plugin: khoá font-scale = 1.0 (tắt phóng to chữ theo cài đặt máy) cho
// Android — giữ UI ổn định cho app kho. Trước đây hand-edit thẳng vào
// MainApplication.kt / MainActivity.kt nên bị `expo prebuild --clean` xoá; nay
// inject lại qua plugin để survive prebuild (kể cả EAS).
//
// iOS không có cơ chế tương đương ở native — iOS dùng JS `allowFontScaling=false`
// toàn cục (xem src/core/utils/disable-font-scaling.ts).
const {
  withMainApplication,
  withMainActivity,
  createRunOncePlugin,
} = require('@expo/config-plugins');

const pkg = { name: 'with-android-font-scale-lock', version: '1.0.0' };

// Override getResources() ép fontScale = 1.0 — dùng tên class đầy đủ để khỏi lo import.
const GET_RESOURCES_OVERRIDE = `
  override fun getResources(): android.content.res.Resources {
    val res = super.getResources()
    val config = android.content.res.Configuration(res.configuration)
    // Lock font scale at 100% (1.0) - disable device font scaling
    config.fontScale = 1.0f
    return createConfigurationContext(config).resources
  }
`;

/** Chèn 1 method trước dấu `}` cuối cùng (đóng class). */
function insertBeforeLastBrace(contents, snippet) {
  const idx = contents.lastIndexOf('}');
  if (idx === -1) return contents;
  return contents.slice(0, idx) + snippet + '\n' + contents.slice(idx);
}

function withFontScaleMainApplication(config) {
  return withMainApplication(config, (cfg) => {
    if (cfg.modResults.language !== 'kt') {
      throw new Error(
        `[with-android-font-scale-lock] Chỉ hỗ trợ MainApplication Kotlin (đang là ${cfg.modResults.language}).`,
      );
    }
    let contents = cfg.modResults.contents;

    // 1) ép fontScale trong onConfigurationChanged
    if (!contents.includes('newConfig.fontScale = 1.0f')) {
      contents = contents.replace(
        'super.onConfigurationChanged(newConfig)',
        'super.onConfigurationChanged(newConfig)\n    newConfig.fontScale = 1.0f',
      );
    }

    // 2) override getResources()
    if (!contents.includes('override fun getResources()')) {
      contents = insertBeforeLastBrace(contents, GET_RESOURCES_OVERRIDE);
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
}

function withFontScaleMainActivity(config) {
  return withMainActivity(config, (cfg) => {
    if (cfg.modResults.language !== 'kt') {
      throw new Error(
        `[with-android-font-scale-lock] Chỉ hỗ trợ MainActivity Kotlin (đang là ${cfg.modResults.language}).`,
      );
    }
    let contents = cfg.modResults.contents;
    if (!contents.includes('override fun getResources()')) {
      contents = insertBeforeLastBrace(contents, GET_RESOURCES_OVERRIDE);
    }
    cfg.modResults.contents = contents;
    return cfg;
  });
}

const withAndroidFontScaleLock = (config) => {
  config = withFontScaleMainApplication(config);
  config = withFontScaleMainActivity(config);
  return config;
};

module.exports = createRunOncePlugin(
  withAndroidFontScaleLock,
  pkg.name,
  pkg.version,
);
