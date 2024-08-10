import ButtonBack from '@/components/ButtonBack';
import { More2Fill } from '@/core/svgs';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge } from '../Badge';
import Header from '../Header';
import SearchLine from '~/src/core/svgs/SearchLine';
import { Input } from '../Input';

type Props = {
  orderCode?: string;
  onClickHeaderAction?: () => void;
};

const OrderPickHeader = ({ orderCode, onClickHeaderAction }: Props) => {
  return (
    <View className="px-4 py-b pb-3 bg-white">
      <View className="py-4  flex-row justify-between">
        <View className="flex flex-row gap-2 items-center">
          <ButtonBack />
          <Text className="font-semibold text-xl">{orderCode}</Text>
          <Badge label={'Đang xác nhận'} variant={'default'} />
        </View>
        <Pressable onPress={onClickHeaderAction}>
          <More2Fill />
        </Pressable>
      </View>
      <Input
        placeholder="SKU, tên sản phẩm"
        prefix={<SearchLine width={20} height={20} />}
      />
    </View>
  );
};

export default OrderPickHeader;
