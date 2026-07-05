import { isNil } from 'lodash';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useConfig } from '~/src/core/store/config';
import { Product } from '~/src/types/product';
import { Badge } from '../Badge';
import { Button } from '../Button';
import SBottomSheet from '../SBottomSheet';
import SImage from '../SImage';
import { formatNumber } from '~/src/core/utils/number';

const pickWarningText = {
  fontSize: 13,
  lineHeight: 18,
  fontStyle: 'italic' as const,
};

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
    [config],
  ) as any[];

  const pickWarningExtraTitle = useMemo(
    () => (
      <View className="mt-3 gap-2 pb-1 pl-0.5">
        <Text style={pickWarningText} className="text-orange-500 font-semibold">
          Nếu SP không được pick với các lý do:
        </Text>
        <View className="gap-1">
          {[
            '• SP hết hàng, SP giảm chất lượng',
            '• SP quá hạn bán online, SP cận hạn sử dụng',
            '• SP chờ NCC xử lý',
          ].map((line) => (
            <View key={line} className="flex-row items-start gap-2 ">
              <View
                style={{
                  width: 6,
                  height: 6,
                  marginTop: 6,
                }}
              />
              <Text
                style={[pickWarningText, { flex: 1 }]}
                className="text-orange-500"
              >
                {line}
              </Text>
            </View>
          ))}
        </View>
        <Text
          style={[pickWarningText, { marginTop: 4 }]}
          className="text-orange-500 font-semibold"
        >
          Hệ thống sẽ tắt bán online các sản phẩm này, khách không thể đặt mua.
          Vui lòng kiểm tra kỹ trước khi xác nhận.
        </Text>
      </View>
    ),
    [],
  );

  return (
    <SBottomSheet
      visible={visible}
      title="Xác nhận đã pick xong"
      titleAlign="left"
      extraTitle={pickWarningExtraTitle}
      ref={actionRef}
      snapPoints={[750]}
      onClose={() => {
        setVisible(false);
      }}
      extraButton={
        <Button
          label="Đã pick xong"
          onPress={() => {
            setVisible(false);
            actionRef.current?.dismiss();
            onConfirm();
          }}
        />
      }
    >
      <View className="flex-1 px-4 pt-1 mb-4 ">
        <View className="flex flex-col flex-1 gap-4 py-3">
          {productFulfillError?.map((item: Product, index: number) => {
            const stock = !isNil(item.stockOnhand)
              ? item.stockOnhand
              : !isNil(item.stockAvailable)
                ? item.stockAvailable
                : null;
            const stockLabel =
              stock === null
                ? '--'
                : `${formatNumber(stock)}${item.unit ? ` ${item.unit}` : ''}`;

            return (
              <View
                key={index}
                className="flex px-3 py-3 overflow-hidden gap-2 bg-white rounded-md shadow-lg shadow-black-500 border border-gray-100"
              >
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
                    <View className="flex flex-row items-center gap-1">
                      {item.tags?.includes('GIFT') && <Text>🎁 </Text>}
                      <Text
                        className="font-semibold"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.name}
                      </Text>
                    </View>
                    <View className="gap-1.5">
                      <Text className="w-full text-[15px] leading-5 text-gray-900">
                        Đặt:{' '}
                        <Text className="font-bold">
                          {item.quantity || 0} {item.unit}
                        </Text>
                        {} • Pick:{' '}
                        <Text className="font-bold">
                          {item.pickedQuantity || 0} {item.unit}
                        </Text>
                      </Text>
                      <View className="flex-row items-center gap-2 flex-wrap mt-1">
                        <Text className="text-sm text-gray-500 font-medium">
                          Tồn kho:
                        </Text>
                        <Badge
                          variant="default"
                          label={stockLabel}
                          labelClasses="font-bold text-gray-900 text-xs"
                          className="py-0.5 px-2 max-w-full"
                        />
                      </View>
                    </View>
                  </View>
                </View>
                {item.pickedErrorType && (
                  <View
                    className="px-2 py-1 flex gap-1 rounded-md "
                    style={{ backgroundColor: '#FFA500' }}
                  >
                    <View className="flex flex-row items-center">
                      <Text
                        className="text-white font-semibold text-sm"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {
                          productPickedErrorTypes.find(
                            (error: any) => error.id === item.pickedErrorType,
                          )?.name
                        }
                      </Text>
                    </View>
                  </View>
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
