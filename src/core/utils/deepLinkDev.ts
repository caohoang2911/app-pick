import { Platform } from 'react-native';
import { DeepLinkPath } from './deepLink';

/**
 * Debug utility for deep link testing in the development build
 */
export const testDeepLink = (path: string, params: Record<string, string> = {}, scheme: string = 'apppickdev'): void => {
  console.log('Testing deep link with:');
  console.log('- Scheme:', scheme);
  console.log('- Path:', path);
  console.log('- Params:', params);
  
  // Build the URL for debugging
  const queryString = Object.keys(params).length 
    ? '?' + Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    : '';
  
  // Use oms.seedcom.vn as host
  const host = 'oms.seedcom.vn';
  const url = `${scheme}://${host}/${path}${queryString}`;
  console.log('Full URL:', url);
  
  // Log different format for direct copy-paste testing
  
  if (Platform.OS === 'ios') {
    console.log('\nTo test in iOS Simulator:');
    console.log(`xcrun simctl openurl booted "${url}"`);
  } else if (Platform.OS === 'android') {
    console.log('\nTo test in Android Emulator:');
    console.log(`adb shell am start -a android.intent.action.VIEW -d "${url}" com.caohoang2911.AppPickDev`);
  }
};

/**
 * Prints debug information about scheme handling
 */
export const debugDeepLinkSetup = (): void => {
  console.log('\n===== DEEP LINK DEBUG INFO =====');
  console.log('App is configured with:');
  console.log('- Main scheme: apppickdev://');
  console.log('- Bundle ID: com.caohoang2911.seedcom-app-pick-dev (iOS)');
  console.log('- Package: com.caohoang2911.AppPickDev (Android)');
  console.log('- Universal Links: https://oms.seedcom.vn/...');
  
  if (Platform.OS === 'ios') {
    console.log('\nFor iOS, make sure:');
    console.log('1. CFBundleURLTypes is correctly set in Info.plist');
    console.log('2. apppickdev is in the list of URL schemes');
    console.log('3. Associated Domains has applinks:oms.seedcom.vn');
  } else if (Platform.OS === 'android') {
    console.log('\nFor Android, make sure:');
    console.log('1. Intent filters in AndroidManifest.xml correctly specify:');
    console.log('   - apppickdev scheme');
    console.log('   - com.caohoang2911.AppPickDev scheme');
    console.log('   - https scheme with oms.seedcom.vn host');
  }
  
  console.log('\n=====  END DEBUG INFO  =====\n');
}; 