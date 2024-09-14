import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import RadioButtonGroup, { RadioButtonItem } from "expo-radio-button";
import SBottomSheet from '../SBottomSheet';

type Props = {};

const BookAhamoveActionsBottomsheet = forwardRef<any, Props>(
  ({ }, ref) => {
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState("test");
  const [current1, setCurrent1] = useState("test");

  const actionRef = useRef<any>();

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

  return (
    <>
      <SBottomSheet
        visible={visible}
        title="Thao tác"
        titleAlign="center"
        ref={actionRef}
        onClose={() => setVisible(false)}
      >
        
        <View className='px-4 py-4'>
          <View className='flex gap-2'>
            <Text className='text-base font-semibold mb-2'>Thao tác</Text>
            <RadioButtonGroup
              containerStyle={{ marginBottom: 10 }}
              selected={current}
              size={18}
              onSelected={(value: string) => setCurrent(value)}
              radioStyle={{ backgroundColor: "white"}}
              radioBackground="blue"
            >
            <RadioButtonItem value="test2" label={<Text className='pl-2'>Giao theo giờ khách chọn</Text>} />
            <View className='size-3' />
            <RadioButtonItem
                value="test"
                label={<Text className='pl-2'>Giao ngay</Text>}
              />
            </RadioButtonGroup>
          </View>
          <View className='flex gap-2'>
            <Text className='text-base font-semibold mb-2'>Chọn kích thước gói hàng</Text>
            <RadioButtonGroup
              containerStyle={{ marginBottom: 10 }}
              selected={current1}
              size={18}
              onSelected={(value: string) => setCurrent1(value)}
              radioStyle={{ backgroundColor: "white"}}
              radioBackground="blue"
            >
              <RadioButtonItem
                value="test1"
                label={<Text className='pl-2'>Thông thường (50x40x50 - 30kg - Miễn phí)</Text>}
              />
              <View className='size-3' />
              <RadioButtonItem
                value="test2"
                label={<Text className='pl-2'>Mức 1 (60x50x60 - 40kg - 10.000đ)</Text>}
              />
              <View className='size-3' />
              <RadioButtonItem
                value="test3"
                label={<Text className='pl-2'>Mức 2 (70x60x70 - 50kg - 20.000đ)</Text>}
              />
              <View className='size-3' />
              <RadioButtonItem
                value="test4"
                label={<Text className='pl-2'>Mức 3 (90x90x90 - 80kg - 40.000đ)</Text>}
              />
            </RadioButtonGroup>
          </View>
        </View>
      </SBottomSheet>
    </>
  )
})

export default BookAhamoveActionsBottomsheet