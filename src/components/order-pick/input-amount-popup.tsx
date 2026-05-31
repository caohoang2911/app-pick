import { Formik } from 'formik';
import { isEmpty, isNumber, toLower } from 'lodash';
import moment from 'moment-timezone';
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  PRODUCT_ACTIONS,
  PRODUCT_PICKED_ERROR_TYPES,
} from '@/core/constants/product';
import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { FontAwesome } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { TouchableOpacity } from 'react-native-gesture-handler';
import {
  useSetOrderItemPicked,
  type SetOrderItemPickedProduct,
} from '~/src/api/app-pick/set-order-item-picked';
import { useOrderPickProductsFlat } from '~/src/core/hooks/useOrderPickProductsFlat';
import { useConfig } from '~/src/core/store/config';
import {
  setActionProduct,
  setCurrentId,
  setIsVisibleReplaceProduct,
  setLastScannedId,
  setOrderPickProduct,
  setQuantityFromBarcode,
  setReplacePickedProductId,
  setScanMoreProduct,
  setWeightRangeQuantityFromScan,
  toggleScanQrCodeProduct,
  toggleShowAmountInput,
  useOrderPick,
} from '~/src/core/store/order-pick';
import {
  formatDecimal,
  roundToDecimalDecrease,
  roundToDecimalIncrease,
} from '~/src/core/utils/number';
import { barcodeCondition } from '~/src/core/utils/order-bag';
import {
  mergePickedProductIntoOrderDetailData,
  type OrderDetailQueryData,
} from '~/src/core/utils/order-detail-query-cache';
import { Product } from '~/src/types/product';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';
import SDropdown from '../SDropdown';
import SImage from '../SImage';
import ProductPickingGuidelines from './product-picking-guidelines';
import { UnitText } from './unit-text';

const BOTTOM_SHEET_TOP_HEADER_HEIGHT = 228;
const BOTTOM_SHEET_HEADER_BORDER = 16;
const BOTTOM_SHEET_PRODUCT_NAME = 24;
const BOTTOM_SHEET_BADGE_ROW = 28;
const BOTTOM_SHEET_PACK_WARNING = 20;
const BOTTOM_SHEET_GUIDELINES_MARGIN = 16;
const BOTTOM_SHEET_GUIDELINES_HEADER_HEIGHT = 28;
const BOTTOM_SHEET_GUIDELINES_LINE_HEIGHT = 24;
const BOTTOM_SHEET_FORM_PADDING_TOP = 16;
const BOTTOM_SHEET_FORM_PADDING_BOTTOM = 32;
const BOTTOM_SHEET_QUANTITY_SECTION = 76;
const BOTTOM_SHEET_WEIGHT_RANGE_SECTION = 28;
const BOTTOM_SHEET_BOX_SECTION = 96;
const BOTTOM_SHEET_SECTION_GAP = 16;
const BOTTOM_SHEET_REASON_SECTION = 72;
const BOTTOM_SHEET_CONFIRM_BUTTON = 48;

function computeInputAmountBottomSheetHeight({
  windowHeight,
  safeAreaTop,
  guidelinesCount = 0,
  isUnitBox = false,
  isWeightRange = false,
  hasConversionBadge = false,
  hasPackWarning = false,
}: {
  windowHeight: number;
  safeAreaTop: number;
  guidelinesCount?: number;
  isUnitBox?: boolean;
  isWeightRange?: boolean;
  hasConversionBadge?: boolean;
  hasPackWarning?: boolean;
}) {
  const headerHeight =
    BOTTOM_SHEET_TOP_HEADER_HEIGHT +
    BOTTOM_SHEET_PRODUCT_NAME +
    BOTTOM_SHEET_BADGE_ROW +
    (hasConversionBadge ? BOTTOM_SHEET_BADGE_ROW : 0) +
    (hasPackWarning ? BOTTOM_SHEET_PACK_WARNING : 0) +
    BOTTOM_SHEET_HEADER_BORDER;

  const guidelinesHeight = guidelinesCount
    ? BOTTOM_SHEET_GUIDELINES_MARGIN +
      BOTTOM_SHEET_GUIDELINES_HEADER_HEIGHT +
      guidelinesCount * BOTTOM_SHEET_GUIDELINES_LINE_HEIGHT +
      8
    : 0;

  const formHeight =
    BOTTOM_SHEET_FORM_PADDING_TOP +
    BOTTOM_SHEET_QUANTITY_SECTION +
    (isWeightRange
      ? BOTTOM_SHEET_SECTION_GAP + BOTTOM_SHEET_WEIGHT_RANGE_SECTION
      : 0) +
    (isUnitBox ? BOTTOM_SHEET_SECTION_GAP + BOTTOM_SHEET_BOX_SECTION : 0) +
    BOTTOM_SHEET_SECTION_GAP +
    BOTTOM_SHEET_REASON_SECTION +
    BOTTOM_SHEET_SECTION_GAP +
    BOTTOM_SHEET_CONFIRM_BUTTON +
    BOTTOM_SHEET_FORM_PADDING_BOTTOM;

  const estimatedHeight = headerHeight + guidelinesHeight + formHeight;
  const maxHeight = windowHeight - safeAreaTop - 8;

  return Math.min(estimatedHeight, maxHeight);
}

