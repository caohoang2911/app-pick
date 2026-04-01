import { create } from 'zustand';

type State = {
  visible: boolean;
  open: () => void;
  close: () => void;
};

export const useOtaUpdateReadyModal = create<State>((set) => ({
  visible: false,
  open: () => set({ visible: true }),
  close: () => set({ visible: false }),
}));

export const openOtaUpdateReadyModal = () => {
  useOtaUpdateReadyModal.getState().open();
};

export const closeOtaUpdateReadyModal = () => {
  useOtaUpdateReadyModal.getState().close();
};
