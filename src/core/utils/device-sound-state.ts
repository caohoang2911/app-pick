import { Platform } from 'react-native';

export const DEFAULT_VOLUME_THRESHOLD = 0.3;

export async function isDeviceSilentOrZeroVolume(options?: {
  volumeThreshold?: number;
}): Promise<boolean> {
  const threshold = options?.volumeThreshold ?? DEFAULT_VOLUME_THRESHOLD;

  try {
    const { VolumeManager } = require('react-native-volume-manager');

    if (Platform.OS === 'ios') {
      const isSilent = await getIOSSilentState(VolumeManager);
      if (isSilent) return true;

      const result = await VolumeManager.getVolume?.();
      const volume = result?.volume;
      return volume != null && volume < threshold;
    }

    if (Platform.OS === 'android') {
      const ringerMode = await VolumeManager.getRingerMode?.();
      if ([0, 1, 'silent', 'vibrate'].includes(ringerMode)) return true;

      if (typeof VolumeManager.isAndroidDeviceSilent === 'function') {
        if (await VolumeManager.isAndroidDeviceSilent()) return true;
      }

      const result = await VolumeManager.getVolume?.();
      const volume = result?.volume ?? result?.music;
      return volume != null && volume < threshold;
    }

    return false;
  } catch (_) {
    return false;
  }
}

function getIOSSilentState(VolumeManager: any): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false;

    const done = (value: boolean) => {
      if (resolved) return;
      resolved = true;
      try {
        sub?.remove?.();
      } catch (_) {}
      resolve(value);
    };

    const sub = VolumeManager.addSilentListener?.(
      (status: { isMuted: boolean; initialQuery: boolean }) => {
        // ✅ initialQuery = true nghĩa là đây là state hiện tại, không phải change event
        if (status.initialQuery) {
          done(!!status.isMuted);
        }
      },
    );

    // Fallback nếu listener không fire (lib không support / lỗi)
    setTimeout(() => done(false), 2500);
  });
}
