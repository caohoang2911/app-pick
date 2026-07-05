import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';
import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { getItem, removeItem, setItem } from '@/core/storage';
import { Env } from '~/env';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  type AppStateStatus,
  InteractionManager,
  Platform,
} from 'react-native';

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

/**
 * Đã xác nhận native ≥ remote → lưu `nativeBuildVersionRaw` + `checkedAt`.
 * Cùng binary VÀ còn trong TTL → bỏ qua gọi GitHub (tránh spam API ở kho nhiều máy chung IP).
 * Hết TTL hoặc đổi binary (cài bản mới) → check lại.
 * Khác bản cũ: nhờ TTL, có release native mới trên GitHub thì vẫn tự phát hiện sau tối đa `AUTO_UPDATE_LATEST_TTL_MS`, kể cả khi user vẫn cùng binary (không cần gỡ cài / xóa data).
 */
const AUTO_UPDATE_LATEST_KEY = 'autoUpdate:isLatest';

/** Bỏ qua fetch GitHub tối đa bấy nhiêu sau lần xác nhận "đang mới nhất" (cùng binary). */
const AUTO_UPDATE_LATEST_TTL_MS = 30 * 60 * 1000; // 30 phút

type AutoUpdateLatestStore = {
  isLatest: true;
  nativeBuildVersionRaw: string;
  checkedAt: number;
};

async function clearAutoUpdateLatest() {
  await removeItem(AUTO_UPDATE_LATEST_KEY);
}

async function writeAutoUpdateLatest(nativeBuildVersionRaw: string) {
  await setItem(AUTO_UPDATE_LATEST_KEY, {
    isLatest: true,
    nativeBuildVersionRaw,
    checkedAt: Date.now(),
  });
}

function shouldSkipGithubFetchDueToLatest(
  nativeBuildVersionRaw: string,
): boolean {
  const st = getItem<AutoUpdateLatestStore>(AUTO_UPDATE_LATEST_KEY);
  if (!st || typeof st !== 'object') return false;
  const raw = (st as AutoUpdateLatestStore).nativeBuildVersionRaw;
  if (
    (st as AutoUpdateLatestStore).isLatest !== true ||
    typeof raw !== 'string' ||
    raw !== nativeBuildVersionRaw
  ) {
    return false;
  }
  // Cache cũ (không có checkedAt) hoặc hết TTL → fetch lại để bắt release mới.
  const checkedAt = (st as AutoUpdateLatestStore).checkedAt;
  if (typeof checkedAt !== 'number' || !Number.isFinite(checkedAt)) {
    return false;
  }
  const age = Date.now() - checkedAt;
  // age < 0 (đồng hồ bị chỉnh lùi) → coi như hết hạn, check lại cho an toàn.
  return age >= 0 && age < AUTO_UPDATE_LATEST_TTL_MS;
}

/** Tránh 2 lần `run()` chồng nhau (Strict Mode / race trước khi ghi MMKV) → gọi GitHub trùng. */
let githubAutoUpdateInFlight = false;

/** Không reset khi remount (khác ranRef) — tránh schedule lại `run()` không cần thiết. Reset khi `enabled` false (chờ CodePush). */
let githubAutoUpdateRan = false;

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

