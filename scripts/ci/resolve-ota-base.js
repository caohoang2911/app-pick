#!/usr/bin/env node

const { spawnSync } = require('child_process');
const appJson = require('../../app.json');

const SHA_PATTERN = /^[0-9a-f]{40}$/i;
const EAS_CLI_VERSION = '22.0.0';

function getOption(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

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

function runEas(args) {
  let result = spawnSync('eas', args, { encoding: 'utf8' });

  if (result.error?.code === 'ENOENT') {
    result = spawnSync(
      'npx',
      ['--yes', `eas-cli@${EAS_CLI_VERSION}`, ...args],
      { encoding: 'utf8' },
    );
  }

  if (result.status !== 0) {
    fail(
      result.stderr.trim() ||
        result.error?.message ||
        `EAS CLI thất bại: ${args.join(' ')}`,
    );
  }

  return result.stdout.trim();
}

function parseJson(raw, label) {
  try {
    return JSON.parse(raw);
  } catch {
    fail(`${label} không trả về JSON hợp lệ.`);
  }
}

function readLatestUpdate(branch, runtimeVersion) {
  const list = parseJson(
    runEas([
      'update:list',
      '--branch',
      branch,
      '--runtime-version',
      runtimeVersion,
      '--limit',
      '1',
      '--json',
      '--non-interactive',
    ]),
    'eas update:list',
  );
  const latest = list?.currentPage?.[0];

  if (!latest) return undefined;
  if (latest.isRollBackToEmbedded) {
    fail(
      `Update mới nhất của ${branch}/${runtimeVersion} là rollback. Không thể tự suy ra source baseline; cần phát hành lại từ native baseline trước.`,
    );
  }
  if (!latest.group) {
    fail('Update mới nhất không có update group ID.');
  }

  const details = parseJson(
    runEas(['update:view', latest.group, '--json']),
    'eas update:view',
  );
  const hashes = [
    ...new Set(
      (Array.isArray(details) ? details : [])
        .map((update) => update.gitCommitHash)
        .filter(Boolean),
    ),
  ];

  if (hashes.length !== 1 || !SHA_PATTERN.test(hashes[0])) {
    fail(
      `Update group ${latest.group} không có một gitCommitHash hợp lệ duy nhất.`,
    );
  }

  return { group: latest.group, sha: hashes[0] };
}

function readRuntimeBaseline() {
  const sha = runGit([
    'log',
    '-1',
    '--format=%H',
    '-G',
    '"runtimeVersion"',
    '--',
    'app.json',
  ]);

  if (!SHA_PATTERN.test(sha)) {
    fail('Không tìm thấy commit baseline của runtimeVersion hiện tại.');
  }
  return sha;
}

function setJobEnvironment(name, value) {
  const result = spawnSync('set-env', [name, value], { stdio: 'inherit' });
  if (result.status !== 0) {
    fail(
      result.error?.message || `Không set được workflow environment ${name}.`,
    );
  }
}

function main() {
  const branch = getOption('--branch');
  const shouldSetEnvironment = process.argv.includes('--set-env');
  const runtimeVersion = appJson?.expo?.runtimeVersion;

  if (!branch) fail('Thiếu --branch <EAS Update branch>.');
  if (typeof runtimeVersion !== 'string') {
    fail('Không đọc được expo.runtimeVersion từ app.json.');
  }

  const latestUpdate = readLatestUpdate(branch, runtimeVersion);
  const baseSha = latestUpdate?.sha || readRuntimeBaseline();
  const targetSha = runGit(['rev-parse', 'HEAD']);

  if (baseSha === targetSha) {
    fail(
      `Commit ${targetSha} đã là OTA mới nhất của ${branch}/${runtimeVersion}; không có release mới để publish.`,
    );
  }

  console.log('Resolved OTA comparison range');
  console.log(`  Branch: ${branch}`);
  console.log(`  Runtime version: ${runtimeVersion}`);
  console.log(
    `  Base source: ${latestUpdate ? `update group ${latestUpdate.group}` : 'runtime baseline'}`,
  );
  console.log(`  Base commit: ${baseSha}`);
  console.log(`  Target commit: ${targetSha}`);

  if (shouldSetEnvironment) {
    setJobEnvironment('BASE_SHA', baseSha);
    setJobEnvironment('RELEASE_BASE_SHA', baseSha);
  }
}

main();
