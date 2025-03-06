import { Formik } from 'formik';
import moment from 'moment-timezone';
import React, { useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { Platform, Text, View } from 'react-native';
import { isEmpty } from 'lodash';

import { FontAwesome } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useConfig } from '~/src/core/store/config';
import {
  getQuantityFromBarcode,
  setCurrentId,
  setOrderPickProduct,
  setQuantityFromBarcode,
  toggleScanQrCodeProduct,
  toggleShowAmountInput,
  useOrderPick
} from '~/src/core/store/order-pick';
import { barcodeCondition, getOrderPickProductsFlat } from '~/src/core/utils/order-bag';
import { Product } from '~/src/types/product';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';
import SDropdown from '../SDropdown';
import { formatDecimal, roundToDecimalDecrease, roundToDecimalIncrease } from '~/src/core/utils/number';
import { useSetOrderItemPicked } from '~/src/api/app-pick/set-order-item-picked';
import { useLocalSearchParams } from 'expo-router';

// QuantityControls Component
const DecrementButton = memo(({ onPress, disabled }: { onPress: () => void, disabled: boolean }) => (
  <TouchableOpacity disabled={disabled} onPress={onPress}>
    <View className="size-8 rounded-full bg-gray-200">
      <View className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2">
        <Text className="text-2xl w-full h-full text-center text-blue-500">-</Text>
      </View>
    </View>
  </TouchableOpacity>
));

const IncrementButton = memo(({ onPress, disabled }: { onPress: () => void, disabled: boolean }) => (
  <TouchableOpacity disabled={disabled} onPress={onPress}>
    <View className="size-8 rounded-full bg-gray-200">
      <View className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2">
        <Text className="text-2xl w-full h-full text-center text-blue-500">+</Text>
      </View>
    </View>
  </TouchableOpacity>
));

// ProductUnit Component
const ProductUnit = memo(({ unit }: { unit: string }) => (
  <View className="bg-gray-200 rounded-lg p-2" style={{ width: 70 }}>
    <Text className="text-gray-300 text-ellipsis text-center text-xs font-medium">{unit}</Text>
  </View>
));

