/**
 * Khai báo type cho `stringee-react-native-v2` (SDK chỉ có JS, không kèm types).
 * Chỉ khai báo phần API mà App Pick sử dụng cho luồng nhận cuộc gọi (StringeeCall2).
 * Tham chiếu: node_modules/stringee-react-native-v2/src/*
 */
declare module 'stringee-react-native-v2' {
  export type SignalingStateValue =
    'calling' | 'ringing' | 'answered' | 'busy' | 'ended';

  export type MediaStateValue = 'connected' | 'disconnected';

  export type AudioDeviceValue =
    'speakerPhone' | 'wiredHeadset' | 'earpiece' | 'bluetooth' | 'none';

  export const SignalingState: Record<SignalingStateValue, SignalingStateValue>;
  export const MediaState: Record<MediaStateValue, MediaStateValue>;
  export const AudioDevice: Record<AudioDeviceValue, AudioDeviceValue>;

  export class StringeeClient {
    constructor(props?: {
      baseUrl?: string;
      stringeeXBaseUrl?: string;
      serverAddresses?: unknown[];
    });
    userId: string;
    uuid: string;
    isConnected: boolean;
    setListener(listener: StringeeClientListener): void;
    connect(token: string): void;
    disconnect(): void;
    /**
     * @param isProduction (iOS) true: APNs production, false: development.
     * @param isVoip (iOS) true: VoIP push (PushKit), false: remote push.
     */
    registerPush(
      deviceToken: string,
      isProduction: boolean,
      isVoip: boolean,
    ): Promise<void>;
    unregisterPush(deviceToken: string): Promise<void>;
  }

  export class StringeeClientListener {
    onConnect: (client: StringeeClient, userId: string) => void;
    onDisConnect: (client: StringeeClient) => void;
    onFailWithError: (
      client: StringeeClient,
      code: number,
      message: string,
    ) => void;
    onRequestAccessToken: (client: StringeeClient) => void;
    onIncomingCall: (client: StringeeClient, call: StringeeCall2) => void;
    onIncomingCall2: (client: StringeeClient, call: StringeeCall2) => void;
  }

  export class StringeeCall2 {
    constructor(props: {
      stringeeClient: StringeeClient;
      from: string;
      to: string;
    });
    stringeeClient: StringeeClient;
    callId: string;
    customData: string;
    from: string;
    fromAlias: string;
    to: string;
    toAlias: string;
    isVideoCall: boolean;
    serial: number;
    uuid: string;
    canAnswer: boolean;
    setListener(listener: StringeeCall2Listener): void;
    makeCall(): Promise<void>;
    initAnswer(): Promise<void>;
    answer(): Promise<void>;
    hangup(): Promise<void>;
    reject(): Promise<void>;
    mute(mute: boolean): Promise<void>;
    setSpeakerphoneOn(on: boolean): Promise<void>;
    getCallStats(): Promise<string>;
    generateUUID(): Promise<string>;
  }

  export class StringeeCall2Listener {
    onChangeSignalingState: (
      call: StringeeCall2,
      signalingState: SignalingStateValue,
      reason: string,
      sipCode: number,
      sipReason: string,
    ) => void;
    onChangeMediaState: (
      call: StringeeCall2,
      mediaState: MediaStateValue,
      description: string,
    ) => void;
    onAudioDeviceChange: (
      call: StringeeCall2,
      selectedAudioDevice: AudioDeviceValue,
      availableAudioDevices: AudioDeviceValue[],
    ) => void;
    onHandleOnAnotherDevice: (
      call: StringeeCall2,
      signalingState: SignalingStateValue,
      description: string,
    ) => void;
  }
}
