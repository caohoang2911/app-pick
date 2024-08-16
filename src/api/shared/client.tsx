import axios, { AxiosResponse } from 'axios';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { getToken } from '~/src/core/store/auth/utils';

export const axiosClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    accept: 'application/json',
    zas: 'aK0eXSFmvO8GRnG_RSKFNi3HqY6bFZfNHKesulQTHh5XI1prfwLwL1DZDJH1UPB9t9VdOqJVqTF3pf6KFvvfJASTnGsUPtCt7tpja0rId5hrWvKzSc8ITUl1TSc9R3QySsOiQPV0qBqg6jBDGkcpFYfFnGsrNY5_fuy6ysa_bRzBndei0BL8wzPB2HlPbpzrSqS3ydy4o6TCNDxr1oL3ZhWJV6tZOFi-q1CqDjSv4bg',
  },
});

axiosClient.interceptors.response.use(function (
  response: AxiosResponse & { error?: string }
): AxiosResponse & { error?: string } {
  const { url } = response.config;
  if (
    response &&
    [
      'ERROR_AUTH_TOKEN_EXPIRED',
      'ERROR_AUTH_TOKEN_REQUIRED',
      'ERROR_AUTH_TOKEN_INVALID',
    ].includes(response?.data?.error)
  ) {
    router.replace('login');
  }
  if (
    response &&
    ['ERR_UNKOWN', 'ERROR_METHOD_NOT_FOUND'].includes(response?.data?.error)
  ) {
    Alert.prompt(`${url}: Lỗi server`);
  }

  if (response && response?.data) {
    return response?.data || response?.data;
  }

  return response;
});

axiosClient.interceptors.request.use(function (config: any) {
  const token = getToken();

  // if (token) {
  //   config.headers.zas = token;
  // }

  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  }
  return config;
});
