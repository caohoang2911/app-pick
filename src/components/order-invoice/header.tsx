import ButtonBack from '@/components/ButtonBack';
import { useGlobalSearchParams } from 'expo-router';
import { toLower } from 'lodash';
import React from 'react';
import { Text, View } from 'react-native';
import { useOrderDetailForCode } from '~/src/api/app-pick/use-get-order-detail';
import { getRelativeTime } from '~/src/core/utils/moment';
import { OrderDetail } from '~/src/types/order-pick';
import { Badge } from '../Badge';
import CopyButton from '../shared/copy-button';
import LabelTags from '../shared/LabelTags';
import HeaderActionBtn from './header-action-btn';

const OrderPickHeader = () => {
  const { code } = useGlobalSearchParams<{ code: string }>();
  const { orderDetail } = useOrderDetailForCode(code);
  const orderDetailData = orderDetail as OrderDetail | undefined;

  const { header } = orderDetailData || {};
  const { status, statusName, lastTimeUpdateStatus, tags } = header || {};

  return (
    <View className="px-4 bg-white pb-3">
      <View className="flex-row justify-between items-center">
        <View className="flex flex-row gap-2 justify-between flex-1 items-center">
          <View className="flex flex-row items-center gap-1">
            <ButtonBack
              title={<Text className="font-semibold text-base">{code}</Text>}
            />
            <CopyButton value={code as string} />
          </View>
          {status && (
            <Badge
              label={statusName}
              variant={toLower(status as string) as any}
              extraLabel={
                <Text className="text-xs text-contentPrimary ml-3">
                  | {getRelativeTime(lastTimeUpdateStatus)}
                </Text>
              }
            />
          )}
        </View>
        <HeaderActionBtn />
      </View>
      <LabelTags tags={tags} />
    </View>
  );
};

export default OrderPickHeader;
