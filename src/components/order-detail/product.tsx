import AntDesign from '@expo/vector-icons/AntDesign';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { isNil } from 'lodash';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Dimensions, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useConfig } from '~/src/core/store/config';
import {
  setCurrentId,
  setIsEditManual,
  setReplacePickedProductId,
  setSuccessForBarcodeScan,
  toggleShowAmountInput,
  useOrderPick
} from '~/src/core/store/order-pick';
import { CheckCircleFill } from '~/src/core/svgs';
import { getConfigNameById } from '~/src/core/utils/config';
import { formatCurrency } from '~/src/core/utils/number';
import { getOrderPickProductsFlat } from '~/src/core/utils/order-bag';
import { OrderStatusValue } from '~/src/types/order';
import { Product } from '~/src/types/product';
import { Badge } from '../Badge';
import SImage from '../SImage';
import MoreActionsBtn from './more-actions-btn';
const screenWidth = Dimensions.get('window').width;
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
      <View className='absolute right-0 bottom-0'>
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
  code,
  id,
  barcode,
  showQuickAction,
  isAllowEditPickQuantity,
  onEditPress,
  onReplaceProduct,
}: { 
  name: string, 
  pickedTime?: number, 
  isGift: boolean,
  code: string,
  id: number,
  barcode: string,
  showQuickAction: boolean,
  isAllowEditPickQuantity: boolean,
  onEditPress: () => void,
  onReplaceProduct: () => void,
}) => (
  <>
    <View className='flex flex-row gap-1'>
      {pickedTime ? (
        <View className="rounded-full bg-white">
          <CheckCircleFill color={'green'} />
        </View>
      ) : null}
      <View className="flex-1">
        <Text className="text-base font-semibold" numberOfLines={2}>
          {isGift ? "🎁 " : ""}{name}
        </Text>
      </View>
      {showQuickAction && <MoreActionsBtn 
        onReplaceProduct={onReplaceProduct}
        onEditPress={onEditPress}
        isAllowEditPickQuantity={isAllowEditPickQuantity} 
        code={code} 
        id={id}
        barcode={barcode} 
      />}
    </View>
  </>
));

const ProductVendor = ({ vendorName }: { vendorName: string }) => {
  if(!vendorName) return null;

  return (
    <View style={{ maxWidth: screenWidth/2 }}>
      <Badge label={vendorName} variant="pink" />
    </View>
  )
}

// Barcode display component
const BarcodeDisplay = memo(({ 
  baseBarcode, 
  barcode, 
}: { 
  baseBarcode?: string, 
  barcode?: string,
}) => (
  <View className='flex flex-row gap-2 flex-wrap items-center'>
    <Badge
      label={baseBarcode || '--'}
      variant="pink"
    />
    {barcode && barcode !== baseBarcode && ( 
      <Badge
        label={barcode}
        variant="pink"
      />
    )}
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
  id,
  image,
  barcode,
  baseBarcode,
  sellPrice,
  unit,
  indexBarcodeWithoutPickedTime,
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
  pickingBarcode,
  statusOrder,
}: Partial<Product | any>) => {
  const { code }  = useLocalSearchParams<{ code: string }>();
  const isShowAmountInput = useOrderPick.use.isShowAmountInput();
  const config = useConfig.use.config();
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const orderPickProducts = useOrderPick.use.orderPickProducts();
  const orderPickProductsFlat = getOrderPickProductsFlat(orderPickProducts);

  const indexById = orderPickProductsFlat?.findIndex((item: Product) => {
    return item.id === id
  });

  const isActive = indexById === indexBarcodeWithoutPickedTime;

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

  const isStatusPicking = statusOrder === OrderStatusValue.STORE_PICKING;
  const isStatusPacked = statusOrder === OrderStatusValue.STORE_PACKED;
  const isPicking = barcode === pickingBarcode && isStatusPicking && !pickedTime && isActive;

  const showQuickAction = isStatusPicking || isStatusPacked

  const handleReplaceProduct = useCallback(() => {
    setReplacePickedProductId(id);
  }, []);

  return (
     <>
        <View 
          className={`bg-white shadow relative ${isDisable && 'opacity-40'}`}
          style={[styles.box, {
            borderLeftWidth: isPicking ? 5 : 1,
            borderLeftColor: isPicking ? 'rgb(59,130,246)' : '#dfdfdf',
            borderStyle: 'solid',
          }]}
          >
          <View className="p-3">
            <ProductHeader 
              name={name || ''} 
              pickedTime={pickedTime}
              isGift={isGift} 
              code={code}
              id={id}
              barcode={barcode}
              isAllowEditPickQuantity={isAllowEditPickQuantity}
              showQuickAction={showQuickAction}
              onEditPress={handleEditPress}
              onReplaceProduct={handleReplaceProduct}
            />
            <View className='flex flex-row mt-1 gap-2'>
              <ProductVendor vendorName={vendorName} />
              <View className='flex flex-1 flex-row gap-2 items-center'>
                <BarcodeDisplay 
                  baseBarcode={baseBarcode} 
                  barcode={barcode}
                />
              </View>
            </View>
            <View className="flex flex-row justify-between gap-2 flex-grow mt-3">
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
          </View>
        <ImagePreviewModal
          visible={isPreviewVisible}
          imageSource={imageSource}
          onClose={() => setIsPreviewVisible(false)}
        />
    </>
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
    borderRadius: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#222',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        borderWidth: 1,
        borderTopColor: '#dfdfdf',
        borderBottomColor: '#dfdfdf',
        borderLeftColor: '#dfdfdf',
        borderRightColor: '#dfdfdf',
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
        borderTopColor: '#dfdfdf',
        borderBottomColor: '#dfdfdf',
        borderLeftColor: '#dfdfdf',
        borderRightColor: '#dfdfdf',
      },
    }),
  },
  productImage: {
    width: 120,
    height: 120,
  },
  labelColumn: { width: "30%" },
  valueColumn: { width: "25%" },
  unitColumn: { width: "45%" },
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