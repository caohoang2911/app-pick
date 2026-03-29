import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';
import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { Env } from '~/env';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  InteractionManager,
  Platform,
} from 'react-native';

const AUTO_UPDATE_IN_DEV =
  process.env.EXPO_PUBLIC_AUTO_UPDATE_IN_DEV === '1' ||
  process.env.EXPO_PUBLIC_AUTO_UPDATE_IN_DEV === 'true';

const BUNDLE_ID =
  Constants.expoConfig?.ios?.bundleIdentifier?.trim() ||
  'com.caohoang2911.seedcom-app-pick';

const GITHUB_REPO =
  process.env.EXPO_PUBLIC_GITHUB_REPO?.trim() || 'caohoang2911/app-pick';

const APP_STORE_URL =
  process.env.EXPO_PUBLIC_APP_STORE_URL?.trim() ||
  `itms-beta://?bundleIdentifier=${BUNDLE_ID}`;

function iosUpdateOpenLabel(url: string) {
  const u = url.toLowerCase();
  const isTestFlight =
    u.startsWith('itms-beta://') || u.includes('testflight.apple.com');
  return isTestFlight
    ? ({
        confirmText: 'Mở TestFlight',
        hint: 'Vui lòng cập nhật bản TestFlight mới nhất để tiếp tục sử dụng.',
      } as const)
    : ({
        confirmText: 'Mở App Store',
        hint: 'Vui lòng cập nhật từ App Store để tiếp tục sử dụng.',
      } as const);
}

const RELEASE_CHANNEL_PREFIX =
  process.env.EXPO_PUBLIC_GITHUB_RELEASE_TAG_PREFIX?.trim() ?? 'prod-';

type GitHubRelease = {
  tag_name: string;
  assets: { name: string; browser_download_url: string }[];
  draft?: boolean;
};

function tagBuildSegment(tag: string, fullTagPrefix: string | null): string {
  const rest =
    fullTagPrefix && tag.startsWith(fullTagPrefix)
      ? tag.slice(fullTagPrefix.length)
      : tag;
  return rest.replace(/^v/i, '').trim();
}

function scheduleUpdateUi(show: () => void) {
  const go = () =>
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(show);
    });
  if (Platform.OS === 'ios') {
    setTimeout(go, 400);
  } else {
    go();
  }
}

async function fetchReleaseForUpdate(
  repo: string,
  fullTagPrefix: string | null,
): Promise<GitHubRelease | null> {
  const headers = { Accept: 'application/vnd.github+json' };

  if (!fullTagPrefix) {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/releases/latest`,
      { headers },
    );
    if (!res.ok) return null;
    return (await res.json()) as GitHubRelease;
  }

  const res = await fetch(
    `https://api.github.com/repos/${repo}/releases?per_page=100`,
    { headers },
  );
  if (!res.ok) {
    if (__DEV__) {
      const body = await res.text();
      console.warn(
        '[useAutoUpdate] GitHub releases API lỗi',
        res.status,
        body.slice(0, 200),
      );
    }
    return null;
  }

  const list = (await res.json()) as unknown;
  if (!Array.isArray(list)) return null;

  const target = list
    .filter(
      (r): r is GitHubRelease =>
        Boolean(r) &&
        typeof (r as GitHubRelease).tag_name === 'string' &&
        !(r as GitHubRelease).draft &&
        (r as GitHubRelease).tag_name.startsWith(fullTagPrefix),
    )
    .sort(
      (a, b) =>
        Number(tagBuildSegment(b.tag_name, fullTagPrefix)) -
        Number(tagBuildSegment(a.tag_name, fullTagPrefix)),
    )[0];

  return target ?? null;
}

function findApkAsset(assets: GitHubRelease['assets']) {
  return assets.find((a) => a.name.toLowerCase().endsWith('.apk'));
}

const APK_INSTALL_INTENT_FLAGS = 0x00000001 | 0x10000000;

const SYSTEM_PACKAGE_INSTALLERS = [
  'com.google.android.packageinstaller',
  'com.android.packageinstaller',
  'com.samsung.android.packageinstaller',
  'com.miui.packageinstaller',
  'com.miui.global.packageinstaller',
];

async function openApkPackageInstaller(contentUri: string) {
  const base = {
    data: contentUri,
    flags: APK_INSTALL_INTENT_FLAGS,
    type: 'application/vnd.android.package-archive',
    category: 'android.intent.category.DEFAULT' as const,
  };

  for (const packageName of SYSTEM_PACKAGE_INSTALLERS) {
    try {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        ...base,
        packageName,
      });
      return;
    } catch {
      /* thử package kế tiếp */
    }
  }

  try {
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', base);
  } catch (e) {
    console.error('GitHub auto-update open installer failed', e);
    scheduleUpdateUi(() =>
      showAlert({
        title: 'Cập nhật',
        message:
          'Không mở được màn hình cài đặt. Kiểm tra quyền cài ứng dụng từ nguồn này.',
        confirmText: 'Đóng',
        isHideCancelButton: true,
        onConfirm: () => {
          hideAlert();
        },
      }),
    );
  }
}

