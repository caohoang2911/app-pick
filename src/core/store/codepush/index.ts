import { create } from 'zustand';

type State = {
  isDoneCodepush: boolean;
  setIsDoneCodepush: (v: boolean) => void;
};

/**
 * Trạng thái CodePush/OTA dùng chung — tránh mỗi lần gọi useCodepush() tạo useState riêng
 * (Providers + NotificationWrapper + Orders) gây isDoneCodepush lệch pha và gọi logic 2 lần.
 */
export const useCodepushStore = create<State>((set) => ({
  isDoneCodepush: false,
  setIsDoneCodepush: (v) => set({ isDoneCodepush: v }),
}));
