/**
 * Lấy URL tải APK Android mới nhất từ GitHub release (cùng prefix tag với useAutoUpdate).
 * Dùng ở Cài đặt khi user miss modal cập nhật bắt buộc.
 */
const GITHUB_REPO =
  process.env.EXPO_PUBLIC_GITHUB_REPO?.trim() || 'caohoang2911/app-pick';

const RELEASE_CHANNEL_PREFIX =
  process.env.EXPO_PUBLIC_GITHUB_RELEASE_TAG_PREFIX?.trim() ?? 'prod-';

type GitHubRelease = {
  tag_name: string;
  assets: { name: string; browser_download_url: string }[];
  draft?: boolean;
};

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

function tagBuildSegment(tag: string, fullTagPrefix: string | null): string {
  const rest =
    fullTagPrefix && tag.startsWith(fullTagPrefix)
      ? tag.slice(fullTagPrefix.length)
      : tag;
  return rest.replace(/^v/i, '').trim();
}

function findApkAsset(assets: GitHubRelease['assets']) {
  return assets.find((a) => a.name.toLowerCase().endsWith('.apk'));
}

async function fetchAndroidRelease(
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
  if (!res.ok) return null;

  const list = (await res.json()) as unknown;
  if (!Array.isArray(list)) return null;

  return (
    list
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
      )[0] ?? null
  );
}

/** URL tải APK Android mới nhất, hoặc null nếu không tìm thấy. */
export async function fetchLatestAndroidApkUrl(): Promise<string | null> {
  if (!GITHUB_REPO) return null;

  const fullTagPrefix =
    RELEASE_CHANNEL_PREFIX === '' ? null : `${RELEASE_CHANNEL_PREFIX}android-`;

  const release = await fetchAndroidRelease(GITHUB_REPO, fullTagPrefix);
  const apk = findApkAsset(release?.assets ?? []);
  return apk?.browser_download_url?.trim() || null;
}

/** Trang releases GitHub — fallback khi không lấy được URL asset. */
export function getAndroidApkReleasesPageUrl(): string {
  return `https://github.com/${GITHUB_REPO}/releases`;
}
