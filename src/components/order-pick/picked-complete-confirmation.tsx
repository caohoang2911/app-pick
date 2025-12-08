import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useConfig } from '~/src/core/store/config';
import { Product } from '~/src/types/product';
import { Button } from '../Button';
import SBottomSheet from '../SBottomSheet';
import SImage from '../SImage';

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
          {productFulfillError?.map((item: Product, index: number) => {
            const isLastItem = index === productFulfillError.length - 1;
            return (
              <View key={index} className="flex gap-2">
                <View className=" flex-row gap-3">
                  <SImage
                    source={item.image}
                    style={{ width: 50, height: 50, borderRadius: 8 }}
                    contentFit="cover"
                    allowDownscaling
                    transition={200}
                    cachePolicy="none"
                    preview={true}
                  />
                  <View className="flex-1 flex gap-2">
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
                    </View>
                  </View>
                </View>
                {item.pickedErrorType && (
                  <View
                    className="px-2 py-1 flex gap-1 rounded-xs   odd:border-b odd:border-gray-200"
                    style={{ backgroundColor: '#FFA500' }}
                  >
                    <View className="flex flex-row items-center">
                      <View className="size-1.5 bg-white rounded-full mr-2 self-start mt-2" />
                      <Text
                        className="text-white font-semibold text-sm"
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
                  </View>
                )}
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
