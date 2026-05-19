import * as Network from 'expo-network';
import { showMessage } from 'react-native-flash-message';

/** Lấy IPv4 Wi‑Fi của máy (expo-network). */
export async function getDeviceIpAddress(): Promise<string | null> {
  try {
    const ip = await Network.getIpAddressAsync();
    if (!ip || ip === '0.0.0.0') return null;
    return ip;
  } catch {
    return null;
  }
}

export async function getDeviceIpHintText(): Promise<string> {
  const ip = await getDeviceIpAddress();
  return ip
    ? `IP máy điện thoại: ${ip}`
    : 'IP máy điện thoại: Không lấy được';
}

/** Ghép thông báo lỗi máy in với hint IP điện thoại. */
export async function buildPrinterConnectionFailMessage(
  baseMessage: string,
): Promise<string> {
  const ipHint = await getDeviceIpHintText();
  return `${baseMessage}\n\n${ipHint}`;
}

/** Toast lỗi kết nối máy in kèm hint IP điện thoại. */
export async function showPrinterConnectionFailMessage(
  baseMessage: string,
): Promise<void> {
  const ipHint = await getDeviceIpHintText();
  showMessage({
    description: baseMessage,
    message: ipHint,
    type: 'danger',
  });
}
