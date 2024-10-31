import axios, { AxiosError, AxiosResponse } from 'axios';
import { showMessage } from 'react-native-flash-message';
import { signOut } from '~/src/core';
import { getToken } from '~/src/core/store/auth/utils';

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
  //  showMessage({
  //     message: error?.message,
  //     type: 'danger',
  //   });
  // reject with error if response status is not 403
  return Promise.reject(error);
});

axiosClient.interceptors.request.use(function (config: any) {
  const token = getToken();

  console.log('baseURL', config?.baseURL);

  if (token) {
    config.headers.zas = token;
  }

  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  }
  return config;
});
