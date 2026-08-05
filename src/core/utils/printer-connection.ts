import * as Network from 'expo-network';
import { showMessage } from 'react-native-flash-message';
import TcpSocket from 'react-native-tcp-socket';

export const PRINTER_PORT = 9100;
export const PRINTER_CONNECT_TIMEOUT_MS = 5000;

/**
 * Thử mở kết nối TCP tới thiết bị (máy in) — true nếu kết nối được trong
 * thời gian chờ. Không toast, chỉ trả kết quả để caller tự hiển thị.
 */
export function checkTcpConnection(
  host: string,
  port: number = PRINTER_PORT,
  timeoutMs: number = PRINTER_CONNECT_TIMEOUT_MS,
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!host) {
      resolve(false);
      return;
    }

    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const finish = (client: { destroy: () => void } | null, ok: boolean) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      try {
        client?.destroy();
      } catch {}
      resolve(ok);
    };

    try {
      const client = TcpSocket.createConnection(
        { host, port, reuseAddress: true },
        () => finish(client, true),
      );
      client.on('error', () => finish(client, false));
      timer = setTimeout(() => finish(client, false), timeoutMs);
    } catch {
      finish(null, false);
    }
  });
}

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
  return ip ? `IP máy điện thoại: ${ip}` : 'IP máy điện thoại: Không lấy được';
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
