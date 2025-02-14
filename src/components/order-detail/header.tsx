import ButtonBack from '@/components/ButtonBack';
import { More2Fill } from '@/core/svgs';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useGlobalSearchParams } from 'expo-router';
import { debounce, toLower } from 'lodash';
import moment from 'moment';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useCanEditOrderPick } from '~/src/core/hooks/useCanEditOrderPick';
import { useConfig } from '~/src/core/store/config';
import { setIsEditManual, setKeyword, setSuccessForBarcodeScan, toggleScanQrCodeProduct, useOrderPick } from '~/src/core/store/order-pick';
import SearchLine from '~/src/core/svgs/SearchLine';
import { getConfigNameById } from "~/src/core/utils/config";
import { OrderDetail } from '~/src/types/order-detail';
import { Badge } from '../Badge';
import { Input } from '../Input';
import { GroupShippingInfo } from './group-shipping-info';

const HeaderTags = ({tags}: {tags?: string[]}) => {
  const configs = useConfig.use.config();
  const orderTags = configs?.orderTags || [];

  return (
    <View className="flex flex-row gap-1 flex-wrap" style={{ marginTop: tags?.length ? 4 : 0 }}>
      {tags?.map((tag) => {
        const tagName = getConfigNameById(orderTags, tag);
        return  (
          <Badge className="self-start rounded-md" label={tagName as string} variant="default" />
        )
      })}
    </View>
  )
}

type Props = {
  onClickHeaderAction?: () => void;
};

const OrderPickHeader = ({ onClickHeaderAction }: Props) => {
  const keyword = useOrderPick.use.keyword();
  const { code } = useGlobalSearchParams<{ code: string }>();
  const [value, setValue] = useState<string>();

  const barcodeScanSuccess = useOrderPick.use.barcodeScanSuccess();
  const fillInput = useOrderPick.use.fillInput();
  useEffect(() => {
    if (barcodeScanSuccess && fillInput) {
      setValue(barcodeScanSuccess);
      setKeyword(barcodeScanSuccess);
    }
  }, [barcodeScanSuccess]);

  useEffect(() => {
    setValue(keyword);
  }, [keyword]);

  useEffect(() => {
    setKeyword('');
  }, [code])

  const handleSearch = useCallback(
    debounce((value: string) => {
      setKeyword(value);
    }, 400),
    []
  );

  const orderDetail: OrderDetail = useOrderPick.use.orderDetail();
  const { header } = orderDetail;
  const { status, statusName,  lastTimeUpdateStatus, tags } = header || {};

  const shouldDisplayQrScan = useCanEditOrderPick();

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
              extraLabel={<Text className="text-xs text-contentPrimary"> | {moment(lastTimeUpdateStatus).fromNow()}</Text>}
            />
          )}
        </View>
        <Pressable onPress={onClickHeaderAction}>
          <More2Fill />
        </Pressable>
      </View>
      <HeaderTags tags={tags} />
      <GroupShippingInfo />
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
            setIsEditManual(false);
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
