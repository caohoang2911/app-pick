import ButtonBack from '@/components/ButtonBack';
import { More2Fill } from '@/core/svgs';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge } from '../Badge';
import Header from '../Header';
import SearchLine from '~/src/core/svgs/SearchLine';
import { Input } from '../Input';
import { TouchableOpacity } from 'react-native-gesture-handler';
import FontAwesome from '@expo/vector-icons/FontAwesome';

type Props = {
  orderCode?: string;
  onClickHeaderAction?: () => void;
  onOpenBarcodeScanner?: () => void;
};

const OrderPickHeader = ({
  orderCode,
  onClickHeaderAction,
  onOpenBarcodeScanner,
}: Props) => {
  return (
    <View className="px-4 py-b pb-3 bg-white">
      <View className="pt-4  flex-row justify-between">
        <View className="flex flex-row gap-2 items-center">
          <ButtonBack />
          <Text className="font-semibold text-xl">{orderCode}</Text>
          <Badge label={'Đang xác nhận'} variant={'default'} />
        </View>
        <Pressable onPress={onClickHeaderAction}>
          <More2Fill />
        </Pressable>
      </View>
      <View className="flex flex-row mt-4 justify-between items-center gap-3">
        <Input
          className="flex-grow"
          placeholder="SKU, tên sản phẩm"
          prefix={<SearchLine width={20} height={20} />}
        />
        <TouchableOpacity onPress={onOpenBarcodeScanner}>
          <View className=" bg-colorPrimary rounded-md size-10 flex flex-row justify-center items-center">
            <FontAwesome name="qrcode" size={24} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OrderPickHeader;
