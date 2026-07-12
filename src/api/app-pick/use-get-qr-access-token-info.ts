import { axiosClient } from '@/api/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { showMessage } from 'react-native-flash-message';
import { setLoading } from '~/src/core/store/loading';

export type QRAccessTokenInfoPayload = {
  storeCode: string;
  employeeCode: string;
  employeeName: string;
  expireAt: number;
};

/** Trạng thái token QR cấp quyền siêu thị. */
export enum QRAccessTokenStatus {
  INITIALIZED = 'INITIALIZED',
  APPROVED = 'APPROVED',
}

export type QRAccessTokenInfo = {
  status?: string;
  payload?: QRAccessTokenInfoPayload;
};

type Variables = {
  token: string;
};

type Response = { error?: string } & {
  payload?: unknown;
  status?: string;
  data?: {
    payload?: unknown;
    status?: string;
  };
};

const getQRAccessTokenInfo = async ({
  token,
}: Variables): Promise<Response> => {
  return await axiosClient.get('app-pick/getQRAccesTokenInfo', {
    params: { token },
  });
};

/** BE có thể bọc payload trong `map` (Java Map serialize). */
const normalizePayload = (
  payload: unknown,
): QRAccessTokenInfoPayload | undefined => {
  if (!payload || typeof payload !== 'object') return undefined;

  const record = payload as Record<string, unknown>;

  const { storeCode, employeeCode, employeeName, expireAt } = record;
  if (
    typeof storeCode !== 'string' ||
    typeof employeeCode !== 'string' ||
    typeof employeeName !== 'string' ||
    typeof expireAt !== 'number'
  ) {
    return undefined;
  }

  return { storeCode, employeeCode, employeeName, expireAt };
};

const normalizeInfo = (res: Response): QRAccessTokenInfo => {
  const rawPayload = res.payload ?? res.data?.payload;
  return {
    status: res.status ?? res.data?.status,
    payload: normalizePayload(rawPayload),
  };
};

/** SM/TC quét QR nhân viên → lấy thông tin trước khi confirm thêm vào siêu thị. */
export const useGetQRAccessTokenInfo = (
  cb?: (info: QRAccessTokenInfoPayload, token: string) => void,
) => {
  return useMutation({
    mutationFn: (params: Variables) => getQRAccessTokenInfo(params),
    onSuccess: (data: Response, variables: Variables) => {
      setLoading(false);
      if (data.error) {
        showMessage({ message: data.error, type: 'danger' });
        return;
      }

      const { payload } = normalizeInfo(data);
      if (!payload) {
        showMessage({
          message: 'Không lấy được thông tin mã QR',
          type: 'danger',
        });
        return;
      }

      cb?.(payload, variables.token);
    },
    onError: () => {
      setLoading(false);
      showMessage({
        message: 'Không lấy được thông tin mã QR',
        type: 'danger',
      });
    },
  });
};

/**
 * NV theo dõi trạng thái QR cấp quyền: poll 1s/lần khi còn `enabled` + có token.
 * Trả về `{ status, payload }`; caller tự xử lý khi status = APPROVED.
 */
export const usePollQRAccessTokenStatus = (
  token: string | null,
  enabled = true,
) => {
  return useQuery({
    queryKey: ['getQRAccesTokenInfo', token],
    queryFn: () => getQRAccessTokenInfo({ token: token! }),
    enabled: enabled && !!token,
    refetchInterval: 1000,
    refetchIntervalInBackground: false,
    staleTime: 0,
    gcTime: 0,
    select: normalizeInfo,
  });
};
