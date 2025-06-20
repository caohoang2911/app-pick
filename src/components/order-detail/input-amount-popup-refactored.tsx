import { Formik } from 'formik';
import { isEmpty, isNumber } from 'lodash';
import moment from 'moment-timezone';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { useLocalSearchParams } from 'expo-router';
import { useSetOrderItemPicked } from '~/src/api/app-pick/set-order-item-picked';
import { useConfig } from '~/src/core/store/config';
import {
  setCurrentId,
  setOrderPickProduct,
  setQuantityFromBarcode,
  setScanMoreProduct,
  toggleScanQrCodeProduct,
  toggleShowAmountInput,
  useOrderPick,
  setActionProduct
} from '~/src/core/store/order-pick';
import { formatDecimal } from '~/src/core/utils/number';
import { barcodeCondition, getOrderPickProductsFlat } from '~/src/core/utils/order-bag';
import { Product } from '~/src/types/product';
import { AmountInput } from '../AmountInput';
import { Badge } from '../Badge';
import { Button } from '../Button';
import SBottomSheet from '../SBottomSheet';
import SDropdown from '../SDropdown';

// ErrorSection Component
const ErrorSection = memo(({ 
  productPickedErrors, 
  values, 
  quantity, 
  setFieldValue,
  quantityInit,
  setErrors,
  action,
  quantityFromBarcode,
}: any) => {
  const isDisabled = ['out-of-stock', 'low-quality', 'near-date'].includes(action);

  const handleSelect = useCallback((value: string) => {
    setFieldValue('pickedError', formatDecimal(value));
    setErrors({});
  }, [setFieldValue, setErrors]);

  const handleClear = useCallback(() => {
    if(isDisabled) return;
    setFieldValue('pickedError', '');
  }, [setFieldValue, isDisabled]);

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
  isError,
  action,
  quantityInit,
  quantityFromBarcode,
  setQuantityFromBarcode,
  toggleScanQrCodeProduct,
  setScanMoreProduct,
}: any) => {
  
  const editable = useMemo(() => !isCampaign && action !== 'out-of-stock', 
    [isCampaign, action]);

  const handleAmountChange = useCallback((value: number) => {
    setQuantityFromBarcode(0);
    setFieldValue('pickedQuantity', value);
    if (Number(value) >= Number(quantity) && !action) {
      setFieldValue('pickedError', null);
    }
  }, [quantity, setFieldValue, action, setQuantityFromBarcode]);

  const handleQRScan = useCallback(() => {
    toggleScanQrCodeProduct(true);
    setQuantityFromBarcode(Math.floor(Number(values?.pickedQuantity || 0) * 1000) / 1000);
    setScanMoreProduct(true);
  }, [values?.pickedQuantity, toggleScanQrCodeProduct, setQuantityFromBarcode, setScanMoreProduct]);

  useEffect(() => {
    return () => {
      setScanMoreProduct(false);
    };
  }, [setScanMoreProduct]);

  const errorMessage = useMemo(() => {
    return (Number(values?.pickedQuantity) < Number(quantityInit) && !values?.pickedError) 
      ? "SL pick nhỏ hơn SL đặt. Vui lòng chọn lý do" 
      : undefined;
  }, [values?.pickedQuantity, values?.pickedError, quantityInit]);

  return (
    <View className="flex-1 px-4 mt-4 pb-4 gap-4">
      <AmountInput
        label="Số lượng pick"
        placeholder="Nhập số lượng"
        value={Number(values?.pickedQuantity || 0)}
        onChangeValue={handleAmountChange}
        unit={currentProduct?.unit || ''}
        editable={editable}
        showScanButton={true}
        onScanPress={handleQRScan}
        useBottomSheetTextInput={true}
        onBlur={handleBlur('pickedQuantity')}
        error={errorMessage}
        minValue={0}
      />
      
      <ErrorSection
        productPickedErrors={productPickedErrors}
        values={values}
        action={action}
        quantity={quantity}
        quantityInit={quantityInit}
        setFieldValue={setFieldValue}
        setErrors={setErrors}
        quantityFromBarcode={quantityFromBarcode}
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
  const quantityFromBarcode = useOrderPick.use.quantityFromBarcode();
  const { code } = useLocalSearchParams<{ code: string }>();

  const action = useOrderPick.use.action();

  const [currentPickedProduct, setCurrentPickedProduct] = useState<Product>();
  
  // Extract once to prevent unnecessary re-renders
  const { header } = orderDetail || {};
  const { operationType } = header || {};
  const isCampaign = operationType === 'CAMPAIGN';

  const { mutate: setOrderTemToPicked } = useSetOrderItemPicked(() => {
    if(currentPickedProduct) {
      setOrderPickProduct(currentPickedProduct);
    }
  }, (error: string) => {
    setQuantityFromBarcode(0);
  });
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
  const displayPickedQuantity = useMemo(() => { 
    if(isNumber(quantityFromBarcode) && action === 'out-of-stock') {
      return 0;
    }
    return quantityFromBarcode || pickedQuantity || 0;
  }, [quantityFromBarcode, pickedQuantity, action]);
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
  const onSubmit = useCallback((values: any) => {
    if (!productName) return;

    const pickedItem = {
      ...currentProduct,
      barcode: barcodeScanSuccess,
      pickedQuantity: values?.pickedQuantity || quantityFromBarcode || 0,
      pickedError: quantity <= values?.pickedQuantity ? '' : values?.pickedError,
      pickedNote: values?.pickedNote,
      pickedTime: moment().valueOf(),
      isAllowEditPickQuantity: true,
    } as Product;

    setCurrentPickedProduct(pickedItem);
    setOrderTemToPicked({ pickedItem, orderCode: code});
    reset();
  }, [productName, currentProduct, barcodeScanSuccess, quantityFromBarcode, quantity, code]);

  const reset = useCallback(() => {
    toggleShowAmountInput(false);
    setCurrentId(null);
    setQuantityFromBarcode(0);
    setActionProduct(null);
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
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
    {({ values, handleBlur, setFieldValue, handleSubmit, setErrors }) => {
      const isError = values?.pickedQuantity < quantity && !values?.pickedError;

      useEffect(() => {
        if(action === 'out-of-stock') {
          setFieldValue('pickedQuantity', 0);
          setFieldValue('pickedError', 'OUT_OF_STOCK');
        } else if(action === 'low-quality') {
          setFieldValue('pickedError', 'QUALITY_DECLINE');
        } else if(action === 'near-date') {
          setFieldValue('pickedError', 'NEAR_EXPIRED_DATE');
        } else {
          setFieldValue('pickedQuantity', displayPickedQuantity.toString());
        }
      }, [action, setFieldValue, isShowAmountInput]);

      return (
        <SBottomSheet
          renderTitle={renderTitle}
          ref={inputBottomSheetRef}
          snapPoints={[370]}
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
            isCampaign={isCampaign}
            action={action}
            productPickedErrors={productPickedErrors}
            isError={isError}
            quantityFromBarcode={quantityFromBarcode}
            setQuantityFromBarcode={setQuantityFromBarcode}
            toggleScanQrCodeProduct={toggleScanQrCodeProduct}
            setScanMoreProduct={setScanMoreProduct}
          />
        </SBottomSheet>
      );
    }}
    </Formik>
  );
};

export default memo(InputAmountPopup); 