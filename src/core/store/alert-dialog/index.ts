import { createSelectors } from '@/core/utils/browser';
import { ReactNode } from 'react';
import { create } from 'zustand';

export interface AlertState {
  isVisible: boolean;
  message: ReactNode;
  title: ReactNode;
  cancelText: string;
  confirmText: string;
  loading: boolean;
  isHideCancelButton: boolean;
  isHideConfirmButton: boolean;
  /** Khi true: không đóng bằng nút Back (Android) — dùng cho thông báo bắt buộc */
  blockDismiss: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  showAlert: ({
    title,
    message,
    cancelText,
    confirmText,
    onConfirm,
    onCancel,
    loading,
    isHideCancelButton,
    isHideConfirmButton,
    blockDismiss,
  }: {
    title?: ReactNode;
    message?: ReactNode;
    cancelText?: string;
    confirmText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
    loading?: boolean;
    isHideCancelButton?: boolean;
    isHideConfirmButton?: boolean;
    blockDismiss?: boolean;
  }) => void;
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
  blockDismiss: false,
  onConfirm: () => {},
  onCancel: () => {},
  showAlert: ({
    title,
    message,
    cancelText,
    confirmText,
    onConfirm,
    onCancel,
    loading,
    isHideCancelButton,
    isHideConfirmButton,
    blockDismiss,
  }: {
    title?: ReactNode;
    message?: ReactNode;
    cancelText?: string;
    confirmText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    loading?: boolean;
    isHideCancelButton?: boolean;
    isHideConfirmButton?: boolean;
    blockDismiss?: boolean;
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
      isHideConfirmButton,
      blockDismiss: blockDismiss ?? false,
    }),
  hideAlert: () => set({ isVisible: false, blockDismiss: false }),
}));

export const useAlertStore = createSelectors(_useAlertStore);

export const showAlert = ({
  title,
  message,
  cancelText,
  confirmText,
  onConfirm,
  onCancel,
  loading,
  isHideCancelButton,
  isHideConfirmButton,
  blockDismiss,
}: {
  title?: string | ReactNode;
  message?: ReactNode;
  cancelText?: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
  isHideCancelButton?: boolean;
  isHideConfirmButton?: boolean;
  blockDismiss?: boolean;
}) => {
  useAlertStore.getState().showAlert({
    title,
    message,
    cancelText,
    confirmText,
    onConfirm,
    onCancel,
    loading,
    isHideCancelButton,
    isHideConfirmButton,
    blockDismiss,
  });
};

export const hideAlert = () => {
  useAlertStore.getState().hideAlert();
};
