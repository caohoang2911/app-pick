const fs = require('fs');
const path = require('path');

// Đường dẫn file version.ts
const VERSION_FILE = path.join(__dirname, '..', 'src', 'core', 'version.ts');

// Đọc version hiện tại
function getCurrentVersion() {
  try {
    const content = fs.readFileSync(VERSION_FILE, 'utf8');
    const match = content.match(/CODEPUSH_VERSION = ['"](.*?)['"]/);
    if (match && match[1]) {
      return match[1];
    }
    return '1.0.0';
  } catch (error) {
    return '1.0.0';
  }
}

// Tăng version
function incrementVersion(currentVersion) {
  try {
    const [major, minor, patch] = currentVersion.split('.').map(num => parseInt(num, 10));
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
  const content = `// This file is auto-generated by codepush-version.js
export const CODEPUSH_VERSION = '${newVersion}';
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