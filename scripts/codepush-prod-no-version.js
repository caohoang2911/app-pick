#!/usr/bin/env node

// Script để chạy CodePush cho production KHÔNG tăng version
const { execSync } = require('child_process');

console.log('🚀 Starting CodePush for Production (No Version Increment)...');

try {
  // Set environment variable
  process.env.EAS_BUILD_PROFILE = 'prod';

  console.log('🔄 Deploying to production branch without version increment...');
  execSync(
    'eas update --branch production --message "CodePush update without version increment"',
    { stdio: 'inherit' },
  );

  console.log(
    '✅ CodePush production deployment completed (no version change)!',
  );
} catch (error) {
  console.error(
    '❌ Error during CodePush production deployment:',
    error.message,
  );
  process.exit(1);
}
