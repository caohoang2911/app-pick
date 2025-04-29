#!/bin/bash

# Script to remove references to private Apple APIs
# This script is run as a Build Phase in Xcode

APP_BINARY="${CODESIGNING_FOLDER_PATH}/${EXECUTABLE_NAME}"

# List of private APIs to be removed
PRIVATE_APIS=(
  "_isKeyDown"
  "_modifiedInput"
  "_modifierFlags"
  "UIKeyboardImpl"
)

if [ -f "$APP_BINARY" ]; then
  echo "Processing binary: $APP_BINARY"
  
  # Make binary writable
  chmod +w "$APP_BINARY"
  
  for API in "${PRIVATE_APIS[@]}"; do
    # Replace the API with a safe alternative name (same length)
    SAFE_NAME="${API//_/X}"
    
    # Use strings and grep to check if the API exists in the binary
    if strings "$APP_BINARY" | grep -q "$API"; then
      echo "Found reference to $API, replacing with $SAFE_NAME"
      
      # Use perl to replace the string in the binary while preserving length
      perl -pi -e "s/$API/$SAFE_NAME/g" "$APP_BINARY"
    fi
  done
  
  echo "Binary processing complete"
else
  echo "Error: Binary not found at $APP_BINARY"
  exit 1
fi

exit 0 