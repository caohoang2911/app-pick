import clsx from 'clsx';
import { Image } from 'expo-image';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useConfig } from '~/src/core/store/config';
import {
  setSuccessForBarcodeScan,
  toggleShowAmountInput,
  useOrderPick,
} from '~/src/core/store/order-pick';
import { CheckCircleFill } from '~/src/core/svgs';
import EditOutLine from '~/src/core/svgs/EditOutLine';
import { getConfigNameById } from '~/src/core/utils/config';
import { formatCurrency, formatNumber } from '~/src/core/utils/number';
import { OrderDetail } from '~/src/types/order-detail';
import { Product } from '~/src/types/product';
import { Badge } from '../Badge';
import { cn } from '~/src/lib/utils';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

const OrderPickProduct = ({
  name,
  image,
  barcode,
  sellPrice,
  unit,
  quantity,
  stockAvailable,
  tags,
}: Partial<Product | any>) => {
  const orderPickProducts: any = useOrderPick.use.orderPickProducts();
  const orderDetail: OrderDetail = useOrderPick.use.orderDetail();
  const isShowAmountInput = useOrderPick.use.isShowAmountInput();

  const config = useConfig.use.config();
  const productPickedErrors = config?.productPickedErrors || [];

  const pickedError = orderPickProducts?.[barcode]?.pickedError;
  const pickedQuantity = orderPickProducts?.[barcode]?.pickedQuantity;
  const pickedErrorName = getConfigNameById(productPickedErrors, pickedError);


  const { header } = orderDetail || {};
  const { status } = header || {};


  const shouldDisplayEdit = status === 'STORE_PICKING'

  const isOutOfStock = stockAvailable === 0;

  return (
    <>
      <View className={cn(`bg-white shadow`)} style={{paddingRight: shouldDisplayEdit ? 30 : 0, ...styles.box}}>
        <View className="p-4">
          <View className='flex flex-row gap-2 items-center mb-3'>
            {orderPickProducts?.[barcode]?.pickedTime && (
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
                placeholder={{ blurhash }}
                contentFit="cover"
                transition={1000}
              />
              <Text numberOfLines={1} className='text-xs text-gray-500 text-center'>{barcode}</Text>
            </View>
            <View className="flex-row justify-between flex-grow h-full" >
              <View className="flex gap-2 flex-1">
                <View style={{width: 150}} className='flex flex-row w-100'>
                  <View style={{width: 100}}><Text>Số lượng đặt</Text></View>
                  <View style={{width: 45}}>
                    <Text className='font-medium'>{quantity}</Text>
                  </View>
                  <Text className='font-medium'>{unit}</Text> 
                </View>
                <View style={{width: 150}} className='flex flex-row w-100'>
                  <View style={{width: 100}}><Text>Thực pick</Text></View>
                  <View style={{width: 45}}>
                    <Text className='font-medium'>{pickedQuantity || "--"}</Text>
                  </View>
                  <Text className='font-medium'>{unit}</Text>
                </View>
                <View style={{width: 150}} className='flex flex-row w-100'>
                  <View style={{width: 100}} ><Text className={cn({ 'text-red-500': isOutOfStock })}>Tồn kho</Text></View>
                  <View style={{width: 45}} >
                    <Text className={cn('font-medium', { 'text-red-500': isOutOfStock })}>{formatNumber(stockAvailable) || "--"}</Text>
                  </View>
                  <Text className={cn('font-medium', { 'text-red-500': isOutOfStock })}>{unit}</Text>
                </View>
                <View className="flex flex-row flex-wrap gap-2 items-stretch w-full">
                  {tags?.map((tag: any) => <Badge className="self-start" label={tag} style={{maxWidth: 180}} /> )}
                </View>
              </View>
            </View>
          </View>
          <View className="border my-3 border-gray-100" />
          <View className="flex gap-3">
            <View className="flex-row gap-3 items-center">
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
              setSuccessForBarcodeScan(barcode);
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
    right: 16,
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
