import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useGetSettingQuery } from '~/src/api/app-pick/use-get-setting';
import { useUpdateSetting } from '~/src/api/app-pick/use-update-setting';
import { queryClient } from '~/src/api/shared';
import { Button } from '~/src/components/Button';
import { Switch } from '~/src/components/Switch';
import { setLoading } from '~/src/core/store/loading';

const Settings = () => {
  const { data } = useGetSettingQuery();
  const noti = data?.data?.noti || {} as any;

  const { mutate: updateSetting, isPending } = useUpdateSetting(() => {
    queryClient.invalidateQueries({ queryKey: ['getSetting'] });
  });

  const [isEnableOnline, setIsEnableOnline] = useState<any>(false);
  const [isEnableHomedeli, setIsEnableHomedeli] = useState<any>(false);

  useEffect(() => {
    setIsEnableOnline(noti?.isEnableOnline);
    setIsEnableHomedeli(noti?.isEnableHomedeli);
  }, [noti]);

  const handleUpdateSetting = () => {
    setLoading(true);
    updateSetting({ data: { noti: { isEnableOnline, isEnableHomedeli } } });
  };

  return (
    <View className="flex-1 bg-white rounded-lg">
      <View className="flex-grow p-4">
        <Text className="text-base font-bold">Thông báo</Text>
        <View className="flex flex-col gap-4 mt-3">
          <View className="flex flex-row items-center justify-between">
            <Text className="text-base">Đơn Oneline</Text>
            <Switch value={isEnableOnline as boolean} onValueChange={setIsEnableOnline} />
          </View>
          <View className="flex flex-row items-center justify-between">
            <Text className="text-base">Đơn Home Delivery</Text>
            <Switch value={isEnableHomedeli as boolean} onValueChange={setIsEnableHomedeli} />
          </View>
        </View>
      </View>
      <View className="px-4" style={{ paddingBottom: 30 }}>
        <Button label="Cập nhật" loading={isPending} onPress={handleUpdateSetting} />
      </View>
    </View>
  );
};

export default Settings;