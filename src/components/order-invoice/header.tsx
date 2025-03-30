import ButtonBack from '@/components/ButtonBack';
import { More2Fill } from '@/core/svgs';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useGlobalSearchParams } from 'expo-router';
import { debounce } from 'lodash';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ORDER_STATUS_BADGE_VARIANT } from '~/src/contants/order';
import { useCanEditOrderPick } from '~/src/core/hooks/useCanEditOrderPick';
import { useConfig } from '~/src/core/store/config';
import { setIsEditManual, setKeyword, setSuccessForBarcodeScan, toggleScanQrCodeProduct, useOrderPick } from '~/src/core/store/order-pick';
import SearchLine from '~/src/core/svgs/SearchLine';
import { getConfigNameById } from "~/src/core/utils/config";
import { getOrderPickProductsFlat } from '~/src/core/utils/order-bag';
import { OrderDetail } from '~/src/types/order-detail';
import { Product, ProductItemGroup } from '~/src/types/product';
import { Badge } from '../Badge';
import { Input } from '../Input';
import HeaderActionBtn from './header-action-btn';

const HeaderTags = ({tags}: {tags?: string[]}) => {
  const configs = useConfig.use.config();
  const orderTags = configs?.orderTags || [];

  return (
    <View className="flex flex-row gap-1 flex-wrap">
      {tags?.map((tag) => {
        const tagName = getConfigNameById(orderTags, tag);
        return  (
          <Badge
            className="self-start rounded-md"
            key={tag} label={tagName as string}
            style={{marginHorizontal: 0}}
            variant={ORDER_STATUS_BADGE_VARIANT[tag as keyof typeof ORDER_STATUS_BADGE_VARIANT] as any} />
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

  useEffect(() => {
    setValue(keyword);
  }, [keyword]);

  useEffect(() => {
    setKeyword('');

    return () => {
      setKeyword('');
    }
  }, [code])

  const handleSearch = useCallback(
    debounce((value: string) => {
      setKeyword(value);
    }, 400),
    []
  );

  const orderDetail: OrderDetail = useOrderPick.use.orderDetail();
  const { header } = orderDetail;
  const { status, statusName,  lastTimeUpdateStatus, tags, picker } = header || {};

  const shouldDisplayQrScan = useCanEditOrderPick();

  return (
    <View className="px-4 bg-white">
      <View className="flex-row justify-between items-center">
        <View className="flex flex-row gap-2 justify-between flex-1 items-center">
          <View className='flex flex-row items-center gap-2'>
            <ButtonBack title="ĐƠN HÀNG" />
          </View>
          <Text className="font-semibold text-sm">{code}</Text>
          {status && (
            <Badge
              icon={<View className='w-1 h-1 bg-blue-500 rounded-full mr-1' />}
              label={statusName as string || status}
              variant={"transparent"}
              extraLabel={<Text className="text-xs text-contentPrimary"> | {moment(lastTimeUpdateStatus).fromNow()}</Text>}
            />
          )}
        </View>
        <HeaderActionBtn />
      </View>
      <HeaderTags tags={tags} />
      <View className="flex flex-row mt-2 justify-between items-center pb-3 gap-3">
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
