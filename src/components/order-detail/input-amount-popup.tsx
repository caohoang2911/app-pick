import { Formik } from 'formik';
import moment from 'moment-timezone';
import React, { useEffect, useMemo, useRef } from 'react';
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
import { getOrderPickProductsFlat } from '~/src/core/utils/order-bag';
import { Product } from '~/src/types/product';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';
import SDropdown from '../SDropdown';
import { formatDecimal, roundToDecimalDecrease, roundToDecimalIncrease } from '~/src/core/utils/number';
import { useSetOrderItemPicked } from '~/src/api/app-pick/set-order-item-picked';
import { useLocalSearchParams } from 'expo-router';


const InputAmountPopup = ({}) => {
  const barcodeScanSuccess = useOrderPick.use.barcodeScanSuccess();
  const isShowAmountInput = useOrderPick.use.isShowAmountInput();
  const orderDetail = useOrderPick.use.orderDetail();
  const quantityFromBarcode = getQuantityFromBarcode();
  const { header } = orderDetail || {};
  const { operationType } = header || {};

  const { code } = useLocalSearchParams<{ code: string }>();
  
  const { mutate: setOrderTemToPicked } = useSetOrderItemPicked();

  const isCampaign = operationType === 'CAMPAIGN';

  const config = useConfig.use.config();
  const productPickedErrors = config?.productPickedErrors || [];

  const inputBottomSheetRef = useRef<any>();
  
  const orderPickProducts = useOrderPick.use.orderPickProducts();
  const orderPickProductsFlat = getOrderPickProductsFlat(orderPickProducts);
  const isEditManual = useOrderPick.use.isEditManual();

  const currentId = useOrderPick.use.currentId();

  let currentProduct = orderPickProductsFlat.find((product: Product) => ( isEditManual ? product.id === currentId : (product.barcode === barcodeScanSuccess || product.baseBarcode === barcodeScanSuccess) && !product.pickedTime));

  if(isEmpty(currentProduct)) {
    currentProduct = orderPickProductsFlat.find((product: Product) => ((product.barcode === barcodeScanSuccess || product.baseBarcode === barcodeScanSuccess) || product.id === currentId));
  }

  const { pickedQuantity, quantity } = currentProduct || { pickedQuantity: 0, quantity: 0 };
    
  const displayPickedQuantity = quantityFromBarcode || pickedQuantity || quantity || 0;

  const productName = currentProduct?.name || '';

  const renderTitle = useMemo(() => {
    return (
      <View className="flex justify-between gap-1">
        <Text numberOfLines={1} className="font-semibold">{productName}</Text>
        <Badge className="self-start" label={`SL đặt: ${currentProduct?.quantity} ${currentProduct?.unit || ""}`}></Badge>
      </View>
    )
  }, [productName, displayPickedQuantity])
  
  useEffect(() => {
    return () => {
      setQuantityFromBarcode(0);
    }
  }, []);

  const handleSubmit = (values: any, { resetForm }: any) => {
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
  }

  const reset = () => {
    toggleShowAmountInput(false);
    setCurrentId(null);
    setQuantityFromBarcode(0);
  }

  if(!isShowAmountInput) return null;

  return (
    <Formik
      initialValues={{
        pickedQuantity: displayPickedQuantity, 
        pickedError: (currentProduct as any)?.pickedError || '', 
        pickedNote: (currentProduct as any)?.pickedNote || ''
      }}
      validateOnChange
      onSubmit={handleSubmit}
    >
    {({ values, handleBlur, setFieldValue, handleSubmit, setErrors }) => {
      const isError = values?.pickedQuantity < quantity && !values?.pickedError;
      useEffect(() => {
        if(quantityFromBarcode) {
          setFieldValue('pickedQuantity', quantityFromBarcode.toString());
        }
      }, [quantityFromBarcode]);

      return (
        <SBottomSheet
          renderTitle={renderTitle}
          ref={inputBottomSheetRef}
          visible={isShowAmountInput}
          onClose={() => {
            reset();
          }}
        > 
          <View className="flex-1 px-4 mt-4 pb-4 gap-4">
            <View className="flex flex-row gap-2 items-center" style={{ position: 'relative' }}>
              <View className="flex-1" style={{ marginRight: 113}}>
                <Input
                  selectTextOnFocus
                  labelClasses="font-medium"
                  label="Số lượng pick"
                  placeholder="Nhập số lượng"
                  inputClasses="text-center"
                  keyboardType="decimal-pad"
                  onChangeText={(value: string) => {
                    setFieldValue('pickedQuantity', formatDecimal(value));
                    if(Number(values?.pickedQuantity) >= Number(quantity)) {
                      setFieldValue('pickedError', null);
                    }
                  }}
                  editable={!isCampaign}
                  useBottomSheetTextInput
                  error={(Number(values?.pickedQuantity) < quantity && !values?.pickedError) && "Số lượng pick nhỏ hơn số lượng đặt. Vui lòng chọn lý do"}
                  name="pickedQuantity"
                  value={values?.pickedQuantity.toString()}
                  onBlur={handleBlur('pickedQuantity')}
                  defaultValue="0"
                  prefix={
                    <TouchableOpacity
                      disabled={isCampaign}
                      onPress={() => {
                        const valueChange = roundToDecimalDecrease(Number(values?.pickedQuantity || 0))
                        if (Number(valueChange) < 0) {
                          setFieldValue('pickedQuantity', 0);
                          return;
                        };
                        setFieldValue('pickedQuantity', Number(valueChange));
                        if(Number(values?.pickedQuantity) >= Number(quantity)) {
                          setFieldValue('pickedError', null);
                        }
                      }}
                    >
                      <View className="size-8 rounded-full bg-gray-200">
                        <View className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2">
                          <Text className="text-2xl w-full h-full text-center text-blue-500">
                            -
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  }
                  suffix={
                    <TouchableOpacity
                      disabled={isCampaign}
                      onPress={() => {
                        const valueChange = roundToDecimalIncrease(Number(values?.pickedQuantity || 0))
                        if (Number(valueChange) < 0) {
                          setFieldValue('pickedQuantity', 0);
                          return;
                        };
                        setFieldValue('pickedQuantity', Number(valueChange));

                        if(Number(values?.pickedQuantity) >= Number(quantity)) {
                          setFieldValue('pickedError', null);
                        }
                      }}
                    >
                      <View className="size-8 rounded-full bg-gray-200">
                        <View className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2">
                          <Text className="text-2xl w-full h-full text-center text-blue-500">
                            +
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  }
                />
              </View>
              <View style={{ position: 'absolute', top: Platform.OS === 'ios' ? 32 : 38, right: 0 }}>
                <View className="flex flex-row items-center gap-2">
                  <View className="bg-gray-200 rounded-lg p-2" style={{ width: 70 }}>
                    <Text className="text-gray-300 text-ellipsis text-center text-xs font-medium">{currentProduct?.unit}</Text>
                  </View>
                  <TouchableOpacity onPress={() => {
                      toggleScanQrCodeProduct(true);
                      setQuantityFromBarcode(Math.floor(Number(values?.pickedQuantity || 0) * 1000) / 1000);
                    }}>
                      <View className=" bg-colorPrimary rounded-md size-8 flex flex-row justify-center items-center">
                        <FontAwesome name="qrcode" size={18} color="white" />
                      </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <SDropdown
              data={productPickedErrors}
              label="Chọn lý do"
              labelClasses="font-medium"
              dropdownPosition="top"
              placeholder="Vui lòng chọn"
              allowClear={true}
              disabled={Number(values?.pickedQuantity) >= Number(quantity)}
              value={values?.pickedError}
              onSelect={(value: string) => {
                setFieldValue('pickedError', formatDecimal(value));
                setErrors({})
              }}
              onClear={() => {
                setFieldValue('pickedError', '');
              }}
            />
            <Button onPress={handleSubmit as any} label={'Xác nhận'} disabled={isError} />
          </View>
        </SBottomSheet>
        )}}
    </Formik>
  );
};

export default InputAmountPopup;

