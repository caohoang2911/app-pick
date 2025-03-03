import { Image } from 'expo-image';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useCanEditOrderPick } from '~/src/core/hooks/useCanEditOrderPick';
import { useConfig } from '~/src/core/store/config';
import {
  setCurrentId,
  setIsEditManual,
  setSuccessForBarcodeScan,
  toggleShowAmountInput,
  useOrderPick
} from '~/src/core/store/order-pick';
import { CheckCircleFill } from '~/src/core/svgs';
import EditOutLine from '~/src/core/svgs/EditOutLine';
import { getConfigNameById } from '~/src/core/utils/config';
import { formatCurrency } from '~/src/core/utils/number';
import { cn } from '~/src/lib/utils';
import { Product } from '~/src/types/product';
import { Badge } from '../Badge';
import { isNil } from 'lodash';

const Row = ({label, value, unit, originOrderQuantity}: {label: string, value: string, unit?: string, originOrderQuantity?: number}) => {
  return (
    <View style={{width: 150}} className='flex flex-row w-100'>
      <View style={{width: 100}}><Text>{label}</Text></View>
      <View style={{width: 65}}>
        <Text className='font-medium' numberOfLines={1}>{value}</Text>
      </View>
      {originOrderQuantity ? <View className='flex flex-row gap-2 items-center'><Text className='font-medium'>{unit}</Text><Badge label={`${originOrderQuantity}`} /></View> : unit ? <Text className='font-medium'>{unit}</Text> : null}
    </View>
  )
}

const OrderPickProduct = ({
  name,
  image,
  barcode,
  baseBarcode,
  sellPrice,
  unit,
  orderQuantity,
  stockOnhand,
  tags,
  pickedTime,
  pickedError,
  pickedQuantity,
  originOrderQuantity,
  isHiddenTag = false,
  type,
  id,
}: Partial<Product | any>) => {
  const isShowAmountInput = useOrderPick.use.isShowAmountInput();

  const config = useConfig.use.config();
  const productPickedErrors = config?.productPickedErrors || [];
  const pickedErrorName = getConfigNameById(productPickedErrors, pickedError);

  const shouldDisplayEdit = useCanEditOrderPick();

  const isGift = type === "GIFT";
  
  return (
    <>
      <View className={cn(`bg-white shadow relative`)} style={styles.box}>
        <View className="p-4">
          <View className='flex flex-row gap-1 items-center mb-3' style={{paddingRight: shouldDisplayEdit ? 53 : 0}}>
            {pickedTime && (
              <View className="rounded-full bg-white">
                <CheckCircleFill color={'green'}/>
              </View>
            )}
           <View className="flex-1">
            <Text className="text-lg font-semibold" numberOfLines={1}>{isGift && "🎁 "}{name}</Text>
           </View>
          </View>
          <View className="flex flex-row justify-between gap-4 flex-grow ">
            <View className="flex justify-between items-center">
              <View className="">
                <Image
                  style={{ width: 80, height: 80 }}
                  source={image || require("~/assets/default-img.jpg")}
                  contentFit="cover"
                  transition={1000}
                />
              </View>
              <View>
                <Text
                  numberOfLines={1}
                  className={`text-xs  text-center mt-2 ${barcode && barcode !== baseBarcode ? 'text-gray-500' : ''}`}
                >
                  {baseBarcode|| '--'}
                </Text>
                {barcode && barcode !== baseBarcode && 
                  <Text 
                    numberOfLines={1}
                    className={`text-xs text-center mt-2 ${tags.length && !isHiddenTag ? 'mb-1' : ''}`}
                  >
                    {barcode}
                  </Text>
                }
              </View>
            </View>
            <View className="flex-row justify-between flex-grow h-full" >
              <View className="flex gap-2 flex-1">
                <Row label="SL đặt" value={orderQuantity} unit={unit} originOrderQuantity={originOrderQuantity} />
                <Row label="Thực pick" value={!isNil(pickedQuantity) ? pickedQuantity : "--"} unit={unit} />
                <Row label="Tồn kho" value={!isNil(stockOnhand) ? stockOnhand : "--"} unit={unit} />
                {(!isGift && Number(sellPrice) > 0) && <View style={{width: 150}} className='flex flex-row w-100'>
                  <View style={{width: 100}}><Text>Giá bán</Text></View>
                  <Text className='font-medium' numberOfLines={1}>{formatCurrency(sellPrice, {unit: true}) || "--"}</Text>
                </View>}
                {!isHiddenTag && (
                  <View className="flex flex-row flex-wrap gap-2 items-stretch w-full">
                    {tags?.map((tag: any) => <Badge className="self-start" label={tag} style={{maxWidth: 180}} /> )}
                  </View>
                )}
              </View>
            </View>
          </View>
          
          {pickedErrorName && <View className="flex gap-1">
            <View className="border mb-2 border-gray-100 mt-3" />
            <View className='flex flex-row bg-orange-100 p-2 gap-2 rounded-md items-center self-end'>
              <Text className='text-orange-500 text-xs'>{pickedErrorName}</Text>
            </View>
          </View>}
        </View>
        {shouldDisplayEdit && <View style={styles.edit}>
          <Pressable
            onPress={() => {
              toggleShowAmountInput(!isShowAmountInput, id);
              setSuccessForBarcodeScan(barcode, { fillInput: false });
              setCurrentId(id);
              setIsEditManual(true);
            }}
          >
            <EditOutLine width={21} height={21} color={'gray'} />
          </Pressable>
        </View>}
      </View>
    </>
  );
};

export default React.memo(OrderPickProduct);

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
