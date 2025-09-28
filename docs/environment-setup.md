# Environment Configuration Guide

Hướng dẫn cấu hình môi trường cho dự án App Pick.

## Tổng quan

Dự án sử dụng hệ thống phân biệt môi trường với 3 môi trường chính:
- **Development**: Môi trường phát triển
- **Production**: Môi trường sản xuất

## Cấu trúc Files

```
├── env.js                    # File cấu hình môi trường chính
├── env.example              # File mẫu cấu hình
├── src/
│   ├── types/env.ts         # Type definitions
│   └── core/env.ts          # Environment utilities
└── scripts/
    └── setup-env.js         # Script setup môi trường
```

## Cách sử dụng

### 1. Setup môi trường tự động

```bash
# Setup cho development
yarn setup-env:dev

# Setup cho production
yarn setup-env:prod
```

### 2. Chạy ứng dụng với môi trường cụ thể

```bash
# Development
yarn start:dev

# Production
yarn start:prod

# Android với môi trường dev
yarn android:dev

# Android với môi trường prod
yarn android:prod

# iOS với môi trường dev
yarn ios:dev

# iOS với môi trường prod
yarn ios:prod
```

### 3. Build với EAS

```bash
# Build development
eas build --profile dev

# Build production
eas build --profile prod

# Build local
yarn build:android:dev:local
yarn build:android:prod:local
```

## Cấu hình môi trường

### Development
- API URL: `https://oms-api-dev.seedcom.vn/`
- App Name: `App Pick Dev`
- Debug Mode: `true`
- Analytics: `false`
- Crash Reporting: `false`

### Production
- API URL: `https://oms-api.seedcom.vn/`
- App Name: `App Pick`
- Debug Mode: `false`
- Analytics: `true`
- Crash Reporting: `true`

## Sử dụng trong Code

### Import environment variables

```typescript
import { Env } from '~/env';
import { isDevelopment, getApiBaseUrl } from '~/src/core/env';

// Sử dụng trực tiếp
const apiUrl = Env.API_BASE_URL;
const isDev = Env.IS_DEVELOPMENT;

// Sử dụng utility functions
const apiUrl = getApiBaseUrl();
const isDev = isDevelopment();
```

### Conditional logic

```typescript
import { isDevelopment, isProduction } from '~/src/core/env';

if (isDevelopment()) {
  console.log('Debug info');
}

if (isProduction()) {
  // Production logic
}
```

## EAS Configuration

File `eas.json` đã được cấu hình sẵn với các profile:

- `dev`: Development environment
- `prod`: Production environment

Mỗi profile có:
- Environment variables riêng
- Build configuration khác nhau
- Distribution settings phù hợp

## Troubleshooting

### Lỗi thường gặp

1. **Environment variables không load**
   - Kiểm tra file `env.js` có đúng cấu trúc
   - Đảm bảo `EAS_BUILD_PROFILE` được set đúng

2. **API URL không đúng**
   - Kiểm tra `API_BASE_URL` trong `env.js`
   - Verify EAS build profile

3. **Build fails**
   - Kiểm tra `eas.json` configuration
   - Verify environment variables trong EAS dashboard

### Debug

```typescript
import { logEnvironmentInfo } from '~/src/core/env';

// Log thông tin môi trường (chỉ trong development)
logEnvironmentInfo();
```

## Best Practices

1. **Không commit file `.env`** - Sử dụng `.env.example` làm template
2. **Sử dụng environment utilities** thay vì truy cập trực tiếp `Env`
3. **Test trên tất cả môi trường** trước khi deploy
4. **Document environment-specific configurations**
5. **Sử dụng feature flags** để control functionality theo môi trường
