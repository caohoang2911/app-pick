import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useGetSettingQuery } from '~/src/api/app-pick/use-get-setting';
import { useUpdateSetting } from '~/src/api/app-pick/use-update-setting';
import { queryClient } from '~/src/api/shared';
import { Button } from '~/src/components/Button';
import Container from '~/src/components/Container';
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
    <View className="bg-gray-100 flex-1">
      <View className="flex-grow flex mt-4">
        <View className='bg-white p-3 mx-4 rounded-lg' style={styles.box}>
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
      </View>
      <View className="px-4" style={{ paddingBottom: 30 }}>
        <Button label="Cập nhật" loading={isPending} onPress={handleUpdateSetting} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderRadius: 5,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#222',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        shadowColor: '#222',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.4,
        shadowRadius: 5.46,
        elevation: 2,
      },
    }),
  },
});

export default Settings;