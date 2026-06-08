import { axiosClient } from '@/api/shared';
import { getApVersion } from '~/src/core/utils/app-version';

type Variables = {
  zas: string;
};

export const authorizeAppPickClient = (params: Variables): Promise<any> => {
  return axiosClient.post(
    'auth/authorizeAppPickClient',
    { version: getApVersion() },
    { headers: { zas: params.zas } },
  );
};
