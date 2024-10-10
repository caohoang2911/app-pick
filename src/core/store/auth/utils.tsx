import { getItem, removeItem, setItem } from '@/core/storage';
import { removeConfigLocalStore, removeVersionLocalStore } from '../config/utils';

const TOKEN = 'token';
const USER_INFO = 'user_info';

export type UserInfo = {
  id?: string;
  name?: string;
  expired?: number;
  username?: string;
  company?: string;
  role?: string;
  storeCode: string;
  storeName: string;
  zas?: string;
};

export type TokenType = {
  token: string;
  userInfo: UserInfo;
};

export const getToken = () => getItem<string>(TOKEN);
export const getUserInfo = () => getItem<UserInfo>(USER_INFO);
export const removeToken = () => {
  removeItem(TOKEN);
  removeItem(USER_INFO);
};
export const setToken = (value: string) => setItem<string>(TOKEN, value);
export const setUserInfo = (value: TokenType['userInfo']) =>
  setItem<TokenType['userInfo']>(USER_INFO, value);

export const removeStore = () => {
  removeItem(TOKEN);
  removeItem(USER_INFO);
  removeItem('env');
  removeVersionLocalStore();
  removeConfigLocalStore();
};
