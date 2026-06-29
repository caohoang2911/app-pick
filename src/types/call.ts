/**
 * Type dùng chung cho tính năng nhận cuộc gọi (Stringee + CallKeep).
 */

export type CallStatus = 'idle' | 'incoming' | 'answered' | 'ended';

export type IncomingCallInfo = {
  /** UUID dùng cho CallKeep/CallKit. */
  callUuid: string;
  /** callId phía Stringee. */
  callId?: string;
  /** userId người gọi (Stringee `from`). */
  fromNumber?: string;
  /** Tên hiển thị người gọi (Stringee `fromAlias`). */
  fromAlias?: string;
};
