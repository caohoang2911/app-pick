import { Formik } from 'formik';
import { isEmpty, isNumber, toLower } from 'lodash';
import moment from 'moment-timezone';
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  isCaseOrPackUnit,
  isIncompleteCaseOrPackPickReason,
  isPickedErrorTypeRequiringImage,
  PRODUCT_ACTIONS,
  PRODUCT_PICKED_ERROR_TYPES,
  REQUIRE_PICKED_IMAGE_FOR_ERROR_TYPES,
  type ProductAction,
} from '@/core/constants/product';
import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { TouchableOpacity } from 'react-native-gesture-handler';
import {
  useSetOrderItemPicked,
  type SetOrderItemPickedProduct,
} from '~/src/api/app-pick/use-set-order-item-picked';
import ImageUploader from '~/src/components/ImageUploader';
import { useOrderPickProductsFlat } from '~/src/core/hooks/useOrderPickProductsFlat';
import { useConfig } from '~/src/core/store/config';
import {
  setActionProduct,
  setCurrentId,
  setInitOrderPickProducts,
  setIsVisibleReplaceProduct,
  setLastScannedId,
  setOrderPickProduct,
  setQuantityFromBarcode,
  setReplacePickedProductId,
  clearWeightRangePendingScanKGs,
  drainWeightRangePendingScanKGs,
  getWeightRangeDraft,
  setWeightRangeDraft,
  setScanMoreProduct,
  toggleScanQrCodeProduct,
  toggleShowAmountInput,
  useOrderPick,
} from '~/src/core/store/order-pick';
import {
  formatDecimal,
  roundToDecimalDecrease,
  roundToDecimalIncrease,
} from '~/src/core/utils/number';
import { barcodeCondition } from '~/src/core/utils/order-bags';
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
import PickMoreScanButton from './pick-more-scan-button';
import WeightRangeLineItems, {
  getWeightRangeOrderQuantity,
  isWeightRangeProduct,
  normalizeWeightRangeItemKGs,
  parseWeightRangeItemKGs,
  sumWeightRangeItemKGs,
  WEIGHT_RANGE_LIST_MAX_HEIGHT,
} from './weight-range-line-items';

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
const BOTTOM_SHEET_WEIGHT_RANGE_SECTION = WEIGHT_RANGE_LIST_MAX_HEIGHT; // 4 item + pick thêm
const BOTTOM_SHEET_BOX_SECTION = 96;
const BOTTOM_SHEET_SECTION_GAP = 16;
const BOTTOM_SHEET_REASON_SECTION = 72;
const BOTTOM_SHEET_IMAGE_SECTION = 120;
const BOTTOM_SHEET_CONFIRM_BUTTON = 48;

const QUICK_ACTION_TO_ERROR_TYPE: Partial<
  Record<
    ProductAction,
    (typeof PRODUCT_PICKED_ERROR_TYPES)[keyof typeof PRODUCT_PICKED_ERROR_TYPES]
  >
> = {
  [PRODUCT_ACTIONS.LOW_QUALITY]: PRODUCT_PICKED_ERROR_TYPES.QUALITY_DECLINE,
  [PRODUCT_ACTIONS.NEAR_EXPIRY]:
    PRODUCT_PICKED_ERROR_TYPES.NEAR_EXPIRY_DATE_NOT_YET_DISCOUNT_STAMPED,
  [PRODUCT_ACTIONS.EXPIRED_ONLINE]:
    PRODUCT_PICKED_ERROR_TYPES.EXPIRED_ONLINE_SALE_DATE_NOT_YET_DISCOUNT_DATE,
  [PRODUCT_ACTIONS.INCORRECT_STOCK]: PRODUCT_PICKED_ERROR_TYPES.INCORRECT_STOCK,
  [PRODUCT_ACTIONS.IN_CART_OFFLINE_CUSTOMER]:
    PRODUCT_PICKED_ERROR_TYPES.IN_CART_OFFLINE_CUSTOMER,
};

