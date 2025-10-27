#!/usr/bin/env node

// Script để chạy CodePush cho development KHÔNG tăng version
const { execSync } = require('child_process');

console.log('🚀 Starting CodePush for Development (No Version Increment)...');

try {
  // Set environment variable
  process.env.EAS_BUILD_PROFILE = 'dev';
  
  console.log('🔄 Deploying to development branch without version increment...');
  execSync('eas update --branch development --message "CodePush update without version increment"', { stdio: 'inherit' });
  
  console.log('✅ CodePush development deployment completed (no version change)!');
} catch (error) {
  console.error('❌ Error during CodePush development deployment:', error.message);
  process.exit(1);
}
