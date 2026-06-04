import AntDesign from '@expo/vector-icons/AntDesign';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { isNil } from 'lodash';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useConfig } from '~/src/core/store/config';
import {
  setCurrentId,
  setIsEditManual,
  setReplacePickedProductId,
  setSuccessForBarcodeScan,
  toggleShowAmountInput,
  useOrderPick,
} from '~/src/core/store/order-pick';
import { CheckCircleFill } from '~/src/core/svgs';
import { getConfigNameById } from '~/src/core/utils/config';
import { formatCurrency } from '~/src/core/utils/number';
import { OrderStatusValue } from '~/src/types/order';
import { Product } from '~/src/types/product';
import { Badge } from '../Badge';
import SImage from '../SImage';
import MoreActionsBtn from './more-actions-btn';
import { UnitText } from './unit-text';
import { colors } from '~/src/ui/colors';
// Base design width — iPhone 14 Pro
const BASE_WIDTH = 390;

/** Responsive scale clamped for small/large screens */
function useCardScale() {
  const { width } = useWindowDimensions();
  return Math.max(0.82, Math.min(1.05, width / BASE_WIDTH));
}

// Extract Row component and memoize
const Row = memo(
  ({
    label,
    value,
    unit,
    warning = false,
  }: {
    label: string;
    value: string;
    unit?: string;
    warning?: boolean;
  }) => {
    const scale = useCardScale();
    const labelW = Math.round(50 * scale);
    const valueW = Math.round(55 * scale);
    const fontSize = Math.max(11, Math.round(13 * scale));
    const unitFontSize = Math.max(10, fontSize - 2);
    const unitColorClass = warning ? 'text-red-500' : '';

    return (
      <View style={styles.row}>
        <View style={[styles.labelColumn, { width: labelW }]}>
          <Text
            className="text-gray-500"
            numberOfLines={1}
            style={{ fontSize }}
          >
            {label}
          </Text>
        </View>
        <View style={[styles.rowTrailing, !unit && styles.rowTrailingSingle]}>
          <View
            style={[
              styles.valueColumn,
              !!unit && { width: valueW },
              !unit && styles.valueColumnExpand,
            ]}
          >
            <Text
              className={`font-medium ${warning ? 'text-red-500' : ''}`}
              numberOfLines={1}
              style={[
                unit ? styles.valueText : styles.valueTextExpand,
                { fontSize },
              ]}
            >
              {value}
            </Text>
          </View>
          {unit ? (
            <View style={styles.unitColumn}>
              <UnitText
                unit={unit}
                className={`font-medium ${unitColorClass}`}
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.unitText, { fontSize: unitFontSize }]}
              />
            </View>
          ) : null}
        </View>
      </View>
    );
  },
);

// Memoize expensive Badge components
const TagsBadges = memo(({ tags }: { tags: string[] }) => {
  const configs = useConfig.use.config();
  const orderItemTags = configs?.orderItemTags || [];

  return (
    <View className="flex flex-row flex-wrap gap-2 items-stretch w-full">
      {tags?.map((tag: string, index: number) => {
        const tagName = getConfigNameById(orderItemTags, tag);
        return (
          <Badge
            key={`${tag}-${index}`}
            className="self-start"
            icon={
              tagName == 'GIFT' && (
                <View className="mr-1 -mt-0.5">
                  <AntDesign name="gift" size={13} color="orange" />
                </View>
              )
            }
            label={tagName}
            variant={tag?.includes('REPLACEABLE') ? 'danger' : 'default'}
            style={{ maxWidth: 180 }}
          />
        );
      })}
    </View>
  );
});

