import type { UserInfo } from '@/core/store/auth/utils';

/**
 * Resolve Stringee userId cho nhân viên App Pick.
 *
 * ⚠️ Giá trị này PHẢI khớp với userId mà tổng đài (CS/OMS) dùng để gọi tới —
 * endpoint token là `genJWTToken?userId=<id>` và client phải `connect` bằng
 * cùng userId đó thì mới nhận được cuộc gọi.
 *
 * Mặc định dùng `username`. Sau khi backend xác nhận hợp đồng, chỉ cần đổi
 * đúng 1 dòng dưới đây (ví dụ chuyển sang `userInfo.id`).
 */
export const getStringeeUserId = (
  userInfo: UserInfo | undefined,
): string | undefined => {
  return userInfo?.username || undefined;
};
