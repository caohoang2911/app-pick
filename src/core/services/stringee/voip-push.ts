/**
 * Base no-op cho VoIP push (Android/web + dùng cho type-check).
 * iOS dùng `voip-push.ios.ts` (Metro tự resolve theo nền).
 */
export const configureVoipPush = (): void => {};

export const getVoipToken = (): string | null => null;