// ScanButton Component
const ScanButton = memo(({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity onPress={onPress}>
    <View className="bg-colorPrimary rounded-md size-8 flex flex-row justify-center items-center">
      <FontAwesome name="qrcode" size={18} color="white" />
    </View>
  </TouchableOpacity>
));

// QuantitySection Component
const QuantitySection = memo(({ 
  values,
  quantity,
  isCampaign,
  currentProduct,
  handleBlur,
  setFieldValue,
  setQuantityFromBarcode,
  toggleScanQrCodeProduct,
}: any) => {
  const handleDecrement = useCallback(() => {
    const valueChange = roundToDecimalDecrease(Number(values?.pickedQuantity || 0));
    if (Number(valueChange) < 0) {
      setFieldValue('pickedQuantity', 0);
      return;
    }
    setFieldValue('pickedQuantity', Number(valueChange));
    if (Number(values?.pickedQuantity) >= Number(quantity)) {
      setFieldValue('pickedError', null);
    }
  }, [values?.pickedQuantity, quantity, setFieldValue]);

  const handleIncrement = useCallback(() => {
    const valueChange = roundToDecimalIncrease(Number(values?.pickedQuantity || 0));
    if (Number(valueChange) < 0) {
      setFieldValue('pickedQuantity', 0);
      return;
    }
    setFieldValue('pickedQuantity', Number(valueChange));
    if (Number(values?.pickedQuantity) >= Number(quantity)) {
      setFieldValue('pickedError', null);
    }
  }, [values?.pickedQuantity, quantity, setFieldValue]);

  const handleQRScan = useCallback(() => {
    toggleScanQrCodeProduct(true);
    setQuantityFromBarcode(Math.floor(Number(values?.pickedQuantity || 0) * 1000) / 1000);
  }, [values?.pickedQuantity, toggleScanQrCodeProduct, setQuantityFromBarcode]);

  const handleChangeText = useCallback((value: string) => {
    setFieldValue('pickedQuantity', formatDecimal(value));
    if (Number(value) >= Number(quantity)) {
      setFieldValue('pickedError', null);
    }
  }, [quantity, setFieldValue]);

  const errorMessage = useMemo(() => {
    return (Number(values?.pickedQuantity) < quantity && !values?.pickedError) 
      ? "Số lượng pick nhỏ hơn số lượng đặt. Vui lòng chọn lý do" 
      : undefined;
  }, [values?.pickedQuantity, values?.pickedError, quantity]);

  return (
    <View className="flex flex-row gap-2 items-center" style={{ position: 'relative' }}>
      <View className="flex-1" style={{ marginRight: 113 }}>
        <Input
          selectTextOnFocus
          labelClasses="font-medium"
          label="Số lượng pick"
          placeholder="Nhập số lượng"
          inputClasses="text-center"
          keyboardType="decimal-pad"
          onChangeText={handleChangeText}
          editable={!isCampaign}
          useBottomSheetTextInput
          error={errorMessage}
          name="pickedQuantity"
          value={values?.pickedQuantity.toString()}
          onBlur={handleBlur('pickedQuantity')}
          defaultValue="0"
          prefix={<DecrementButton onPress={handleDecrement} disabled={isCampaign} />}
          suffix={<IncrementButton onPress={handleIncrement} disabled={isCampaign} />}
        />
      </View>
      <View style={{ position: 'absolute', top: Platform.OS === 'ios' ? 32 : 38, right: 0 }}>
        <View className="flex flex-row items-center gap-2">
          <ProductUnit unit={currentProduct?.unit || ''} />
          <ScanButton onPress={handleQRScan} />
        </View>
      </View>
    </View>
  );
});

// ErrorSection Component
const ErrorSection = memo(({ 
  productPickedErrors, 
  values, 
  quantity, 
  setFieldValue, 
  setErrors 
}: any) => {
  const isDisabled = useMemo(() => Number(values?.pickedQuantity) >= Number(quantity), 
    [values?.pickedQuantity, quantity]);

  const handleSelect = useCallback((value: string) => {
    setFieldValue('pickedError', formatDecimal(value));
    setErrors({});
  }, [setFieldValue, setErrors]);

  const handleClear = useCallback(() => {
    setFieldValue('pickedError', '');
  }, [setFieldValue]);

  return (
    <SDropdown
      data={productPickedErrors}
      label="Chọn lý do"
      labelClasses="font-medium"
      dropdownPosition="top"
      placeholder="Vui lòng chọn"
      allowClear={true}
      disabled={isDisabled}
      value={values?.pickedError}
      onSelect={handleSelect}
      onClear={handleClear}
    />
  );
});

// FormContent Component
const FormContent = memo(({ 
  values,
  handleBlur,
  setFieldValue,
  handleSubmit,
  setErrors,
  currentProduct,
  quantity,
  isCampaign,
  productPickedErrors,
  isError
}: any) => {
  return (
    <View className="flex-1 px-4 mt-4 pb-4 gap-4">
      <QuantitySection
        values={values}
        quantity={quantity}
        isCampaign={isCampaign}
        currentProduct={currentProduct}
        handleBlur={handleBlur}
        setFieldValue={setFieldValue}
        setQuantityFromBarcode={setQuantityFromBarcode}
        toggleScanQrCodeProduct={toggleScanQrCodeProduct}
      />
      <ErrorSection
        productPickedErrors={productPickedErrors}
        values={values}
        quantity={quantity}
        setFieldValue={setFieldValue}
        setErrors={setErrors}
      />
      <Button onPress={handleSubmit} label={'Xác nhận'} disabled={isError} />
    </View>
  );
});

// Main Component
const InputAmountPopup = () => {
  const barcodeScanSuccess = useOrderPick.use.barcodeScanSuccess();
  const isShowAmountInput = useOrderPick.use.isShowAmountInput();
  const orderDetail = useOrderPick.use.orderDetail();
  const quantityFromBarcode = getQuantityFromBarcode();
  const { code } = useLocalSearchParams<{ code: string }>();
  
  // Extract once to prevent unnecessary re-renders
  const { header } = orderDetail || {};
  const { operationType } = header || {};
  const isCampaign = operationType === 'CAMPAIGN';

  const { mutate: setOrderTemToPicked } = useSetOrderItemPicked();
  const config = useConfig.use.config();
  const productPickedErrors = useMemo(() => config?.productPickedErrors || [], [config]);

  const inputBottomSheetRef = useRef<any>(null);
  
  const orderPickProducts = useOrderPick.use.orderPickProducts();
  const isEditManual = useOrderPick.use.isEditManual();
  const currentId = useOrderPick.use.currentId();

  // Memoize expensive operations
  const orderPickProductsFlat = useMemo(() => 
    getOrderPickProductsFlat(orderPickProducts), 
    [orderPickProducts]
  );

  // Find current product - memoized to avoid recalculation on every render
  const currentProduct = useMemo(() => {
    let product = orderPickProductsFlat.find((product: Product) => (
      isEditManual 
        ? product.id === currentId 
        : (barcodeCondition(barcodeScanSuccess, product.refBarcodes) || product.id === currentId) && !product.pickedTime
    ));

    if(isEmpty(product)) {
      product = orderPickProductsFlat.find((product: Product) => (
        barcodeCondition(barcodeScanSuccess, product.refBarcodes) || product.id === currentId
      ));
    }
    
    return product;
  }, [orderPickProductsFlat, isEditManual, currentId, barcodeScanSuccess]);

  // Extract product properties once
  const { pickedQuantity, quantity } = currentProduct || { pickedQuantity: 0, quantity: 0 };
  const displayPickedQuantity = useMemo(() => 
    quantityFromBarcode || pickedQuantity || quantity || 0, 
    [quantityFromBarcode, pickedQuantity, quantity]
  );
  const productName = currentProduct?.name || '';

  // Memoize title component
  const renderTitle = useMemo(() => (
    <View className="flex justify-between gap-1">
      <Text numberOfLines={1} className="font-semibold">{productName}</Text>
      <Badge 
        className="self-start" 
        label={`SL đặt: ${currentProduct?.quantity} ${currentProduct?.unit || ""}`} 
      />
    </View>
  ), [productName, currentProduct?.quantity, currentProduct?.unit]);
  
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

  // Memoized callbacks
  const handleSubmit = useCallback((values: any, { resetForm }: any) => {
    if (!productName) return;

    const pickedItem = {
      ...currentProduct,
      barcode: barcodeScanSuccess,
      pickedQuantity: values?.pickedQuantity || quantityFromBarcode || 0,
      pickedError: quantity <= values?.pickedQuantity ? '' : values?.pickedError,
      pickedNote: values?.pickedNote,
      pickedTime: moment().valueOf(),
    } as Product;

    setOrderTemToPicked({ pickedItem, orderCode: code});
    resetForm();
    setOrderPickProduct(pickedItem);
    reset();
  }, [productName, currentProduct, barcodeScanSuccess, quantityFromBarcode, quantity, code]);

  const reset = useCallback(() => {
    toggleShowAmountInput(false);
    setCurrentId(null);
    setQuantityFromBarcode(0);
  }, []);

  // Memoize initial values
  const initialValues = useMemo(() => ({
    pickedQuantity: displayPickedQuantity, 
    pickedError: (currentProduct as any)?.pickedError || '', 
    pickedNote: (currentProduct as any)?.pickedNote || ''
  }), [displayPickedQuantity, currentProduct]);

  return (
    <Formik
      initialValues={initialValues}
      validateOnChange
      onSubmit={handleSubmit}
      enableReinitialize={true}
    >
    {({ values, handleBlur, setFieldValue, handleSubmit, setErrors }) => {
      const isError = values?.pickedQuantity < quantity && !values?.pickedError;
      
      useEffect(() => {
        if(quantityFromBarcode) {
          setFieldValue('pickedQuantity', quantityFromBarcode.toString());
        }
      }, [quantityFromBarcode, setFieldValue]);

      return (
        <SBottomSheet
          renderTitle={renderTitle}
          ref={inputBottomSheetRef}
          snapPoints={[isError ? 370 : 330]}
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
            quantity={quantity}
            isCampaign={isCampaign}
            productPickedErrors={productPickedErrors}
            isError={isError}
          />
        </SBottomSheet>
      );
    }}
    </Formik>
  );
};

export default memo(InputAmountPopup);

