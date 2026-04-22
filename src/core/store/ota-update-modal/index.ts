import { create } from 'zustand';

type State = {
  visible: boolean;
  pendingRestart: boolean;
  open: () => void;
  close: () => void;
  setPendingRestart: (value: boolean) => void;
};

export const useOtaUpdateReadyModal = create<State>((set) => ({
  visible: false,
  pendingRestart: false,
  open: () => set({ visible: true }),
  close: () => set({ visible: false }),
  setPendingRestart: (value: boolean) => set({ pendingRestart: value }),
}));

export const openOtaUpdateReadyModal = () => {
  useOtaUpdateReadyModal.getState().open();
};

export const closeOtaUpdateReadyModal = () => {
  useOtaUpdateReadyModal.getState().close();
};
