import ButtonBack from '@/components/ButtonBack';
import { More2Fill } from '@/core/svgs';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { debounce, toLower } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { setKeyword, setSuccessForBarcodeScan, toggleScanQrCodeProduct, useOrderPick } from '~/src/core/store/order-pick';
import SearchLine from '~/src/core/svgs/SearchLine';
import { OrderDetail } from '~/src/types/order-detail';
import { Badge } from '../Badge';
import { Input } from '../Input';
import { useGlobalSearchParams } from 'expo-router';
import moment from 'moment';
import { OrderStatus } from '~/src/types/order';

type Props = {
  onClickHeaderAction?: () => void;
};

const OrderPickHeader = ({ onClickHeaderAction }: Props) => {
  const keyword = useOrderPick.use.keyword();
  const { code } = useGlobalSearchParams<{ code: string }>();
  const [value, setValue] = useState<string>();

  const barcodeScanSuccess = useOrderPick.use.barcodeScanSuccess();

  useEffect(() => {
    if (barcodeScanSuccess) {
      setValue(barcodeScanSuccess);
      setKeyword(barcodeScanSuccess);
    }
  }, [barcodeScanSuccess]);

  useEffect(() => {
    setValue(keyword);
  }, [keyword]);

  const handleSearch = useCallback(
    debounce((value: string) => {
      setKeyword(value);
    }, 400),
    []
  );

  const orderDetail: OrderDetail = useOrderPick.use.orderDetail();
  const { header } = orderDetail;
  const { status, statusName,  orderTime } = header || {};

  const shouldDisplayQrScan = ['STORE_PICKING'].includes(status as OrderStatus);

  return (
    <View className="px-4 py-2 pb-3 bg-white">
      <View className="pt-4  flex-row justify-between">
        <View className="flex flex-row gap-2 items-center">
          <ButtonBack />
          <Text className="font-semibold text-xl">{code}</Text>
          {status && (
            <Badge
              label={statusName as string || status}
              variant={toLower(status as string) as any}
              extraLabel={<Text className="text-xs text-contentPrimary"> | {moment(orderTime).fromNow()}</Text>}
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
          onChangeText={(value: string) => {
            setValue(value);
            handleSearch(value)
          }}
          value={value}
          onClear={() => {
            setValue("");
            setKeyword('');
          }}
          allowClear
        />
        {shouldDisplayQrScan && (
          <TouchableOpacity onPress={() => {
            toggleScanQrCodeProduct(true);
            setSuccessForBarcodeScan('');
          }}>
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