// QuantityControls Component
const DecrementButton = memo(
  ({ onPress, disabled }: { onPress: () => void; disabled: boolean }) => (
    <TouchableOpacity
      disabled={disabled}
      className="overflow-hidden"
      onPress={onPress}
      style={{ marginLeft: -9 }}
    >
      <View
        className="rounded-md bg-gray-200"
        style={{ width: 38, height: 38 }}
      >
        <View className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2">
          <Text className="text-2xl w-full h-full text-center text-blue-500">
            -
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ),
);

const IncrementButton = memo(
  ({ onPress, disabled }: { onPress: () => void; disabled: boolean }) => (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={{ marginRight: -9 }}
    >
      <View
        className=" rounded-md bg-gray-200"
        style={{ width: 38, height: 38 }}
      >
        <View className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2">
          <Text className="text-2xl w-full h-full text-center text-blue-500">
            +
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ),
);

// ScanButton Component
const ScanButton = memo(
  ({ onPress, disabled }: { onPress: () => void; disabled: boolean }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`rounded-lg ${disabled ? 'opacity-50' : ''}`}
    >
      <View
        className={`bg-colorPrimary rounded-lg px-4 h-11 flex flex-row gap-1 justify-center items-center ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        <FontAwesome name="qrcode" size={14} color="white" />
        <Text className="text-white font-semibold text-sm">Pick thêm</Text>
      </View>
    </TouchableOpacity>
  ),
);

// QuantitySection Component
const QuantitySection = memo(
  ({
    values,
    currentProduct,
    handleBlur,
    action,
    setFieldValue,
    quantityInit,
    setQuantityFromBarcode,
    toggleScanQrCodeProduct,
    onInputFocus,
    label = 'Số lượng pick',
  }: any) => {
    const editable = useMemo(
      () => action !== PRODUCT_ACTIONS.OUT_OF_STOCK,
      [action],
    );

    const handleDecrement = useCallback(() => {
      // setQuantityFromBarcode(0);
      const valueChange = roundToDecimalDecrease(
        Number(values?.pickedQuantity || 0),
      );
      if (Number(valueChange) < 0) {
        setFieldValue('pickedQuantity', 0);
        return;
      }
      setFieldValue('pickedQuantity', Number(valueChange));
      if (Number(values?.pickedQuantity) >= Number(quantityInit) && !action) {
        setFieldValue('pickedErrorType', null);
      }
    }, [values?.pickedQuantity, quantityInit, setFieldValue, editable, action]);

    const handleIncrement = useCallback(() => {
      if (!editable) return;
      // setQuantityFromBarcode(0);
      const valueChange = roundToDecimalIncrease(
        Number(values?.pickedQuantity || 0),
      );
      if (Number(valueChange) < 0) {
        setFieldValue('pickedQuantity', 0);
        return;
      }
      setFieldValue('pickedQuantity', Number(valueChange));
      if (Number(values?.pickedQuantity) >= Number(quantityInit) && !action) {
        setFieldValue('pickedErrorType', null);
      }
    }, [values?.pickedQuantity, quantityInit, setFieldValue, editable, action]);

    const handleQRScan = useCallback(() => {
      toggleScanQrCodeProduct(true);
      setQuantityFromBarcode(
        Math.floor(Number(values?.pickedQuantity || 0) * 1000) / 1000,
      );
      setScanMoreProduct(true);
    }, [
      values?.pickedQuantity,
      toggleScanQrCodeProduct,
      setQuantityFromBarcode,
      setScanMoreProduct,
    ]);

    useEffect(() => {
      return () => {
        setScanMoreProduct(false);
      };
    }, [setScanMoreProduct]);

    const handleChangeText = useCallback(
      (value: string) => {
        setQuantityFromBarcode(0);
        setFieldValue('pickedQuantity', formatDecimal(value));
        if (Number(value) >= Number(quantityInit)) {
          setFieldValue('pickedErrorType', null);
        }
      },
      [quantityInit, setFieldValue],
    );

    const errorMessage = useMemo(() => {
      return Number(values?.pickedQuantity) < Number(quantityInit) &&
        !values?.pickedErrorType
        ? 'SL pick nhỏ hơn SL đặt. Vui lòng chọn lý do'
        : undefined;
    }, [values?.pickedQuantity, values?.pickedErrorType, quantityInit]);

    return (
      <View className="flex gap-2 flex-1" style={{ position: 'relative' }}>
        <Text className="text-base font-medium text-gray-700">
          {label}

          {currentProduct?.unit ? (
            <Text className="text-orange-500 font-semibold">
              {' '}
              <UnitText unit={currentProduct.unit}  />
              
            </Text>
          ) : null}
        </Text>

        <View className="flex-row items-center gap-3">
          <Input
            className="flex-1"
            selectTextOnFocus
            placeholder="Nhập số lượng"
            inputClasses="text-center"
            keyboardType="decimal-pad"
            onChangeText={handleChangeText}
            editable={editable}
            useBottomSheetTextInput
            name="pickedQuantity"
            value={values?.pickedQuantity?.toString()}
            onBlur={handleBlur('pickedQuantity')}
            onFocus={() => onInputFocus?.('pickedQuantity')}
            defaultValue="0"
            prefix={
              <DecrementButton onPress={handleDecrement} disabled={false} />
            }
            suffix={
              <IncrementButton onPress={handleIncrement} disabled={false} />
            }
          />
          <ScanButton onPress={handleQRScan} disabled={!editable} />
        </View>

        {errorMessage && <Text className="text-red-500">{errorMessage}</Text>}
      </View>
    );
  },
);

// ReasonDropdown Component
const ReasonDropdown = memo(
  ({
    productPickedErrorTypes,
    values,
    setFieldValue,
    quantityInit,
    setErrors,
    action,
    currentProduct,
  }: any) => {
    const isQuantityEnough =
      Number(values?.pickedQuantity) >= Number(quantityInit);
    const hasQuickAction = Object.values(PRODUCT_ACTIONS).includes(action);
    const isDisabled = isQuantityEnough || hasQuickAction;
    const { unit } = currentProduct || {};

    useEffect(() => {
      if (isQuantityEnough && !hasQuickAction && values?.pickedErrorType) {
        setFieldValue('pickedErrorType', '');
      }
    }, [isQuantityEnough, hasQuickAction, values?.pickedErrorType, setFieldValue]);

    const handleSelect = useCallback(
      (value: string) => {
        setFieldValue('pickedErrorType', value);
        setErrors({});
      },
      [setFieldValue, setErrors],
    );

    const handleClear = useCallback(() => {
      if (isDisabled) return;
      setFieldValue('pickedErrorType', '');
    }, [setFieldValue, isDisabled]);

    const productPickedErrorsWithUnit = useMemo(() => {
      // return productPickedErrorTypes.map((item: any) => item.id !== 'INCORRECT_ORDERED_WEIGHT');
      return productPickedErrorTypes
        .map((item: any) =>
          item.id === 'INCORRECT_ORDERED_WEIGHT'
            ? { ...item, disabled: toLower(unit) !== 'kg' }
            : item,
        )
        ?.reverse();
    }, [productPickedErrorTypes, unit]);

    const dropdownModalHeight = useMemo(() => {
      const screenHeight = Dimensions.get('window').height;
      const maxHeight = Math.floor(screenHeight * 0.75);
      const itemCount = productPickedErrorsWithUnit?.length || 0;
      const estimatedItemHeight = 52;
      const baseHeight = 170; // title, search/input, paddings
      const calculatedHeight = baseHeight + itemCount * estimatedItemHeight;
      return Math.min(maxHeight, calculatedHeight);
    }, [productPickedErrorsWithUnit]);

    return (
      <SDropdown
        data={productPickedErrorsWithUnit}
        label="Chọn lý do"
        modalProps={{
          height: dropdownModalHeight,
        }}
        labelClasses="font-medium"
        mode="modal"
        dropdownPosition="top"
        placeholder="Vui lòng chọn"
        allowClear={true}
        disabled={isDisabled}
        value={values?.pickedErrorType}
        onSelect={handleSelect}
        onClear={handleClear}
      />
    );
  },
);

// Pack input
const BoxInput = memo(
  ({ values, setFieldValue, handleBlur, onInputFocus }: any) => {
    const handleChangeText = useCallback(
      (name: string, value: string) => {
        setFieldValue(name, parseInt(value || '0'));
      },
      [setFieldValue],
    );

    const handleDecrement = useCallback(
      (name: string) => {
        const valueChange = roundToDecimalDecrease(Number(values?.[name] || 0));
        if (Number(valueChange) < 0) {
          setFieldValue(name, 0);
          return;
        }

        setFieldValue(name, Number(valueChange));
      },
      [setFieldValue, values],
    );

    const handleIncrement = useCallback(
      (name: string) => {
        const valueChange = roundToDecimalIncrease(Number(values?.[name] || 0));
        if (Number(valueChange) < 0) {
          setFieldValue(name, 0);
          return;
        }

        setFieldValue(name, Number(valueChange));
      },
      [setFieldValue, values],
    );

    return (
      <View className="flex-1 flex-row gap-2">
        <View className="flex-1">
          <Input
            label={
              <Text className="font-medium text-gray-500" numberOfLines={1}>
                Thùng nguyên kiện
              </Text>
            }
            placeholder="Nhập số lượng"
            value={values?.fullBoxQuantity?.toString()}
            onChangeText={(value: string) =>
              handleChangeText('fullBoxQuantity', value)
            }
            keyboardType="decimal-pad"
            inputClasses="text-center"
            useBottomSheetTextInput
            name="fullBoxQuantity"
            onBlur={handleBlur('fullBoxQuantity')}
            onFocus={() => onInputFocus?.('fullBoxQuantity')}
            defaultValue="0"
            prefix={
              <DecrementButton
                onPress={() => handleDecrement('fullBoxQuantity')}
                disabled={false}
              />
            }
            suffix={
              <IncrementButton
                onPress={() => handleIncrement('fullBoxQuantity')}
                disabled={false}
              />
            }
          />
        </View>
        <View className="flex-1">
          <Input
            label={
              <Text className="font-medium text-gray-500" numberOfLines={1}>
                Thùng gom lẻ
              </Text>
            }
            placeholder="Nhập số lượng"
            value={values?.openedBoxQuantity?.toString()}
            onChangeText={(value: string) =>
              handleChangeText('openedBoxQuantity', value)
            }
            keyboardType="decimal-pad"
            inputClasses="text-center"
            useBottomSheetTextInput
            name="openedBoxQuantity"
            onBlur={handleBlur('openedBoxQuantity')}
            onFocus={() => onInputFocus?.('openedBoxQuantity')}
            defaultValue="0"
            suffix={
              <IncrementButton
                onPress={() => handleIncrement('openedBoxQuantity')}
                disabled={false}
              />
            }
            prefix={
              <DecrementButton
                onPress={() => handleDecrement('openedBoxQuantity')}
                disabled={false}
              />
            }
          />
        </View>
      </View>
    );
  },
);

// WeightRangeQuantitySection Component
const WeightRangeQuantitySection = memo(
  ({
    values,
    setFieldValue,
    handleBlur,
    onInputFocus,
    orderQuantityConversion,
    action,
  }: any) => {
    const editable = useMemo(
      () => action !== PRODUCT_ACTIONS.OUT_OF_STOCK,
      [action],
    );

    const unitLabel = orderQuantityConversion?.unit ?? '';

    const handleDecrement = useCallback(() => {
      const current = Number(values?.weightRangeQuantity || 0);
      if (current <= 0) return;
      setFieldValue('weightRangeQuantity', current - 1);
    }, [values?.weightRangeQuantity, setFieldValue]);

    const handleIncrement = useCallback(() => {
      if (!editable) return;
      const current = Number(values?.weightRangeQuantity || 0);
      setFieldValue('weightRangeQuantity', current + 1);
    }, [values?.weightRangeQuantity, setFieldValue, editable]);

    return (
      <View className="flex gap-2 flex-1">
        <Text className="text-base font-medium text-gray-700">
          {'Số lượng pick '}
          <Text className="text-orange-500 font-semibold">
            <UnitText unit={unitLabel} />
          </Text>
        </Text>
        <View className="flex-row items-center gap-3">
          <Input
            className="flex-1"
            selectTextOnFocus
            placeholder="Nhập số lượng"
            inputClasses="text-center"
            keyboardType="number-pad"
            onChangeText={(value: string) =>
              setFieldValue('weightRangeQuantity', parseInt(value || '0'))
            }
            editable={editable}
            useBottomSheetTextInput
            name="weightRangeQuantity"
            value={values?.weightRangeQuantity?.toString()}
            onBlur={handleBlur('weightRangeQuantity')}
            onFocus={() => onInputFocus?.('weightRangeQuantity')}
            defaultValue="0"
            prefix={
              <DecrementButton onPress={handleDecrement} disabled={false} />
            }
            suffix={
              <IncrementButton onPress={handleIncrement} disabled={false} />
            }
          />
        </View>
      </View>
    );
  },
);

// FormContent Component
const FormContent = memo(
  ({
    values,
    handleBlur,
    setFieldValue,
    handleSubmit,
    setErrors,
    currentProduct,
    quantity,
    productPickedErrorTypes,
    isError,
    action,
    quantityInit,
    quantityFromBarcode,
    weightRangeQuantityFromScan,
    shoudShowBoxInput,
    shouldShowWeightRangeInput,
    isLoading,
    onInputFocus,
  }: any) => {
    const safeWeightRangeScanCount =
      Number(weightRangeQuantityFromScan) || 0;
    const prevWeightRangeScanCountRef = useRef(safeWeightRangeScanCount);
    const weightRangeQuantityRef = useRef(values?.weightRangeQuantity);
    weightRangeQuantityRef.current = values?.weightRangeQuantity;

    useEffect(() => {
      setFieldValue('pickedQuantity', quantityFromBarcode || quantity);
      setFieldValue(
        'fullBoxQuantity',
        (currentProduct as Product)?.pickedExtraQuantities?.fullBoxQuantity ||
          0,
      );
      setFieldValue(
        'openedBoxQuantity',
        (currentProduct as Product)?.pickedExtraQuantities?.openedBoxQuantity ||
          0,
      );
    }, [currentProduct?.id, quantityFromBarcode, quantity, setFieldValue]);

    useEffect(() => {
      setFieldValue(
        'weightRangeQuantity',
        (currentProduct as Product)?.pickedExtraQuantities
          ?.weightRangeQuantity || 0,
      );
      prevWeightRangeScanCountRef.current = 0;
    }, [currentProduct?.id, setFieldValue]);

    useEffect(() => {
      if (!shouldShowWeightRangeInput) return;

      const prevScanCount = prevWeightRangeScanCountRef.current;
      if (safeWeightRangeScanCount <= prevScanCount) return;

      const delta = safeWeightRangeScanCount - prevScanCount;
      setFieldValue(
        'weightRangeQuantity',
        Number(weightRangeQuantityRef.current || 0) + delta,
      );
      prevWeightRangeScanCountRef.current = safeWeightRangeScanCount;
    }, [safeWeightRangeScanCount, shouldShowWeightRangeInput, setFieldValue]);

    return (
      <View className="px-4 mt-4 pb-8 gap-4">
        <QuantitySection
          values={values}
          quantity={quantity}
          quantityInit={quantityInit}
          currentProduct={currentProduct}
          action={action}
          handleBlur={handleBlur}
          setFieldValue={setFieldValue}
          setQuantityFromBarcode={setQuantityFromBarcode}
          toggleScanQrCodeProduct={toggleScanQrCodeProduct}
          onInputFocus={onInputFocus}
        />
        {shouldShowWeightRangeInput && (
          <WeightRangeQuantitySection
            values={values}
            setFieldValue={setFieldValue}
            handleBlur={handleBlur}
            onInputFocus={onInputFocus}
            orderQuantityConversion={
              (currentProduct as Product)?.orderQuantityConversion
            }
            action={action}
          />
        )}
        {shoudShowBoxInput && (
          <BoxInput
            values={values}
            setFieldValue={setFieldValue}
            handleBlur={handleBlur}
            onInputFocus={onInputFocus}
          />
        )}
        <ReasonDropdown
          productPickedErrorTypes={productPickedErrorTypes}
          values={values}
          action={action}
          quantityInit={quantityInit}
          setFieldValue={setFieldValue}
          setErrors={setErrors}
          currentProduct={currentProduct}
          quantityFromBarcode={quantityFromBarcode}
        />
        <View>
          <Button
            onPress={handleSubmit}
            label={'Xác nhận'}
            disabled={isError}
            loading={isLoading}
          />
        </View>
      </View>
    );
  },
);

// Main Component
const InputAmountPopup = () => {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const barcodeScanSuccess = useOrderPick.use.barcodeScanSuccess();
  const isShowAmountInput = useOrderPick.use.isShowAmountInput();
  const isPickedByManualBarcodeInput =
    useOrderPick.use.isPickedByManualBarcodeInput();
  const quantityFromBarcode = useOrderPick.use.quantityFromBarcode();
  const { code } = useLocalSearchParams<{ code: string }>();
  const queryClient = useQueryClient();
  const action = useOrderPick.use.action();

  const {
    mutate: setOrderTemToPicked,
    isPending: isSetOrderTemToPickedPending,
  } = useSetOrderItemPicked(
    (variables) => {
      reset();

      const picked = variables.pickedItem;
      if (code && picked) {
        queryClient.setQueryData<OrderDetailQueryData>(
          ['orderDetail', code],
          (old) => mergePickedProductIntoOrderDetailData(old, picked),
        );
      }

      if (picked) {
        setOrderPickProduct(picked);
        setLastScannedId(picked.id ?? null);
        setReplacePickedProductId(picked.id);
        if (!picked.pickedQuantity && picked.tags?.includes('REPLACEABLE')) {
          showAlert({
            title: 'Thông báo',
            message: 'Sản phẩm hết hàng, vui lòng chọn sản phẩm thay thế?',
            isHideCancelButton: true,
            onConfirm: () => {
              hideAlert();
              setIsVisibleReplaceProduct(true);
            },
          });
        }
      }
    },
    () => {
      // setQuantityFromBarcode(0);
    },
  );
  const config = useConfig.use.config();
  const productPickedErrorTypes = useMemo(
    () => config?.productPickedErrorTypes || [],
    [config],
  );

  const inputBottomSheetRef = useRef<any>(null);

  const isEditManual = useOrderPick.use.isEditManual();
  const currentId = useOrderPick.use.currentId();

  const orderPickProductsFlat = useOrderPickProductsFlat();

  // Find current product - memoized to avoid recalculation on every render
  const currentProduct = useMemo(() => {
    let product = orderPickProductsFlat.find((product: Product) =>
      isEditManual
        ? product.id === currentId
        : (barcodeCondition(barcodeScanSuccess, product.refBarcodes) ||
            product.id === currentId) &&
          !product.pickedTime,
    );

    if (isEmpty(product)) {
      product = orderPickProductsFlat.find(
        (product: Product) =>
          barcodeCondition(barcodeScanSuccess, product.refBarcodes) ||
          product.id === currentId,
      );
    }

    return product;
  }, [orderPickProductsFlat, isEditManual, currentId, barcodeScanSuccess]);

  // Extract product properties once
  const { pickedQuantity, quantity, orderQuantity } = currentProduct || {
    pickedQuantity: 0,
    quantity: 0,
    orderQuantity: 0,
  };
  const displayPickedQuantity = useMemo(() => {
    if (
      isNumber(quantityFromBarcode) &&
      action === PRODUCT_ACTIONS.OUT_OF_STOCK
    ) {
      return 0;
    }
    return quantityFromBarcode || pickedQuantity || 0;
  }, [quantityFromBarcode, pickedQuantity, action]);
  const productName = currentProduct?.name || '';

  const packOrBoxUnitWarning = useMemo(() => {
    const unitName = currentProduct?.unit?.trim();
    if (!unitName) return null;
    const lowerUnit = unitName.toLowerCase();
    if (lowerUnit.startsWith('pack') || lowerUnit.startsWith('thùng')) {
      return (
        <Text className="font-bold text-orange-500 text-sm mt-1">
          SP bán theo <UnitText unit={unitName} className="font-bold" />, vui
          lòng pick đúng quy cách
        </Text>
      );
    }
    return null;
  }, [currentProduct?.unit]);

  // Memoize title component
  const renderTitle = useMemo(
    () => (
      <Pressable
        className="flex justify-between gap-1"
        onPress={Keyboard.dismiss}
      >
        <View className="flex flex-row items-center gap-1">
          {currentProduct?.tags?.includes('GIFT') && (
            <View className="mb-0.5">
              <Text>🎁 </Text>
            </View>
          )}
          <Text className="font-semibold">{productName}</Text>
        </View>
        <View className="flex flex-row items-center gap-1">
          <Badge
            className="self-start"
            label={
              <>
                {`SL đặt: ${currentProduct?.orderQuantity} `}
                <UnitText unit={currentProduct?.unit || ''} />
              </>
            }
          />
          {currentProduct?.barcode && (
            <Badge
              className="self-start"
              label={currentProduct.barcode}
              variant="pink"
            />
          )}
          {!!currentProduct?.orderQuantityConversion && (
            <Badge
              className="self-start"
              label={
                <>
                  {`${currentProduct.orderQuantityConversion.quantity} x `}
                  <UnitText
                    unit={currentProduct.orderQuantityConversion.unit}
                  />
                </>
              }
              variant="purple"
            />
          )}
              
        </View>
        {packOrBoxUnitWarning}
        {!!currentProduct?.productPickingGuidelines && (
          <View className="flex flex-row items-center gap-1 w-full mt-4">
            <ProductPickingGuidelines
              guidelines={currentProduct?.productPickingGuidelines}
            />
          </View>
        )}
      </Pressable>
    ),
    [
      productName,
      currentProduct?.orderQuantity,
      currentProduct?.unit,
      currentProduct?.tags,
      currentProduct?.barcode,
      currentProduct?.orderQuantityConversion,
      currentProduct?.productPickingGuidelines,
      packOrBoxUnitWarning,
    ],
  );

  const renderTopHeader = useMemo(
    () => (
      <Pressable
        className="mb-2 relative pt-10"
        onPress={() => {
          Keyboard.dismiss();
        }}
      >
        <View className="flex-row items-center justify-center">
          <SImage
            source={currentProduct?.image}
            style={{ width: 180, height: 180, borderRadius: 8 }}
          />
        </View>
      </Pressable>
    ),
    [currentProduct?.image],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setQuantityFromBarcode(0);
    };
  }, []);

  // Handle BottomSheet visibility
  useEffect(() => {
    if (isShowAmountInput) {
      inputBottomSheetRef.current?.present();
    }
  }, [isShowAmountInput]);

  const isUnitBox = currentProduct?.unit?.toLowerCase()?.startsWith('thùng');
  const isWeightRange = currentProduct?.tags?.includes('WEIGHT_RANGE') ?? false;
  const weightRangeQuantityFromScan =
    Number(useOrderPick.use.weightRangeQuantityFromScan()) || 0;
  const hasPackWarning = useMemo(() => {
    const unitName = currentProduct?.unit?.trim()?.toLowerCase();
    return !!unitName && (unitName.startsWith('pack') || unitName.startsWith('thùng'));
  }, [currentProduct?.unit]);
  const hasConversionBadge = !!currentProduct?.orderQuantityConversion;

  const bottomSheetHeight = useMemo(
    () =>
      computeInputAmountBottomSheetHeight({
        windowHeight,
        safeAreaTop: insets.top,
        guidelinesCount: currentProduct?.productPickingGuidelines?.length ?? 0,
        isUnitBox,
        isWeightRange,
        hasConversionBadge,
        hasPackWarning,
      }),
    [
      windowHeight,
      insets.top,
      currentProduct?.productPickingGuidelines,
      isUnitBox,
      isWeightRange,
      hasConversionBadge,
      hasPackWarning,
    ],
  );

  // Memoized callbacks
  const reset = useCallback(() => {
    toggleShowAmountInput(false);
    setCurrentId(null);
    setQuantityFromBarcode(0);
    setWeightRangeQuantityFromScan(0);
    setActionProduct(null);
  }, [
    toggleShowAmountInput,
    setCurrentId,
    setQuantityFromBarcode,
    setWeightRangeQuantityFromScan,
    setActionProduct,
  ]);

  const handleInputFocus = useCallback(
    (field?: 'pickedQuantity' | 'fullBoxQuantity' | 'openedBoxQuantity') => {
      requestAnimationFrame(() => {
        if (field === 'pickedQuantity') {
          inputBottomSheetRef.current?.scrollTo?.({ y: 0, animated: true });
          return;
        }

        if (field === 'fullBoxQuantity') {
          inputBottomSheetRef.current?.scrollTo?.({ y: 90, animated: true });
          return;
        }

        if (field === 'openedBoxQuantity') {
          inputBottomSheetRef.current?.scrollTo?.({ y: 90, animated: true });
          return;
        }
      });
    },
    [],
  );

  const onSubmit = useCallback(
    (values: any) => {
      if (!productName) return;

      const pickedQty = Number(values?.pickedQuantity || 0);
      const orderQty = Number(orderQuantity || 0);
      const pickedItem = {
        ...currentProduct,
        barcode: barcodeScanSuccess,
        isPickedByManualBarcodeInput,
        pickedQuantity: pickedQty,
        pickedErrorType:
          pickedQty >= orderQty ? '' : values?.pickedErrorType,
        pickedNote: values?.pickedNote,
        pickedTime: moment().valueOf(),
        isAllowEditPickQuantity: true,
        ...((isUnitBox || isWeightRange) && {
          pickedExtraQuantities: {
            ...(isUnitBox && {
              fullBoxQuantity: values?.fullBoxQuantity || 0,
              openedBoxQuantity: values?.openedBoxQuantity || 0,
            }),
            ...(isWeightRange && {
              weightRangeQuantity: values?.weightRangeQuantity || 0,
            }),
          },
        }),
      } as SetOrderItemPickedProduct;

      Keyboard.dismiss();

      setOrderTemToPicked({ pickedItem, orderCode: code });
    },
    [
      productName,
      currentProduct,
      barcodeScanSuccess,
      isPickedByManualBarcodeInput,
      orderQuantity,
      code,
      isUnitBox,
      isWeightRange,
      setOrderTemToPicked,
      reset,
    ],
  );

  // Memoize initial values
  const initialValues = useMemo(
    () => ({
      pickedQuantity: displayPickedQuantity,
      pickedErrorType: (currentProduct as Product)?.pickedErrorType || '',
      pickedNote: (currentProduct as Product)?.pickedNote || '',
      ...(isUnitBox && {
        fullBoxQuantity:
          (currentProduct as Product)?.pickedExtraQuantities?.fullBoxQuantity ||
          0,
        openedBoxQuantity:
          (currentProduct as Product)?.pickedExtraQuantities
            ?.openedBoxQuantity || 0,
      }),
      ...(isWeightRange && {
        weightRangeQuantity:
          (currentProduct as Product)?.pickedExtraQuantities
            ?.weightRangeQuantity || 0,
      }),
    }),
    [currentProduct?.id, isUnitBox, isWeightRange],
  );

  return (
    <Formik
      initialValues={initialValues}
      validateOnChange
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {({ values, handleBlur, setFieldValue, handleSubmit, setErrors }) => {
        const isError =
          Number(values?.pickedQuantity) < Number(orderQuantity) &&
          !values?.pickedErrorType;

        useEffect(() => {
          if (action === PRODUCT_ACTIONS.OUT_OF_STOCK) {
            setFieldValue('pickedQuantity', 0);
            setFieldValue(
              'pickedErrorType',
              PRODUCT_PICKED_ERROR_TYPES.OUT_OF_STOCK,
            );
          } else if (action === PRODUCT_ACTIONS.LOW_QUALITY) {
            setFieldValue(
              'pickedErrorType',
              PRODUCT_PICKED_ERROR_TYPES.QUALITY_DECLINE,
            );
          } else if (action === PRODUCT_ACTIONS.NEAR_EXPIRY) {
            setFieldValue(
              'pickedErrorType',
              PRODUCT_PICKED_ERROR_TYPES.NEAR_EXPIRY_DATE_NOT_YET_DISCOUNT_STAMPED,
            );
          } else if (action === PRODUCT_ACTIONS.EXPIRED_ONLINE) {
            setFieldValue(
              'pickedErrorType',
              PRODUCT_PICKED_ERROR_TYPES.EXPIRED_ONLINE_SALE_DATE_NOT_YET_DISCOUNT_DATE,
            );
          } else if (action === PRODUCT_ACTIONS.INCORRECT_STOCK) {
            setFieldValue(
              'pickedErrorType',
              PRODUCT_PICKED_ERROR_TYPES.INCORRECT_STOCK,
            );
          } else if (action === PRODUCT_ACTIONS.IN_CART_OFFLINE_CUSTOMER) {
            setFieldValue(
              'pickedErrorType',
              PRODUCT_PICKED_ERROR_TYPES.IN_CART_OFFLINE_CUSTOMER,
            );
          } else {
            setFieldValue('pickedQuantity', displayPickedQuantity.toString());
          }
        }, [action, setFieldValue, isShowAmountInput, displayPickedQuantity]);

        return (
          <SBottomSheet
            topHeader={renderTopHeader}
            renderTitle={renderTitle}
            ref={inputBottomSheetRef}
            snapPoints={[bottomSheetHeight]}
            onClose={reset}
            visible={isShowAmountInput}
          >
            <FormContent
              isLoading={isSetOrderTemToPickedPending}
              values={values}
              handleBlur={handleBlur}
              setFieldValue={setFieldValue}
              handleSubmit={handleSubmit}
              setErrors={setErrors}
              currentProduct={currentProduct}
              quantityInit={currentProduct?.orderQuantity}
              quantity={displayPickedQuantity}
              action={action}
              productPickedErrorTypes={productPickedErrorTypes}
              isError={isError}
              quantityFromBarcode={quantityFromBarcode}
              weightRangeQuantityFromScan={weightRangeQuantityFromScan}
              shoudShowBoxInput={isUnitBox}
              shouldShowWeightRangeInput={isWeightRange}
              onInputFocus={handleInputFocus}
            />
          </SBottomSheet>
        );
      }}
    </Formik>
  );
};

export default memo(InputAmountPopup);
