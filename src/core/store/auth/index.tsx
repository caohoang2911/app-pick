import { create } from 'zustand';

import { createSelectors } from '../../utils/browser';
import type { TokenType, UserInfo } from './utils';
import {
  getENV,
  getToken,
  getUserInfo,
  removeToken,
  setENV,
  setToken,
  setUserInfo,
} from './utils';

interface AuthState {
  token: string | null;
  env: string;
  status: 'idle' | 'signOut' | 'signIn';
  urlRedirect: string;
  userInfo: UserInfo;
  signIn: (data: TokenType) => void;
  setRedirectUrl: (url: string) => void;
  setUser: (userInfo: UserInfo | {}) => void;
  signOut: () => void;
  hydrate: () => void;
  setEnv: () => void;
}

const _useAuth = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  env: 'prod',
  urlRedirect: '',
  userInfo: {},
  setRedirectUrl: (url: string) => {
    set({ urlRedirect: url });
  },
  setUser: (userInfo: UserInfo | {}) => {
    set({ userInfo });
  },
  signIn: ({ token, userInfo }: TokenType) => {
    setToken(token);
    setUserInfo(userInfo);
    set({ status: 'signIn', token, userInfo });
  },
  signOut: () => {
    removeToken();
    set({ status: 'signOut', token: null });
  },
  setEnv: () => {
    const currentEnv = get().env;
    const nextEnv = currentEnv == 'dev' ? 'prod' : 'dev';
    setENV(nextEnv);
    set({ env: nextEnv });
  },
  hydrate: () => {
    try {
      const userToken = getToken();
      const userInfo = getUserInfo();
      const env = getENV();

      if (env) {
        set({ env: env });
      }

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

export const setEnv = () => _useAuth.getState().setEnv();
