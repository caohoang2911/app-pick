import { create } from 'zustand';

import { createSelectors } from '@/core/utils/browser';


interface LoadingState {
  loading: boolean;
  description: string;
  setLoading: (loading: boolean, description?: string) => void;
}

const _useLoading = create<LoadingState>((set, get) => ({
  loading: false,
  description: '',
  setLoading: (loading: boolean, description?: string) => {
    if(loading) {
      set({ loading, description })
    } else {
      set({ loading: false, description: '' })
    }
  },
}));

export const useLoading = createSelectors(_useLoading);

export const setLoading = (loading: boolean, description?: string) => {
  useLoading.getState().setLoading(loading, description);
};



