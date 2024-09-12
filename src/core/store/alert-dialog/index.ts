
import { create } from 'zustand';
import { createSelectors } from '@/core/utils/browser';

export interface AlertState {
  isVisible: boolean;
  message: string;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  showAlert: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
  hideAlert: () => void;
}

const _useAlertStore = create<AlertState>((set) => ({
  isVisible: false,
  message: '',
  title: '',
  onConfirm: () => {
  },
  onCancel: () => {
  },
  showAlert: (title, message, onConfirm, onCancel) => set({ isVisible: true, title, message, onConfirm, onCancel }),
  hideAlert: () => set({ isVisible: false }),
}));

export const useAlertStore = createSelectors(_useAlertStore);

export const showAlert = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
  useAlertStore.getState().showAlert(title, message, onConfirm, onCancel);
};

export const hideAlert = () => {
  useAlertStore.getState().hideAlert();
};