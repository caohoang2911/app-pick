import ButtonBack from '@/components/ButtonBack';
import { More2Fill } from '@/core/svgs';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge } from '../Badge';

type Props = {
  orderCode?: string;
  onClickHeaderAction?: () => void;
};

const OrderPickHeader = ({ orderCode, onClickHeaderAction }: Props) => {
  return (
    <>
      <View className="flex flex-row justify-between">
        <View className="flex flex-row gap-2 items-center">
          <ButtonBack />
          <Text className="font-semibold text-xl">{orderCode}</Text>
          <Badge label={'Đang xác nhận'} variant={'default'} />
        </View>
        <Pressable onPress={onClickHeaderAction}>
          <More2Fill />
        </Pressable>
      </View>
    </>
  );
};

export default OrderPickHeader;
