#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APP_JSON_PATH = path.join(__dirname, '..', '..', 'app.json');
const RUNTIME_VERSION_RE = /("runtimeVersion"\s*:\s*)"([^"]+)"/;
const VERSION_RE = /^\d+\.\d+\.\d+$/;

const NATIVE_PREFIXES = [
  'android/',
  'ios/',
  'modules/',
  'patches/',
  'plugins/',
];

const NATIVE_FILES = new Set([
  'app.config.ts',
  'app.json',
  'eas.json',
  'yarn.lock',
  'commands/prebuild.sh',
  'commands/copy-google-services.sh',
  'commands/materialize-google-services.sh',
  'assets/icon.png',
  'assets/splash.png',
  'assets/adaptive-icon.png',
]);

const PACKAGE_NATIVE_KEYS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
  'resolutions',
  'overrides',
];

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function runGit(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    fail(result.stderr.trim() || `Không chạy được git ${args.join(' ')}`);
  }
  return result.stdout.trim();
}

function readVersions() {
  const raw = fs.readFileSync(APP_JSON_PATH, 'utf8');
  const config = JSON.parse(raw);
  const appVersion = config?.expo?.version;
  const runtimeVersion = config?.expo?.runtimeVersion;

  if (typeof appVersion !== 'string' || !VERSION_RE.test(appVersion)) {
    fail(`expo.version không hợp lệ: ${String(appVersion)}`);
  }
  if (typeof runtimeVersion !== 'string' || !VERSION_RE.test(runtimeVersion)) {
    fail(
      `expo.runtimeVersion phải là custom version dạng x.y.z: ${String(runtimeVersion)}`,
    );
  }

  return { raw, appVersion, runtimeVersion };
}

function isNativeFile(file) {
  return (
    NATIVE_FILES.has(file) ||
    NATIVE_PREFIXES.some((prefix) => file.startsWith(prefix))
  );
}

function packageHasNativeChanges(runtimeCommit) {
  const previous = JSON.parse(
    runGit(['show', `${runtimeCommit}:package.json`]),
  );
  const current = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'),
  );

  return PACKAGE_NATIVE_KEYS.some(
    (key) =>
      JSON.stringify(previous[key] || null) !==
      JSON.stringify(current[key] || null),
  );
}

function getChangedFilesSinceRuntimeBump() {
  const gitRepository = spawnSync(
    'git',
    ['rev-parse', '--is-inside-work-tree'],
    { encoding: 'utf8' },
  );
  if (gitRepository.status !== 0) {
    return {
      runtimeCommit: 'git unavailable (config-only validation)',
      nativeFiles: [],
    };
  }

  const { runtimeVersion } = readVersions();
  const headAppJson = JSON.parse(runGit(['show', 'HEAD:app.json']));
  const headRuntimeVersion = headAppJson?.expo?.runtimeVersion;

  // Bump runtime đang nằm trong working tree/staging sẽ trở thành baseline mới
  // khi commit cùng native changes, nên không so ngược về baseline cũ.
  if (runtimeVersion !== headRuntimeVersion) {
    return {
      runtimeCommit: 'working-tree (pending commit)',
      nativeFiles: [],
    };
  }

  const runtimeCommit = runGit([
    'log',
    '-1',
    '--format=%H',
    '-G',
    '"runtimeVersion"',
    '--',
    'app.json',
  ]);

  if (!runtimeCommit) {
    fail('Không tìm thấy commit khai báo runtimeVersion trong app.json.');
  }

  const changed = runGit([
    'diff',
    '--name-only',
    '--diff-filter=ACMRTUXB',
    runtimeCommit,
    '--',
  ]);

  const files = [...new Set(changed.split('\n'))]
    .map((file) => file.trim())
    .filter(Boolean);

  return {
    runtimeCommit,
    nativeFiles: files.filter(
      (file) =>
        isNativeFile(file) ||
        (file === 'package.json' && packageHasNativeChanges(runtimeCommit)),
    ),
  };
}

function validate() {
  const { appVersion, runtimeVersion } = readVersions();
  const { runtimeCommit, nativeFiles } = getChangedFilesSinceRuntimeBump();

  console.log(`App version: ${appVersion}`);
  console.log(`Runtime version: ${runtimeVersion}`);
  console.log(`Runtime baseline commit: ${runtimeCommit}`);

  if (nativeFiles.length > 0) {
    console.error('\nNative changes after the latest runtime bump:');
    nativeFiles.forEach((file) => console.error(`  - ${file}`));
    fail(
      'Native contract đã thay đổi nhưng runtimeVersion chưa tăng. Chạy yarn runtime:bump, commit rồi build lại.',
    );
  }

  console.log('✅ Runtime version khớp native baseline.');
}

function setRuntimeVersion(nextVersion) {
  if (!VERSION_RE.test(nextVersion || '')) {
    fail(
      `runtimeVersion không hợp lệ: ${String(nextVersion)}. Dùng dạng x.y.z.`,
    );
  }

  const { raw, appVersion, runtimeVersion } = readVersions();
  if (nextVersion === runtimeVersion) {
    fail(`runtimeVersion đã là ${runtimeVersion}.`);
  }
  const currentParts = runtimeVersion.split('.').map(Number);
  const nextParts = nextVersion.split('.').map(Number);
  const isGreater = nextParts.some(
    (part, index) =>
      part > currentParts[index] &&
      nextParts.slice(0, index).every((value, i) => value === currentParts[i]),
  );
  if (!isGreater) {
    fail(
      `runtimeVersion mới (${nextVersion}) phải lớn hơn version hiện tại (${runtimeVersion}).`,
    );
  }

  const nextRaw = raw.replace(RUNTIME_VERSION_RE, `$1"${nextVersion}"`);
  if (nextRaw === raw) {
    fail('Không cập nhật được runtimeVersion trong app.json.');
  }

  fs.writeFileSync(APP_JSON_PATH, nextRaw);
  console.log(`✅ Runtime version: ${runtimeVersion} → ${nextVersion}`);
  console.log(`App version giữ nguyên: ${appVersion}`);
  console.log(
    'Commit app.json cùng thay đổi native trước khi chạy native build.',
  );
}

function bumpRuntimeVersion() {
  const { runtimeVersion } = readVersions();
  const parts = runtimeVersion.split('.').map(Number);
  parts[2] += 1;
  setRuntimeVersion(parts.join('.'));
}

function main() {
  const command = process.argv[2] || 'show';

  if (command === 'show') {
    const { appVersion, runtimeVersion } = readVersions();
    console.log(`App version: ${appVersion}`);
    console.log(`Runtime version: ${runtimeVersion}`);
    return;
  }
  if (command === 'validate') {
    validate();
    return;
  }
  if (command === 'bump') {
    bumpRuntimeVersion();
    return;
  }
  if (command === 'set') {
    setRuntimeVersion(process.argv[3]);
    return;
  }

  fail(`Lệnh không hợp lệ: ${command}. Dùng show, validate, bump hoặc set.`);
}

main();
