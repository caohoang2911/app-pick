#!/bin/bash

# Pre-commit checks script
# This script runs additional checks before commit

set -e

echo "🔍 Running pre-commit checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
  echo -e "${GREEN}✅ No staged files to check${NC}"
  exit 0
fi

# Check 1: TypeScript type checking
echo -e "\n${YELLOW}📘 Checking TypeScript types...${NC}"
if command -v yarn &> /dev/null; then
  if yarn tsc --noEmit 2>&1 | grep -q "error"; then
    echo -e "${RED}❌ TypeScript errors found!${NC}"
    yarn tsc --noEmit
    exit 1
  fi
  echo -e "${GREEN}✅ TypeScript check passed${NC}"
elif command -v npx &> /dev/null; then
  if npx tsc --noEmit --pretty false 2>&1 | grep -q "error"; then
    echo -e "${RED}❌ TypeScript errors found!${NC}"
    npx tsc --noEmit
    exit 1
  fi
  echo -e "${GREEN}✅ TypeScript check passed${NC}"
else
  echo -e "${YELLOW}⚠️  yarn/npx not found, skipping type check${NC}"
fi

# Check 2: Check for large files (> 1MB)
echo -e "\n${YELLOW}📦 Checking file sizes...${NC}"
LARGE_FILES=""
for file in $STAGED_FILES; do
  if [ -f "$file" ]; then
    size=$(wc -c < "$file" 2>/dev/null || echo "0")
    if [ "$size" -gt 1048576 ] 2>/dev/null; then
      LARGE_FILES="$LARGE_FILES$file\n"
    fi
  fi
done
if [ ! -z "$LARGE_FILES" ]; then
  echo -e "${RED}❌ Large files detected (>1MB):${NC}"
  echo -e "$LARGE_FILES"
  echo -e "${YELLOW}⚠️  Consider using Git LFS for large files${NC}"
  # Don't fail, just warn
fi

# Check 3: Check for console.log in production code (optional - can be disabled)
echo -e "\n${YELLOW}🔍 Checking for console.log...${NC}"
CONSOLE_LOGS=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx|js|jsx)$' | xargs grep -l "console\.log" 2>/dev/null || true)
if [ ! -z "$CONSOLE_LOGS" ]; then
  echo -e "${YELLOW}⚠️  console.log found in:${NC}"
  echo "$CONSOLE_LOGS"
  echo -e "${YELLOW}💡 Consider removing console.log before committing${NC}"
  # Don't fail, just warn
fi

# Check 4: Check for TODO/FIXME comments (optional)
echo -e "\n${YELLOW}📝 Checking for TODO/FIXME comments...${NC}"
TODOS=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx|js|jsx)$' | xargs grep -n "TODO\|FIXME" 2>/dev/null || true)
if [ ! -z "$TODOS" ]; then
  echo -e "${YELLOW}📋 TODO/FIXME comments found:${NC}"
  echo "$TODOS"
  # Don't fail, just inform
fi

# Check 5: Check for merge conflicts
echo -e "\n${YELLOW}🔀 Checking for merge conflicts...${NC}"
CONFLICTS=$(echo "$STAGED_FILES" | xargs grep -l "^<<<<<<< \|^======= \|^>>>>>>> " 2>/dev/null || true)
if [ ! -z "$CONFLICTS" ]; then
  echo -e "${RED}❌ Merge conflict markers found in:${NC}"
  echo "$CONFLICTS"
  exit 1
fi
echo -e "${GREEN}✅ No merge conflicts${NC}"

# Check 6: Check for debugger statements
echo -e "\n${YELLOW}🐛 Checking for debugger statements...${NC}"
DEBUGGERS=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx|js|jsx)$' | xargs grep -l "debugger" 2>/dev/null || true)
if [ ! -z "$DEBUGGERS" ]; then
  echo -e "${RED}❌ debugger statements found in:${NC}"
  echo "$DEBUGGERS"
  echo -e "${YELLOW}💡 Please remove debugger statements before committing${NC}"
  exit 1
fi
echo -e "${GREEN}✅ No debugger statements${NC}"

echo -e "\n${GREEN}✅ All pre-commit checks passed!${NC}"

