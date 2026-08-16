const fs = require('fs');
const path = require('path');

// Đường dẫn file version.ts
const VERSION_FILE = path.join(__dirname, '..', 'src', 'core', 'version.ts');

// Đọc version hiện tại
function getCurrentVersion() {
  try {
    const content = fs.readFileSync(VERSION_FILE, 'utf8');
    const match = content.match(
      /CODEPUSH_VERSION_FALLBACK\s*=\s*['"](.*?)['"]|CODEPUSH_VERSION\s*=\s*['"](.*?)['"]/,
    );
    if (match && (match[1] || match[2])) {
      return match[1] || match[2];
    }
    return '1.0.0';
  } catch (error) {
    return '1.0.0';
  }
}

// Tăng version
function incrementVersion(currentVersion) {
  try {
    const [major, minor, patch] = currentVersion
      .split('.')
      .map((num) => parseInt(num, 10));
    if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
      return '1.0.0';
    }
    return `${major}.${minor}.${patch + 1}`;
  } catch (error) {
    return '1.0.0';
  }
}

// Cập nhật version trong version.ts
function updateVersionFile(newVersion) {
  const content = `// Fallback này được tăng bởi codepush-version.js khi publish thủ công.
const CODEPUSH_VERSION_FALLBACK = '${newVersion}';

// EAS Workflow truyền version tường minh để mỗi OTA có mã bất biến, thay vì
// tăng file trong checkout tạm thời rồi mất thay đổi khi worker kết thúc.
export const CODEPUSH_VERSION =
  process.env.EXPO_PUBLIC_OTA_VERSION?.trim() || CODEPUSH_VERSION_FALLBACK;
`;

  fs.writeFileSync(VERSION_FILE, content);
  console.log(`CodePush version updated to ${newVersion}`);
}

// Main function
function main() {
  const currentVersion = getCurrentVersion();
  const newVersion = incrementVersion(currentVersion);
  updateVersionFile(newVersion);
}

main();
