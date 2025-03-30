
import { useRouter } from "expo-router";
import { toLower } from "lodash";
import moment from 'moment';
import React, { useCallback, memo } from "react";
import { Text, View } from "react-native";
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';

import { TouchableOpacity } from "react-native-gesture-handler";
import Feather from '@expo/vector-icons/Feather';
import { useConfig } from "~/src/core/store/config";
import { getConfigNameById } from "~/src/core/utils/config";
import { expectedDeliveryTime } from "~/src/core/utils/moment";
import { formatCurrency } from "~/src/core/utils/number";
import { OrderStatus } from "~/src/types/order";
import { Payment } from "~/src/types/order-detail";
import { Badge } from "../Badge";
import MoreActionsBtn from "./more-actions-btn";
import { ORDER_STATUS_BADGE_VARIANT } from "~/src/contants/order";

const RowWithLabel = memo(({icon, label, value, pickedItemProgress}: {icon: React.ReactNode, label: string, value: string, pickedItemProgress?: number}) => {
  return (
    <View className="flex flex-row gap-1">
      <View className="mr-2 -mt-0.5">{icon}</View>
      <View style={{width: 72}}><Text className="text-gray-500">{label}</Text></View>
      <Text className="font-medium" numberOfLines={1} style={{ maxWidth: pickedItemProgress ? "60%" : "68%" }} ellipsizeMode="tail">{value}</Text>
      {pickedItemProgress && (
        <View className="flex flex-row ml-auto gap-1 items-center">
          <Text className="text-sm text-gray-500">Pick</Text>
          <Badge label={`${pickedItemProgress}`} variant="warning" />
        </View>
      )}
    </View>
  )
});

const OrderItem = ({
  statusName,
  orderTime,
  code,
  status,
  customer,
  payment,
  deliveryTimeRange,
  amount,
  tags,
  note,
  type,
  fulfillError,
  groupShippingCode,
  lastTimeUpdateStatus,
  deliveryAddress,
  picker,
  pickedItemProgress,
}: {
  statusName: string;
  orderTime: string;
  code: string;
  status: OrderStatus;
  customer: any;
  payment: Payment;
  deliveryTimeRange?: any;
  amount: number;
  tags: Array<any>;
  note: string;
  type: string;
  groupShippingCode: string;
  fulfillError: any;
  lastTimeUpdateStatus: string;
  deliveryAddress: {
    fullAddress: string;
  };
  picker: {
    username: string;
    name: string;
  };
  pickedItemProgress: number;
}) => {
  const router = useRouter();

  const config = useConfig.use.config();
  const orderTags = config?.orderTags || [];

  const fulfillErrorTypes = config?.fulfillErrorTypes || [];
  const fulfillErrorTypeDisplay = getConfigNameById(fulfillErrorTypes, fulfillError?.type);

  const handlePress = useCallback(() => {
    if(type === 'STORE_DELIVERY') {
      router.push(`orders/order-invoice/${code}`);
    } else {
      router.push({ pathname: `orders/order-detail/${code}`, params: { status } });
    }
  }, [type, code, status, router]);

  const shouldShowassignee = picker?.username && picker?.name;

  return (
    <TouchableOpacity onPress={handlePress} className="flex-1">
      <View className="rounded-md border-bgPrimary border">
        <View className="bg-bgPrimary pl-3 py-4 pr-0 flex flex-row justify-between items-center">
          <View className="flex flex-row items-center gap-2">
            <Text className="font-semibold text-base text-colorPrimary">
              {code}
            </Text>
            {groupShippingCode && <Badge label={groupShippingCode} variant="warning" />}
          </View>
          <View className="flex flex-row items-center gap-0">
            <Badge
              label={statusName}
              variant={toLower(status) as any}
              extraLabel={<Text className="text-xs text-contentPrimary ml-3">
                | {moment(lastTimeUpdateStatus).fromNow()}
              </Text>}
            />
            <View className="mr-1  rounded-full">
              <MoreActionsBtn code={code} />
            </View>
          </View>
        </View>
        <View className="py-4 px-3 pt-3 gap-3">
          <View className="flex flex-row gap-1 items-center justify-between mb-1">
            <View className="flex flex-row gap-2 items-center flex-1 ">
              <View className="-mt-0.5">
                <Feather name="user" size={22} color="black" />
              </View>
              <Text className="text-md font-semibold " style={{width: '85%'}} numberOfLines={1} ellipsizeMode="tail">{customer?.name}</Text>
            </View>
            <View className="flex flex-row gap-1 items-center flex-grow-1">
              <Badge 
                label={<Text className="text-base mr-2">{formatCurrency(amount, {unit: true})}</Text>}  
                extraLabel={<Text className="text-sm text-contentPrimary ml-3">
                  - {payment?.methodName}
                </Text>}
                variant="warning" 
              />
            </View>
          </View>
          <RowWithLabel 
            icon={<SimpleLineIcons name="location-pin" size={18} color="gray" />}
            label="ĐC giao"
            value={deliveryAddress?.fullAddress} />
          <RowWithLabel
            icon={<Feather name="calendar" size={18} color="gray" />}
            label="Ngày đặt"
            value={moment(orderTime).format('DD/MM/YYYY')}
          />
          <RowWithLabel
            icon={<Feather name="calendar" size={18} color="gray" />}
            label="Giao hàng"
            value={deliveryTimeRange ? `${expectedDeliveryTime(deliveryTimeRange).hh} ${expectedDeliveryTime(deliveryTimeRange).day}` : '--'}
          />
          <RowWithLabel
            icon={<Feather name="package" size={18} color="gray" />}
            label="NV pick"
            value={shouldShowassignee ? `${picker?.name &&  `${picker?.name}`}` : '--'}
            pickedItemProgress={pickedItemProgress}
          />
          {tags?.length > 0 && 
            <View className="pt-1 flex flex-row gap-1 flex-wrap">
              {tags?.map((tag: string, index: number) => {
                const tagName = getConfigNameById(orderTags, tag)
                return (
                  <Badge key={index} label={tagName as string || tag} variant={ORDER_STATUS_BADGE_VARIANT[tag as keyof typeof ORDER_STATUS_BADGE_VARIANT] as any} className="self-start rounded-md px-1"/>
                )
              })}
            </View>
          }
          {note && (
            <View className="flex flex-row gap-1 mt-1">
              <Text className="text-sm text-orange-500 italic">Note: {note?.trim()}</Text>
            </View>
          )}
          {fulfillError?.type && (
            <View className="flex flex-row items-center gap-1">
              <Text className="text-sm text-red-500 italic">{fulfillErrorTypeDisplay}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default React.memo(OrderItem);