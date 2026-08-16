#!/bin/bash

set -euo pipefail

PROFILE=$(echo "${EAS_BUILD_PROFILE:-dev}" | tr '[:upper:]' '[:lower:]')
if [[ "$PROFILE" == "prod" || "$PROFILE" == "production" || "$PROFILE" == "testflight" ]]; then
  ENV_SUFFIX="prod"
else
  ENV_SUFFIX="dev"
fi

ANDROID_TARGET="./google-services-${ENV_SUFFIX}.json"
IOS_TARGET="./GoogleService-Info-${ENV_SUFFIX}.plist"

materialize_file_variable() {
  local source_path="$1"
  local target_path="$2"
  local variable_name="$3"

  if [ -z "$source_path" ]; then
    return
  fi

  if [ ! -f "$source_path" ]; then
    echo "❌ $variable_name không trỏ tới file hợp lệ: $source_path"
    exit 1
  fi

  cp "$source_path" "$target_path"
  echo "✅ Materialized $variable_name cho profile $PROFILE"
}

materialize_file_variable "${GOOGLE_SERVICES_JSON:-}" "$ANDROID_TARGET" "GOOGLE_SERVICES_JSON"
materialize_file_variable "${GOOGLE_SERVICES_PLIST:-}" "$IOS_TARGET" "GOOGLE_SERVICES_PLIST"

if [ ! -s "$ANDROID_TARGET" ]; then
  echo "❌ Thiếu $ANDROID_TARGET. Cấu hình EAS file variable GOOGLE_SERVICES_JSON hoặc tạo file local."
  exit 1
fi

if [ ! -s "$IOS_TARGET" ]; then
  echo "❌ Thiếu $IOS_TARGET. Cấu hình EAS file variable GOOGLE_SERVICES_PLIST hoặc tạo file local."
  exit 1
fi
