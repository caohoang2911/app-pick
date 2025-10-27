import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useConfig } from '~/src/core/store/config';
import { OrderItem } from '~/src/types/product';
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
  productFulfillError: OrderItem[];
}) => {
  const config = useConfig.use.config();
  const productPickedErrorTypes = useMemo(
    () => config?.productPickedErrorTypes || [],
    [config]
  ) as any[];

  return (
    <SBottomSheet
      visible={visible}
      title="Xác nhận đã pick xong"
      ref={actionRef}
      snapPoints={[500]}
      onClose={() => {
        setVisible(false);
      }}
      extraButton={
        <View className="flex gap-3 mt-auto mb-6 px-4 pb-3">
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
        <View className="flex gap-4 mt-3">
          {productFulfillError?.map((item: OrderItem, index: number) => {
            const isLastItem = index === productFulfillError.length - 1;
            return (
              <View key={index} className="flex gap-2">
                <Text
                  className="font-semibold"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.name}
                </Text>
                <View className="flex gap-2 justify-between">
                  <Text>
                    <Text numberOfLines={1} className="w-full">
                      Đặt:{' '}
                      <Text className="font-bold">
                        {item.quantity || 0} {item.unit}
                      </Text>
                      , Pick:{' '}
                      <Text className="font-bold">
                        {item.pickedQuantity || 0} {item.unit}
                      </Text>
                    </Text>
                  </Text>
                  {item.pickedErrorType && (
                    <View className="px-3 py-2 flex gap-1 rounded-xs  bg-orange-400 odd:border-b w-full odd:border-gray-200">
                      <Text
                        className="font-semibold text-white"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {
                          productPickedErrorTypes.find(
                            (error: any) => error.id === item.pickedErrorType
                          )?.name
                        }
                      </Text>
                    </View>
                  )}
                </View>
                {!isLastItem && (
                  <View className="flex-1 bg-gray-200" style={{ height: 1 }} />
                )}
              </View>
            );
          })}
        </View>
      </View>
    </SBottomSheet>
  );
};

export default PickedCompleteConfirmation;
