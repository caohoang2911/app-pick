import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useConfig } from '~/src/core/store/config';
import { Product } from '~/src/types/product';
import { Button } from '../Button';
import SBottomSheet from '../SBottomSheet';

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
  const config = useConfig.use.config();
  const productPickedErrors = useMemo(() => config?.productPickedErrors || [], [config]) as any[];


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
      <View className="flex-1 px-4 pt-1 mb-4">
        <View className="flex flex-row items-center gap-2">
        <Text className="text-orange-500 text-base font-bold my-3">SP pick khác số lượng đặt</Text>
      </View> 
      <View className="flex-1 bg-gray-200" style={{ height: 1 }} />
      <View className="flex gap-4 mt-3">
        {productFulfillError?.map((item: Product, index: number) => (
          <View key={index} className="flex gap-2">
            <Text className="font-semibold" numberOfLines={1} ellipsizeMode="tail">• {item.name}</Text>
            <View className="flex gap-2 justify-between">
              <Text className="ml-3">
                <Text numberOfLines={1} className="w-full">Đặt: <Text className="font-bold">{item.quantity || 0} {item.unit}</Text>
                , Pick: <Text className="font-bold">{item.pickedQuantity || 0} {item.unit}</Text></Text>
              </Text>
              {item.pickedError && 
                <View className="flex-1 flex-row gap-2">
                  <Text className="ml-3 italic text-orange-500" numberOfLines={1} ellipsizeMode="tail">
                    {productPickedErrors.find((error: any) => error.id === item.pickedError)?.name}
                  </Text>
                </View>
              }
            </View>
            <View className="flex-1 bg-gray-200" style={{ height: 1 }} />
          </View>
        ))}
      </View>
    </View>
  </SBottomSheet>
  )
}

export default PickedCompleteConfirmation;