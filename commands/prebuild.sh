#!/bin/bash

set -e  # Exit on error

echo "🚀 Starting prebuild process..."

# Copy Google Services files FIRST (before prebuild generates AndroidManifest)
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

# Fix AndroidManifest.xml to add Firebase notification channel meta-data
# This must be done AFTER expo prebuild generates the manifest
fix_android_manifest() {
  local manifest_file="./android/app/src/main/AndroidManifest.xml"
  
  if [ ! -f "$manifest_file" ]; then
    echo "⚠️  AndroidManifest.xml not found yet, will be fixed after prebuild"
    return
  fi
  
  # Check if meta-data already exists
  if grep -q "com.google.firebase.messaging.default_notification_channel_id" "$manifest_file"; then
    echo "✅ Firebase notification channel meta-data already exists"
    return
  fi
  
  echo "🔧 Adding Firebase notification channel meta-data to AndroidManifest.xml..."
  
  # Add meta-data after the EXPO_UPDATE_URL line
  sed -i.bak '/<meta-data android:name="expo.modules.updates.EXPO_UPDATE_URL"/a\
    <meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="default_channel_id" tools:replace="android:value"/>
' "$manifest_file"
  
  rm -f "${manifest_file}.bak"
  echo "✅ Firebase notification channel meta-data added successfully"
}

# Register the function to run after prebuild
trap 'fix_android_manifest' EXIT

echo "✨ Prebuild process completed!"