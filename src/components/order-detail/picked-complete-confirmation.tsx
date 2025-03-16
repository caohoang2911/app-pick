import React from 'react'
import SBottomSheet from '../SBottomSheet';
import { View, Text } from 'react-native';
import { useOrderPick } from '~/src/core/store/order-pick';
import { getOrderPickProductsFlat } from '~/src/core/utils/order-bag';
import { Product } from '~/src/types/product';
import { Button } from '../Button';

const PickedCompleteConfirmation = ({
  visible,
  setVisible,
  actionRef,
  onConfirm,
  productFulfillError,
}: {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  actionRef: React.RefObject<any>;
  onConfirm: () => void;
  productFulfillError: Product[];
}) => {

  return (
    <SBottomSheet
      visible={visible}
      title="Xác nhận đã pick xong"
      ref={actionRef}
      snapPoints={['50%']}
      onClose={() => {
        setVisible(false);
      }}
      extraButton={
        <View className="flex gap-3 mt-auto mb-6 px-4">
          <Button
            label="Đã pick xong"
            onPress={() => {
              setVisible(false);
              actionRef.current?.dismiss();
              onConfirm();
            }}
          />
        </View>
      }
    >
      <View className="flex-1 px-4 pt-">
        <View className="flex flex-row items-center gap-2">
        <Text className="text-orange-500 text-base font-bold mt-3">SP pick khác số lượng đặt</Text>
      </View> 
      <View className="flex gap-2 mt-3">
        {productFulfillError?.map((item: Product) => (
          <>
            <View className="flex gap-3">
              <View className="flex flex-row items-center gap-2" key={item.code}>
                <Text>• {item.name}:</Text>
                <Text>Đặt <Text className="font-bold">{item.quantity} {item.unit}</Text>, Pick: <Text className="font-bold">{item.pickedQuantity} {item.unit}</Text></Text>
              </View>
            </View>
          </>
        ))}
      </View>
    </View>
  </SBottomSheet>
  )
}

export default PickedCompleteConfirmation;