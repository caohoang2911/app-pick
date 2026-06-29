import { useQuery } from '@tanstack/react-query';

import { axiosClient } from '@/api/shared';

type GenTokenResponse = {
  accessToken?: string;
  data?: { accessToken?: string };
  error?: string;
};

/**
 * Lấy Stringee access token cho `userId`.
 *
 * Backend: `GET stringee-apppick/genJWTToken?userId=<id>` → `{ data: { accessToken } }`.
 * Lưu ý: response interceptor của `axiosClient` đã unwrap `response.data`, nên
 * giá trị trả về ở đây chính là payload (không phải `AxiosResponse`).
 */
export const genStringeeToken = async (userId: string): Promise<string> => {
  const payload = (await axiosClient.get('stringee-apppick/genJWTToken', {
    params: { userId },
  })) as unknown as GenTokenResponse;

  const accessToken = payload?.data?.accessToken ?? payload?.accessToken;
  if (!accessToken) {
    throw new Error('Không lấy được Stringee access token');
  }
  return accessToken;
};

/** Hook React (tuỳ chọn) — luồng chính dùng `genStringeeToken` ở service singleton. */
export const useGenStringeeToken = (userId?: string) =>
  useQuery({
    queryKey: ['genStringeeToken', userId],
    queryFn: () => genStringeeToken(userId as string),
    enabled: !!userId,
    // Token Stringee sống ~1h; cache 30' rồi lấy lại khi cần.
    staleTime: 30 * 60 * 1000,
  });
