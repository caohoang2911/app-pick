import AntDesign from '@expo/vector-icons/AntDesign';
import { Image } from 'expo-image';
import { isNil } from 'lodash';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Button, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useCanEditOrderPick } from '~/src/core/hooks/useCanEditOrderPick';
import { useConfig } from '~/src/core/store/config';
import {
  setCurrentId,
  setIsEditManual,
  setQuantityFromBarcode,
  setSuccessForBarcodeScan,
  toggleShowAmountInput,
  useOrderPick
} from '~/src/core/store/order-pick';
import { CheckCircleFill } from '~/src/core/svgs';
import EditOutLine from '~/src/core/svgs/EditOutLine';
import { getConfigNameById } from '~/src/core/utils/config';
import { formatCurrency } from '~/src/core/utils/number';
import { Product } from '~/src/types/product';
import { Badge } from '../Badge';
import SImage from '../SImage';
import MoreActionsBtn from './more-actions-btn';
import { useLocalSearchParams } from 'expo-router';
// Extract Row component and memoize
const Row = memo(({
  label,
  value,
  unit,
  originOrderQuantity,
  warning = false
}: {
  label: string,
  value: string,
  unit?: string,
  originOrderQuantity?: number,
  warning?: boolean
}) => (
  <View className='flex-1 flex-row w-100'>
    <View className='flex-row' style={styles.labelColumn}>
      <Text className='text-gray-500'>{label}</Text>
    </View>
    <View className='flex-row' style={styles.valueColumn}>
      <Text className={`font-medium ${warning ? 'text-red-500' : ''}`} numberOfLines={1}>{value}</Text>
    </View>
    <View className='flex-row' style={styles.unitColumn}>
      {unit && <Text className={`font-medium ${warning ? 'text-red-500' : ''}`}>{unit}</Text>}
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
        icon={
          tag?.toUpperCase() == 'GIFT' &&
            <View className='mr-1 -mt-0.5'>
              <AntDesign name="gift" size={13} color="orange" />
            </View>
        }
        label={tag}
        style={{ maxWidth: 180 }}
      />
    ))}
  </View>
));

// Error message component
const WarningMessage = memo(({ errorName }: { errorName: string }) => (
  <View 
    className="p-3 rounded-b"
    style={{ backgroundColor: '#FFA500' }}
  >
    <View className='flex'>
      <Text className='text-white font-semibold text-sm'>{errorName}</Text>
    </View>
  </View>
));

// Product Header component
const ProductHeader = memo(({ 
  name, 
  pickedTime, 
  isGift, 
  showEdit,
  code,
  id,
  barcode,
}: { 
  name: string, 
  pickedTime?: number, 
  isGift: boolean,
  showEdit: boolean,
  code: string,
  id: number,
  barcode: string,
}) => (
  <>
    <View className='flex flex-row gap-1 items-center' style={{ paddingRight: showEdit ? 33 : 0}}>
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
      <MoreActionsBtn code={code} id={id} barcode={barcode} />
    </View>
  </>
));

const ProductVender = ({ vendorName }: { vendorName: string }) => {
  if(!vendorName) return null;

  return (
    <View className='flex flex-row gap-2 items-center'>
      <Badge label={vendorName} variant="pink" />
    </View>
  )
}

