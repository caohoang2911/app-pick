
import { createSelectors } from '@/core/utils/browser';
import { create } from 'zustand';

export interface AlertState {
  isVisible: boolean;
  message: string;
  title: string;
  cancelText: string;
  confirmText: string;
  loading: boolean;
  isHideCancelButton: boolean;
  isHideConfirmButton: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  showAlert: ({ title, message, cancelText, confirmText, onConfirm, onCancel, loading, isHideCancelButton, isHideConfirmButton }: { title?: string, message?: string, cancelText?: string, confirmText?: string, onConfirm: () => void, onCancel?: () => void, loading?: boolean, isHideCancelButton?: boolean, isHideConfirmButton?: boolean }) => void;
  hideAlert: () => void;
}

const _useAlertStore = create<AlertState>((set) => ({
  isVisible: false,
  message: '',
  title: '',
  cancelText: 'Trở lại',
  confirmText: 'Xác nhận',
  loading: false,
  isHideCancelButton: false,
  isHideConfirmButton: false,
  onConfirm: () => {
  },
  onCancel: () => {
  },
  showAlert: (
    {
      title,
      message,
      cancelText,
      confirmText,
      onConfirm,
      onCancel,
      loading,
      isHideCancelButton,
      isHideConfirmButton
    }: {
      title?: string,
      message?: string, 
      cancelText?: string,
      confirmText?: string,
      onConfirm?: () => void,
      onCancel?: () => void,
      loading?: boolean,
      isHideCancelButton?: boolean,
      isHideConfirmButton?: boolean
    }) => 
      set({
        isVisible: true,
        title,
        message,
        cancelText,
        confirmText,
        onConfirm,
        onCancel,
        loading,
        isHideCancelButton,
        isHideConfirmButton
      }),
  hideAlert: () => set({ isVisible: false }),
}));

export const useAlertStore = createSelectors(_useAlertStore);

export const showAlert = ({ title, message, cancelText, confirmText, onConfirm, onCancel, loading, isHideCancelButton, isHideConfirmButton }: { title?: string; message?: string; cancelText?: string; confirmText?: string; onConfirm: () => void; onCancel?: () => void; loading?: boolean; isHideCancelButton?: boolean; isHideConfirmButton?: boolean; }) => {
  useAlertStore.getState().showAlert({ title, message, cancelText, confirmText, onConfirm, onCancel, loading, isHideCancelButton, isHideConfirmButton });
};

export const hideAlert = () => {
  useAlertStore.getState().hideAlert();
};