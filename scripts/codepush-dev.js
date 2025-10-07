#!/usr/bin/env node

// Script để chạy CodePush cho development với environment đúng
const { execSync } = require('child_process');

console.log('🚀 Starting CodePush for Development...');

try {
  // Set environment variable
  process.env.EAS_BUILD_PROFILE = 'dev';
  
  console.log('📦 Updating CodePush version...');
  execSync('node scripts/codepush-version.js', { stdio: 'inherit' });
  
  console.log('🔄 Deploying to development branch...');
  execSync('eas update --branch development --message "Update CodePush version"', { stdio: 'inherit' });
  
  console.log('✅ CodePush development deployment completed!');
} catch (error) {
  console.error('❌ Error during CodePush development deployment:', error.message);
  process.exit(1);
}
