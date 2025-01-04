import { Formik } from 'formik';
import React, { useEffect, useMemo, useRef } from 'react';
import * as Yup from 'yup';
import { Text, View } from 'react-native';

import { TouchableOpacity } from 'react-native-gesture-handler';
import { useConfig } from '~/src/core/store/config';
import {
  getOrderPickProductsFlat,
  getQuantityFromBarcode,
  setOrderPickProducts,
  setQuantityFromBarcode,
  toggleShowAmountInput,
  useOrderPick,
} from '~/src/core/store/order-pick';
import { Product } from '~/src/types/product';
import { Button } from '../Button';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';
import SDropdown from '../SDropdown';
import { Badge } from '../Badge';
import { isEmpty } from 'lodash';


const InputAmountPopup = ({}) => {
  const barcodeScanSuccess = useOrderPick.use.barcodeScanSuccess();
  const isShowAmountInput = useOrderPick.use.isShowAmountInput();
  const orderDetail = useOrderPick.use.orderDetail();
  const quantityFromBarcode = getQuantityFromBarcode();
  const { header } = orderDetail || {};
  const { operationType } = header || {};

  const isCampaign = operationType === 'CAMPAIGN';

  const config = useConfig.use.config();
  const productPickedErrors = config?.productPickedErrors || [];

  const inputBottomSheetRef = useRef<any>();
  
  const orderPickProductsFlat = getOrderPickProductsFlat();

  const currentProduct = orderPickProductsFlat.find((product: Product) => product.barcode === barcodeScanSuccess);

  const { pickedQuantity, quantity } = currentProduct || { pickedQuantity: 0, quantity: 0 };
    
  const displayPickedQuantity = quantityFromBarcode || pickedQuantity || quantity || 0;

  const productName = currentProduct?.name || '';

  const renderTitle = useMemo(() => {
    return (
      <View className="flex justify-between gap-1">
        <Text className="font-semibold">{productName}</Text>
        <Badge className="self-start" label={`SL đặt: ${currentProduct?.quantity} ${currentProduct?.unit || ""}`}></Badge>
      </View>
    )
  }, [productName, displayPickedQuantity])

  useEffect(() => {
    return () => {
      setQuantityFromBarcode(0);
    }
  }, []);


  return (
    <SBottomSheet
      renderTitle={renderTitle}
      ref={inputBottomSheetRef}
      visible={isShowAmountInput}
      onClose={() => {
        toggleShowAmountInput(false);
      }}
    > 
      <View className="flex-1 px-4 mt-4 pb-4 gap-4">
        <Formik
          initialValues={{
            pickedQuantity: displayPickedQuantity, 
            pickedError: (currentProduct as any)?.pickedError || '', 
            pickedNote: (currentProduct as any)?.pickedNote || ''
          }}
          validateOnChange
          onSubmit={(values, { resetForm }) => {
            if (!productName) return;
            toggleShowAmountInput(false);
            setOrderPickProducts({
              ...currentProduct,
              barcode: barcodeScanSuccess,
              pickedQuantity: values?.pickedQuantity,
              pickedError: quantity <= values?.pickedQuantity ? '' : values?.pickedError,
              pickedNote: values?.pickedNote,
            } as Product);
            resetForm();
          }}
        >
          {({ values, errors, handleBlur, setFieldValue, handleSubmit, setErrors }) => {

            const isError = values?.pickedQuantity < quantity && !values?.pickedError;

            return (
              <>
                <Input
                  selectTextOnFocus
                  labelClasses="font-medium"
                  label="Số lượng pick"
                  placeholder="Nhập số lượng"
                  inputClasses="text-center"
                  keyboardType="numeric"
                  onChangeText={(value: string) => {
                    setFieldValue('pickedQuantity', value);
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
                        const valueChange = Number(values?.pickedQuantity || 0) - 1
                        if (Number(valueChange) < 0) {
                          setFieldValue('pickedQuantity', 0);
                          return;
                        };
                        setFieldValue('pickedQuantity', Number(values?.pickedQuantity - 1));
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
                        const valueChange = Number(values?.pickedQuantity || 0) + 1;
                        if (Number(valueChange) < 0) {
                          setFieldValue('pickedQuantity', 0);
                          return;
                        };
                        setFieldValue('pickedQuantity', Number(valueChange));
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
                    setFieldValue('pickedError', value);
                    setErrors({})
                  }}
                  onClear={() => {
                    setFieldValue('pickedError', '');
                  }}
                />
                {/* <Input
                  label="Mô tả"
                  labelClasses="font-medium"
                  useBottomSheetTextInput
                  value={values?.pickedNote}
                  placeholder="Nhập mô tả"
                  multiline
                  numberOfLines={3}
                  keyboardType="default"
                  handleBlur={handleBlur('pickedNote')}
                  onChangeText={(value: string) => {
                    setFieldValue('pickedNote', value);
                  }}
                />  */}
                <Button onPress={handleSubmit as any} label={'Xác nhận'} disabled={isError} />
              </>
          )}}
        </Formik>
      </View>
    </SBottomSheet>
  );
};

export default InputAmountPopup;