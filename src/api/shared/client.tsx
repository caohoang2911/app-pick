import axios, { AxiosError, AxiosResponse } from 'axios';
import { showMessage } from 'react-native-flash-message';
import { signOut } from '~/src/core';
import { getToken } from '~/src/core/store/auth/utils';

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
    
    console.log('Xử lý lỗi xác thực:', message);
    
    // Hiển thị thông báo
    showMessage({
      message: message || 'Phiên đăng nhập đã hết hạn',
      type: 'danger',
    });
    
    // Logout sau một khoảng thời gian ngắn
    setTimeout(() => {
      signOut();
      
      // Reset trạng thái sau 1 giây
      setTimeout(() => {
        AUTH_STATE.isAuthError = false;
      }, 1000);
    }, 500);
    
    return true;
  }
  
  console.log('Bỏ qua lỗi xác thực (đã đang xử lý)');
  return false;
};

export const axiosClient = axios.create({
  baseURL: "https://oms-api.seedcom.vn/",
  headers: {
    accept: 'application/json',
  },
});

axiosClient.interceptors.response.use(function (
  response: AxiosResponse & { error?: string }
): AxiosResponse & { error?: string } {
  if (
    response &&
    [
      'ERROR_AUTH_TOKEN_EXPIRED',
      'ERROR_AUTH_TOKEN_REQUIRED',
      'ERROR_AUTH_TOKEN_INVALID',
    ].includes(response?.data?.error)
  ) {
    handleAuthError('Vui lòng đăng nhập để tiếp tục');
  } else if (response?.data?.error) {
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
  if (error.response?.status === 401 || error.response?.status === 403) {
    handleAuthError('Phiên đăng nhập đã hết hạn');
  }
  return Promise.reject(error);
});

axiosClient.interceptors.request.use(function (config: any) {
  const token = getToken();

  if (token) {
    config.headers.zas = token;
  }

  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  }
  return config;
});
