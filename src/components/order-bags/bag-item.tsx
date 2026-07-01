import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { removeOrderBag } from '~/src/core/store/order-bags';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { OrderBagItem } from '~/src/types/order-bags';
import { Button } from '../Button';

const BagItem = ({ code, type }: OrderBagItem) => {
  const handleDelete = useCallback(() => {
    showAlert({
      title: 'Bạn chắc chắn xoá túi hàng này?',
      onConfirm: () => {
        hideAlert();
        removeOrderBag(code, type);
      },
    });
  }, [code, type]);

  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-base text-gray-500">{code}</Text>
      <View className="flex-row items-center gap-3">
        <Button
          variant="text"
          label={'Xoá'}
          onPress={handleDelete}
          labelClasses="text-red-500 text-base"
          size="sm"
          className="px-0"
        />
      </View>
    </View>
  );
};

export default React.memo(BagItem);
