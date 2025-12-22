# 🔧 Git Pre-commit Hooks Setup

## Tổng Quan

Pre-commit hooks được setup để tự động kiểm tra code quality trước khi commit.

---

## 📦 Dependencies Cần Cài

### 1. Install Husky và lint-staged

```bash
# Install husky
npm install --save-dev husky lint-staged

# Hoặc với yarn
yarn add -D husky lint-staged
```

### 2. Initialize Husky (v9+)

```bash
# Husky v9+ tự động init khi install
# Chỉ cần chạy prepare script
npm run prepare

# Hoặc nếu chưa có .husky folder
npx husky init
```

---

## 🎯 Hooks Đã Setup

### 1. **Pre-commit Hook** (`.husky/pre-commit`)

**Chức năng:**

- ✅ Chạy lint-staged trên staged files
- ✅ TypeScript type checking
- ✅ Prettier format checking
- ✅ File size checking
- ✅ Console.log detection (warning)
- ✅ Debugger detection (fail)
- ✅ Merge conflict detection (fail)

**Cách hoạt động:**

```bash
git commit -m "message"
# → Tự động chạy checks
# → Nếu fail, commit bị reject
```

---

## 📋 Configuration Files

### 1. `.lintstagedrc.js`

**Chức năng:** Định nghĩa linters chạy trên staged files

**Checks:**

- TypeScript type checking (`tsc --noEmit`)
- Prettier format checking

**File patterns:**

- `**/*.{ts,tsx}` - TypeScript files
- `**/*.{js,jsx}` - JavaScript files
- `**/*.json` - JSON files
- `**/*.md` - Markdown files
- `**/*.{yml,yaml}` - YAML files

### 2. `scripts/pre-commit-checks.sh`

**Chức năng:** Additional checks script

**Checks:**

1. ✅ TypeScript type checking
2. ⚠️ Large files detection (>1MB) - Warning only
3. ⚠️ Console.log detection - Warning only
4. 📋 TODO/FIXME comments - Info only
5. ❌ Merge conflict markers - Fail
6. ❌ Debugger statements - Fail

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
yarn add -D husky lint-staged
```

### Step 2: Initialize Husky

```bash
# Initialize husky
npx husky install

# Add prepare script (đã có trong package.json)
npm run prepare
```

### Step 3: Verify Setup

```bash
# Test pre-commit hook
git add .
git commit -m "test: verify pre-commit hooks"
```

---

## 📝 Package.json Scripts

Đã thêm các scripts sau:

```json
{
  "scripts": {
    "lint": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
    "lint:fix": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "tsc --noEmit",
    "prepare": "husky install"
  }
}
```

---

## ⚙️ Customization

### Disable Specific Checks

**Disable console.log check:**

```bash
# Edit scripts/pre-commit-checks.sh
# Comment out console.log check section
```

**Disable debugger check:**

```bash
# Edit scripts/pre-commit-checks.sh
# Comment out debugger check section
```

### Skip Hooks (Emergency)

```bash
# Skip pre-commit hook
git commit --no-verify -m "message"

# Hoặc
git commit -n -m "message"
```

⚠️ **Lưu ý:** Chỉ dùng `--no-verify` khi thực sự cần thiết!

---

## 🔍 Checks Chi Tiết

### 1. TypeScript Type Checking

**Command:** `tsc --noEmit`

**Fail khi:**

- Type errors
- Missing types
- Type mismatches

**Fix:**

```bash
# Check types manually
npm run type-check
```

---

### 2. Prettier Format Checking

**Command:** `prettier --check`

**Fail khi:**

- Code không đúng format
- Inconsistent indentation
- Missing semicolons (nếu config)

**Fix:**

```bash
# Auto-fix format
npm run lint:fix
```

---

### 3. Large Files Check

**Warning khi:**

- Files > 1MB

**Không fail commit**, chỉ warning.

**Fix:**

- Sử dụng Git LFS cho large files
- Hoặc exclude khỏi git

---

### 4. Console.log Check

**Warning khi:**

- Tìm thấy `console.log` trong code

**Không fail commit**, chỉ warning.

**Fix:**

- Remove console.log
- Hoặc dùng logger utility

---

### 5. Debugger Check

**Fail khi:**

- Tìm thấy `debugger` statements

**Fix:**

```bash
# Remove debugger statements
grep -r "debugger" src/
# Remove manually
```

---

### 6. Merge Conflict Check

**Fail khi:**

- Tìm thấy conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)

**Fix:**

- Resolve merge conflicts
- Remove conflict markers

---

## 📊 Workflow

```
Developer commits
    ↓
Pre-commit hook triggered
    ↓
lint-staged runs
    ├─ TypeScript check
    ├─ Prettier check
    └─ Additional checks
    ↓
All checks pass?
    ├─ Yes → Commit succeeds ✅
    └─ No → Commit rejected ❌
```

---

## 🐛 Troubleshooting

### Issue 1: Husky not found hoặc deprecated warning

```bash
# Solution: Đảm bảo dùng Husky v9+
npm install --save-dev husky@latest
npm run prepare

# Nếu thấy "husky install is DEPRECATED"
# → Đó là bình thường, Husky v9+ không cần install command
# → Chỉ cần ensure .husky/pre-commit file có executable permission
chmod +x .husky/pre-commit
```

### Issue 2: Permission denied

```bash
# Solution: Make scripts executable
chmod +x .husky/pre-commit
chmod +x scripts/pre-commit-checks.sh
```

### Issue 3: lint-staged not found

```bash
# Solution: Install lint-staged
npm install --save-dev lint-staged
```

### Issue 4: TypeScript errors but code works

```bash
# Solution: Fix type errors
npm run type-check
# Fix errors shown
```

### Issue 5: Prettier format issues

```bash
# Solution: Auto-fix format
npm run lint:fix
git add .
git commit -m "fix: format code"
```

---

## ✅ Best Practices

1. **Always run checks locally:**

   ```bash
   npm run type-check
   npm run lint
   ```

2. **Fix issues before committing:**
   - Don't use `--no-verify` unless absolutely necessary

3. **Keep hooks fast:**
   - Only check staged files
   - Use lint-staged for efficiency

4. **Update hooks as needed:**
   - Add new checks when needed
   - Remove unnecessary checks

---

## 📚 References

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Prettier Documentation](https://prettier.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

---

**Last Updated:** Dec 22, 2025  
**Status:** ✅ Ready to use
