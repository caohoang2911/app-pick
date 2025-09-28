import axios, { AxiosError, AxiosResponse } from 'axios';
import { showMessage } from 'react-native-flash-message';
import { signOut } from '~/src/core';
import { getToken } from '~/src/core/store/auth/utils';
import { Env } from '~/env';
import { isDevelopment } from '~/src/core/env';

const BLACK_LIST_SHOW_MESSAGE = [
  '/app-pick/getStoreEmployeeProfile',
];

const DUMMY_TOKEN = "4kkgCYTSGyU4hc50sSNRYiCAZ2KxQPQzUClPl-cMi8EKduxy1jLs1OweKInfH7etwjBZBWE5HV7ZAbi_3J8_BA"

// Function để gọi API logout
const callLogoutAPI = async () => {
  try {
    await axiosClient.post('auth/logout');
  } catch (error) {
    // Bỏ qua lỗi API logout, vẫn sẽ clear state local
    console.log('Logout API failed:', error);
  }
};

// Biến toàn cục theo dõi trạng thái auth
const AUTH_STATE = {
  isAuthError: false,
  lastErrorTime: 0,
  COOLDOWN: 5000, // Thời gian nghỉ giữa các lần xử lý lỗi (5 giây)
};

// Xử lý lỗi xác thực
const handleAuthError = (message: string) => {
  const now = Date.now();
  
  // Chỉ xử lý lỗi nếu không có lỗi nào đang xử lý và đã qua thời gian cooldown
  if (!AUTH_STATE.isAuthError && (now - AUTH_STATE.lastErrorTime > AUTH_STATE.COOLDOWN)) {
    AUTH_STATE.isAuthError = true;
    AUTH_STATE.lastErrorTime = now;
    
    // Hiển thị thông báo
    showMessage({
      message: message || 'Phiên đăng nhập đã hết hạn',
      type: 'danger',
    });
    
    // Logout sau một khoảng thời gian ngắn
    setTimeout(async () => {
      // Gọi API logout trước
      await callLogoutAPI();
      
      // Sau đó clear state local
      signOut();
      
      // Reset trạng thái sau 1 giây
      setTimeout(() => {
        AUTH_STATE.isAuthError = false;
      }, 1000);
    }, 500);
    
    return true;
  }
  
  return false;
};

export const axiosClient = axios.create({
  baseURL: Env.API_BASE_URL,
  timeout: Env.API_TIMEOUT,
  headers: {
    accept: 'application/json',
  },
});

// Log API configuration
if (isDevelopment()) {
  console.log('🌐 API Configuration:', {
    baseURL: Env.API_BASE_URL,
    timeout: Env.API_TIMEOUT,
    environment: Env.ENVIRONMENT,
    isDevelopment: Env.IS_DEVELOPMENT,
    isProduction: Env.IS_PRODUCTION,
  });
}

axiosClient.interceptors.response.use(function (
  response: AxiosResponse & { error?: string }
): AxiosResponse & { error?: string } {
  // Log API responses in development
  if (isDevelopment()) {
    console.log('📥 API Response:', {
      status: response.status,
      url: response.config?.url,
      method: response.config?.method?.toUpperCase(),
      hasError: !!response?.data?.error,
      error: response?.data?.error,
      dataKeys: response?.data ? Object.keys(response.data) : []
    });
  }

  if (
    response &&
    [
      'ERROR_AUTH_TOKEN_EXPIRED',
      'ERROR_AUTH_TOKEN_REQUIRED',
      'ERROR_AUTH_TOKEN_INVALID',
    ].includes(response?.data?.error)
  ) {
    handleAuthError('Vui lòng đăng nhập để tiếp tục');
  } else if (
    response?.data?.error 
    && response?.data?.error !== 'ERROR_EMPLOYEE_STORE_OUT_OF_DATE'
    && !BLACK_LIST_SHOW_MESSAGE.includes(response.config?.url || '')) {
    showMessage({
      message: response?.data?.error,
      type: 'danger',
    });
  }

  if (response && response?.data) {
    return response?.data;
  }

  return response;
}, (error: AxiosError) => {
  // Log API errors in development
  if (isDevelopment()) {
    console.log('❌ API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      message: error.message,
      data: error.response?.data
    });
  }

  if (error.response?.status === 401 || error.response?.status === 403) {
    handleAuthError('Phiên đăng nhập đã hết hạn');
  }
  return Promise.reject(error);
});

axiosClient.interceptors.request.use(function (config: any) {
  const token = getToken();

  if (token) {
    config.headers.zas = token;
  } else {
    config.headers.zas = DUMMY_TOKEN;
  }

  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  }

  // Log API requests in development
  if (isDevelopment()) {
    console.log('📤 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      headers: {
        'Content-Type': config.headers['Content-Type'],
        'zas': config.headers.zas ? '***' : 'none'
      }
    });
  }

  return config;
});
