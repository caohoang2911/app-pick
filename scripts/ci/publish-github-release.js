#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const path = require('path');
const { spawnSync } = require('child_process');

const token = process.env.GITHUB_RELEASE_TOKEN?.trim();
const repository = (
  process.env.GITHUB_RELEASE_REPOSITORY ||
  process.env.EXPO_PUBLIC_GITHUB_REPO ||
  ''
).trim();
const tag = process.env.GITHUB_RELEASE_TAG?.trim();
const name = process.env.GITHUB_RELEASE_NAME?.trim() || tag;
const notes = process.env.GITHUB_RELEASE_NOTES || '';
const prerelease = process.env.GITHUB_RELEASE_PRERELEASE === 'true';
const assetPath = process.argv[2] ? path.resolve(process.argv[2]) : null;

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function apiRequest({
  hostname = 'api.github.com',
  method,
  requestPath,
  body,
}) {
  const payload = body == null ? null : Buffer.from(JSON.stringify(body));

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname,
        method,
        path: requestPath,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'seedcom-app-pick-eas-workflow',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(payload
            ? {
                'Content-Type': 'application/json',
                'Content-Length': payload.length,
              }
            : {}),
        },
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let parsed = null;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {
            parsed = raw;
          }
          resolve({ status: response.statusCode || 0, body: parsed });
        });
      },
    );

    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
}

function uploadAsset(releaseId, filePath, assetName) {
  const stat = fs.statSync(filePath);
  const encodedName = encodeURIComponent(assetName);

  return new Promise((resolve, reject) => {
    const request = https.request(
      {
        hostname: 'uploads.github.com',
        method: 'POST',
        path: `/repos/${repository}/releases/${releaseId}/assets?name=${encodedName}`,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Length': stat.size,
          'User-Agent': 'seedcom-app-pick-eas-workflow',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          const parsed = raw ? JSON.parse(raw) : null;
          resolve({ status: response.statusCode || 0, body: parsed });
        });
      },
    );

    request.on('error', reject);
    fs.createReadStream(filePath).on('error', reject).pipe(request);
  });
}

function currentCommit() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : undefined;
}

async function getOrCreateRelease() {
  const encodedTag = encodeURIComponent(tag);
  const existing = await apiRequest({
    method: 'GET',
    requestPath: `/repos/${repository}/releases/tags/${encodedTag}`,
  });

  if (existing.status === 200) return existing.body;
  if (existing.status !== 404) {
    throw new Error(`GitHub lookup lỗi ${existing.status}`);
  }

  const targetCommitish = currentCommit();
  const created = await apiRequest({
    method: 'POST',
    requestPath: `/repos/${repository}/releases`,
    body: {
      tag_name: tag,
      name,
      body: notes,
      draft: false,
      prerelease,
      ...(targetCommitish ? { target_commitish: targetCommitish } : {}),
    },
  });

  if (created.status !== 201) {
    throw new Error(`GitHub create release lỗi ${created.status}`);
  }
  return created.body;
}

async function replaceAsset(release, filePath) {
  const assetName = `app-pick-${tag}.apk`;
  const existingAsset = Array.isArray(release.assets)
    ? release.assets.find((asset) => asset.name === assetName)
    : null;

  if (existingAsset) {
    const deleted = await apiRequest({
      method: 'DELETE',
      requestPath: `/repos/${repository}/releases/assets/${existingAsset.id}`,
    });
    if (deleted.status !== 204) {
      throw new Error(`GitHub delete asset lỗi ${deleted.status}`);
    }
  }

  const uploaded = await uploadAsset(release.id, filePath, assetName);
  if (uploaded.status !== 201) {
    throw new Error(`GitHub upload asset lỗi ${uploaded.status}`);
  }
}

async function main() {
  if (!token) fail('Thiếu EAS secret GITHUB_RELEASE_TOKEN.');
  if (!/^[^/\s]+\/[^/\s]+$/.test(repository)) {
    fail('GITHUB_RELEASE_REPOSITORY phải có dạng owner/repo.');
  }
  if (!tag) fail('Thiếu GITHUB_RELEASE_TAG.');
  if (
    assetPath &&
    (!fs.existsSync(assetPath) || !fs.statSync(assetPath).isFile())
  ) {
    fail(`Không tìm thấy build artifact: ${assetPath}`);
  }

  try {
    const release = await getOrCreateRelease();
    if (assetPath) await replaceAsset(release, assetPath);
    console.log(`✅ GitHub release sẵn sàng: ${release.html_url}`);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}

main();
