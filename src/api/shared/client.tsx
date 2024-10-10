import axios, { AxiosError, AxiosResponse } from 'axios';
import { router } from 'expo-router';
import { showMessage } from 'react-native-flash-message';
import { signOut } from '~/src/core';
import { getToken } from '~/src/core/store/auth/utils';

export const axiosClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    accept: 'application/json',
    // zas: 'aK0eXSFmvO8GRnG_RSKFNi3HqY6bFZfNHKesulQTHh7OFkhSNj_tS55T4V22jGCq5ee5tZcs0cHMewGGu57O7wSTnGsUPtCt7tpja0rId5hrWvKzSc8ITUl1TSc9R3QySsOiQPV0qBqg6jBDGkcpFYfFnGsrNY5_fuy6ysa_bRzBndei0BL8wzPB2HlPbpzrSqS3ydy4o6TCNDxr1oL3ZhWJV6tZOFi-q1CqDjSv4bg',
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
    showMessage({
      message: 'Vui lòng đăng nhập để tiếp tục',
      type: 'danger',
    });

    signOut();
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
   showMessage({
      message: error?.message,
      type: 'danger',
    });
  // reject with error if response status is not 403
  return Promise.reject(error);
});

axiosClient.interceptors.request.use(function (config: any) {
  const token = getToken();
  
  if (token) {
    config.headers.zas = token;
  }

  config.baseURL = process.env.EXPO_PUBLIC_API_URL

  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  }
  return config;
});