function computeInputAmountBottomSheetHeight({
  windowHeight,
  safeAreaTop,
  guidelinesCount = 0,
  isUnitBox = false,
  isWeightRange = false,
  hasConversionBadge = false,
  hasPackWarning = false,
  hasImageSection = false,
}: {
  windowHeight: number;
  safeAreaTop: number;
  guidelinesCount?: number;
  isUnitBox?: boolean;
  isWeightRange?: boolean;
  hasConversionBadge?: boolean;
  hasPackWarning?: boolean;
  hasImageSection?: boolean;
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
    // WeightRange dùng list thay cho QuantitySection thông thường
    (isWeightRange ? 0 : BOTTOM_SHEET_QUANTITY_SECTION) +
    (isWeightRange ? BOTTOM_SHEET_WEIGHT_RANGE_SECTION : 0) +
    (isUnitBox ? BOTTOM_SHEET_SECTION_GAP + BOTTOM_SHEET_BOX_SECTION : 0) +
    BOTTOM_SHEET_SECTION_GAP +
    BOTTOM_SHEET_REASON_SECTION +
    (hasImageSection
      ? BOTTOM_SHEET_SECTION_GAP + BOTTOM_SHEET_IMAGE_SECTION
      : 0) +
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
              <UnitText unit={currentProduct.unit} />
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
          <PickMoreScanButton onPress={handleQRScan} disabled={!editable} />
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
    isWeightRange = false,
  }: any) => {
    const isQuantityEnough =
      Number(values?.pickedQuantity) >= Number(quantityInit);
    const hasQuickAction = Object.values(PRODUCT_ACTIONS).includes(action);
    // WeightRange: "đủ" tính theo SỐ ITEM đã quét (length) so với SL đặt quy đổi,
    // KHÔNG theo tổng KG (pickedQuantity).
    const isWeightRangeEnough =
      isWeightRange &&
      (values?.weightRangeItemKGs?.length ?? 0) >=
        getWeightRangeOrderQuantity(currentProduct);
    // Chưa đủ → enable cho chọn lý do; đủ → disable (và auto-clear bên dưới).
    // Vẫn enable khi đang OUT_OF_STOCK để user đổi lý do được.
    const isDisabled = isWeightRange
      ? isWeightRangeEnough
      : isQuantityEnough || hasQuickAction;
    const { unit } = currentProduct || {};

    const pickedQty = Number(values?.pickedQuantity || 0);
    const hasPickedSomething = isWeightRange
      ? (values?.weightRangeItemKGs?.length ?? 0) > 0
      : pickedQty > 0;

    useEffect(() => {
      if (
        (isWeightRange || !isCaseOrPackUnit(unit)) &&
        isIncompleteCaseOrPackPickReason({ id: values?.pickedErrorType })
      ) {
        setFieldValue('pickedErrorType', '');
        setFieldValue('pickedImage', '');
        return;
      }
      // Đã pick > 0 → không được giữ lý do hết hàng
      if (
        hasPickedSomething &&
        values?.pickedErrorType === PRODUCT_PICKED_ERROR_TYPES.OUT_OF_STOCK
      ) {
        setFieldValue('pickedErrorType', '');
        setFieldValue('pickedImage', '');
        return;
      }
      if (isWeightRange) {
        if (!isWeightRangeEnough || !values?.pickedErrorType) return;
        setFieldValue('pickedErrorType', '');
        setFieldValue('pickedImage', '');
        return;
      }
      if (!isQuantityEnough || hasQuickAction || !values?.pickedErrorType) {
        return;
      }
      setFieldValue('pickedErrorType', '');
      setFieldValue('pickedImage', '');
    }, [
      isWeightRange,
      isWeightRangeEnough,
      isQuantityEnough,
      hasQuickAction,
      hasPickedSomething,
      values?.pickedErrorType,
      setFieldValue,
      unit,
    ]);

    const handleSelect = useCallback(
      (value: string) => {
        setFieldValue('pickedErrorType', value);
        if (!isPickedErrorTypeRequiringImage(value)) {
          setFieldValue('pickedImage', '');
        }
        setErrors({});
      },
      [setFieldValue, setErrors],
    );

    const handleClear = useCallback(() => {
      if (isDisabled) return;
      setFieldValue('pickedErrorType', '');
      setFieldValue('pickedImage', '');
    }, [setFieldValue, isDisabled]);

    const productPickedErrorsWithUnit = useMemo(() => {
      return productPickedErrorTypes
        .map((item: any) => {
          if (item.id === PRODUCT_PICKED_ERROR_TYPES.OUT_OF_STOCK) {
            return {
              ...item,
              // Đã pick > 0 → không cho chọn hết hàng
              disabled: hasPickedSomething,
            };
          }
          if (item.id === PRODUCT_PICKED_ERROR_TYPES.INCORRECT_ORDERED_WEIGHT) {
            return {
              ...item,
              // Weight range: quét theo KG dù unit hiển thị là Bông/Quả/Trái...
              disabled: !isWeightRange && toLower(unit) !== 'kg',
            };
          }
          if (isIncompleteCaseOrPackPickReason(item)) {
            return {
              ...item,
              // Chỉ unit Thùng/Lốc/Pack; weight range cũng không áp dụng
              disabled: isWeightRange || !isCaseOrPackUnit(unit),
            };
          }
          return item;
        })
        ?.reverse();
    }, [productPickedErrorTypes, unit, isWeightRange, hasPickedSomething]);

    const dropdownModalHeight = useMemo(() => {
      const screenHeight = Dimensions.get('window').height;
      const maxHeight = Math.floor(screenHeight * 0.75);
      const itemCount = productPickedErrorsWithUnit?.length || 0;
      const estimatedItemHeight = 48;
      const baseHeight = 49; // modal header
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

// FormContent Component
const FormContent = memo(
  ({
    values,
    handleBlur,
    setFieldValue,
    setErrors,
    currentProduct,
    quantity,
    productPickedErrorTypes,
    action,
    quantityInit,
    quantityFromBarcode,
    shoudShowBoxInput,
    shouldShowWeightRangeInput,
    onInputFocus,
    onImageUploadingChange,
  }: any) => {
    // Init số lượng + hộp thùng khi đổi sản phẩm
    useEffect(() => {
      if (shouldShowWeightRangeInput) return;
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
    }, [
      currentProduct?.id,
      quantityFromBarcode,
      quantity,
      setFieldValue,
      shouldShowWeightRangeInput,
    ]);

    return (
      <View className="px-4 mt-4 pb-4 gap-4">
        {!shouldShowWeightRangeInput && (
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
        )}
        {shouldShowWeightRangeInput && (
          <WeightRangeLineItems
            values={values}
            setFieldValue={setFieldValue}
            orderQuantityConversion={
              (currentProduct as Product)?.orderQuantityConversion
            }
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
          isWeightRange={shouldShowWeightRangeInput}
        />
        {isPickedErrorTypeRequiringImage(values?.pickedErrorType) ? (
          <ImageUploader
            key={`pick-evidence-${currentProduct?.id}-${values?.pickedErrorType}`}
            title="Thêm Hình ảnh"
            variant="dashed"
            cameraOnly
            maxImages={1}
            required
            proofDeliveryImages={
              values?.pickedImage ? [values.pickedImage] : undefined
            }
            onImagesChange={(urls) => {
              setFieldValue('pickedImage', urls[0] || '');
            }}
            onUploadingChange={onImageUploadingChange}
          />
        ) : null}
      </View>
    );
  },
);

// Main Component
const InputAmountPopup = () => {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isRefreshingOrderDetail, setIsRefreshingOrderDetail] = useState(false);
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

  const isWeightRange = isWeightRangeProduct(currentProduct);

  const handleRefreshOrderDetail = useCallback(async () => {
    if (!code || isRefreshingOrderDetail) return;
    setIsRefreshingOrderDetail(true);
    try {
      await queryClient.refetchQueries({
        queryKey: ['orderDetail', code],
        exact: true,
      });
      const cached = queryClient.getQueryData<OrderDetailQueryData>([
        'orderDetail',
        code,
      ]);
      const itemGroups = cached?.data?.delivery?.itemGroups;
      if (itemGroups) {
        setInitOrderPickProducts(
          Object.values(itemGroups).map((item: any) => item) as never[],
        );
      }
    } finally {
      setIsRefreshingOrderDetail(false);
    }
  }, [code, isRefreshingOrderDetail, queryClient]);

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
            variant={isWeightRange ? 'purple' : 'default'}
            label={
              <>
                {'SL đặt: '}
                {isWeightRange && currentProduct?.orderQuantityConversion ? (
                  <>
                    {`${getWeightRangeOrderQuantity(currentProduct)} x `}
                    <UnitText
                      unit={currentProduct.orderQuantityConversion.unit}
                      orderQuantityConversion
                    />
                  </>
                ) : (
                  <>
                    {`${currentProduct?.orderQuantity} `}
                    <UnitText unit={currentProduct?.unit || ''} />
                  </>
                )}
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
      isWeightRange,
    ],
  );

  const renderHeaderLeft = useMemo(
    () => (
      <Button
        label="Làm mới"
        size="sm"
        icon={<Ionicons name="refresh" size={16} color="#fff" />}
        onPress={handleRefreshOrderDetail}
        disabled={isRefreshingOrderDetail}
        loading={isRefreshingOrderDetail}
        accessibilityLabel="Làm mới đơn hàng"
      />
    ),
    [handleRefreshOrderDetail, isRefreshingOrderDetail],
  );

  const renderTopHeader = useMemo(
    () => (
      <Pressable
        className="mb-2 pt-8"
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

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!isShowAmountInput) {
      setIsKeyboardVisible(false);
      setIsImageUploading(false);
    }
  }, [isShowAmountInput]);

  const isUnitBox = currentProduct?.unit?.toLowerCase()?.startsWith('thùng');
  const weightRangePendingScanKGs =
    useOrderPick.use.weightRangePendingScanKGs();
  const isScanQrCodeProduct = useOrderPick.use.isScanQrCodeProduct();
  const hasPackWarning = useMemo(() => {
    const unitName = currentProduct?.unit?.trim()?.toLowerCase();
    return (
      !!unitName &&
      (unitName.startsWith('pack') || unitName.startsWith('thùng'))
    );
  }, [currentProduct?.unit]);
  const hasConversionBadge = false;

  const bottomSheetHeightBase = useMemo(
    () =>
      computeInputAmountBottomSheetHeight({
        windowHeight,
        safeAreaTop: insets.top,
        guidelinesCount: currentProduct?.productPickingGuidelines?.length ?? 0,
        isUnitBox,
        isWeightRange,
        hasConversionBadge,
        hasPackWarning,
        hasImageSection: false,
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

  const bottomSheetHeightWithImage = useMemo(
    () =>
      computeInputAmountBottomSheetHeight({
        windowHeight,
        safeAreaTop: insets.top,
        guidelinesCount: currentProduct?.productPickingGuidelines?.length ?? 0,
        isUnitBox,
        isWeightRange,
        hasConversionBadge,
        hasPackWarning,
        hasImageSection: true,
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
    clearWeightRangePendingScanKGs();
    setWeightRangeDraft(null);
    setActionProduct(null);
  }, [
    toggleShowAmountInput,
    setCurrentId,
    setQuantityFromBarcode,
    setActionProduct,
  ]);

  const handleSheetClose = useCallback(() => {
    if (isScanQrCodeProduct) return;
    reset();
  }, [isScanQrCodeProduct, reset]);

  const handleInputFocus = useCallback(
    (field?: 'pickedQuantity' | 'fullBoxQuantity' | 'openedBoxQuantity') => {
      setIsKeyboardVisible(true);
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
      const weightRangeOrderQty = getWeightRangeOrderQuantity(currentProduct);
      const pickedWeightRangeCount = values?.weightRangeItemKGs?.length ?? 0;

      const pickedItem = {
        ...currentProduct,
        barcode: barcodeScanSuccess,
        isPickedByManualBarcodeInput,
        pickedQuantity: pickedQty,
        pickedErrorType: isWeightRange
          ? pickedWeightRangeCount >= weightRangeOrderQty
            ? ''
            : values?.pickedErrorType
          : pickedQty >= orderQty
            ? ''
            : values?.pickedErrorType,
        pickedNote: values?.pickedNote,
        ...(values?.pickedImage ? { pickedImage: values.pickedImage } : {}),
        pickedTime: moment().valueOf(),
        isAllowEditPickQuantity: true,
        ...((isUnitBox || isWeightRange) && {
          pickedExtraQuantities: {
            ...(isUnitBox && {
              fullBoxQuantity: values?.fullBoxQuantity || 0,
              openedBoxQuantity: values?.openedBoxQuantity || 0,
            }),
            ...(isWeightRange && {
              weightRangeItemKGs: normalizeWeightRangeItemKGs(
                values?.weightRangeItemKGs ?? [],
              ),
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
    ],
  );

  // Memoize initial values
  const initialValues = useMemo(() => {
    // Ưu tiên bản nháp đang thao tác (mirror trong store) để KHÔNG mất item đã
    // quét khi Formik remount giữa chừng. draft gắn theo product id để không lẫn
    // sản phẩm; null = mở phiên mới → seed từ dữ liệu đã lưu.
    const draft = getWeightRangeDraft();
    const weightRangeItemKGs = isWeightRange
      ? draft && draft.id === (currentProduct as Product)?.id
        ? draft.items
        : parseWeightRangeItemKGs(
            (currentProduct as Product)?.pickedExtraQuantities
              ?.weightRangeItemKGs,
          )
      : [];

    return {
      pickedQuantity: isWeightRange
        ? sumWeightRangeItemKGs(weightRangeItemKGs)
        : displayPickedQuantity,
      pickedErrorType: (currentProduct as Product)?.pickedErrorType || '',
      pickedNote: (currentProduct as Product)?.pickedNote || '',
      pickedImage: (currentProduct as Product)?.pickedImage || '',
      ...(isUnitBox && {
        fullBoxQuantity:
          (currentProduct as Product)?.pickedExtraQuantities?.fullBoxQuantity ||
          0,
        openedBoxQuantity:
          (currentProduct as Product)?.pickedExtraQuantities
            ?.openedBoxQuantity || 0,
      }),
      ...(isWeightRange && { weightRangeItemKGs }),
    };
  }, [
    currentProduct?.id,
    isUnitBox,
    isWeightRange,
    // WeightRange không reinit theo displayPickedQuantity (drain queue lo việc đó).
    // Giữ kích thước deps cố định để tránh lỗi "deps array changed size".
    isWeightRange ? 0 : displayPickedQuantity,
  ]);

  const formikKey = isWeightRange
    ? `wr-${currentProduct?.id ?? 'none'}-${isShowAmountInput}`
    : `pick-${currentProduct?.id ?? 'none'}`;

  return (
    <Formik
      key={formikKey}
      initialValues={initialValues}
      validateOnChange
      onSubmit={onSubmit}
      enableReinitialize={!isWeightRange}
    >
      {({ values, handleBlur, setFieldValue, handleSubmit, setErrors }) => {
        const isError = isWeightRange
          ? (values?.weightRangeItemKGs?.length ?? 0) === 0 &&
            !values?.pickedErrorType
          : Number(values?.pickedQuantity) < Number(orderQuantity) &&
            !values?.pickedErrorType;

        const needsPickedImage = isPickedErrorTypeRequiringImage(
          values?.pickedErrorType,
        );
        const isMissingRequiredImage =
          REQUIRE_PICKED_IMAGE_FOR_ERROR_TYPES &&
          needsPickedImage &&
          !values?.pickedImage;

        useEffect(() => {
          if (!needsPickedImage) {
            setIsImageUploading(false);
          }
        }, [needsPickedImage]);

        const bottomSheetHeight = needsPickedImage
          ? bottomSheetHeightWithImage
          : bottomSheetHeightBase;

        const weightRangeItemsRef = useRef<number[]>([]);
        weightRangeItemsRef.current = values?.weightRangeItemKGs ?? [];

        // Drain pending KG từ scan → form (chạy ở Formik, không phụ thuộc WeightRangeLineItems mount)
        useLayoutEffect(() => {
          if (!isShowAmountInput || !isWeightRange) return;
          if (weightRangePendingScanKGs.length === 0) return;

          const pending = drainWeightRangePendingScanKGs();
          if (pending.length === 0) return;

          const merged = [...weightRangeItemsRef.current, ...pending];
          setFieldValue('weightRangeItemKGs', merged);
          // Cập nhật draft ngay trong cùng layout-effect (sau khi đã drain queue)
          // để không có cửa sổ mất item nếu remount xảy ra trước passive effect.
          const id = (currentProduct as Product)?.id;
          if (id != null) {
            setWeightRangeDraft({ id, items: merged });
          }
        }, [
          isShowAmountInput,
          isWeightRange,
          weightRangePendingScanKGs,
          currentProduct,
          setFieldValue,
        ]);

        // Mirror danh sách KG hiện tại → store draft (gắn product id) để remount
        // giữa chừng có thể khôi phục, tránh mất item đã quét → submit rỗng.
        useEffect(() => {
          if (!isShowAmountInput || !isWeightRange) return;
          const id = (currentProduct as Product)?.id;
          if (id == null) return;
          setWeightRangeDraft({
            id,
            items: values?.weightRangeItemKGs ?? [],
          });
        }, [
          isShowAmountInput,
          isWeightRange,
          currentProduct,
          values?.weightRangeItemKGs,
        ]);

        useEffect(() => {
          if (!isShowAmountInput) return;

          if (action === PRODUCT_ACTIONS.OUT_OF_STOCK) {
            if (!isWeightRange) {
              setFieldValue('pickedQuantity', 0);
              setFieldValue(
                'pickedErrorType',
                PRODUCT_PICKED_ERROR_TYPES.OUT_OF_STOCK,
              );
            } else if (!values?.pickedErrorType) {
              // WeightRange: chỉ set mặc định lần đầu mở popup
              setFieldValue(
                'pickedErrorType',
                PRODUCT_PICKED_ERROR_TYPES.OUT_OF_STOCK,
              );
            }
            return;
          }

          if (action && QUICK_ACTION_TO_ERROR_TYPE[action]) {
            setFieldValue(
              'pickedErrorType',
              QUICK_ACTION_TO_ERROR_TYPE[action],
            );
          }
        }, [action, isShowAmountInput, isWeightRange, setFieldValue]);

        useEffect(() => {
          if (!isShowAmountInput || isWeightRange) return;
          if (action === PRODUCT_ACTIONS.OUT_OF_STOCK) return;

          setFieldValue('pickedQuantity', displayPickedQuantity.toString());
        }, [
          isShowAmountInput,
          displayPickedQuantity,
          isWeightRange,
          action,
          setFieldValue,
        ]);

        return (
          <SBottomSheet
            topHeader={renderTopHeader}
            headerLeft={renderHeaderLeft}
            renderTitle={renderTitle}
            ref={inputBottomSheetRef}
            snapPoints={[bottomSheetHeight]}
            onClose={handleSheetClose}
            visible={isShowAmountInput}
            enablePanDownToClose={!isWeightRange}
            enableHandlePanningGesture={!isWeightRange}
            enableContentPanningGesture={!isWeightRange}
            extraButton={
              isKeyboardVisible ? undefined : (
                <Button
                  onPress={() => handleSubmit()}
                  label="Xác nhận"
                  disabled={
                    isError || isMissingRequiredImage || isImageUploading
                  }
                  loading={isSetOrderTemToPickedPending}
                />
              )
            }
          >
            <FormContent
              values={values}
              handleBlur={handleBlur}
              setFieldValue={setFieldValue}
              setErrors={setErrors}
              currentProduct={currentProduct}
              quantityInit={currentProduct?.orderQuantity}
              quantity={displayPickedQuantity}
              action={action}
              productPickedErrorTypes={productPickedErrorTypes}
              quantityFromBarcode={quantityFromBarcode}
              shoudShowBoxInput={isUnitBox}
              shouldShowWeightRangeInput={isWeightRange}
              onInputFocus={handleInputFocus}
              onImageUploadingChange={setIsImageUploading}
            />
          </SBottomSheet>
        );
      }}
    </Formik>
  );
};

export default memo(InputAmountPopup);
