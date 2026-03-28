/**
 * Queue FIFO: `showAlert` push cuối, UI chỉ hiển thị `alerts[0]`, `hideAlert` = slice(1).
 * `AlertDialog`: tự `hideAlert` sau onCancel (và back). onConfirm tự gọi `hideAlert` trong callback nếu cần đóng.
 */
import { createSelectors } from '@/core/utils/browser';
import { ReactNode } from 'react';
import { create } from 'zustand';

export type AlertInstance = {
  id: number;
  /** Cùng stackId chỉ giữ một bản trong queue (thay thế entry cũ cùng id) */
  stackId?: string;
  title: ReactNode;
  message: ReactNode;
  cancelText: string;
  confirmText: string;
  loading: boolean;
  isHideCancelButton: boolean;
  isHideConfirmButton: boolean;
  blockDismiss: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
};

export interface AlertState {
  alerts: AlertInstance[];
  showAlert: (payload: {
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
    stackId?: string;
  }) => void;
  /** FIFO: bỏ alerts[0], alert kế hiển thị tự động */
  hideAlert: () => void;
  hideAllAlerts: () => void;
}

let nextAlertId = 1;

const _useAlertStore = create<AlertState>((set) => ({
  alerts: [],
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
    stackId,
  }) => {
    const id = nextAlertId++;
    const item: AlertInstance = {
      id,
      stackId,
      title: title ?? '',
      message: message ?? '',
      cancelText: cancelText ?? 'Trở lại',
      confirmText: confirmText ?? 'Xác nhận',
      loading: loading ?? false,
      isHideCancelButton: isHideCancelButton ?? false,
      isHideConfirmButton: isHideConfirmButton ?? false,
      blockDismiss: blockDismiss ?? false,
      onConfirm: onConfirm ?? (() => {}),
      onCancel,
    };

    set((state) => {
      const base = stackId
        ? state.alerts.filter((a) => a.stackId !== stackId)
        : state.alerts;
      return { alerts: [...base, item] };
    });
  },
  hideAlert: () => {
    set((state) => {
      if (state.alerts.length === 0) return state;
      return { alerts: state.alerts.slice(1) };
    });
  },
  hideAllAlerts: () => set({ alerts: [] }),
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
  stackId,
}: {
  title?: string | ReactNode;
  message?: ReactNode;
  cancelText?: string;
  confirmText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  isHideCancelButton?: boolean;
  isHideConfirmButton?: boolean;
  blockDismiss?: boolean;
  stackId?: string;
}) => {
  _useAlertStore.getState().showAlert({
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
    stackId,
  });
};

export const hideAlert = () => {
  _useAlertStore.getState().hideAlert();
};

export const hideAllAlerts = () => {
  _useAlertStore.getState().hideAllAlerts();
};
