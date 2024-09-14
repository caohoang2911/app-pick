import RadioButtonGroup, { RadioButtonItem } from "expo-radio-button";
import { useLocalSearchParams } from 'expo-router';
import { Formik } from 'formik';
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useBookShipper } from '~/src/api/app-pick/use-book-shipper';
import { setLoading } from '~/src/core/store/loading';
import { useOrderInvoice } from '~/src/core/store/order-invoice';
import { HeavyProduct, scheduleType } from '~/src/types/order';
import { Button } from '../Button';
import SBottomSheet from '../SBottomSheet';
import { hideAlert, showAlert } from "~/src/core/store/alert-dialog";

type Props = {};

const BookAhamoveActionsBottomsheet = forwardRef<any, Props>(
  ({ }, ref) => {
  const [visible, setVisible] = useState(false);
  const actionRef = useRef<any>();

  const { code } = useLocalSearchParams<{ code: string }>();
  const orderInvoice = useOrderInvoice.use.orderInvoice();
  const { delivery } = orderInvoice || {};

  const { isPending: isLoadingBookShipper, mutate: bookShipper } = useBookShipper(() => {
    hideAlert();
  });

  useImperativeHandle(
    ref,
    () => {
      return {
        present: () => {
          actionRef.current?.present();
          setVisible(!visible);
        },
      };
    },
    []
  );

  const handleBookShipper = (values: any) => {
    setVisible(false);
    showAlert({
      title: 'Xác nhận book AhaMove',
      loading: isLoadingBookShipper,
      onConfirm: () => {
        setLoading(true);
        bookShipper({
          ...values,
          orderCode: code,
          serviceId: delivery?.shipping?.serviceId,
        });
      }
    })
  }

  return (
    <>
      <SBottomSheet
        visible={visible}
        title="Thao tác"
        titleAlign="center"
        ref={actionRef}
        onClose={() => setVisible(false)}
      >
        <Formik initialValues={{
          scheduleType: scheduleType.ORDER_DELIVERY_TIME,
          heavyProduct: HeavyProduct.STANDARD,
        }} onSubmit={handleBookShipper}>
          {({ setFieldValue, handleSubmit, values }) => (
            <View className='px-4 py-4'>
              <View className='flex gap-2 mb-2'>
                <Text className='text-base font-semibold mb-1'>Thao tác</Text>
                <RadioButtonGroup
                  containerStyle={{ marginBottom: 10 }}
                  selected={values.scheduleType}
                  size={18}
                  onSelected={(value: string) => {
                    if(!value) return;
                    setFieldValue('scheduleType', value)
                  }}
                  radioStyle={{ backgroundColor: "white"}}
                  radioBackground="blue"
                >
                <RadioButtonItem value={scheduleType.ORDER_DELIVERY_TIME} label={<Text className='pl-3'>Giao theo giờ khách chọn</Text>} />
                <View className='py-1' />
                <RadioButtonItem
                    value={scheduleType.NOW}
                    label={<Text className='pl-3'>Giao ngay</Text>}
                  />
                </RadioButtonGroup>
              </View>
              <View className='flex gap-2'>
                <Text className='text-base font-semibold mb-1'>Chọn kích thước gói hàng</Text>
                <RadioButtonGroup
                  containerStyle={{ marginBottom: 10 }}
                  selected={values.heavyProduct}
                  size={18}
                  onSelected={(value: string) => {
                    if(!value) return;
                    setFieldValue('heavyProduct', value)
                  }}
                  radioStyle={{ backgroundColor: "white"}}
                  radioBackground="blue"
                >
                  <RadioButtonItem
                    value={HeavyProduct.STANDARD}
                    label={<Text className='pl-3'>Thông thường (50x40x50 - 30kg - Miễn phí)</Text>}
                  />
                  <View className='py-1' />
                  <RadioButtonItem
                    value={HeavyProduct.SIZE_1}
                    label={<Text className='pl-3'>Mức 1 (60x50x60 - 40kg - 10.000đ)</Text>}
                  />
                  <View className='py-1' />
                  <RadioButtonItem
                    value={HeavyProduct.SIZE_2}
                    label={<Text className='pl-3'>Mức 2 (70x60x70 - 50kg - 20.000đ)</Text>}
                  />
                  <View className='py-1' />
                  <RadioButtonItem
                    value={HeavyProduct.SIZE_3}
                    label={<Text className='pl-3'>Mức 3 (90x90x90 - 80kg - 40.000đ)</Text>}
                  />
                </RadioButtonGroup>
              </View>
              <Button className='mt-4' label='Book xe' onPress={handleSubmit as any} />
            </View>
          )}
        </Formik>
      </SBottomSheet>
    </>
  )
})

export default BookAhamoveActionsBottomsheet