import { Button } from '@/components/Button';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useHandoverOrder } from '~/src/api/app-pick/use-handover-order';
import { queryClient } from '~/src/api/shared';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { setLoading } from '~/src/core/store/loading';

const ActionsBottom = () => {
  const { code } = useLocalSearchParams<{ code: string }>();

  const { isPending: isLoadingHandoverOrder, mutate: handoverOrder } = useHandoverOrder(() => {
    hideAlert();
    setLoading(false);
    queryClient.invalidateQueries({ queryKey: ['orderDetail', code] });
  });

  const handleCompleteOrder = () => {
    if (!code) return;

    showAlert({
      title: 'Xác nhận đã giao hàng',
      loading: isLoadingHandoverOrder,
      onConfirm: () => {
        setLoading(true);
        handoverOrder({ orderCode: code });
      },
    });
  };

  return (
    <View className="border-t border-gray-200 pb-4">
      <View className="px-4 py-3 bg-white ">
        <Button
          loading={false}
          onPress={handleCompleteOrder}
          disabled={false}
          label={'Đã pick xong'}
        />
      </View>
    </View>
  );
}

export default ActionsBottom