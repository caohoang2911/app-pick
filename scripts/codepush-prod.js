#!/usr/bin/env node

// Script để chạy CodePush cho production với environment đúng
const { execSync } = require('child_process');

console.log('🚀 Starting CodePush for Production...');

try {
  // Set environment variable
  process.env.EAS_BUILD_PROFILE = 'prod';
  
  console.log('📦 Updating CodePush version...');
  execSync('node scripts/codepush-version.js', { stdio: 'inherit' });
  
  console.log('🔄 Deploying to production branch...');
  execSync('eas update --branch production --message "Update CodePush version"', { stdio: 'inherit' });
  
  console.log('✅ CodePush production deployment completed!');
} catch (error) {
  console.error('❌ Error during CodePush production deployment:', error.message);
  process.exit(1);
}
