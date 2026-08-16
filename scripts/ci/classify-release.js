#!/usr/bin/env node

const { spawnSync } = require('child_process');

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

const DELIVERY_ONLY_PREFIXES = [
  '.cursor/',
  '.eas/',
  '.github/',
  'docs/',
  'scripts/ci/',
];

const DELIVERY_ONLY_FILES = new Set([
  '.eslintrc.js',
  '.gitignore',
  '.prettierrc.js',
  'AGENTS.md',
  'README.md',
]);

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function isNativeFile(file) {
  return (
    NATIVE_FILES.has(file) ||
    NATIVE_PREFIXES.some((prefix) => file.startsWith(prefix))
  );
}

function isDeliveryOnlyFile(file) {
  return (
    DELIVERY_ONLY_FILES.has(file) ||
    file.endsWith('.md') ||
    DELIVERY_ONLY_PREFIXES.some((prefix) => file.startsWith(prefix))
  );
}

function readChangedFiles(base, head) {
  const result = spawnSync(
    'git',
    ['diff', '--name-only', '--diff-filter=ACMRTUXB', base, head, '--'],
    { encoding: 'utf8' },
  );

  if (result.status !== 0) {
    fail(result.stderr.trim() || `Không đọc được diff ${base}..${head}`);
  }

  return result.stdout
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean);
}

function resolveCommit(ref) {
  const result = spawnSync('git', ['rev-parse', ref], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : ref;
}

function readJsonAt(ref, file) {
  const result = spawnSync('git', ['show', `${ref}:${file}`], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    fail(result.stderr.trim() || `Không đọc được ${file} tại ${ref}`);
  }
  return JSON.parse(result.stdout);
}

function packageHasNativeChanges(base, head) {
  const previous = readJsonAt(base, 'package.json');
  const current = readJsonAt(head, 'package.json');
  return PACKAGE_NATIVE_KEYS.some(
    (key) =>
      JSON.stringify(previous[key] || null) !==
      JSON.stringify(current[key] || null),
  );
}

function validateOtaVersion(version) {
  if (!version) return;
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
    fail(
      `OTA version "${version}" không hợp lệ. Dùng dạng 1.2.3 hoặc 1.2.3-hotfix.1.`,
    );
  }
}

function main() {
  const base = getOption('--base');
  const head = getOption('--head') || 'HEAD';
  const otaVersion = getOption('--ota-version');
  const requireOta = process.argv.includes('--require-ota');

  if (!base) fail('Thiếu --base <commit>.');
  validateOtaVersion(otaVersion);

  const files = readChangedFiles(base, head);
  const packageIsNative =
    files.includes('package.json') && packageHasNativeChanges(base, head);
  const nativeFiles = files.filter(
    (file) =>
      isNativeFile(file) || (file === 'package.json' && packageIsNative),
  );
  const appFiles = files.filter(
    (file) =>
      file !== 'package.json' &&
      !isNativeFile(file) &&
      !isDeliveryOnlyFile(file),
  );

  let releaseKind = 'none';
  if (nativeFiles.length > 0) releaseKind = 'native';
  else if (appFiles.length > 0) releaseKind = 'ota';

  console.log(`Release classification: ${releaseKind}`);
  console.log(`Compared: ${base}..${head}`);
  console.log(`Changed files: ${files.length}`);

  if (nativeFiles.length > 0) {
    console.log('\nNative-required files:');
    nativeFiles.forEach((file) => console.log(`  - ${file}`));
  }

  if (appFiles.length > 0) {
    console.log('\nOTA bundle files:');
    appFiles.forEach((file) => console.log(`  - ${file}`));
  }

  if (requireOta && releaseKind !== 'ota') {
    if (releaseKind === 'native') {
      fail('Diff có thay đổi native/config. Hãy chạy native build workflow.');
    }
    if (files.length === 0) {
      const baseCommit = resolveCommit(base);
      const headCommit = resolveCommit(head);

      if (baseCommit === headCommit) {
        fail(
          `base_sha đang trỏ đúng commit đích ${headCommit}. Commit đích đã được lấy từ --ref; hãy nhập full SHA của bản phát hành thành công trước đó làm base_sha.`,
        );
      }

      fail(
        'base_sha không có khác biệt với commit đích. Không cần publish OTA; hãy tạo commit JS/assets mới trước lần OTA tiếp theo.',
      );
    }
    fail(
      'Diff chỉ chứa tài liệu/workflow; không có bundle app để publish OTA.',
    );
  }
}

main();
