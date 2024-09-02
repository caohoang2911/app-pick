import { Formik } from 'formik';
import React, { useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { TouchableOpacity } from 'react-native-gesture-handler';
import { useConfig } from '~/src/core/store/config';
import {
  setOrderPickProducts,
  toggleShowAmountInput,
  useOrderPick,
} from '~/src/core/store/order-pick';
import { Product } from '~/src/types/product';
import { Button } from '../Button';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';
import SDropdown from '../SDropdown';

const InputAmountPopup = ({}) => {
  const snapPoints = useMemo(() => [420], []);
  const barcodeScanSuccess = useOrderPick.use.barcodeScanSuccess();
  const isShowAmountInput = useOrderPick.use.isShowAmountInput();

  const config = useConfig.use.config();
  const productPickedErrors = config?.productPickedErrors || [];

  const inputBottomSheetRef = useRef<any>();
  const orderPickProducts = useOrderPick.use.orderPickProducts();
  const currentProduct = orderPickProducts[barcodeScanSuccess as keyof typeof orderPickProducts] as Product;

  const productName = currentProduct?.name || '';

  return (
    <SBottomSheet
      title={productName}
      snapPoints={snapPoints}
      ref={inputBottomSheetRef}
      visible={isShowAmountInput}
      onClose={() => {
        toggleShowAmountInput(false);
      }}
    >
      <View className="flex-1 px-4 mt-4 pb-4 gap-4">
        <Formik
          initialValues={{
            pickedQuantity: (currentProduct as any)?.pickedQuantity || 0, 
            pickedError: (currentProduct as any)?.pickedError || '', 
            pickedNote: (currentProduct as any)?.pickedNote || ''
          }}
          onSubmit={(values, { resetForm }) => {
            if (!productName) return;
            toggleShowAmountInput(false);
            setOrderPickProducts({
              ...currentProduct,
              barcode: barcodeScanSuccess,
              pickedQuantity: values.pickedQuantity,
              pickedError: values.pickedError,
              pickedNote: values.pickedNote,
            });
            resetForm();
          }}
        >
          {({ values, handleBlur, setFieldValue, handleSubmit }) => (
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
                name="pickedQuantity"
                value={values?.pickedQuantity.toString()}
                onBlur={handleBlur('pickedQuantity')}
                defaultValue="0"
                prefix={
                  <TouchableOpacity
                    onPress={() => {
                      if (values.pickedQuantity == 0) return;
                      setFieldValue('pickedQuantity', Number(values.pickedQuantity || 0) - 1);
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
                    onPress={() => {
                      setFieldValue('pickedQuantity', Number(values.pickedQuantity || 0) + 1);
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
                value={values.pickedError}
                onSelect={(value: string) => {
                  setFieldValue('pickedError', value);
                }}
              />

              <Input
                label="Mô tả"
                labelClasses="font-medium"
                value={values.pickedNote}
                placeholder="Nhập mô tả"
                multiline
                numberOfLines={3}
                keyboardType="default"
                handleBlur={handleBlur('pickedNote')}
                onChangeText={(value: string) => {
                  setFieldValue('pickedNote', value);
                }}
              />  

              <Button onPress={handleSubmit as any} label={'Xác nhận'} />
            </>
          )}
        </Formik>
      </View>
    </SBottomSheet>
  );
};

export default InputAmountPopup;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: 'grey',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
  },
  input: {
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 10,
    fontSize: 16,
    lineHeight: 20,
    padding: 8,
    backgroundColor: 'rgba(151, 151, 151, 0.25)',
  },
});
