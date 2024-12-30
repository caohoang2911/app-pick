import { create } from 'zustand';

import { createSelectors } from '../../utils/browser';
import type { TokenType, UserInfo } from './utils';
import {
  getToken,
  getUserInfo,
  removeToken,
  removeUserInfo,
  setToken,
  setUserInfo,
} from './utils';
import { reset as resetOrdersState } from '../orders';

interface AuthState {
  token: string | null;
  status: 'idle' | 'signOut' | 'signIn';
  urlRedirect: string;
  userInfo: UserInfo;
  signIn: (data: TokenType) => void;
  setRedirectUrl: (url: string) => void;
  setUser: (userInfo: UserInfo) => void;
  signOut: () => void;
  hydrate: () => void;
}

const _useAuth = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  urlRedirect: '',
  userInfo: {
    storeCode: '',
    storeName: ''
  },
  setRedirectUrl: (url: string) => {
    set({ urlRedirect: url });
  },
  setUser: (userInfo: UserInfo) => {
    set({ userInfo });
  },
  signIn: ({ token, userInfo }: TokenType) => {
    setToken(token);
    setUserInfo(userInfo);
    set({ status: 'signIn', token, userInfo });
  },
  signOut: () => {
    removeToken();
    removeUserInfo();
    set({ status: 'signOut', token: null });
    resetOrdersState();
  },
  hydrate: () => {
    try {
      const userToken = getToken();
      const userInfo = getUserInfo();
      
      if (userToken !== null) {
        get().signIn({
          token: userToken,
          userInfo: userInfo,
        });
      } else {
        get().signOut();
      }
    } catch (e) {
      get().signOut();
      // catch error here
      // Maybe sign_out user!
    }
  },
}));

export const useAuth = createSelectors(_useAuth);

export const signOut = () => _useAuth.getState().signOut();
export const signIn = (token: TokenType) => _useAuth.getState().signIn(token);
export const setRedirectUrl = (url: string) =>
  _useAuth.getState().setRedirectUrl(url);
export const hydrateAuth = () => _useAuth.getState().hydrate();
export const setUser = (userInfo: UserInfo) => _useAuth.getState().setUser(userInfo);