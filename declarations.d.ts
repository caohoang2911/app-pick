declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '*.css';

declare module 'expo-radio-button';

/**
 * Metro/Babel inline `process.env.EXPO_PUBLIC_*` at build time.
 * Minimal typing only — avoid pulling full `@types/node` into RN/Expo.
 */
declare const process: {
  env: Record<string, string | undefined>;
};
