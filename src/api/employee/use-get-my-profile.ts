import { axiosClient } from '@/api/shared';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { setUser, useAuth } from '~/src/core';
import { setUserInfo } from '~/src/core/store/auth/utils';
import { setLoading } from '~/src/core/store/loading';

type Response = { error: string } & {
  data: any;
};

const getMyProfile = async (): Promise<Response> => {
  return await axiosClient.get('employee/getMyProfile');
};

export const useGetMyProfile = () => {
  const authStatus = useAuth.use.status();
  const userInfo = useAuth.use.userInfo();

  const query = useQuery({
    queryKey: ['getMyProfile'],
    queryFn: () => {
      return getMyProfile();
    },
    enabled: authStatus === 'signIn',
  });

  useEffect(() => {
    if (query?.data?.data && !query?.data?.error) {
      const { driverOrderAssignSetting, kposShiftStatus } = query?.data?.data;
      setLoading(true);

      setUserInfo({
        ...userInfo,
        kposShiftStatus: kposShiftStatus,
        ...driverOrderAssignSetting,
      });

      setUser({
        ...userInfo,
        ...driverOrderAssignSetting,
        kposShiftStatus: kposShiftStatus,
        driverOrderAssignStatus: driverOrderAssignSetting?.status,
      });
      setLoading(false);

      setLoading(false);
    }
  }, [query?.data]);

  // Override refetch để kiểm tra điều kiện auth
  const originalRefetch = query.refetch;
  const safeRefetch = () => {
    if (authStatus === 'signIn') {
      return originalRefetch();
    }
    return Promise.resolve({
      data: null,
      error: null,
      isError: false,
      isLoading: false,
    });
  };

  return {
    ...query,
    refetch: safeRefetch,
  };
};
