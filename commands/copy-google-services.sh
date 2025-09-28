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
    else
        echo "⚠️  Android: File not found: $ANDROID_SOURCE"
    fi

    # Copy iOS Google Services
    IOS_SOURCE="./GoogleService-Info-${ENV_SUFFIX}.plist"

    # Find iOS app directory
    IOS_APP_DIR=""
    if [ -d "./ios" ]; then
        for dir in ./ios/*/; do
            dirname=$(basename "$dir")
            # Skip hidden directories, Pods, and build directories
            if [[ ! "$dirname" =~ ^\. ]] && [[ "$dirname" != "Pods" ]] && [[ "$dirname" != "build" ]]; then
                IOS_APP_DIR="$dirname"
                break
            fi
        done
    fi

    if [ -n "$IOS_APP_DIR" ]; then
        IOS_TARGET="./ios/$IOS_APP_DIR/GoogleService-Info.plist"
        
        if [ -f "$IOS_SOURCE" ]; then
            mkdir -p "$(dirname "$IOS_TARGET")"
            cp "$IOS_SOURCE" "$IOS_TARGET"
            echo "✅ iOS: Copied $IOS_SOURCE to $IOS_TARGET"
        else
            echo "⚠️  iOS: File not found: $IOS_SOURCE"
        fi
    else
        echo "⚠️  iOS: Could not find app directory in ./ios/"
    fi

    echo "🎉 Google Services files copied successfully!"
}

# Run the function
copy_google_services