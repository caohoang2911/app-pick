#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const easConfig = require('../../eas.json');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function getProfile() {
  if (process.env.RELEASE_PROFILE) return process.env.RELEASE_PROFILE;
  if (process.env.RELEASE_ENVIRONMENT === 'production') return 'prod';
  if (process.env.RELEASE_TARGET === 'ios-device') return 'dev-device';
  return 'dev';
}

function getBuildProfile(profile) {
  const selected = easConfig.build?.[profile] || {};
  const parent = selected.extends
    ? easConfig.build?.[selected.extends] || {}
    : {};
  return {
    ...parent,
    ...selected,
    android: { ...(parent.android || {}), ...(selected.android || {}) },
    ios: { ...(parent.ios || {}), ...(selected.ios || {}) },
  };
}

function readExpoConfig(profile) {
  const expoBinary = path.join(
    __dirname,
    '..',
    '..',
    'node_modules',
    '.bin',
    'expo',
  );
  const result = spawnSync(expoBinary, ['config', '--json'], {
    encoding: 'utf8',
    env: { ...process.env, EAS_BUILD_PROFILE: profile },
  });

  if (result.status !== 0) {
    fail(result.stderr.trim() || 'Không resolve được Expo config.');
  }

  try {
    return JSON.parse(result.stdout.trim());
  } catch {
    fail('Expo config không trả về JSON hợp lệ.');
  }
}

function readGitCommit() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  });
  if (result.status === 0) return result.stdout.trim();
  return process.env.EAS_BUILD_GIT_COMMIT_HASH || 'unknown';
}

function readGitCommitMessage() {
  const result = spawnSync('git', ['log', '-1', '--pretty=%s'], {
    encoding: 'utf8',
  });
  if (result.status === 0) return result.stdout.trim();
  return undefined;
}

function print(label, value) {
  if (value === undefined || value === null || value === '') return;
  console.log(`  ${label}: ${value}`);
}

function main() {
  const profile = getProfile();
  const config = readExpoConfig(profile);
  const buildProfile = getBuildProfile(profile);
  const runtimeVersion =
    typeof config.runtimeVersion === 'string'
      ? config.runtimeVersion
      : JSON.stringify(config.runtimeVersion);

  console.log('Release context');
  print('Kind', process.env.RELEASE_KIND);
  print('Environment', process.env.RELEASE_ENVIRONMENT);
  print('Target', process.env.RELEASE_TARGET);
  print('Platform', process.env.RELEASE_PLATFORM);
  print('Profile', profile);
  print('Channel', process.env.RELEASE_CHANNEL || buildProfile.channel);
  print('App name', config.name);
  print('App version', config.version);
  print('Runtime version', runtimeVersion);
  print('Expo SDK', config.sdkVersion);
  print('Update URL', config.updates?.url);
  print('OTA display version', process.env.RELEASE_OTA_VERSION);
  print('Rollout', process.env.RELEASE_ROLLOUT);
  print('Git commit', readGitCommit());
  print('Base commit', process.env.RELEASE_BASE_SHA?.trim());
  print('Android package', config.android?.package);
  print('iOS bundle ID', config.ios?.bundleIdentifier);
  print('EAS project ID', config.extra?.eas?.projectId);
  print('Build version source', easConfig.cli?.appVersionSource);
  print('Auto increment build number', buildProfile.autoIncrement);
  print('Android build type', buildProfile.android?.buildType);
  print('iOS distribution', buildProfile.ios?.distribution);
  print('GitHub release repository', process.env.RELEASE_GITHUB_REPOSITORY);
  print('Message', process.env.RELEASE_MESSAGE || readGitCommitMessage());
}

main();
