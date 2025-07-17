import { create } from 'zustand';
import { router } from 'expo-router';

interface CallState {
  isInCall: boolean;
  callStatus: string;
  phoneNumber: string;
  callId: string | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  remoteUserId: string;
  signalingCode: number | null;
  mediaCode: number | null;
  isCallAnswered: boolean;
}

interface StringeeStore {
  // State
  callState: CallState;
  callRef: any | null;
  
  // Actions
  setCallState: (state: Partial<CallState>) => void;
  setCallRef: (callRef: any) => void;
  startCall: (phoneNumber: string, callId: string) => void;
  endCall: () => void;
  updateCallStatus: (status: string) => void;
  updateSignalingCode: (code: number) => void;
  updateMediaCode: (code: number) => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  resetCallState: () => void;
}

const initialState: CallState = {
  isInCall: false,
  callStatus: '',
  phoneNumber: '',
  callId: null,
  isVideoEnabled: true,
  isAudioEnabled: true,
  remoteUserId: '',
  signalingCode: null,
  mediaCode: null,
  isCallAnswered: false,
};

export const useStringeeStore = create<StringeeStore>((set, get) => ({
  callState: initialState,
  callRef: null,
  
  setCallState: (newState) => {
    set((state) => ({
      callState: { ...state.callState, ...newState }
    }));
  },
  
  setCallRef: (callRef) => {
    set({ callRef });
  },
  
  startCall: (phoneNumber, callId) => {
    set((state) => ({
      callState: {
        ...state.callState,
        isInCall: true,
        phoneNumber,
        callId,
        callStatus: 'Calling...',
        isVideoEnabled: true,
        isAudioEnabled: true,
        signalingCode: null,
        mediaCode: null,
        isCallAnswered: false,
      }
    }));
  },
  
  endCall: () => {
    const { callRef } = get();
    if (callRef) {
      try {
        callRef.hangup();
        console.log('📴 Call ended successfully');
      } catch (error) {
        console.error('❌ Hang up error:', error);
      }
    }
    
    set((state) => ({
      callState: {
        ...state.callState,
        isInCall: false,
        callStatus: 'Call ended',
        callId: null,
      },
      callRef: null,
    }));
    // Go back to previous page when call ends
    router.back();
  },
  
  updateCallStatus: (status) => {
    set((state) => ({
      callState: {
        ...state.callState,
        callStatus: status,
      }
    }));
  },

  updateSignalingCode: (code: number) => {
    set((state) => ({
      callState: {
        ...state.callState,
        signalingCode: code,
        isCallAnswered: code === 2, // code 2 = Answered
        callStatus: code === 2 ? 'Call answered' : state.callState.callStatus,
      }
    }));
  },

  updateMediaCode: (code: number) => {
    set((state) => ({
      callState: {
        ...state.callState,
        mediaCode: code,
        callStatus: code === 1 ? 'Media connected' : state.callState.callStatus,
      }
    }));
  },
  
  toggleVideo: () => {
    const { callRef, callState } = get();
    if (callRef) {
      try {
        const newState = !callState.isVideoEnabled;
        callRef.enableVideo(newState);
        console.log('📹 Video toggled:', newState);
      } catch (error) {
        console.error('❌ Video toggle error:', error);
      }
    }
    
    set((state) => ({
      callState: {
        ...state.callState,
        isVideoEnabled: !state.callState.isVideoEnabled,
      }
    }));
  },
  
  toggleAudio: () => {
    const { callRef, callState } = get();
    if (callRef) {
      try {
        const newState = !callState.isAudioEnabled;
        callRef.mute(!newState);
        console.log('🔊 Audio toggled:', newState);
      } catch (error) {
        console.error('❌ Audio toggle error:', error);
      }
    }
    
    set((state) => ({
      callState: {
        ...state.callState,
        isAudioEnabled: !state.callState.isAudioEnabled,
      }
    }));
  },
  
  resetCallState: () => {
    set({ callState: initialState, callRef: null });
  },
})); 