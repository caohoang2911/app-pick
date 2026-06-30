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

# Step 3: Firebase notification channel/sound meta-data
# → ĐÃ CHUYỂN sang config plugin `plugins/withFcmNotificationConfig.js` (chạy trong
#   `expo prebuild`, thêm channel_id + sound và xử lý đúng xmlns:tools cho tools:replace).
#   Không còn sed thủ công ở đây (sed cũ thêm tools:replace mà thiếu xmlns:tools → mong manh).

echo "✨ Prebuild process completed successfully!"