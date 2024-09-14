import { Button } from '@/components/Button';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useCompleteOrder } from '~/src/api/app-pick/use-complete-order';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { setLoading } from '~/src/core/store/loading';

const ActionsBottom = () => {
  const { code } = useLocalSearchParams<{ code: string }>();

  const { isPending: isLoadingCompleteOrder, mutate: completeOrder } = useCompleteOrder(() => {
    hideAlert();
    setLoading(false);
  });

  const handleCompleteOrder = () => {
    if (!code) return;

    showAlert({
      title: 'Xác nhận đã giao hàng',
      loading: isLoadingCompleteOrder,
      onConfirm: () => {
        setLoading(true);
        completeOrder({ orderCode: code });
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