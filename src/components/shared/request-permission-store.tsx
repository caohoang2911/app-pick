import { isEmpty } from 'lodash';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useGetConfig } from '~/src/api/config/useGetConfig';
import { useConfig } from '~/src/core/store/config';
import { Button } from '../Button';
import Loading from '../Loading';
import StoreSelection from './StoreSelection';
import { setLoading } from '~/src/core/store/loading';

interface Props {
  code?: string | null;
}

const RequestPermissionStore = ({ code }: Props) => {
  const ref = useRef<any>(null)
  const version = useConfig.use.version();
  const config = useConfig.use.config();
  
  const { refetch, isFetching } = useGetConfig({ version: !isEmpty(config) ? version : "" });

  const handleRequestPermission = () => {
    ref.current.present() 
  }

  useEffect(() => {
    if(isEmpty(config)){
      refetch();
    }
  }, [config]);

  useEffect(() => {
    setLoading(isFetching);
  }, [isFetching]);

  if(isFetching) return null;

  return (
    <View className='flex-1 bg-white justify-center items-center'>
      <Button label='Yêu cầu cấp quyền siêu thị' onPress={handleRequestPermission} />
      <StoreSelection
        ref={ref}
        onSelect={() => {}}
        selectedId={''}
        code={code}
        newbie={true}
      />  
    </View>
  )
}

export default RequestPermissionStore