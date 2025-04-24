import ButtonBack from '@/components/ButtonBack';
import { useGlobalSearchParams } from 'expo-router';
import moment from 'moment';
import React from 'react';
import { Text, View } from 'react-native';
import { ORDER_STATUS_BADGE_VARIANT } from '~/src/contants/order';
import { useConfig } from '~/src/core/store/config';
import { useOrderPick } from '~/src/core/store/order-pick';
import { getConfigNameById } from "~/src/core/utils/config";
import { OrderDetail } from '~/src/types/order-detail';
import { Badge } from '../Badge';
import HeaderActionBtn from './header-action-btn';
import { toLower } from 'lodash';

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
              label={statusName}
              variant={toLower(status as string) as any}
              extraLabel={<Text className="text-xs text-contentPrimary ml-3">
                | {moment(lastTimeUpdateStatus).fromNow()}
              </Text>}
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
