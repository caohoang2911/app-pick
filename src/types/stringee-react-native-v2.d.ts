declare module 'stringee-react-native-v2' {
  export const StringeeVideoScalingType: any;
  export const StringeeVideoTrack: any;
  export const StringeeVideoView: any;
  
  // Constructor function for StringeeCall (older version)
  export class StringeeCall {  
    constructor({stringeeClient, from, to, customData}: {stringeeClient: any, from: string, to: string, customData: string});
    
    // Call methods
    makeCall(): Promise<string>; // Return callId as string
    answer(): Promise<void>;
    reject(): Promise<void>;
    hangup(): Promise<void>;
    mute(mute: boolean): Promise<void>;
    unmute(): Promise<void>;
    enableVideo(enable: boolean): Promise<void>;
    muteVideo(): Promise<void>;
    unmuteVideo(): Promise<void>;
    
    // Call properties
    uuid: string;
    localVideoTrack: any;
    remoteVideoTrack: any;
    from: string;
    to: string;
    isVideoCall: boolean;
    
    // Event listeners
    onSignalingStateChange?: (call: any, signalingState: string, reason: string, sipCode: number, sipReason: string) => void;
    onMediaStateChange?: (call: any, mediaState: string) => void;
    onLocalStream?: (call: any) => void;
    onRemoteStream?: (call: any) => void;
    onCallInfo?: (call: any, callInfo: any) => void;
    onCallEnd?: (call: any) => void;
  }
  
  // Constructor function for StringeeCall2
  export class StringeeCall2 {  
    constructor({stringeeClient, from, to, customData}: {stringeeClient: any, from: string, to: string, customData: string});
    
    // Call methods
    makeCall(): Promise<string>; // Return callId as string
    answer(): Promise<void>;
    reject(): Promise<void>;
    hangup(): Promise<void>;
    mute(mute: boolean): Promise<void>;
    unmute(): Promise<void>;
    enableVideo(enable: boolean): Promise<void>;
    muteVideo(): Promise<void>;
    unmuteVideo(): Promise<void>;
    
    // Call properties
    uuid: string;
    localVideoTrack: any;
    remoteVideoTrack: any;
    from: string;
    to: string;
    isVideoCall: boolean;
    
    // Event listeners
    onSignalingStateChange?: (call: any, signalingState: string, reason: string, sipCode: number, sipReason: string) => void;
    onMediaStateChange?: (call: any, mediaState: string) => void;
    onLocalStream?: (call: any) => void;
    onRemoteStream?: (call: any) => void;
    onCallInfo?: (call: any, callInfo: any) => void;
    onCallEnd?: (call: any) => void;
  }
  
  export class StringeeClient {
    setListener(listener: StringeeClientListener): void;
    connect(token: string): void;
  }
  
  export class StringeeClientListener {
    onConnect?: (stringeeClient: StringeeClient, userId: string) => void;
    onDisConnect?: (stringeeClient: StringeeClient) => void;
    onFailWithError?: (stringeeClient: StringeeClient, code: number, message: string) => void;
    onRequestAccessToken?: (stringeeClient: StringeeClient) => void;
    onIncomingCall?: (stringeeClient: StringeeClient, stringeeCall: any) => void;
    onIncomingCall2?: (stringeeClient: StringeeClient, stringeeCall2: any) => void;
  }
  
  export interface StringeeCallInstance {
    uuid: string;
    localVideoTrack: any;
    remoteVideoTrack: any;
    from: string;
    to: string;
    isVideoCall: boolean;
    onSignalingStateChange?: (call: any, signalingState: string, reason: string, sipCode: number, sipReason: string) => void;
    onMediaStateChange?: (call: any, mediaState: string) => void;
    onLocalStream?: (call: any) => void;
    onRemoteStream?: (call: any) => void;
    onCallInfo?: (call: any, callInfo: any) => void;
    onCallEnd?: (call: any) => void;
    makeCall(): Promise<string>;
    answer(): Promise<void>;
    reject(): Promise<void>;
    hangup(): Promise<void>;
    mute(mute: boolean): Promise<void>;
    unmute(): Promise<void>;
    enableVideo(enable: boolean): Promise<void>;
    muteVideo(): Promise<void>;
    unmuteVideo(): Promise<void>;
  }
  
  export interface StringeeCall2Instance {
    uuid: string;
    localVideoTrack: any;
    remoteVideoTrack: any;
    from: string;
    to: string;
    isVideoCall: boolean;
    onSignalingStateChange?: (call: any, signalingState: string, reason: string, sipCode: number, sipReason: string) => void;
    onMediaStateChange?: (call: any, mediaState: string) => void;
    onLocalStream?: (call: any) => void;
    onRemoteStream?: (call: any) => void;
    onCallInfo?: (call: any, callInfo: any) => void;
    onCallEnd?: (call: any) => void;
    makeCall(): Promise<string>;
    answer(): Promise<void>;
    reject(): Promise<void>;
    hangup(): Promise<void>;
    mute(mute: boolean): Promise<void>;
    unmute(): Promise<void>;
    enableVideo(enable: boolean): Promise<void>;
    muteVideo(): Promise<void>;
    unmuteVideo(): Promise<void>;
  }
} 