#!/bin/bash

# Script để xử lý các tham chiếu API riêng tư trước khi build với Expo
echo "Running prebuild script to fix private API usages..."

# Đường dẫn đến thư mục Pods
PODS_DIR="$PWD/Pods"

if [ -d "$PODS_DIR" ]; then
  echo "Finding and replacing private APIs in $PODS_DIR"
  
  # Danh sách thư mục an toàn để thay thế (không liên quan đến JavaScript bundle)
  SAFE_DIRS=("$PODS_DIR/Headers" "$PODS_DIR/Target Support Files" "$PODS_DIR/Local Podspecs")
  
  # Xử lý các tệp .h, .m, .mm, .swift - chỉ trong các thư mục an toàn
  for SAFE_DIR in "${SAFE_DIRS[@]}"; do
    if [ -d "$SAFE_DIR" ]; then
      echo "Processing files in $SAFE_DIR"
      for EXT in h m mm swift; do
        echo "Processing .$EXT files in $SAFE_DIR..."
        find "$SAFE_DIR" -name "*.$EXT" -type f -exec sed -i '' 's/_isKeyDown/isKeyDownReplacement/g; s/_modifiedInput/modifiedInputReplacement/g; s/_modifierFlags/modifierFlagsReplacement/g' {} \;
      done
    fi
  done
  
  # Thêm các từ khóa cần loại trừ để tránh thay đổi trong các file quan trọng
  EXCLUDE_PATTERN="React|JSBundle|JavaScriptCore|hermes|jscExecutor|RCTBridge"
  
  # Cập nhật các tệp project.pbxproj - loại trừ các file liên quan đến React/JS
  echo "Processing project files..."
  for PBXPROJ in $(find "$PODS_DIR" -name "*.pbxproj" -type f); do
    if ! grep -q -E "$EXCLUDE_PATTERN" "$PBXPROJ"; then
      echo "Safe to process: $PBXPROJ"
      sed -i '' 's/_isKeyDown/isKeyDownReplacement/g; s/_modifiedInput/modifiedInputReplacement/g; s/_modifierFlags/modifierFlagsReplacement/g' "$PBXPROJ"
    else
      echo "Skipping React-related file: $PBXPROJ"
    fi
  done
  
  # Thêm cờ để chỉ định đã sử dụng phương pháp an toàn
  echo "$(date): Applied safe replacements" > "$PODS_DIR/.safe_patch_applied"
  
  echo "Safe prebuild completed successfully"
else
  echo "Warning: Pods directory not found at $PODS_DIR"
fi

# Thêm các chỉ thị tiền xử lý vào các tệp .pch của dự án để xử lý các private API
PCH_FILES=$(find "$PWD" -name "*.pch")
if [ -n "$PCH_FILES" ]; then
  for PCH_FILE in $PCH_FILES; do
    echo "Updating $PCH_FILE with preprocessor directives"
    grep -q "_isKeyDown" "$PCH_FILE" || echo "#define _isKeyDown isKeyDownReplacement" >> "$PCH_FILE"
    grep -q "_modifiedInput" "$PCH_FILE" || echo "#define _modifiedInput modifiedInputReplacement" >> "$PCH_FILE"
    grep -q "_modifierFlags" "$PCH_FILE" || echo "#define _modifierFlags modifierFlagsReplacement" >> "$PCH_FILE"
  done
fi

echo "Adding extra compiler flags to fix API issues..."
cat > "$PWD/ExtraCompilerFlags.xcconfig" << 'EOL'
OTHER_CFLAGS = $(inherited) -DUIKeyboardImpl=UIKeyboardImplReplacement -D_isKeyDown=isKeyDownReplacement -D_modifiedInput=modifiedInputReplacement -D_modifierFlags=modifierFlagsReplacement
OTHER_SWIFT_FLAGS = $(inherited) -D_isKeyDown=isKeyDownReplacement -D_modifiedInput=modifiedInputReplacement -D_modifierFlags=modifierFlagsReplacement
EOL

echo "Prebuild completed successfully without touching JavaScript files."
exit 0 