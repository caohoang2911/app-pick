# 🚀 Quick Setup Guide - Pre-commit Hooks

## ⚡ Quick Start (3 bước)

### Step 1: Install Dependencies

```bash
yarn add -D husky lint-staged
```

### Step 2: Initialize Husky (v9+)

```bash
# Husky v9+ tự động init
npm run prepare

# Hoặc nếu cần init manually
npx husky init
```

### Step 3: Test

```bash
# Make a test commit
git add .
git commit -m "test: verify pre-commit hooks"
```

---

## ✅ Done!

Pre-commit hooks đã được setup. Mỗi lần commit sẽ tự động:

- ✅ Check TypeScript types
- ✅ Check code format (Prettier)
- ✅ Check for debugger statements
- ✅ Check for merge conflicts
- ⚠️ Warn về console.log và large files

---

## 📖 Chi Tiết

Xem file `PRE_COMMIT_HOOKS_SETUP.md` để biết chi tiết đầy đủ.

---

**Last Updated:** Dec 22, 2025
