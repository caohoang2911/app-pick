#!/bin/bash

# Script clean và rebuild sau khi cài đặt react-native-vision-camera
# Chạy: bash scripts/clean-and-rebuild.sh [ios|android|all]

set -e

PLATFORM=${1:-all}

echo "🧹 Starting clean process for: $PLATFORM"
echo ""

# Function to clean iOS
clean_ios() {
    echo "📱 Cleaning iOS..."
    cd ios
    
    # Remove Pods and build cache
    echo "  - Removing Pods..."
    rm -rf Pods
    
    echo "  - Removing Podfile.lock..."
    rm -rf Podfile.lock
    
    echo "  - Removing build cache..."
    rm -rf build
    
    # Clean Xcode derived data
    echo "  - Cleaning Xcode derived data..."
    rm -rf ~/Library/Developer/Xcode/DerivedData
    
    cd ..
    echo "✅ iOS cleaned successfully!"
    echo ""
}

# Function to clean Android
clean_android() {
    echo "🤖 Cleaning Android..."
    cd android
    
    # Clean gradle
    echo "  - Running gradle clean..."
    ./gradlew clean
    
    echo "  - Removing build folders..."
    rm -rf app/build
    rm -rf build
    rm -rf .gradle
    
    cd ..
    echo "✅ Android cleaned successfully!"
    echo ""
}

# Function to clean node modules and cache
clean_cache() {
    echo "🗑️  Cleaning Metro and Expo cache..."
    
    # Clean watchman
    if command -v watchman &> /dev/null; then
        echo "  - Cleaning watchman..."
        watchman watch-del-all
    fi
    
    # Clean metro
    echo "  - Cleaning Metro bundler cache..."
    rm -rf $TMPDIR/metro-* 2>/dev/null || true
    rm -rf $TMPDIR/haste-map-* 2>/dev/null || true
    
    # Clean expo
    echo "  - Cleaning Expo cache..."
    rm -rf .expo
    
    echo "✅ Cache cleaned successfully!"
    echo ""
}

# Execute cleaning based on platform
if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "all" ]; then
    clean_ios
fi

if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "all" ]; then
    clean_android
fi

if [ "$PLATFORM" = "all" ]; then
    clean_cache
fi

echo "🎉 Clean process completed!"
echo ""
echo "📦 Next steps:"
echo ""

if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "all" ]; then
    echo "iOS:"
    echo "  1. cd ios && pod install && cd .."
    echo "  2. yarn ios"
    echo ""
fi

if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "all" ]; then
    echo "Android:"
    echo "  1. yarn android"
    echo ""
fi

echo "Or use prebuild:"
echo "  - yarn prebuild:ios:prod"
echo "  - yarn prebuild:android:prod"
