import React, { forwardRef, useMemo } from 'react';
import { Keyboard, Text, View } from 'react-native';
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
  useOrderPick,
} from '~/src/core/store/order-pick';
import { Product } from '~/src/types/product';
import { useBottomSheetModal } from '@gorhom/bottom-sheet';

const InputAmountPopup = forwardRef<{}, any>(({}, ref) => {
  const snapPoints = useMemo(() => [260], []);
  const barcodeScanSuccess = useOrderPick.use.barcodeScanSuccess();

  const { dismiss } = useBottomSheetModal();

  const { code } = useGlobalSearchParams<{ code: string }>();
  const data: any = useQuery({ queryKey: ['orderDetail', code] });

  const orderDetail: OrderDetail = data?.data?.data || {};
  const { productItems } = orderDetail?.deliveries?.[0] || {};

  const currentProduct = productItems?.find((productItem: Product) => {
    return productItem.barcode === barcodeScanSuccess;
  });

  const productName = currentProduct?.name || '';

  return (
    <SBottomSheet
      title={productName}
      snapPoints={snapPoints}
      ref={ref}
      // enableDismissOnClose={false}
    >
      <View className="flex-1 px-4 mt-4 pb-4 gap-4">
        <Formik
          initialValues={{ number: 0 }}
          onSubmit={(values) => {
            if (!productName) return;

            setOrderPickProducts({
              barcode: barcodeScanSuccess,
              number: values.number,
            });

            setTimeout(() => {
              Keyboard.dismiss();
              dismiss();
            }, 100);
          }}
        >
          {({ values, handleBlur, setFieldValue, handleSubmit }) => (
            <>
              <Input
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
              <Button
                onPress={handleSubmit as VoidFunction}
                label={'Xác nhận'}
              />
            </>
          )}
        </Formik>
      </View>
    </SBottomSheet>
  );
});

export default InputAmountPopup;
