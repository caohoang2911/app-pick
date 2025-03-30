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

const OrderPickHeader = () => {
  const { code } = useGlobalSearchParams<{ code: string }>();
  const orderDetail: OrderDetail = useOrderPick.use.orderDetail();
  const { header } = orderDetail;
  const { status, statusName,  lastTimeUpdateStatus, tags } = header || {};

  return (
    <View className="px-4 bg-white pb-3">
      <View className="flex-row justify-between items-center">
        <View className="flex flex-row gap-2 justify-between flex-1 items-center">
          <View className='flex flex-row items-center gap-2'>
            <ButtonBack title={<Text className="font-semibold text-base">{code}</Text>} />
          </View>
          {status && (
            <Badge
              icon={<View className='w-1 h-1 bg-blue-500 rounded-full mr-1' />}
              label={statusName as string || status}
              variant={ORDER_STATUS_BADGE_VARIANT[status as keyof typeof ORDER_STATUS_BADGE_VARIANT] as any}
              extraLabel={<Text className="text-xs text-contentPrimary"> | {moment(lastTimeUpdateStatus).fromNow()}</Text>}
            />
          )}
        </View>
        <HeaderActionBtn />
      </View>
      <HeaderTags tags={tags} />
    </View>
  );
};

export default OrderPickHeader;
