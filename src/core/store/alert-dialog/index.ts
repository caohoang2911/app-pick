
import { create } from 'zustand';
import { createSelectors } from '@/core/utils/browser';

export interface AlertState {
  isVisible: boolean;
  message: string;
  title: string;
  cancelText: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  showAlert: ({ title, message, cancelText, confirmText, onConfirm, onCancel }: { title: string, message: string, cancelText?: string, confirmText?: string, onConfirm: () => void, onCancel?: () => void }) => void;
  hideAlert: () => void;
}

const _useAlertStore = create<AlertState>((set) => ({
  isVisible: false,
  message: '',
  title: '',
  cancelText: 'Trở lại',
  confirmText: 'Xác nhận',
  onConfirm: () => {
  },
  onCancel: () => {
  },
  showAlert: ({ title, message, cancelText, confirmText, onConfirm, onCancel }: { title: string, message: string, cancelText?: string, confirmText?: string, onConfirm: () => void, onCancel?: () => void }) => set({ isVisible: true, title, message, cancelText, confirmText, onConfirm, onCancel }),
  hideAlert: () => set({ isVisible: false }),
}));

export const useAlertStore = createSelectors(_useAlertStore);

export const showAlert = ({ title, message, cancelText, confirmText, onConfirm, onCancel }: { title: string; message: string; cancelText?: string; confirmText?: string; onConfirm: () => void; onCancel?: () => void; }) => {
  useAlertStore.getState().showAlert({ title, message, cancelText, confirmText, onConfirm, onCancel });
};

export const hideAlert = () => {
  useAlertStore.getState().hideAlert();
};