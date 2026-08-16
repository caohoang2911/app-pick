#!/usr/bin/env node

// Publish một bundle CodePush cho NHIỀU runtimeVersion cùng lúc.
//
// Vì sao cần: `eas update` lấy runtimeVersion từ app config tại thời điểm
// publish. Khi native đã bump runtimeVersion (vd 1.0.6) nhưng binary iOS trên
// store vẫn còn ở bản cũ (1.0.5) — đợi review App Store rất lâu — thì iOS sẽ
// không nhận được OTA nữa. Script này publish cùng một bundle lần lượt cho từng
// runtimeVersion, để máy cũ vẫn nhận update trong lúc chờ build native mới.
//
// ĐIỀU KIỆN AN TOÀN: bundle JS phải chạy được trên binary cũ (native module mới
// phải guard bằng `requireOptionalNativeModule` + cờ `isAvailable`, xem
// modules/pda-scanner/index.ts). Nếu code gọi thẳng native module chưa có trong
// binary cũ, publish kiểu này sẽ làm app cũ crash.
//
// Dùng — liệt kê ĐẦY ĐỦ mọi runtimeVersion muốn publish:
//   node scripts/codepush-prod-multi.js 1.0.6 1.0.5
//   node scripts/codepush-prod-multi.js 1.0.6 1.0.5 1.0.4
//   node scripts/codepush-prod-multi.js                  → chỉ runtimeVersion hiện tại
//   node scripts/codepush-prod-multi.js 1.0.5 --skip-current
//
// runtimeVersion hiện tại của app.json BẮT BUỘC nằm trong danh sách (nếu không
// script báo lỗi) — quên nó đồng nghĩa bản build native mới nhất không nhận
// được update nào, mà lại không có gì cảnh báo. Cố ý bỏ thì thêm --skip-current.
//
// CODEPUSH_VERSION chỉ tăng MỘT lần cho cả loạt, để mọi platform cùng mang một
// số version cho cùng một code.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APP_JSON = path.join(__dirname, '..', 'app.json');
const VERSION_FILE = path.join(__dirname, '..', 'src', 'core', 'version.ts');
const RUNTIME_VERSION_RE = /("runtimeVersion"\s*:\s*)"([^"]*)"/g;

