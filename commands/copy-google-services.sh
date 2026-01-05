#!/bin/bash

# Copy Google Services files based on environment
copy_google_services() {
    # Get profile from environment variable
    PROFILE=${EAS_BUILD_PROFILE:-"dev"}
    PROFILE=$(echo "$PROFILE" | tr '[:upper:]' '[:lower:]')
    
    # Get variant
    VARIANT=${APP_VARIANT:-"dev"}
    VARIANT=$(echo "$VARIANT" | tr '[:upper:]' '[:lower:]')

    echo "🔧 Copying Google Services files for profile: $PROFILE, variant: $VARIANT"

    # Determine environment suffix
    if [[ "$PROFILE" == "prod" || "$PROFILE" == "production" || "$PROFILE" == "testflight" ]]; then
        ENV_SUFFIX="prod"
    else
        # For dev builds, you can use different files based on variant
        case "$VARIANT" in
            "staging")
                ENV_SUFFIX="staging"
                ;;
            *)
                ENV_SUFFIX="dev"
                ;;
        esac
    fi

    echo "📱 Using environment files with suffix: $ENV_SUFFIX"

    # Copy Android Google Services
    ANDROID_SOURCE="./google-services-${ENV_SUFFIX}.json"
    ANDROID_TARGET="./android/app/google-services.json"

    if [ -f "$ANDROID_SOURCE" ]; then
        mkdir -p "$(dirname "$ANDROID_TARGET")"
        cp "$ANDROID_SOURCE" "$ANDROID_TARGET"
        echo "✅ Android: Copied $ANDROID_SOURCE to $ANDROID_TARGET"
        
        # Also copy to variant-specific directories for release builds
        # Google Services plugin (v4.4.1) searches in src/release/google-services.json first
        # This is REQUIRED for :app:assembleRelease builds
        RELEASE_TARGET="./android/app/src/release/google-services.json"
        mkdir -p "$(dirname "$RELEASE_TARGET")"
        cp "$ANDROID_SOURCE" "$RELEASE_TARGET"
        echo "✅ Android: Copied $ANDROID_SOURCE to $RELEASE_TARGET"
        
        # Also copy to debug directory for consistency
        DEBUG_TARGET="./android/app/src/debug/google-services.json"
        mkdir -p "$(dirname "$DEBUG_TARGET")"
        cp "$ANDROID_SOURCE" "$DEBUG_TARGET"
        echo "✅ Android: Copied $ANDROID_SOURCE to $DEBUG_TARGET"
    else
        echo "❌ Error: Android Google Services file not found: $ANDROID_SOURCE"
        echo "   Please ensure the file exists before building"
        exit 1
    fi

    # Copy iOS Google Services
    IOS_SOURCE="./GoogleService-Info-${ENV_SUFFIX}.plist"

    # Find iOS app directory - look for directories with Info.plist or that match app name patterns
    IOS_APP_DIR=""
    if [ -d "./ios" ]; then
        # First, try to find directory with Info.plist (most reliable)
        for dir in ./ios/*/; do
            dirname=$(basename "$dir")
            # Skip hidden directories, Pods, build directories, and Xcode project files
            if [[ ! "$dirname" =~ ^\. ]] && \
               [[ "$dirname" != "Pods" ]] && \
               [[ "$dirname" != "build" ]] && \
               [[ ! "$dirname" =~ \.xcodeproj$ ]] && \
               [[ ! "$dirname" =~ \.xcworkspace$ ]]; then
                # Check if this directory has Info.plist (it's an app directory)
                if [ -f "$dir/Info.plist" ] || [ -f "$dir/GoogleService-Info.plist" ]; then
                    IOS_APP_DIR="$dirname"
                    echo "📱 Found iOS app directory: $IOS_APP_DIR"
                    break
                fi
            fi
        done
        
        # If not found, try common names
        if [ -z "$IOS_APP_DIR" ]; then
            for dirname in "AppPick" "app" "App"; do
                if [ -d "./ios/$dirname" ]; then
                    IOS_APP_DIR="$dirname"
                    echo "📱 Using iOS app directory: $IOS_APP_DIR"
                    break
                fi
            done
        fi
    fi

    if [ -n "$IOS_APP_DIR" ]; then
        IOS_TARGET="./ios/$IOS_APP_DIR/GoogleService-Info.plist"
        
        if [ -f "$IOS_SOURCE" ]; then
            mkdir -p "$(dirname "$IOS_TARGET")"
            cp "$IOS_SOURCE" "$IOS_TARGET"
            echo "✅ iOS: Copied $IOS_SOURCE to $IOS_TARGET"
            
            # Verify the copy was successful
            if [ -f "$IOS_TARGET" ]; then
                echo "✅ iOS: Verified GoogleService-Info.plist exists at target location"
            else
                echo "❌ Error: File copy failed - target file not found"
                exit 1
            fi
        else
            echo "❌ Error: iOS Google Services file not found: $IOS_SOURCE"
            echo "   Please ensure the file exists before building"
            exit 1
        fi
    else
        echo "⚠️  iOS: Could not find app directory in ./ios/"
        echo "   This is OK if expo prebuild hasn't run yet - Expo will copy the file automatically via googleServicesFile config"
        echo "   If the directory exists but wasn't found, check the directory structure"
    fi

    echo "🎉 Google Services files copied successfully!"
}

# Run the function
copy_google_services