import { create } from 'zustand';

import { createSelectors } from '@/core/utils/browser';


interface LoadingState {
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const _useLoading = create<LoadingState>((set, get) => ({
  loading: false,
  setLoading: (loading: boolean) => {
    set({ loading })
  },
}));

export const useLoading = createSelectors(_useLoading);

export const setLoading = (loading: boolean) => {
  useLoading.getState().setLoading(loading);
};



