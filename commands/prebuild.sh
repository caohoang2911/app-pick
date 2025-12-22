#!/bin/bash

set -e  # Exit on error

echo "🚀 Starting prebuild process..."

# Copy Google Services files
if [ -f "./commands/copy-google-services.sh" ]; then
  bash ./commands/copy-google-services.sh
  
  # Verify files were copied
  if [ ! -f "./android/app/google-services.json" ] && [ -d "./android" ]; then
    echo "⚠️  Warning: Android Google Services file not found after copy"
  fi
  
  if [ ! -f "./ios/AppPick/GoogleService-Info.plist" ] && [ -d "./ios" ]; then
    echo "⚠️  Warning: iOS Google Services file not found after copy"
  fi
else
  echo "⚠️  Warning: copy-google-services.sh not found"
fi

# Your existing prebuild commands here
# ...

echo "✨ Prebuild process completed!"