export function useAutoUpdate({ enabled = true }: { enabled?: boolean } = {}): {
  isDownloading: boolean;
  isChecking: boolean;
  progress: number;
} {
  const nativeGithubUpdateAllowed = Env.NATIVE_GITHUB_UPDATE;
  const effectiveEnabled = enabled && nativeGithubUpdateAllowed;

  const [isDownloading, setIsDownloading] = useState(false);
  /** Chỉ true khi thật sự cần chờ check GitHub; false ngay nếu tắt native update (kể cả lúc chờ CodePush). */
  const [isChecking, setIsChecking] = useState(nativeGithubUpdateAllowed);
  const [progress, setProgress] = useState(0);
  const ranRef = useRef(false);
  /** iOS: còn bản GitHub mới hơn native — hiện lại popup khi quay lại app (ví dụ từ TestFlight). */
  const iosMandatoryRef = useRef<{ remoteBuild: number } | null>(null);

  const presentIosMandatoryAlert = useCallback((remoteBuild: number) => {
    const nativeCurrent = Number(Application.nativeBuildVersion);
    if (!APP_STORE_URL) {
      const body = `Build mới: ${remoteBuild} | Hiện tại: ${nativeCurrent}`;
      showAlert({
        title: 'Cần cập nhật phiên bản',
        message: body,
        confirmText: 'Đóng',
        isHideCancelButton: true,
        blockDismiss: true,
        onConfirm: () => {
          hideAlert();
          setIsChecking(false);
        },
      });
      return;
    }
    const { confirmText, hint } = iosUpdateOpenLabel(APP_STORE_URL);
    showAlert({
      title: 'Cần cập nhật phiên bản',
      message: `Phiên bản mới (build ${remoteBuild}) đã có. Thiết bị đang dùng build ${nativeCurrent}.\n\n${hint}`,
      confirmText,
      isHideCancelButton: true,
      blockDismiss: true,
      onConfirm: () => {
        hideAlert();
        void Linking.openURL(APP_STORE_URL);
        setIsChecking(false);
      },
    });
  }, []);

  useEffect(() => {
    if (!effectiveEnabled || Platform.OS !== 'ios') return;

    const onAppState = (next: AppStateStatus) => {
      if (next !== 'active') return;
      const pending = iosMandatoryRef.current;
      if (!pending) return;

      const native = Number(Application.nativeBuildVersion);
      if (Number.isFinite(native) && native >= pending.remoteBuild) {
        iosMandatoryRef.current = null;
        return;
      }

      setIsChecking(true);
      scheduleUpdateUi(() => presentIosMandatoryAlert(pending.remoteBuild));
    };

    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, [effectiveEnabled, presentIosMandatoryAlert]);

  useEffect(() => {
    // ✅ Tắt native GitHub: bỏ loading ngay — không phụ thuộc CodePush đã xong hay chưa
    if (!nativeGithubUpdateAllowed) {
      if (__DEV__) {
        // console.warn(
        //   '[useAutoUpdate] Tắt check GitHub native (Env.NATIVE_GITHUB_UPDATE / EXPO_PUBLIC_NATIVE_GITHUB_UPDATE).',
        // );
        return;
      }
      iosMandatoryRef.current = null;
      setIsChecking(false);
      return;
    }

    // ✅ Chưa enabled (CodePush chưa xong) → giữ isChecking = true, chờ tới khi mới check GitHub
    if (!enabled) return;

    if (ranRef.current) return;
    ranRef.current = true;

    const native = Number(Application.nativeBuildVersion);

    if (__DEV__) {
      console.log(
        `[useAutoUpdate] ${Platform.OS} native:`,
        native,
        '(Number(nativeBuildVersion)), raw:',
        Application.nativeBuildVersion,
      );
    }

    if (__DEV__ && !AUTO_UPDATE_IN_DEV) {
      console.warn(
        '[useAutoUpdate] Đang __DEV__: không check/tải cập nhật. Đặt EXPO_PUBLIC_AUTO_UPDATE_IN_DEV=1 để test.',
      );
      iosMandatoryRef.current = null;
      setIsChecking(false);
      return;
    }
    if (Platform.OS === 'web') {
      iosMandatoryRef.current = null;
      setIsChecking(false);
      return;
    }
    if (!GITHUB_REPO) {
      iosMandatoryRef.current = null;
      setIsChecking(false);
      return;
    }

    const run = async () => {
      let deferUnlock = false;
      try {
        const fullTagPrefix =
          RELEASE_CHANNEL_PREFIX === ''
            ? null
            : `${RELEASE_CHANNEL_PREFIX}${Platform.OS === 'ios' ? 'ios' : 'android'}-`;

        const release = await fetchReleaseForUpdate(GITHUB_REPO, fullTagPrefix);

        if (!release) {
          if (__DEV__) {
            console.warn(
              '[useAutoUpdate] Không có release khớp prefix tag',
              fullTagPrefix ?? '(latest)',
              'repo',
              GITHUB_REPO,
            );
          }
          return;
        }

        const tag = release.tag_name;
        if (!tag) return;

        const currentBuild = Number.isFinite(native) ? native : 0;
        const remoteBuild = Number(tagBuildSegment(tag, fullTagPrefix));

        if (!Number.isFinite(remoteBuild)) {
          if (__DEV__) {
            console.warn(
              '[useAutoUpdate] Tag không ra số build:',
              tag,
              '→',
              tagBuildSegment(tag, fullTagPrefix),
            );
          }
          return;
        }

        if (currentBuild >= remoteBuild) {
          if (Platform.OS === 'ios') {
            iosMandatoryRef.current = null;
          }
          if (__DEV__) {
            console.log(
              '[useAutoUpdate] Không cần cập nhật: native',
              currentBuild,
              '>= remote',
              remoteBuild,
              tag,
            );
          }
          return;
        }

        const downloadAndInstallApk = async (
          url: string,
          unlockApp: () => void,
        ) => {
          const baseDir = FileSystem.documentDirectory;
          if (!baseDir) {
            scheduleUpdateUi(() =>
              showAlert({
                title: 'Cập nhật',
                message: 'Không truy cập được bộ nhớ ứng dụng để tải file.',
                confirmText: 'Đóng',
                isHideCancelButton: true,
                blockDismiss: true,
                onConfirm: () => {
                  hideAlert();
                  unlockApp();
                },
              }),
            );
            return;
          }

          const fileUri = `${baseDir}update.apk`;
          setIsDownloading(true);
          setProgress(0);

          try {
            const download = FileSystem.createDownloadResumable(
              url,
              fileUri,
              {},
              (downloadProgress) => {
                const total = downloadProgress.totalBytesExpectedToWrite;
                if (total > 0) {
                  setProgress(downloadProgress.totalBytesWritten / total);
                }
              },
            );

            const result = await download.downloadAsync();
            if (!result?.uri)
              throw new Error('Download finished without a file URI');

            if (__DEV__) {
              const info = await FileSystem.getInfoAsync(result.uri, {
                size: true,
              });
              console.log(
                '[useAutoUpdate] APK path:',
                result.uri,
                'exists:',
                info.exists,
                'size:',
                info.exists ? info.size : 'n/a',
              );
            }

            const contentUri = await FileSystem.getContentUriAsync(result.uri);

            scheduleUpdateUi(() =>
              showAlert({
                title: 'Tải xong',
                message:
                  'Bấm Cài đặt để mở trình cài đặt và hoàn tất cập nhật. Ứng dụng cần phiên bản mới để tiếp tục.',
                confirmText: 'Cài đặt',
                isHideCancelButton: true,
                blockDismiss: true,
                onConfirm: () => {
                  hideAlert();
                  void openApkPackageInstaller(contentUri);
                  unlockApp();
                },
              }),
            );
          } catch (e) {
            console.error('GitHub auto-update download failed', e);
            scheduleUpdateUi(() =>
              showAlert({
                title: 'Cập nhật',
                message:
                  'Tải xuống thất bại. Kiểm tra kết nối mạng và thử lại sau.',
                confirmText: 'Đóng',
                isHideCancelButton: true,
                blockDismiss: true,
                onConfirm: () => {
                  hideAlert();
                  unlockApp();
                },
              }),
            );
          } finally {
            setIsDownloading(false);
            setProgress(0);
          }
        };

        if (Platform.OS === 'android') {
          const apk = findApkAsset(release.assets ?? []);
          if (!apk?.browser_download_url) {
            deferUnlock = true;
            scheduleUpdateUi(() =>
              showAlert({
                title: 'Cập nhật',
                message:
                  'Đã có phiên bản mới nhưng bản phát hành không kèm file APK. Vui lòng liên hệ quản trị.',
                confirmText: 'Đã hiểu',
                isHideCancelButton: true,
                blockDismiss: true,
                onConfirm: () => {
                  hideAlert();
                  setIsChecking(false);
                },
              }),
            );
            return;
          }

          deferUnlock = true;
          await downloadAndInstallApk(apk.browser_download_url, () =>
            setIsChecking(false),
          );
          return;
        }

        if (Platform.OS === 'ios') {
          deferUnlock = true;
          iosMandatoryRef.current = { remoteBuild };
          scheduleUpdateUi(() => presentIosMandatoryAlert(remoteBuild));
          return;
        }
      } catch (e) {
        console.error('GitHub auto-update check failed', e);
        setIsChecking(false);
      } finally {
        if (!deferUnlock) {
          setIsChecking(false);
        }
      }
    };

    void run();
  }, [enabled, nativeGithubUpdateAllowed, presentIosMandatoryAlert]);

  return { isDownloading, isChecking, progress };
}
