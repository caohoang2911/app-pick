import { Image } from 'expo-image';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCanEditOrderPick } from '~/src/core/hooks/useCanEditOrderPick';
import { useConfig } from '~/src/core/store/config';
import {
  setSuccessForBarcodeScan,
  toggleShowAmountInput,
  useOrderPick
} from '~/src/core/store/order-pick';
import { CheckCircleFill } from '~/src/core/svgs';
import EditOutLine from '~/src/core/svgs/EditOutLine';
import { getConfigNameById } from '~/src/core/utils/config';
import { formatCurrency, formatNumber } from '~/src/core/utils/number';
import { cn } from '~/src/lib/utils';
import { Product } from '~/src/types/product';
import { Badge } from '../Badge';

const Row = ({label, value, unit, extraConversionQuantity}: {label: string, value: string, unit: string, extraConversionQuantity?: number}) => {
  return (
    <View style={{width: 150}} className='flex flex-row w-100'>
      <View style={{width: 100}}><Text>{label}</Text></View>
      <View style={{width: 45}}>
        <Text className='font-medium'>{value}</Text>
      </View>
      {extraConversionQuantity ? <View className='flex flex-row gap-2 items-center'><Text className='font-medium'>{unit}</Text><Badge label={`${extraConversionQuantity}`} /></View> : <Text className='font-medium'>{unit}</Text> }
    </View>
  )
}

const OrderPickProduct = ({
  name,
  image,
  barcode,
  sellPrice,
  unit,
  quantity,
  stockAvailable,
  tags,
  pickedTime,
  pickedError,
  pickedQuantity,
  extraConversionQuantity
}: Partial<Product | any>) => {
  const isShowAmountInput = useOrderPick.use.isShowAmountInput();

  const config = useConfig.use.config();
  const productPickedErrors = config?.productPickedErrors || [];
  const pickedErrorName = getConfigNameById(productPickedErrors, pickedError);

  const shouldDisplayEdit = useCanEditOrderPick();

  return (
    <>
      <View className={cn(`bg-white shadow`)} style={styles.box}>
        <View className="p-4">
          <View className='flex flex-row gap-2 items-center mb-3' style={[{paddingRight: shouldDisplayEdit ? 53 : 28}]}>
            {pickedTime && (
              <View className="rounded-full bg-white ">
                <CheckCircleFill color={'green'}/>
              </View>
            )}
            <Text className="text-lg font-semibold" numberOfLines={1}>{name}</Text>
          </View>
          <View className="flex flex-row justify-between gap-4 flex-grow ">
            <View className="">
              <Image
                style={{ width: 80, height: 80 }}
                source={image}
                contentFit="cover"
                transition={1000}
              />
              <Text numberOfLines={1} className='text-xs text-gray-500 text-center mt-2'>{barcode}</Text>
            </View>
            <View className="flex-row justify-between flex-grow h-full" >
              <View className="flex gap-2 flex-1">
                <Row label="Số lượng đặt" value={quantity} unit={unit} extraConversionQuantity={extraConversionQuantity} />
                <Row label="Thực pick" value={pickedQuantity || "--"} unit={unit} />
                <Row label="Tồn kho" value={stockAvailable || "--"} unit={unit} />
                <View className="flex flex-row flex-wrap gap-2 items-stretch w-full">
                  {tags?.map((tag: any) => <Badge className="self-start" label={tag} style={{maxWidth: 180}} /> )}
                </View>
              </View>
            </View>
          </View>
          <View className="border my-3 border-gray-100" />
          <View className="flex">
            <View className="flex-row justify-end">
              <Text className="text-gray-500">
                Giá: {formatCurrency(sellPrice, {unit: true})}
              </Text>
            </View>
          </View>
          {pickedErrorName && <View className="flex gap-1 mt-2">
            <Text className="text-red-500 italic">Lỗi: {pickedErrorName}</Text>
          </View>}
        </View>
        {shouldDisplayEdit && <View style={styles.edit}>
          <Pressable
            onPress={() => {
              toggleShowAmountInput(!isShowAmountInput);
              setSuccessForBarcodeScan(barcode, { fillInput: false });
            }}
          >
            <EditOutLine width={21} height={21} color={'gray'} />
          </Pressable>
        </View>}
      </View>
    </>
  );
};

export default OrderPickProduct;

const styles = StyleSheet.create({
  edit: {
    position: 'absolute',
    top: 16,
    right: 10,
  },
  box: {
    borderRadius: 10,
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
        elevation: 9,
      },
    }),
  },
});
