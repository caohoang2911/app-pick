import type { StringeeCall2 } from 'stringee-react-native-v2';

/**
 * Cầu nối giữa UUID của CallKeep/CallKit và đối tượng `StringeeCall2`.
 * App Pick chỉ xử lý 1 cuộc gọi tại một thời điểm, nhưng vẫn lưu theo map để
 * tra cứu 2 chiều (UUID ↔ call) khi nhận sự kiện từ native.
 */
const callsByUuid = new Map<string, StringeeCall2>();
const uuidByCall = new Map<StringeeCall2, string>();

export const registerCall = (uuid: string, call: StringeeCall2): void => {
  callsByUuid.set(uuid, call);
  uuidByCall.set(call, uuid);
};

export const getCallByUuid = (uuid: string): StringeeCall2 | undefined =>
  callsByUuid.get(uuid);

export const getUuidByCall = (call: StringeeCall2): string | undefined =>
  uuidByCall.get(call);

export const removeCall = (uuid: string): void => {
  const call = callsByUuid.get(uuid);
  if (call) uuidByCall.delete(call);
  callsByUuid.delete(uuid);
};

export const clearCalls = (): void => {
  callsByUuid.clear();
  uuidByCall.clear();
};
