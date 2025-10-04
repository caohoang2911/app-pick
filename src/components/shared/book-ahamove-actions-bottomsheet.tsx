import RadioButtonGroup, { RadioButtonItem } from "expo-radio-button";
import { useLocalSearchParams } from 'expo-router';
import { Formik } from 'formik';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useBookAhamoveShipper } from '~/src/api/app-pick/use-book-ahamove-shipper';
import { hideAlert } from "~/src/core/store/alert-dialog";
import { setLoading } from '~/src/core/store/loading';
import { PackageSize, scheduleType } from '~/src/types/order';
import { Button } from '../Button';
import SBottomSheet from '../SBottomSheet';
import { queryClient } from "~/src/api/shared/api-provider";

type Props = {};

const BookAhamoveActionsBottomsheet = forwardRef<any, Props>(
  ({ }, ref) => {
  const [visible, setVisible] = useState(false);
  const actionRef = useRef<any>();

  const { code } = useLocalSearchParams<{ code: string }>();

  const { mutate: bookAhamoveShipper } = useBookAhamoveShipper(() => {
    hideAlert();
    queryClient.invalidateQueries({ queryKey: ['orderDetail', code] });
  });

  useImperativeHandle(
    ref,
    () => {
      return {
        present: () => {
  
          setVisible(!visible);
        },
      };
    },
    []
  );

  useEffect(() => {
    if (visible) {
      actionRef.current?.present();
    }
  }, [visible]);

  const handleBookShipper = (values: any) => {
    setVisible(false);
    setLoading(true);
    bookAhamoveShipper({
      ...values,
      orderCode: code,
    });
  }

  return (
    <>
      <SBottomSheet
        visible={visible}
        title="Thao tác"
        titleAlign="center"
        snapPoints={[620]}
        ref={actionRef}
        onClose={() => setVisible(false)}
      >
        <Formik initialValues={{
          scheduleType: scheduleType.ORDER_DELIVERY_TIME,
          packageSize: PackageSize.STANDARD,
          serviceId: 'SGN-BIKE'
        }} onSubmit={handleBookShipper}>
          {({ setFieldValue, handleSubmit, values }) => (
            <View className='px-4 py-4'>
              <View className='flex gap- mb-2'>
                <View className="pt-4 mb-2">
                 <Text className='text-base font-semibold'>Thời gian</Text>
                </View>
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
                <View className='py-3' />
                <RadioButtonItem
                    value={scheduleType.NOW}
                    label={<Text className='pl-3'>Giao ngay</Text>}
                  />
                </RadioButtonGroup>
              </View>
              <View className='flex gap-2 mb-2'>
                <View className="pt-4 mb-2">
                  <Text className='text-base font-semibold'>Tài xế</Text>
                </View>
                <RadioButtonGroup
                  containerStyle={{ marginBottom: 10 }}
                  selected={values.serviceId}
                  size={18}
                  onSelected={(value: string) => {
                    if(!value) return;
                    setFieldValue('serivceId', value)
                  }}
                  radioStyle={{ backgroundColor: "white"}}
                  radioBackground="blue"
                >
                <RadioButtonItem value={"SGN-BIKE"} label={<Text className='pl-3'>Tài xế Ahamove (Siêu tốc)</Text>} />
                <View className='py-3' />
                <RadioButtonItem
                  value={"VNM-PARTNER-KFM-FT"}
                  label={<Text className='pl-3'>Tài xế nội bộ</Text>}
                />
                </RadioButtonGroup>
              </View>
              <View className='flex gap-2'>
                <View className="pt-4 mb-2">
                  <Text className='text-base font-semibold'>Chọn kích thước gói hàng</Text>
                </View>
                <RadioButtonGroup
                  containerStyle={{ marginBottom: 10 }}
                  selected={values.packageSize}
                  size={18}
                  onSelected={(value: string) => {
                    if(!value) return;
                    setFieldValue('packageSize', value)
                  }}
                  radioStyle={{ backgroundColor: "white"}}
                  radioBackground="blue"
                >
                  <RadioButtonItem
                    value={PackageSize.STANDARD}
                    label={<Text className='pl-3'>Thông thường (50x40x50 - 30kg - Miễn phí)</Text>}
                  />
                  <View className='py-3' />
                  <RadioButtonItem
                    value={PackageSize.SIZE_1}
                    label={<Text className='pl-3'>Mức 1 (60x50x60 - 40kg - 10.000đ)</Text>}
                  />
                  <View className='py-3' />
                  <RadioButtonItem
                    value={PackageSize.SIZE_2}
                    label={<Text className='pl-3'>Mức 2 (70x60x70 - 50kg - 20.000đ)</Text>}
                  />
                  <View className='py-3' />
                  <RadioButtonItem
                    value={PackageSize.SIZE_3}
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