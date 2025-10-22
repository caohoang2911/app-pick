import { Formik } from 'formik';
import { isEmpty, isNumber, toLower } from 'lodash';
import moment from 'moment-timezone';
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, Text, View } from 'react-native';

import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSetOrderItemPicked } from '~/src/api/app-pick/set-order-item-picked';
import { useConfig } from '~/src/core/store/config';
import {
  setActionProduct,
  setCurrentId,
  setIsVisibleReplaceProduct,
  setOrderPickProduct,
  setQuantityFromBarcode,
  setReplacePickedProductId,
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
import {
  barcodeCondition,
  getOrderPickProductsFlat,
} from '~/src/core/utils/order-bag';
import { Product } from '~/src/types/product';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';
import SDropdown from '../SDropdown';
import SImage from '../SImage';

// QuantityControls Component
const DecrementButton = memo(
  ({ onPress, disabled }: { onPress: () => void; disabled: boolean }) => (
    <TouchableOpacity disabled={disabled} onPress={onPress}>
      <View className="size-8 rounded-full bg-gray-200">
        <View className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2">
          <Text className="text-2xl w-full h-full text-center text-blue-500">
            -
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
);

const IncrementButton = memo(
  ({ onPress, disabled }: { onPress: () => void; disabled: boolean }) => (
    <TouchableOpacity disabled={disabled} onPress={onPress}>
      <View className="size-8 rounded-full bg-gray-200">
        <View className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2">
          <Text className="text-2xl w-full h-full text-center text-blue-500">
            +
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
);

// ProductUnit Component
const ProductUnit = memo(({ unit }: { unit: string }) => (
  <View className="bg-gray-200 rounded-lg p-2" style={{ width: 70 }}>
    <Text className="text-gray-300 text-ellipsis text-center text-xs font-medium">
      {unit}
    </Text>
  </View>
));

// ScanButton Component
const ScanButton = memo(
  ({ onPress, disabled }: { onPress: () => void; disabled: boolean }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      className={`${disabled ? 'opacity-50' : ''}`}
    >
      <View
        className={`bg-colorPrimary rounded-md size-8 flex flex-row justify-center items-center ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        <FontAwesome name="qrcode" size={18} color="white" />
      </View>
    </TouchableOpacity>
  )
);

// QuantitySection Component
const QuantitySection = memo(
  ({
    values,
    quantity,
    currentProduct,
    handleBlur,
    action,
    setFieldValue,
    quantityInit,
    setQuantityFromBarcode,
    toggleScanQrCodeProduct,
  }: any) => {
    const editable = useMemo(() => action !== 'out-of-stock', [action]);

    const handleDecrement = useCallback(() => {
      // setQuantityFromBarcode(0);
      const valueChange = roundToDecimalDecrease(
        Number(values?.pickedQuantity || 0)
      );
      if (Number(valueChange) < 0) {
        setFieldValue('pickedQuantity', 0);
        return;
      }
      setFieldValue('pickedQuantity', Number(valueChange));
      if (Number(values?.pickedQuantity) >= Number(quantity) && !action) {
        setFieldValue('pickedErrorType', null);
      }
    }, [values?.pickedQuantity, quantity, setFieldValue, editable, action]);

    const handleIncrement = useCallback(() => {
      if (!editable) return;
      // setQuantityFromBarcode(0);
      const valueChange = roundToDecimalIncrease(
        Number(values?.pickedQuantity || 0)
      );
      if (Number(valueChange) < 0) {
        setFieldValue('pickedQuantity', 0);
        return;
      }
      setFieldValue('pickedQuantity', Number(valueChange));
      if (Number(values?.pickedQuantity) >= Number(quantity) && !action) {
        setFieldValue('pickedErrorType', null);
      }
    }, [values?.pickedQuantity, quantity, setFieldValue, editable, action]);

    const handleQRScan = useCallback(() => {
      toggleScanQrCodeProduct(true);
      setQuantityFromBarcode(
        Math.floor(Number(values?.pickedQuantity || 0) * 1000) / 1000
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
        if (Number(value) >= Number(quantity)) {
          setFieldValue('pickedErrorType', null);
        }
      },
      [quantity, setFieldValue]
    );

    const errorMessage = useMemo(() => {
      return Number(values?.pickedQuantity) < Number(quantityInit) &&
        !values?.pickedErrorType
        ? 'SL pick nhỏ hơn SL đặt. Vui lòng chọn lý do'
        : undefined;
    }, [values?.pickedQuantity, values?.pickedErrorType, quantityInit]);

    return (
      <View className="flex gap-2 flex-1" style={{ position: 'relative' }}>
        <View className="flex-1">
          <View className="flex-1" style={{ marginRight: 113 }}>
            <Input
              selectTextOnFocus
              labelClasses="font-medium"
              label="Số lượng pick"
              placeholder="Nhập số lượng"
              inputClasses="text-center"
              keyboardType="decimal-pad"
              onChangeText={handleChangeText}
              editable={editable}
              useBottomSheetTextInput
              name="pickedQuantity"
              value={values?.pickedQuantity?.toString()}
              onBlur={handleBlur('pickedQuantity')}
              defaultValue="0"
              prefix={
                <DecrementButton onPress={handleDecrement} disabled={false} />
              }
              suffix={
                <IncrementButton onPress={handleIncrement} disabled={false} />
              }
            />
          </View>
          <View
            style={{
              position: 'absolute',
              top: Platform.OS === 'ios' ? 32 : 38,
              right: 0,
            }}
          >
            <View className="flex flex-row items-center gap-2">
              <ProductUnit unit={currentProduct?.unit || ''} />
              <ScanButton onPress={handleQRScan} disabled={!editable} />
            </View>
          </View>
        </View>
        <Text className="text-red-500">{errorMessage}</Text>
      </View>
    );
  }
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
    const isError = values?.pickedQuantity >= quantityInit;
    const { unit } = currentProduct || {};

    const isDisabled =
      isError || ['out-of-stock', 'low-quality', 'near-date', 'incorrect-stock'].includes(action);

    const handleSelect = useCallback(
      (value: string) => {
        setFieldValue('pickedErrorType', value);
        setErrors({});
      },
      [setFieldValue, setErrors]
    );

    const handleClear = useCallback(() => {
      if (isDisabled) return;
      setFieldValue('pickedErrorType', '');
    }, [setFieldValue, isDisabled]);

    const productPickedErrorsWithUnit = useMemo(() => {
      // return productPickedErrorTypes.map((item: any) => item.id !== 'INCORRECT_ORDERED_WEIGHT');
      return productPickedErrorTypes.map((item: any) =>
        item.id === 'INCORRECT_ORDERED_WEIGHT'
          ? { ...item, disabled: toLower(unit) !== 'kg' }
          : item
      )?.reverse();
    }, [productPickedErrorTypes, unit]);
    

    return (
      <SDropdown
        data={productPickedErrorsWithUnit}
        label="Chọn lý do"
        labelClasses="font-medium"
        dropdownPosition="top"
        placeholder="Vui lòng chọn"
        allowClear={true}
        disabled={isDisabled}
        value={values?.pickedErrorType}
        onSelect={handleSelect}
        onClear={handleClear}
      />
    );
  }
);

// Pack input
const BoxInput = memo(({ values, setFieldValue, handleBlur }: any) => {
  const handleChangeText = useCallback(
    (name: string, value: string) => {
      setFieldValue(name, parseInt(value || '0'));
    },
    [setFieldValue]
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
    [setFieldValue, values]
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
    [setFieldValue, values]
  );

  return (
    <View className="flex-1 flex-row gap-2">
      <View className="flex-1">
        <Input
          label={
            <Text className="font-medium text-gray-500" numberOfLines={1}>Thùng nguyên kiện</Text>
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
          label={<Text className="font-medium text-gray-500" numberOfLines={1}>Thùng gom lẻ</Text>}
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
});

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
    shoudShowBoxInput,
  }: any) => {
    useEffect(() => {
      setFieldValue('pickedQuantity', quantityFromBarcode || quantity);
      setFieldValue(
        'fullBoxQuantity',
        (currentProduct as Product)?.pickedExtraQuantities?.fullBoxQuantity || 0
      );
      setFieldValue(
        'openedBoxQuantity',
        (currentProduct as Product)?.pickedExtraQuantities?.openedBoxQuantity ||
          0
      );
    }, []);

    return (
      <View className="flex-1 px-4 mt-4 pb-4 gap-4">
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
        />
        {shoudShowBoxInput && (
          <BoxInput
            values={values}
            setFieldValue={setFieldValue}
            handleBlur={handleBlur}
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
        <Button onPress={handleSubmit} label={'Xác nhận'} disabled={isError} />
      </View>
    );
  }
);

// Main Component
const InputAmountPopup = () => {
  const barcodeScanSuccess = useOrderPick.use.barcodeScanSuccess();
  const isShowAmountInput = useOrderPick.use.isShowAmountInput();
  const quantityFromBarcode = useOrderPick.use.quantityFromBarcode();
  const { code } = useLocalSearchParams<{ code: string }>();

  const action = useOrderPick.use.action();

  const [currentPickedProduct, setCurrentPickedProduct] = useState<Product>();

  const { mutate: setOrderTemToPicked } = useSetOrderItemPicked(
    () => {
      if (currentPickedProduct) {
        setOrderPickProduct(currentPickedProduct);
        setReplacePickedProductId(currentPickedProduct?.id);
        if (!currentPickedProduct?.pickedQuantity && currentPickedProduct?.tags?.includes('REPLACEABLE')) {
          showAlert({
            title: 'Thông báo',
            message: 'Sản phẩm hết hàng, bạn có muốn thay thế sản phẩm?',
            onConfirm: () => {
              hideAlert();
              setIsVisibleReplaceProduct(true);
            },
          });
        }
      }
    },
    (error: string) => {
      setQuantityFromBarcode(0);
    }
  );
  const config = useConfig.use.config();
  const productPickedErrorTypes = useMemo(
    () => config?.productPickedErrorTypes || [],
    [config]
  );

  const inputBottomSheetRef = useRef<any>(null);

  const orderPickProducts = useOrderPick.use.orderPickProducts();
  const isEditManual = useOrderPick.use.isEditManual();
  const currentId = useOrderPick.use.currentId();

  // Memoize expensive operations
  const orderPickProductsFlat = useMemo(
    () => getOrderPickProductsFlat(orderPickProducts),
    [orderPickProducts]
  );

  // Find current product - memoized to avoid recalculation on every render
  const currentProduct = useMemo(() => {
    let product = orderPickProductsFlat.find((product: Product) =>
      isEditManual
        ? product.id === currentId
        : (barcodeCondition(barcodeScanSuccess, product.refBarcodes) ||
            product.id === currentId) &&
          !product.pickedTime
    );

    if (isEmpty(product)) {
      product = orderPickProductsFlat.find(
        (product: Product) =>
          barcodeCondition(barcodeScanSuccess, product.refBarcodes) ||
          product.id === currentId
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
    if (isNumber(quantityFromBarcode) && action === 'out-of-stock') {
      return 0;
    }
    return quantityFromBarcode || pickedQuantity || 0;
  }, [quantityFromBarcode, pickedQuantity, action]);
  const productName = currentProduct?.name || '';

  // Memoize title component
  const renderTitle = useMemo(
    () => (
      <View className="flex justify-between gap-1">
        <Text numberOfLines={1} className="font-semibold">
          {productName}
        </Text>
        <Badge
          className="self-start"
          label={`SL đặt: ${currentProduct?.quantity} ${
            currentProduct?.unit || ''
          }`}
        />
      </View>
    ),
    [productName, currentProduct?.quantity, currentProduct?.unit]
  );

  const renderTopHeader = useMemo(
    () => (
      <View className="flex-row items-center justify-center mb-2 -mt-5">
        <SImage source={currentProduct?.image} style={{ width: 180, height: 180, borderRadius: 8 }} />
      </View>
    ),
    [currentProduct?.image]
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

  // Memoized callbacks
  const onSubmit = useCallback(
    (values: any) => {
      if (!productName) return;

      const pickedItem = {
        ...currentProduct,
        barcode: barcodeScanSuccess,
        pickedQuantity: Number(values?.pickedQuantity || 0),
        pickedErrorType:
          quantity <= values?.pickedQuantity ? '' : values?.pickedErrorType,
        pickedNote: values?.pickedNote,
        pickedTime: moment().valueOf(),
        isAllowEditPickQuantity: true,
        ...(isUnitBox && {
          pickedExtraQuantities: {
            fullBoxQuantity: values?.fullBoxQuantity || 0,
            openedBoxQuantity: values?.openedBoxQuantity || 0,
          },
        }),
      } as Product;

      setCurrentPickedProduct(pickedItem);
      setOrderTemToPicked({ pickedItem, orderCode: code });
      reset();
    },
    [productName, currentProduct, barcodeScanSuccess, quantity, code, isUnitBox]
  );

  const reset = useCallback(() => {
    toggleShowAmountInput(false);
    setCurrentId(null);
    setQuantityFromBarcode(0);
    setActionProduct(null);
  }, []);

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
    }),
    [displayPickedQuantity, currentProduct, isUnitBox]
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
          values?.pickedQuantity < orderQuantity && !values?.pickedErrorType;

        useEffect(() => {
          if (action === 'out-of-stock') {
            setFieldValue('pickedQuantity', 0);
            setFieldValue('pickedErrorType', 'OUT_OF_STOCK');
          } else if (action === 'low-quality') {
            setFieldValue('pickedErrorType', 'QUALITY_DECLINE');
          } else if (action === 'near-date') {
            setFieldValue('pickedErrorType', 'NEAR_EXPIRED_DATE');
          } else if (action === 'incorrect-stock') {
            setFieldValue('pickedErrorType', 'INCORRECT_STOCK');
          } else {
            setFieldValue('pickedQuantity', displayPickedQuantity.toString());
          }
        }, [action, setFieldValue, isShowAmountInput]);

        
        return (
          <SBottomSheet
            topHeader={renderTopHeader}
            renderTitle={renderTitle}
            ref={inputBottomSheetRef}
            snapPoints={[isUnitBox ? 605 : 530]}
            onClose={reset}
            visible={isShowAmountInput}
          >
            <FormContent
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
              shoudShowBoxInput={isUnitBox}
            />
          </SBottomSheet>
        );
      }}
    </Formik>
  );
};

export default memo(InputAmountPopup);
