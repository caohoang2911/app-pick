import { axiosClient } from '@/api/shared';
import { useMutation } from '@tanstack/react-query';
import { getVersionInfo, VersionInfo } from '@/core/utils/getVersionInfo';

type Variables = {
  "version": VersionInfo
};

type Response = { error: string } & {};

const setAppVersion = async (params: Variables): Promise<Response> => {
  return await axiosClient.post('app-pick/setAppVersion', params);
};

export const useSetAppVersion = (cb: () => void) => {
  return useMutation({
    mutationFn: (params: Variables) => setAppVersion(params),
    onSuccess: (response: Response) => {
      if(!response.error) {
        cb?.()
      }
    },
  });
};

// Helper function to get version info and create the mutation
export const useSetAppVersionWithAutoInfo = (cb?: () => void) => {
  const mutation = useSetAppVersion(cb || (() => {}));
  
  const setVersionWithAutoInfo = () => {
    const versionInfo = getVersionInfo();
    mutation.mutate({ version: versionInfo });
  };
  
  return {
    ...mutation,
    setVersionWithAutoInfo,
  };
};
