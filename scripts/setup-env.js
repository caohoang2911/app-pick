#!/usr/bin/env node

/**
 * Environment setup script
 * This script helps set up environment variables for different environments
 */

const fs = require('fs');
const path = require('path');

const environments = {
  development: {
    EAS_BUILD_PROFILE: 'dev',
    API_BASE_URL: 'https://oms-api-dev.seedcom.vn/',
    APP_NAME: 'App Pick Dev',
    DEBUG_MODE: 'true',
    ENABLE_ANALYTICS: 'false',
    ENABLE_CRASH_REPORTING: 'false',
    ENABLE_DEBUG_TOOLS: 'true',
  },
  production: {
    EAS_BUILD_PROFILE: 'prod',
    API_BASE_URL: 'https://oms-api.seedcom.vn/',
    APP_NAME: 'App Pick',
    DEBUG_MODE: 'false',
    ENABLE_ANALYTICS: 'true',
    ENABLE_CRASH_REPORTING: 'true',
    ENABLE_DEBUG_TOOLS: 'false',
  }
};

function createEnvFile(environment) {
  const config = environments[environment];
  if (!config) {
    console.error(`❌ Unknown environment: ${environment}`);
    console.log('Available environments: development, production');
    process.exit(1);
  }

  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const envPath = path.join(process.cwd(), '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Created .env file for ${environment} environment`);
    console.log(`📁 File location: ${envPath}`);
    console.log('\n📋 Environment variables:');
    Object.entries(config).forEach(([key, value]) => {
      console.log(`   ${key}=${value}`);
    });
  } catch (error) {
    console.error(`❌ Error creating .env file: ${error.message}`);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🌍 Environment Setup Script

Usage:
  node scripts/setup-env.js <environment>

Available environments:
  development  - Development environment
  production   - Production environment

Examples:
  node scripts/setup-env.js development
  node scripts/setup-env.js production

This script will create a .env file with the appropriate environment variables.
  `);
}

// Main execution
const environment = process.argv[2];

if (!environment || environment === '--help' || environment === '-h') {
  showHelp();
  process.exit(0);
}

createEnvFile(environment);
