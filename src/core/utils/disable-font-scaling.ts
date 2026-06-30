import { Text, TextInput } from 'react-native';

/**
 * Tắt phóng to chữ theo cài đặt máy (allowFontScaling=false) toàn cục cho RN
 * Text/TextInput — giữ UI ổn định bất kể "cỡ chữ" của hệ thống.
 *
 * Bổ trợ cho khoá font-scale ở native Android (plugins/withAndroidFontScaleLock.js)
 * và là cơ chế DUY NHẤT cho iOS (iOS không có override getResources). Import sớm
 * (đầu `_layout.tsx`) để chạy TRƯỚC khi UI render.
 */
type WithDefaultProps = { defaultProps?: { allowFontScaling?: boolean } };

const TextWithDefaults = Text as unknown as WithDefaultProps;
TextWithDefaults.defaultProps = {
  ...TextWithDefaults.defaultProps,
  allowFontScaling: false,
};

const TextInputWithDefaults = TextInput as unknown as WithDefaultProps;
TextInputWithDefaults.defaultProps = {
  ...TextInputWithDefaults.defaultProps,
  allowFontScaling: false,
};
