#!/usr/bin/env node

const { spawnSync } = require('child_process');

const baseSha = (process.env.BASE_SHA || '').trim();

if (!/^[0-9a-f]{40}$/i.test(baseSha)) {
  console.error(
    '❌ OTA base commit không hợp lệ. Workflow phải resolve được full SHA gồm 40 ký tự.',
  );
  console.error(`Độ dài nhận được sau khi bỏ khoảng trắng: ${baseSha.length}`);
  process.exit(1);
}

console.log(`Fetching base commit: ${baseSha}`);

const result = spawnSync(
  'git',
  ['fetch', '--no-tags', '--depth=1', 'origin', baseSha],
  { stdio: 'inherit' },
);

if (result.error) {
  console.error(`❌ Không chạy được git fetch: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(
    '❌ Không fetch được OTA base commit. Kiểm tra commit từ EAS Update metadata còn tồn tại trên GitHub.',
  );
  process.exit(result.status || 1);
}