function readCodepushVersion() {
  try {
    const content = fs.readFileSync(VERSION_FILE, 'utf8');
    const match = content.match(
      /CODEPUSH_VERSION_FALLBACK\s*=\s*['"](.*?)['"]|CODEPUSH_VERSION\s*=\s*['"](.*?)['"]/,
    );
    return match && (match[1] || match[2]) ? match[1] || match[2] : '?';
  } catch (error) {
    return '?';
  }
}

// Đọc app.json dưới dạng chuỗi thô (không JSON.parse) để giữ nguyên format
// prettier khi ghi lại — chỉ thay đúng giá trị runtimeVersion.
function readAppJson() {
  const raw = fs.readFileSync(APP_JSON, 'utf8');
  const matches = raw.match(RUNTIME_VERSION_RE);
  if (!matches || matches.length !== 1) {
    throw new Error(
      `app.json phải có đúng 1 khoá "runtimeVersion" (tìm thấy ${
        matches ? matches.length : 0
      }).`,
    );
  }
  const current = RegExp(RUNTIME_VERSION_RE.source).exec(raw)[2];
  return { raw, current };
}

function writeRuntimeVersion(raw, version) {
  fs.writeFileSync(
    APP_JSON,
    raw.replace(RegExp(RUNTIME_VERSION_RE.source), `$1"${version}"`),
  );
}

function publish(runtimeVersion, codepushVersion, dryRun) {
  const cmd = `eas update --branch production --message "CodePush ${codepushVersion} (runtime ${runtimeVersion})"`;

  if (dryRun) {
    // Đọc lại app.json từ đĩa để chứng minh nhãn runtimeVersion mà `eas update`
    // sẽ thấy đúng bằng version đang publish.
    const onDisk = RegExp(RUNTIME_VERSION_RE.source).exec(
      fs.readFileSync(APP_JSON, 'utf8'),
    )[2];
    console.log(`\n🔍 [dry-run] runtimeVersion ${runtimeVersion}`);
    console.log(`   app.json trên đĩa lúc này: "${onDisk}"`);
    console.log(`   sẽ chạy: ${cmd}`);
    return;
  }

  console.log(`\n🔄 Publish runtimeVersion ${runtimeVersion}...`);
  execSync(cmd, {
    stdio: 'inherit',
    env: { ...process.env, EAS_BUILD_PROFILE: 'prod' },
  });
}

function main() {
  const argv = process.argv.slice(2);
  const skipCurrent = argv.includes('--skip-current');
  const dryRun = argv.includes('--dry-run');
  const requested = [...new Set(argv.filter((a) => !a.startsWith('--')))];

  const invalid = requested.filter((v) => !/^\d+\.\d+\.\d+$/.test(v));
  if (invalid.length > 0) {
    console.error(`❌ runtimeVersion không hợp lệ: ${invalid.join(', ')}`);
    process.exit(1);
  }

  const { raw: originalRaw, current } = readAppJson();

  // Không truyền gì → hiểu là chỉ publish runtimeVersion hiện tại (≡ codepush:prod).
  const versions = requested.length > 0 ? requested : [current];

  if (!versions.includes(current) && !skipCurrent) {
    console.error(
      `❌ Danh sách thiếu runtimeVersion hiện tại (${current}) — bản native mới nhất sẽ không nhận được update nào.\n` +
        `   Thêm ${current} vào danh sách, hoặc dùng --skip-current nếu cố ý bỏ qua.`,
    );
    process.exit(1);
  }

  // Publish runtimeVersion hiện tại trước (app.json đã đúng sẵn, không phải ghi file).
  const ordered = versions.includes(current)
    ? [current, ...versions.filter((v) => v !== current)]
    : versions;

  // app.json phải được khôi phục dù publish lỗi hay bị Ctrl+C giữa chừng —
  // nếu không, file kẹt ở runtimeVersion cũ và lần build sau sẽ sai âm thầm.
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    fs.writeFileSync(APP_JSON, originalRaw);
    console.log(`\n♻️  Đã khôi phục app.json về runtimeVersion ${current}`);
  };

  const onSignal = (signal) => {
    restore();
    process.exit(signal === 'SIGINT' ? 130 : 143);
  };
  process.on('SIGINT', onSignal);
  process.on('SIGTERM', onSignal);

  try {
    console.log(
      '🚀 Starting CodePush for Production (multi runtimeVersion)...',
    );
    console.log(`📋 Sẽ publish runtimeVersion: ${ordered.join(', ')}`);

    let codepushVersion = readCodepushVersion();
    if (dryRun) {
      console.log(
        `\n📦 [dry-run] bỏ qua tăng CodePush version (${codepushVersion})`,
      );
    } else {
      console.log('\n📦 Updating CodePush version...');
      execSync('node scripts/codepush-version.js', { stdio: 'inherit' });
      codepushVersion = readCodepushVersion();
    }

    for (const version of ordered) {
      if (version !== current) writeRuntimeVersion(originalRaw, version);
      publish(version, codepushVersion, dryRun);
    }

    restore();
    console.log(
      dryRun
        ? `\n✅ [dry-run] Không publish gì. Chạy thật sẽ đẩy CodePush ${codepushVersion}+1 cho: ${ordered.join(', ')}`
        : `\n✅ Xong. CodePush ${codepushVersion} đã publish cho runtimeVersion: ${ordered.join(', ')}`,
    );
  } catch (error) {
    restore();
    console.error(
      '\n❌ Error during CodePush production deployment:',
      error.message,
    );
    process.exit(1);
  }
}

main();
