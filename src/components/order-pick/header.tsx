import ButtonBack from '@/components/ButtonBack';
import { More2Fill } from '@/core/svgs';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge } from '../Badge';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useQuery } from '@tanstack/react-query';
import { useGlobalSearchParams } from 'expo-router';
import { toLower } from 'lodash';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { toggleScanQrCodeProduct } from '~/src/core/store/order-pick';
import SearchLine from '~/src/core/svgs/SearchLine';
import { OrderDetail } from '~/src/types/order-detail';
import { Input } from '../Input';

type Props = {
  onClickHeaderAction?: () => void;
};

const OrderPickHeader = ({ onClickHeaderAction }: Props) => {
  const { code } = useGlobalSearchParams<{ code: string }>();
  const data: any = useQuery({ queryKey: ['orderDetail', code] });
  const [keyword, setKeyWord] = useState('');

  const orderDetail: OrderDetail = data?.data?.data || {};
  const { header } = orderDetail;
  const { status, statusName } = header || {};

  const shouldDisplayQrScan = ['STORE_PICKING'].includes(status as OrderStatus);

  return (
    <View className="px-4 py-3 pb-3 bg-white">
      <View className="pt-4  flex-row justify-between">
        <View className="flex flex-row gap-2 items-center">
          <ButtonBack />
          <Text className="font-semibold text-xl">{code}</Text>
          {status && (
            <Badge
              label={statusName as string}
              variant={toLower(status as string) as any}
            />
          )}
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
          onChangeText={setKeyWord}
          value={keyword}
          onClear={() => {
            setKeyWord('');
          }}
          allowClear
        />
        {shouldDisplayQrScan && (
          <TouchableOpacity onPress={() => toggleScanQrCodeProduct(true)}>
            <View className=" bg-colorPrimary rounded-md size-10 flex flex-row justify-center items-center">
              <FontAwesome name="qrcode" size={24} color="white" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default OrderPickHeader;
