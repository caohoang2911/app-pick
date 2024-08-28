import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { Formik } from 'formik';

import { TouchableOpacity } from 'react-native-gesture-handler';
import { Button } from '../Button';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';
import { useGlobalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { OrderDetail } from '~/src/types/order-detail';
import {
  setOrderPickProducts,
  toggleShowAmountInput,
  useOrderPick,
} from '~/src/core/store/order-pick';
import { Product } from '~/src/types/product';
import {
  BottomSheetFooter,
  BottomSheetTextInput,
  useBottomSheetModal,
} from '@gorhom/bottom-sheet';
import SDropdown from '../SDropdown';

const dataEx = [
  { label: 'Hàng khô', value: '1' },
  { label: 'Hàng đông lạnh', value: '2' },
  { label: 'Hàng tươi', value: '3' },
];

const InputAmountPopup = ({}) => {
  const snapPoints = useMemo(() => [310], []);
  const barcodeScanSuccess = useOrderPick.use.barcodeScanSuccess();
  const isShowAmountInput = useOrderPick.use.isShowAmountInput();

  const inputBottomSheetRef = useRef<any>();

  const { dismiss } = useBottomSheetModal();

  const { code } = useGlobalSearchParams<{ code: string }>();
  const data: any = useQuery({ queryKey: ['orderDetail', code] });

  const orderDetail: OrderDetail = data?.data?.data || {};
  const { productItems } = orderDetail?.deliveries?.[0] || {};

  const currentProduct = productItems?.find((productItem: Product) => {
    return productItem.barcode === barcodeScanSuccess;
  });

  const productName = currentProduct?.name || '';

  useEffect(() => {
    if (isShowAmountInput) {
      inputBottomSheetRef.current.present();
    } else {
      // inputBottomSheetRef.current.dismiss();
    }
  }, [isShowAmountInput]);

  if(!isShowAmountInput) return <></>

  return (
    <SBottomSheet
      title={productName}
      snapPoints={snapPoints}
      ref={inputBottomSheetRef}
      enableDismissOnClose={false}
      onClose={() => {
      toggleShowAmountInput(false);
      }}
    >
      <View className="flex-1 px-4 mt-4 pb-4 gap-4">
        <Formik
          initialValues={{ number: 0 }}
          onSubmit={(values, { resetForm }) => {
            if (!productName) return;
            setOrderPickProducts({
              barcode: barcodeScanSuccess,
              number: values.number,
            });

            setTimeout(() => {
              Keyboard.dismiss();
              toggleShowAmountInput(false);
              dismiss();
              resetForm();
            }, 100);
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
                  setFieldValue('number', value);
                }}
                name="number"
                value={values?.number.toString()}
                onBlur={handleBlur('number')}
                defaultValue="0"
                prefix={
                  <TouchableOpacity
                    onPress={() => {
                      if (values.number == 0) return;
                      setFieldValue('number', Number(values.number || 0) - 1);
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
                      setFieldValue('number', Number(values.number || 0) + 1);
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
                data={dataEx}
                label="Chọn loại"
                labelClasses="font-medium"
                dropdownPosition="top"
                placeholder="Vui lòng chọn"
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
