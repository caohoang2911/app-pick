#!/bin/bash

set -e  # Exit on error

echo "🚀 Starting prebuild process..."

# Step 1: Run expo prebuild to generate native directories
echo "📦 Running expo prebuild..."
npx expo prebuild --clean

# Step 2: Copy Google Services files AFTER prebuild creates the directories
echo "📋 Copying Google Services files for Android and iOS..."
if [ -f "./commands/copy-google-services.sh" ]; then
  bash ./commands/copy-google-services.sh
  
  # Step 2.1: Verify iOS GoogleService-Info.plist exists and is in the right place
  echo "🔍 Verifying iOS GoogleService-Info.plist..."
  IOS_APP_DIR=""
  if [ -d "./ios" ]; then
    # Find iOS app directory
    for dir in ./ios/*/; do
      dirname=$(basename "$dir")
      if [[ ! "$dirname" =~ ^\. ]] && \
         [[ "$dirname" != "Pods" ]] && \
         [[ "$dirname" != "build" ]] && \
         [[ ! "$dirname" =~ \.xcodeproj$ ]] && \
         [[ ! "$dirname" =~ \.xcworkspace$ ]]; then
        if [ -f "$dir/Info.plist" ]; then
          IOS_APP_DIR="$dirname"
          break
        fi
      fi
    done
  fi
  
  if [ -n "$IOS_APP_DIR" ]; then
    IOS_TARGET="./ios/$IOS_APP_DIR/GoogleService-Info.plist"
    if [ -f "$IOS_TARGET" ]; then
      echo "✅ Verified: GoogleService-Info.plist exists at $IOS_TARGET"
      # Ensure file is readable and has content
      if [ -s "$IOS_TARGET" ]; then
        echo "✅ Verified: GoogleService-Info.plist has content"
      else
        echo "❌ Error: GoogleService-Info.plist is empty!"
        exit 1
      fi
    else
      echo "❌ Error: GoogleService-Info.plist not found at expected location: $IOS_TARGET"
      echo "   Attempting to copy again..."
      PROFILE=${EAS_BUILD_PROFILE:-"dev"}
      PROFILE=$(echo "$PROFILE" | tr '[:upper:]' '[:lower:]')
      if [[ "$PROFILE" == "prod" || "$PROFILE" == "production" || "$PROFILE" == "testflight" ]]; then
        ENV_SUFFIX="prod"
      else
        ENV_SUFFIX="dev"
      fi
      IOS_SOURCE="./GoogleService-Info-${ENV_SUFFIX}.plist"
      if [ -f "$IOS_SOURCE" ]; then
        mkdir -p "$(dirname "$IOS_TARGET")"
        cp "$IOS_SOURCE" "$IOS_TARGET"
        echo "✅ Re-copied $IOS_SOURCE to $IOS_TARGET"
      else
        echo "❌ Error: Source file not found: $IOS_SOURCE"
        exit 1
      fi
    fi
  else
    echo "⚠️  Warning: Could not find iOS app directory to verify GoogleService-Info.plist"
  fi
else
  echo "❌ Error: copy-google-services.sh not found!"
  exit 1
fi

# Step 3: Fix AndroidManifest.xml to add Firebase notification channel meta-data
fix_android_manifest() {
  local manifest_file="./android/app/src/main/AndroidManifest.xml"
  
  if [ ! -f "$manifest_file" ]; then
    echo "⚠️  AndroidManifest.xml not found, skipping manifest fix"
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

# Run the Android manifest fix
fix_android_manifest

echo "✨ Prebuild process completed successfully!"