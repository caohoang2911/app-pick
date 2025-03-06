import { Image } from 'expo-image';
import React, { memo, useMemo, useCallback } from 'react';
import { Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

// Extract Row component and memoize
const Row = memo(({
  label,
  value,
  unit,
  originOrderQuantity
}: {
  label: string,
  value: string,
  unit?: string,
  originOrderQuantity?: number
}) => (
  <View className='flex-1 flex-row w-100'>
    <View className='flex-row' style={styles.labelColumn}>
      <Text>{label}</Text>
    </View>
    <View className='flex-row' style={styles.valueColumn}>
      <Text className='font-medium' numberOfLines={1}>{value}</Text>
    </View>
    <View className='flex-row' style={styles.unitColumn}>
      {unit && <Text className='font-medium'>{unit}</Text>}
    </View>
    {originOrderQuantity && (
      <View className='flex-row items-end justify-end' style={styles.badgeColumn}>
        <Badge label={`${originOrderQuantity}`} />
      </View>
    )}
  </View>
));

// Memoize expensive Badge components
const TagsBadges = memo(({ tags }: { tags: string[] }) => (
  <View className="flex flex-row flex-wrap gap-2 items-stretch w-full">
    {tags?.map((tag: string, index: number) => (
      <Badge 
        key={`${tag}-${index}`} 
        className="self-start" 
        label={tag} 
        style={{ maxWidth: 180 }}
      />
    ))}
  </View>
));

// Error message component
const ErrorMessage = memo(({ errorName }: { errorName: string }) => (
  <View className="flex gap-1">
    <View className="border mb-2 border-gray-100 mt-3" />
    <View className='flex flex-row bg-orange-100 p-2 gap-2 rounded-md items-center self-end'>
      <Text className='text-orange-500 text-xs'>{errorName}</Text>
    </View>
  </View>
));

// Product Header component
const ProductHeader = memo(({ 
  name, 
  pickedTime, 
  isGift, 
  showEdit 
}: { 
  name: string, 
  pickedTime?: number, 
  isGift: boolean,
  showEdit: boolean 
}) => (
  <View className='flex flex-row gap-1 items-center mb-3' style={{ paddingRight: showEdit ? 33 : 0 }}>
    {pickedTime ? (
      <View className="rounded-full bg-white">
        <CheckCircleFill color={'green'} />
      </View>
    ) : null}
    <View className="flex-1">
      <Text className="text-lg font-semibold" numberOfLines={1}>
        {isGift ? "🎁 " : ""}{name}
      </Text>
    </View>
  </View>
));

// Barcode display component
const BarcodeDisplay = memo(({ 
  baseBarcode, 
  barcode, 
  hasTags,
  isHiddenTag
}: { 
  baseBarcode?: string, 
  barcode?: string,
  hasTags: boolean,
  isHiddenTag: boolean
}) => (
  <View>
    <Text
      numberOfLines={1}
      className={`text-xs text-center mt-2 ${barcode && barcode !== baseBarcode ? 'text-gray-500' : ''}`}
    >
      {baseBarcode || '--'}
    </Text>
    {barcode && barcode !== baseBarcode && (
      <Text
        numberOfLines={1}
        className={`text-xs text-center mt-2 ${hasTags && !isHiddenTag ? 'mb-1' : ''}`}
      >
        {barcode}
      </Text>
    )}
  </View>
));

// Edit button component
const EditButton = memo(({ 
  onPress 
}: { 
  onPress: () => void 
}) => (
  <View style={styles.edit}>
    <TouchableOpacity
      onPress={onPress}
      className='p-3'
    >
      <EditOutLine width={21} height={21} color={'gray'} />
    </TouchableOpacity>
  </View>
));

// Main component
const OrderPickProduct = memo(({
  name,
  image,
  barcode,
  baseBarcode,
  sellPrice,
  unit,
  orderQuantity,
  stockOnhand,
  tags = [],
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
  const shouldDisplayEdit = useCanEditOrderPick();
  
  // Memoize expensive calculations
  const productPickedErrors = useMemo(() => config?.productPickedErrors || [], [config]);
  const pickedErrorName = useMemo(() => 
    getConfigNameById(productPickedErrors, pickedError), 
    [productPickedErrors, pickedError]
  );
  const isGift = useMemo(() => type === "GIFT", [type]);
  const hasSellPrice = useMemo(() => 
    !isGift && Number(sellPrice) > 0, 
    [isGift, sellPrice]
  );
  const hasTags = useMemo(() => 
    tags?.length > 0, 
    [tags]
  );
  
  // Extract handler to useCallback 
  const handleEditPress = useCallback(() => {
    toggleShowAmountInput(!isShowAmountInput, id);
    setSuccessForBarcodeScan(barcode, { fillInput: false });
    setCurrentId(id);
    setIsEditManual(true);
  }, [isShowAmountInput, id, barcode]);

  // Memoize image source to prevent re-renders
  const imageSource = useMemo(() => 
    image || require("~/assets/default-img.jpg"), 
    [image]
  );

  return (
    <View className={cn(`bg-white shadow relative`)} style={styles.box}>
      <View className="p-3">
        <ProductHeader 
          name={name || ''} 
          pickedTime={pickedTime} 
          isGift={isGift} 
          showEdit={shouldDisplayEdit}
        />
        
        <View className="flex flex-row justify-between gap-4 flex-grow">
          <View className="flex justify-between items-center">
            <View>
              <Image
                style={styles.productImage}
                source={imageSource}
                contentFit="cover"
                allowDownscaling
                cachePolicy="memory-disk"
                transition={200}
              />
            </View>
            
            <BarcodeDisplay 
              baseBarcode={baseBarcode} 
              barcode={barcode}
              hasTags={hasTags}
              isHiddenTag={isHiddenTag}
            />
          </View>
          
          <View className="flex-row justify-between flex-grow h-full">
            <View className="flex gap-2 flex-1">
              <Row 
                label="SL đặt" 
                value={orderQuantity} 
                unit={unit} 
                originOrderQuantity={originOrderQuantity} 
              />
              <Row 
                label="Thực pick" 
                value={!isNil(pickedQuantity) ? pickedQuantity : "--"} 
                unit={unit} 
              />
              <Row 
                label="Tồn kho" 
                value={!isNil(stockOnhand) ? stockOnhand : "--"} 
                unit={unit} 
              />
              
              {hasSellPrice && (
                <View className='flex flex-row w-100'>
                  <View style={styles.labelColumn}>
                    <Text>Giá bán</Text>
                  </View>
                  <Text className='font-medium text-left' numberOfLines={1}>
                    {formatCurrency(sellPrice, { unit: true }) || "--"}
                  </Text>
                </View>
              )}
              
              {!isHiddenTag && hasTags && <TagsBadges tags={tags} />}
            </View>
          </View>
        </View>
        
        {pickedErrorName ? <ErrorMessage errorName={pickedErrorName} /> : null}
      </View>
      
      {shouldDisplayEdit && <EditButton onPress={handleEditPress} />}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.id === nextProps.id &&
    prevProps.pickedTime === nextProps.pickedTime &&
    prevProps.pickedQuantity === nextProps.pickedQuantity &&
    prevProps.pickedError === nextProps.pickedError &&
    prevProps.stockOnhand === nextProps.stockOnhand
  );
});

// Cache styles outside component to avoid recreation
const styles = StyleSheet.create({
  edit: {
    position: 'absolute',
    top: 5,
    right: 6,
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
  productImage: {
    width: 80,
    height: 80,
  },
  labelColumn: { width: "30%" },
  valueColumn: { width: "20%" },
  unitColumn: { width: "25%" },
  badgeColumn: { width: "25%" },
});

OrderPickProduct.displayName = 'OrderPickProduct';

export default OrderPickProduct;