// Barcode display component
const BarcodeDisplay = memo(({ 
  baseBarcode, 
  barcode, 
  hasTags,
  isHiddenTag,
}: { 
  baseBarcode?: string, 
  barcode?: string,
  hasTags: boolean,
  isHiddenTag: boolean,
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
        className={`text-xs text-center mt-1 ${hasTags && !isHiddenTag ? 'mb-1' : ''}`}
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

// Add ImagePreviewModal component
const ImagePreviewModal = memo(({ 
  visible, 
  imageSource, 
  onClose 
}: { 
  visible: boolean, 
  imageSource: any, 
  onClose: () => void 
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <TouchableOpacity 
      style={styles.modalOverlay} 
      activeOpacity={1} 
      onPress={onClose}
    >
      <View style={styles.modalContent}>
        <Image
          style={styles.previewImage}
          source={imageSource}
          contentFit="contain"
          transition={200}
        />
      </View>
    </TouchableOpacity>
  </Modal>
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
  isAllowEditPickQuantity,
  pickedError,
  pickedQuantity,
  originOrderQuantity,
  isHiddenTag = false,
  vendorName,
  id,
}: Partial<Product | any>) => {
  const { code }  = useLocalSearchParams<{ code: string }>();
  const isShowAmountInput = useOrderPick.use.isShowAmountInput();
  const config = useConfig.use.config();
  const shouldDisplayEdit = useCanEditOrderPick() && isAllowEditPickQuantity;
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const isGift = useMemo(() => {
    return tags?.includes('Gift');
  }, [tags]);
  

  // TODO: 
  // const isDisable = useMemo(() => disable && isGift, [disable, isGift]) && isGift;

  const isDisable = false;

  const orderQuantityNum = Number(orderQuantity);
  const allowedExcess = orderQuantityNum * 0.05; // 5% tolerance

  const isWarningOverQuantity = useMemo(() => {
    return Number(pickedQuantity) > (orderQuantityNum + allowedExcess);
  }, [pickedQuantity, orderQuantity]);

  // Memoize expensive calculations
  const productPickedErrors = useMemo(() => config?.productPickedErrors || [], [config]);
  const pickedErrorName = useMemo(() => 
    getConfigNameById(productPickedErrors, pickedError), 
    [productPickedErrors, pickedError]
  );
  // const isGift = useMemo(() => type === "GIFT", [type]);
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
    if(isDisable) return;
    toggleShowAmountInput(!isShowAmountInput, id);
    setSuccessForBarcodeScan(barcode);
    setCurrentId(id);
    setIsEditManual(true);
  }, [isShowAmountInput, id, barcode, isDisable]);

  // Memoize image source to prevent re-renders
  const imageSource = useMemo(() => 
    image || require("~/assets/default-img.jpg"), 
    [image]
  );

  const handleConfimationRemoveProductItem = useCallback((id: number) => {
    if(isDisable) return;
    toggleShowAmountInput(!isShowAmountInput, id);
    setSuccessForBarcodeScan(barcode);
    setCurrentId(id);
    setIsEditManual(true, 'out-of-stock');
    setQuantityFromBarcode(0);
  }, [isShowAmountInput, barcode, isDisable]);

  const handleImagePress = useCallback(() => {
    setIsPreviewVisible(true);
  }, []);

  return (
     <Swipeable 
      renderRightActions={() => 
        <TouchableOpacity style={{ width: 80 }} onPress={() => handleConfimationRemoveProductItem(id)}>
          <View className="bg-red-200 p-5 h-full justify-center items-center">
            <Text className="text-red-500 text-center font-medium">Hết hàng</Text>
          </View>
        </TouchableOpacity>
      }>
        <View className={`bg-white shadow relative ${isDisable && 'opacity-40'}`} style={styles.box}>
          <View className="p-3">
            <ProductHeader 
              name={name || ''} 
              pickedTime={pickedTime}
              isGift={isGift} 
              showEdit={shouldDisplayEdit}
              code={code}
              id={id}
              barcode={barcode}
            />
            <ProductVender vendorName={vendorName} />
            <View className="flex flex-row justify-between gap-4 flex-grow mt-3">
              <View className="flex justify-between items-center">
                <View>
                  <SImage
                    style={styles.productImage}
                    source={imageSource}
                    contentFit="cover"
                    allowDownscaling
                    transition={200}
                    cachePolicy="none"
                    preview={true}
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
                    label="Đã pick" 
                    value={!isNil(pickedQuantity) ? pickedQuantity : "--"} 
                    unit={unit} 
                    warning={Number(pickedQuantity) != Number(orderQuantity)}
                  />
                  <Row 
                    label="Tồn kho" 
                    value={!isNil(stockOnhand) ? stockOnhand : "--"} 
                    unit={unit} 
                  />
                  
                  {hasSellPrice && (
                    <View className='flex flex-row w-100'>
                      <View style={styles.labelColumn}>
                        <Text className='text-gray-500'>Giá bán</Text>
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
          </View>
          {Boolean(pickedErrorName || isWarningOverQuantity) && 
            <View className='flex w-full flex-grow mt-3'>
              {pickedErrorName && <WarningMessage errorName={pickedErrorName} />}
              {isWarningOverQuantity && <WarningMessage errorName={"Khách sẽ bị thu thêm tiền phần chênh lệch trọng lượng"} />}
            </View>
          }
          {shouldDisplayEdit && <EditButton onPress={handleEditPress} />}
        </View>
        <ImagePreviewModal
          visible={isPreviewVisible}
          imageSource={imageSource}
          onClose={() => setIsPreviewVisible(false)}
        />
    </Swipeable>
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
        borderWidth: 1,
        borderColor: '#dfdfdf',
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
        borderWidth: 1,
        borderColor: '#dfdfdf',
      },
    }),
  },
  productImage: {
    width: 80,
    height: 80,
  },
  labelColumn: { width: "25%" },
  valueColumn: { width: "25%" },
  unitColumn: { width: "25%" },
  badgeColumn: { width: "25%" },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});

OrderPickProduct.displayName = 'OrderPickProduct';

export default OrderPickProduct;
