import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { CODEPUSH_VERSION } from '@/core/version';

export type ApVersion = {
  deviceModel: string;
  appVersion: string;
  platformVersion: string;
  codepushVersion: string;
};

const getDeviceModel = (): string => {
  const constants = Platform.constants as any;

  if (Platform.OS === 'android') {
    const brand = constants?.Brand || constants?.Manufacturer || '';
    const model = constants?.Model || '';
    const merged = `${brand} ${model}`.trim();
    return merged || 'Android';
  }

  if (Platform.OS === 'ios') {
    const idiom = constants?.interfaceIdiom;
    if (idiom === 'pad') return 'iPad';
    if (idiom === 'phone') return 'iPhone';
    return constants?.systemName || 'iOS';
  }

  return Platform.OS;
};

const getPlatformVersion = (): string => {
  const version = Platform.Version;

  return version != null ? String(version) : '';
};

const getAppVersion = (): string => {
  return (
    Application.nativeApplicationVersion ||
    Constants.expoConfig?.version ||
    ''
  );
};

export const getApVersion = (): ApVersion => ({
  deviceModel: getDeviceModel(),
  appVersion: getAppVersion(),
  platformVersion: getPlatformVersion(),
  codepushVersion: CODEPUSH_VERSION,
});
