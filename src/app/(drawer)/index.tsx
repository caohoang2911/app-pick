import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { setConfig, useConfig } from '@/core/store/config';
import { ConfigResponse, useGetConfig } from '@/api/config/useGetConfig';
import Loading from '@/components/Loading';
import { useAuth } from '@/core';

const ConfigWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isDone, setIsDone] = useState(false)
  const status = useAuth.use.status();
  const version = useConfig.use.version();

  const { data, refetch, isFetching } = useGetConfig({ version });
  
  useEffect(() => { 
    if(status === 'signIn'){
      refetch();
    }
  }, [status]);

  useEffect(() => {
    if (data?.error) return;
    if (data?.data) {
      setConfig(data.data as ConfigResponse);
    }

    if(typeof data === 'object'){
      setIsDone(true);
    }

  }, [data]);

  if (isFetching || !isDone) {
    return <Loading />
  }

  return <>{children}</>;
};


const Index = () => {

  return <ConfigWrapper><Redirect href={'/orders'} /></ConfigWrapper>;
};

export default Index;