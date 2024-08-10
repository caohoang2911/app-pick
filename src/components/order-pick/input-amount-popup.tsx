import React, { forwardRef, useMemo } from 'react';
import { Text, View } from 'react-native';

import { Button } from '../Button';
import { Input } from '../Input';
import SBottomSheet from '../SBottomSheet';
import { TouchableOpacity } from 'react-native-gesture-handler';

type Props = {
  productName?: string;
};

const InputAmountPopup = forwardRef<any, Props>(({ productName }, ref) => {
  const snapPoints = useMemo(() => [240], []);

  return (
    <SBottomSheet title={productName} snapPoints={snapPoints} ref={ref}>
      <View className="flex-1 px-4 mt-4 pb-0 gap-4">
        <Input
          label="Số lượng pick"
          placeholder="Nhập số lượng"
          inputClasses="text-center"
          keyboardType="numeric"
          prefix={
            <TouchableOpacity>
              <View className="size-6 rounded-full bg-gray-200">
                <View className="absolute top-1/2 left-3 transform -translate-y-1/2 -translate-x-1/2">
                  <Text className="text-lg w-full h-full text-center text-blue-500">
                    -
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          }
          suffix={
            <TouchableOpacity>
              <View className="size-6 rounded-full bg-gray-200">
                <View className="absolute top-1/2 left-3 transform -translate-y-1/2 -translate-x-1/2">
                  <Text className="text-lg w-full h-full text-center text-blue-500">
                    +
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          }
        />
        <Button label={'Xác nhận'} />
      </View>
    </SBottomSheet>
  );
});

export default InputAmountPopup;
