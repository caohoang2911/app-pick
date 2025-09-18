import { CODEPUSH_VERSION } from '@/core/version';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface VersionInfo {
  appVersion: string;
  platformVersion: string;
  deviceModel: string;
  codepushVersion: string;
}

export const getVersionInfo = (): VersionInfo => {
  // Get app version from expo config
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  
  // Get platform version from Constants
  const platformVersion = Platform.OS;
  
  // Get device model from Constants or create a generic one
  const deviceModel = Constants.deviceName || 
                     `${Platform.OS.toUpperCase()} Device`;
  
  // Get codepush version from the version file
  const codepushVersion = CODEPUSH_VERSION;

  return {
    appVersion,
    platformVersion,
    deviceModel,
    codepushVersion,
  };
};
