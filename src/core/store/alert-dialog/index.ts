
import { create } from 'zustand';
import { createSelectors } from '@/core/utils/browser';

export interface AlertState {
  isVisible: boolean;
  message: string;
  title: string;
  cancelText: string;
  confirmText: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  showAlert: ({ title, message, cancelText, confirmText, onConfirm, onCancel, loading }: { title?: string, message?: string, cancelText?: string, confirmText?: string, onConfirm: () => void, onCancel?: () => void, loading?: boolean }) => void;
  hideAlert: () => void;
}

const _useAlertStore = create<AlertState>((set) => ({
  isVisible: false,
  message: '',
  title: '',
  cancelText: 'Trở lại',
  confirmText: 'Xác nhận',
  loading: false,
  onConfirm: () => {
  },
  onCancel: () => {
  },
  showAlert: ({ title, message, cancelText, confirmText, onConfirm, onCancel, loading }: { title?: string, message?: string, cancelText?: string, confirmText?: string, onConfirm: () => void, onCancel?: () => void, loading?: boolean }) => set({ isVisible: true, title, message, cancelText, confirmText, onConfirm, onCancel, loading }),
  hideAlert: () => set({ isVisible: false }),
}));

export const useAlertStore = createSelectors(_useAlertStore);

export const showAlert = ({ title, message, cancelText, confirmText, onConfirm, onCancel, loading }: { title?: string; message?: string; cancelText?: string; confirmText?: string; onConfirm: () => void; onCancel?: () => void; loading?: boolean; }) => {
  useAlertStore.getState().showAlert({ title, message, cancelText, confirmText, onConfirm, onCancel, loading });
};

export const hideAlert = () => {
  useAlertStore.getState().hideAlert();
};