// Error message component
const WarningMessage = memo(
  ({
    errorName,
    iconVariant = 'default',
    isLast = false,
  }: {
    errorName: string | React.ReactNode;
    iconVariant?: 'default' | 'check';
    isLast?: boolean;
  }) => (
    <View
      className={`px-3 py-2 ${!isLast ? 'border-b border-gray-200' : ''}`}
      style={{ backgroundColor: colors.orange[200] }}
    >
      <View className="flex flex-row items-start gap-2">
        {iconVariant == 'check' ? (
          <Text className="text-white font-semibold text-sm shrink-0">✓</Text>
        ) : (
          <View className="size-1.5 bg-white rounded-full self-start mt-2 shrink-0" />
        )}

        <View style={{ flex: 1, flexShrink: 1, minWidth: 0 }}>
          {typeof errorName === 'string' ? (
            <Text className="text-white font-semibold text-sm">
              {errorName}
            </Text>
          ) : (
            errorName
          )}
        </View>
      </View>
    </View>
  ),
);

// Product Header component
const ProductHeader = memo(
  ({
    name,
    isGift,
    code,
    id,
    barcode,
    showQuickAction,
    isAllowEditPickQuantity,
    onEditPress,
    onReplaceProduct,
  }: {
    name: string;
    pickedTime?: number;
    isGift: boolean;
    code: string;
    id: number;
    barcode: string;
    showQuickAction: boolean;
    isAllowEditPickQuantity: boolean;
    onEditPress: () => void;
    onReplaceProduct: () => void;
  }) => (
    <>
      <View className="flex flex-row gap-1 align-center">
        <View className="flex-1">
          <Text className="text-base font-semibold" numberOfLines={2}>
            {isGift ? '🎁 ' : ''}
            {name}
          </Text>
        </View>
        {showQuickAction && (
          <MoreActionsBtn
            onReplaceProduct={onReplaceProduct}
            onEditPress={onEditPress}
            isAllowEditPickQuantity={isAllowEditPickQuantity}
            code={code}
            id={id}
            barcode={barcode}
          />
        )}
      </View>
    </>
  ),
);

const ProductVendor = ({ vendorName }: { vendorName: string }) => {
  const { width } = useWindowDimensions();
  if (!vendorName) return null;

  return (
    <View style={{ maxWidth: width / 2 }}>
      <Badge label={vendorName} variant="default" />
    </View>
  );
};

// Barcode display component
const BarcodeDisplay = memo(
  ({ baseBarcode, barcode }: { baseBarcode?: string; barcode?: string }) => {
    if (!barcode && !baseBarcode) return null;

    const isBaseBarcode = barcode && barcode !== baseBarcode;
    return (
      <View
        className={`flex-row  items-center ${isBaseBarcode ? 'gap-1' : ''}`}
      >
        <View className="w-auto">
          <Badge
            label={baseBarcode || '--'}
            variant="pink"
            className="d-block"
          />
        </View>
        <View className="flex-shrink">
          {isBaseBarcode && (
            <Badge
              label={barcode}
              variant="secondary"
              labelClasses="text-xs text-gray-500"
            />
          )}
        </View>
      </View>
    );
  },
);

