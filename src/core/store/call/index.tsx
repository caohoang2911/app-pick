import { create } from 'zustand';

import { createSelectors } from '@/core/utils/browser';
import type { CallStatus, IncomingCallInfo } from '@/types/call';

interface CallState {
  status: CallStatus;
  callUuid: string | null;
  callId: string | null;
  fromNumber: string | null;
  fromAlias: string | null;
  isMuted: boolean;
  isSpeaker: boolean;
  /** Thời điểm cuộc gọi được nhận (ms) — dùng để đếm thời lượng. */
  answeredAt: number | null;

  setIncoming: (info: IncomingCallInfo) => void;
  setAnswered: () => void;
  setEnded: () => void;
  setMuted: (muted: boolean) => void;
  setSpeaker: (on: boolean) => void;
  reset: () => void;
}

type CallData = Omit<
  CallState,
  | 'setIncoming'
  | 'setAnswered'
  | 'setEnded'
  | 'setMuted'
  | 'setSpeaker'
  | 'reset'
>;

const INITIAL: CallData = {
  status: 'idle',
  callUuid: null,
  callId: null,
  fromNumber: null,
  fromAlias: null,
  isMuted: false,
  isSpeaker: false,
  answeredAt: null,
};

const _useCall = create<CallState>((set) => ({
  ...INITIAL,
  setIncoming: (info) =>
    set({
      ...INITIAL,
      status: 'incoming',
      callUuid: info.callUuid,
      callId: info.callId ?? null,
      fromNumber: info.fromNumber ?? null,
      fromAlias: info.fromAlias ?? null,
    }),
  setAnswered: () => set({ status: 'answered', answeredAt: Date.now() }),
  setEnded: () => set({ status: 'ended' }),
  setMuted: (isMuted) => set({ isMuted }),
  setSpeaker: (isSpeaker) => set({ isSpeaker }),
  reset: () => set({ ...INITIAL }),
}));

export const useCall = createSelectors(_useCall);

// ─── Non-hook helpers (gọi từ service singletons, ngoài React) ────────────────
export const getCallState = () => _useCall.getState();
export const setIncomingCall = (info: IncomingCallInfo) =>
  _useCall.getState().setIncoming(info);
export const setCallAnswered = () => _useCall.getState().setAnswered();
export const setCallEnded = () => _useCall.getState().setEnded();
export const resetCall = () => _useCall.getState().reset();