/** CFBundleVersion đôi khi là số thuần ("69", "127") hoặc semver ("1.0.127"). So sánh với remote build: lấy số từ segment cuối nếu có dấu chấm. */
function parseNativeBuildVersion(raw: string | null | undefined): number {
  if (raw == null) return NaN;
  const trimmed = String(raw).trim();
  if (!trimmed) return NaN;

  if (trimmed.includes('.')) {
    const last = trimmed.split('.').pop() ?? '';
    const n = parseInt(last, 10);
    return Number.isFinite(n) ? n : NaN;
  }

  const n = Number(trimmed);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * So sánh 2 chuỗi version theo TỪNG phần số (semver-ish), không chỉ lấy segment cuối.
 * Tách theo dấu '.', so từng số; phần thiếu coi như 0.
 * Trả: <0 nếu a < b, 0 nếu bằng, >0 nếu a > b.
 * Dùng được cho cả iOS semver ("1.0.127") lẫn Android versionCode số thuần ("131").
 * Nhờ vậy bump major/minor (vd 1.0.131 → 1.1.5) vẫn so đúng, khác kiểu cũ chỉ lấy số cuối.
 */
function compareBuildVersions(
  a: string | null | undefined,
  b: string | null | undefined,
): number {
  const parse = (v: string | null | undefined): number[] => {
    if (v == null) return [];
    return String(v)
      .trim()
      .replace(/^v/i, '')
      .split('.')
      .map((seg) => {
        const n = parseInt(seg, 10);
        return Number.isFinite(n) ? n : 0;
      });
  };
  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x !== y) return x - y;
  }
  return 0;
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
    .sort((a, b) =>
      compareBuildVersions(
        tagBuildSegment(b.tag_name, fullTagPrefix),
        tagBuildSegment(a.tag_name, fullTagPrefix),
      ),
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
  /**
   * Chỉ true khi thật sự cần chờ check GitHub; false ngay nếu tắt native update (kể cả lúc chờ CodePush).
   * Lazy-init theo cache: còn trong TTL (mới xác nhận latest gần đây) → khởi tạo false để KHỎI flash
   * "Đang kiểm tra cập nhật" và vào app luôn (GitHub sẽ bị skip ở effect bên dưới).
   */
  const [isChecking, setIsChecking] = useState(() => {
    if (!nativeGithubUpdateAllowed) return false;
    const raw = String(Application.nativeBuildVersion ?? '');
    return !shouldSkipGithubFetchDueToLatest(raw);
  });
  const [progress, setProgress] = useState(0);
  /** iOS: còn bản GitHub mới hơn native — hiện lại popup khi quay lại app (ví dụ từ TestFlight). */
  const iosMandatoryRef = useRef<{ remoteBuildRaw: string } | null>(null);

  const presentIosMandatoryAlert = useCallback((remoteBuildRaw: string) => {
    const rawNative = Application.nativeBuildVersion;
    const nativeLabel = rawNative ?? '—';
    if (!APP_STORE_URL) {
      const body = `Build mới: ${remoteBuildRaw} | Hiện tại: ${nativeLabel}`;
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
      message: `Phiên bản mới (build ${remoteBuildRaw}) đã có. Thiết bị đang dùng build ${nativeLabel}.\n\n${hint}`,
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

      const nativeRaw = String(Application.nativeBuildVersion ?? '');
      if (compareBuildVersions(nativeRaw, pending.remoteBuildRaw) >= 0) {
        iosMandatoryRef.current = null;
        void writeAutoUpdateLatest(nativeRaw);
        return;
      }

      setIsChecking(true);
      scheduleUpdateUi(() => presentIosMandatoryAlert(pending.remoteBuildRaw));
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

    // ✅ Chưa enabled (CodePush chưa xong) → giữ isChecking = true; reset cờ module để lần enabled=true sau vẫn schedule check
    if (!enabled) {
      githubAutoUpdateRan = false;
      return;
    }

    const skipRawEarly = String(Application.nativeBuildVersion ?? '');
    if (shouldSkipGithubFetchDueToLatest(skipRawEarly)) {
      iosMandatoryRef.current = null;
      setIsChecking(false);
      if (__DEV__) {
        console.log(
          '[useAutoUpdate] Bỏ qua GitHub (MMKV isLatest + cùng nativeBuildVersion)',
          skipRawEarly,
        );
      }
      return;
    }

    const native = parseNativeBuildVersion(Application.nativeBuildVersion);

    if (__DEV__) {
      console.log(
        `[useAutoUpdate] ${Platform.OS} native build (parsed):`,
        native,
        'raw nativeBuildVersion:',
        Application.nativeBuildVersion,
      );
    }

    if (__DEV__) {
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

    if (githubAutoUpdateRan) {
      setIsChecking(false);
      return;
    }
    githubAutoUpdateRan = true;

    const run = async () => {
      let deferUnlock = false;
      const nativeRawForCache = String(Application.nativeBuildVersion ?? '');

      if (shouldSkipGithubFetchDueToLatest(nativeRawForCache)) {
        iosMandatoryRef.current = null;
        setIsChecking(false);
        if (__DEV__) {
          console.log(
            '[useAutoUpdate] Bỏ qua GitHub (MMKV isLatest + cùng nativeBuildVersion)',
            nativeRawForCache,
          );
        }
        return;
      }

      if (githubAutoUpdateInFlight) {
        if (__DEV__) {
          console.log(
            '[useAutoUpdate] Bỏ qua lần gọi GitHub trùng (đang có request auto-update).',
          );
        }
        return;
      }
      githubAutoUpdateInFlight = true;

      try {
        const fullTagPrefix =
          RELEASE_CHANNEL_PREFIX === ''
            ? null
            : `${RELEASE_CHANNEL_PREFIX}${Platform.OS === 'ios' ? 'ios' : 'android'}-`;

        const release = await fetchReleaseForUpdate(GITHUB_REPO, fullTagPrefix);

        if (!release) {
          githubAutoUpdateRan = false;
          await clearAutoUpdateLatest();
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
        if (!tag) {
          githubAutoUpdateRan = false;
          await clearAutoUpdateLatest();
          return;
        }

        const remoteRaw = tagBuildSegment(tag, fullTagPrefix);
        const remoteBuild = parseNativeBuildVersion(remoteRaw);

        if (!Number.isFinite(remoteBuild)) {
          githubAutoUpdateRan = false;
          await clearAutoUpdateLatest();
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

        if (compareBuildVersions(nativeRawForCache, remoteRaw) >= 0) {
          if (Platform.OS === 'ios') {
            iosMandatoryRef.current = null;
          }
          await writeAutoUpdateLatest(nativeRawForCache);
          if (__DEV__) {
            console.log(
              '[useAutoUpdate] Không cần cập nhật: native',
              nativeRawForCache,
              '>= remote',
              remoteRaw,
              tag,
            );
          }
          return;
        }

        await clearAutoUpdateLatest();

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
          iosMandatoryRef.current = { remoteBuildRaw: remoteRaw };
          scheduleUpdateUi(() => presentIosMandatoryAlert(remoteRaw));
          return;
        }
      } catch (e) {
        githubAutoUpdateRan = false;
        console.error('GitHub auto-update check failed', e);
        setIsChecking(false);
      } finally {
        githubAutoUpdateInFlight = false;
        if (!deferUnlock) {
          setIsChecking(false);
        }
      }
    };

    void run();
  }, [enabled, nativeGithubUpdateAllowed, presentIosMandatoryAlert]);

  return { isDownloading, isChecking, progress };
}