// Add ImagePreviewModal component
const ImagePreviewModal = memo(
  ({
    visible,
    imageSource,
    onClose,
  }: {
    visible: boolean;
    imageSource: any;
    onClose: () => void;
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
  ),
);

// Main component
const OrderPickProduct = memo(
  ({
    name,
    id,
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
    pickedErrorType,
    pickedQuantity,
    isHiddenTag = false,
    vendorName,
    pickedNote,
    statusOrder,
    orderQuantityConversion,
  }: Partial<
    Product & {
      isAllowEditPickQuantity: boolean;
      isHiddenTag: boolean;
      statusOrder: string;
    }
  >) => {
    const { code } = useLocalSearchParams<{ code: string }>();
    const isShowAmountInput = useOrderPick.use.isShowAmountInput();
    const config = useConfig.use.config();
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);
    const { width: screenWidth } = useWindowDimensions();
    const cardScale = Math.max(0.82, Math.min(1.05, screenWidth / BASE_WIDTH));
    // Image: 90% of 1/3 screen width, scaled
    const imageSize = Math.round(((screenWidth - 32) / 3) * 0.9 * cardScale);

    const lastScannedId = useOrderPick.use.lastScannedId();

    const isActive =
      id != null && lastScannedId != null && id === lastScannedId;

    const isGift = useMemo(() => {
      return tags?.includes('GIFT');
    }, [tags]);

    // TODO:
    // const isDisable = useMemo(() => disable && isGift, [disable, isGift]) && isGift;

    const isDisable = false;

    const orderQuantityNum = Number(orderQuantity);
    const allowedExcess = orderQuantityNum * 0.05; // 5% tolerance

    const isWarningOverQuantity = useMemo(() => {
      const isBulkProduct = tags?.includes('Hàng xá');
      const pickedQuantityNum = Number(pickedQuantity);
      const [
        minWeight = Number.NEGATIVE_INFINITY,
        maxWeight = Number.POSITIVE_INFINITY,
      ] = orderQuantityConversion?.weightRange ?? [];

      if (
        isBulkProduct &&
        Number.isFinite(pickedQuantityNum) &&
        pickedQuantityNum >= minWeight &&
        pickedQuantityNum <= maxWeight
      ) {
        return false;
      }

      return pickedQuantityNum > orderQuantityNum + allowedExcess;
    }, [
      pickedQuantity,
      orderQuantity,
      tags,
      orderQuantityConversion?.weightRange,
    ]);

    // Memoize expensive calculations
    const productPickedErrorTypes = useMemo(
      () => config?.productPickedErrorTypes || [],
      [config],
    );
    const pickedErrorName = useMemo(
      () => getConfigNameById(productPickedErrorTypes, pickedErrorType),
      [productPickedErrorTypes, pickedErrorType],
    );

    const warningItems = useMemo(() => {
      const items: Array<{
        key: string;
        errorName: React.ReactNode;
        iconVariant?: 'default' | 'check';
      }> = [];
      const isBulkProduct = tags?.includes('Hàng xá');

      if (pickedErrorName) {
        items.push({ key: 'pickedErrorName', errorName: pickedErrorName });
      }
      if (pickedNote) {
        items.push({
          key: 'pickedNote',
          errorName: (
            <Text className="text-white font-bold text-sm">{pickedNote}</Text>
          ),
          iconVariant: 'check',
        });
      }
      if (isWarningOverQuantity) {
        items.push({
          key: 'isWarningOverQuantity',
          errorName: 'Khách sẽ bị thu thêm tiền phần chênh lệch trọng lượng',
        });
      }
      return items;
    }, [pickedErrorName, pickedNote, isWarningOverQuantity]);

    // const isGift = useMemo(() => type === "GIFT", [type]);
    const hasSellPrice = useMemo(
      () => !isGift && Number(sellPrice) > 0,
      [isGift, sellPrice],
    );
    const hasTags = useMemo(() => tags?.length > 0, [tags]);

    // Extract handler to useCallback
    const handleEditPress = useCallback(() => {
      if (isDisable || !id || !barcode) return;

      toggleShowAmountInput(!isShowAmountInput, id);
      setSuccessForBarcodeScan(barcode);
      setCurrentId(id);
      setIsEditManual(true);
    }, [
      isShowAmountInput,
      id,
      barcode,
      isDisable,
      toggleShowAmountInput,
      setSuccessForBarcodeScan,
      setCurrentId,
      setIsEditManual,
    ]);

    // Memoize image source to prevent re-renders
    const imageSource = useMemo(
      () => image || require('~/assets/default-img.jpg'),
      [image],
    );

    const isStatusPicking = statusOrder === OrderStatusValue.STORE_PICKING;
    const isStatusPacked = statusOrder === OrderStatusValue.STORE_PACKED;
    const showQuickAction = isStatusPicking || isStatusPacked;

    const handleReplaceProduct = useCallback(() => {
      if (!id) return;
      setReplacePickedProductId(id);
    }, [setReplacePickedProductId, id]);

    return (
      <>
        <View
          className={`bg-white ${isDisable && 'opacity-40'}`}
          style={styles.box}
        >
          <View style={styles.boxBody}>
            {isActive && <View style={styles.activeIndicatorColumn} />}
            <View style={styles.boxContent}>
              <View className="p-3">
                <ProductHeader
                  name={name || ''}
                  pickedTime={pickedTime}
                  isGift={isGift}
                  code={code}
                  id={id || 0}
                  barcode={barcode || ''}
                  isAllowEditPickQuantity={isAllowEditPickQuantity || false}
                  showQuickAction={showQuickAction}
                  onEditPress={handleEditPress}
                  onReplaceProduct={handleReplaceProduct}
                />
                <View className="flex flex-row mt-1 gap-1 flex-wrap">
                  <ProductVendor vendorName={vendorName || ''} />
                  <View className="flex flex-row items-center">
                    <BarcodeDisplay
                      baseBarcode={baseBarcode}
                      barcode={barcode}
                    />
                  </View>
                  {!!orderQuantityConversion && (
                    <>
                      <Badge
                        label={`${orderQuantityConversion?.quantity} x ${orderQuantityConversion?.unit}`}
                        variant="purple"
                      />
                    </>
                  )}
                </View>
                <View className="flex flex-row gap-1.5 justify-between flex-grow mt-3">
                  <View className="flex justify-between items-center">
                    <View className="relative">
                      <SImage
                        style={[styles.productImage, { width: imageSize }]}
                        source={imageSource}
                        contentFit="cover"
                        allowDownscaling
                        transition={200}
                        cachePolicy="none"
                        preview={true}
                        key={imageSource}
                      />
                      {pickedTime ? (
                        <View
                          className="rounded-full bg-white border-solid shadow-md absolute left-0 top-0"
                          style={{ borderColor: 'green', borderWidth: 1 }}
                        >
                          <CheckCircleFill color={'green'} />
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View className="flex-row justify-between flex-grow h-full">
                    <View className="flex gap-2 flex-1">
                      <Row
                        label="SL đặt"
                        value={orderQuantity?.toString() || '--'}
                        unit={unit}
                      />
                      <Row
                        label="Đã pick"
                        value={
                          !isNil(pickedQuantity)
                            ? pickedQuantity?.toString()
                            : '--'
                        }
                        unit={unit}
                        warning={
                          Number(pickedQuantity) != Number(orderQuantity)
                        }
                      />
                      <Row
                        label="Tồn kho"
                        value={
                          !isNil(stockOnhand) ? stockOnhand?.toString() : '--'
                        }
                        unit={unit}
                      />

                      {hasSellPrice && (
                        <Row
                          label="Giá bán"
                          value={
                            formatCurrency(sellPrice, { unit: true }) || '--'
                          }
                        />
                      )}

                      {!isHiddenTag && hasTags && <TagsBadges tags={tags} />}
                    </View>
                  </View>
                </View>
              </View>
              {warningItems.length > 0 && (
                <View className="mt-3">
                  {warningItems.map((item, index) => (
                    <WarningMessage
                      key={item.key}
                      errorName={item.errorName}
                      iconVariant={item.iconVariant}
                      isLast={index === warningItems.length - 1}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
        <ImagePreviewModal
          visible={isPreviewVisible}
          imageSource={imageSource}
          onClose={() => setIsPreviewVisible(false)}
        />
      </>
    );
  },
);

// Cache styles outside component to avoid recreation
const styles = StyleSheet.create({
  edit: {
    position: 'absolute',
    top: 5,
    right: 6,
  },
  box: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  boxBody: {
    flexDirection: 'row',
  },
  activeIndicatorColumn: {
    width: 4,
    backgroundColor: '#22c55e',
    alignSelf: 'stretch',
  },
  boxContent: {
    flex: 1,
    minWidth: 0,
  },
  productImage: {
    // sized dynamically via useCardScale in component
    aspectRatio: 1,
  },
  row: { flexDirection: 'row', width: '100%', alignItems: 'center' },
  labelColumn: { flexShrink: 0, marginRight: 6 },
  rowTrailing: {
    flex: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    justifyContent: 'flex-end',
  },
  rowTrailingSingle: {
    justifyContent: 'flex-start',
  },
  valueColumn: {
    flexShrink: 0,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueColumnExpand: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginRight: 0,
  },
  valueText: { textAlign: 'left', width: '100%' },
  valueTextExpand: { textAlign: 'left', width: '100%' },
  unitColumn: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  unitText: {
    width: '100%',
    textAlign: 'left',
  },
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
