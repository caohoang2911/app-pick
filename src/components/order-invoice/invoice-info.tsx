import { useLocalSearchParams } from 'expo-router'
import { pick, toLower } from 'lodash'
import React, { useMemo } from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { useOrderInvoice } from '~/src/core/store/order-invoice'
import { expectedDeliveryTime } from '~/src/core/utils/moment'
import { formatCurrency } from '~/src/core/utils/number'
import { Badge } from '../Badge'
import { useConfig } from '~/src/core/store/config'
import { getConfigNameById } from '~/src/core/utils/config'
import moment from 'moment'
import { ORDER_STATUS_BADGE_VARIANT } from '~/src/contants/order'

const COL_LEFT_WIDTH = 105;

const InvoiceInfo = () => {
  const { code } = useLocalSearchParams<{
    code: string;
  }>();

  const orderInvoice = useOrderInvoice.use.orderInvoice();
  const { header } = orderInvoice || {};
  const { status, picker, orderTime, deliveryAddress, statusName, amount, customer, deliveryTimeRange, tags, payment } = header || {};

  const shouldDisplayPicker = useMemo(() => {
    return picker?.username && picker?.name;
  }, [picker]);

  const config = useConfig.use.config();
  const orderTags = config?.orderTags || [];

  return (
    <View className='bg-white mx-4 px-4 py-3' style={styles.box}>
      <View className='flex flex-row items-center gap-2 flex-wrap'>
        <View style={{ minWidth: COL_LEFT_WIDTH }}><Text className='text-base font-medium'>{code}</Text></View>
        <View className='flex flex-row gap-1 flex-wrap'>
          {tags?.map((tag: string, index: number) => {
            const tagName = getConfigNameById(orderTags, tag)
            return <>
              <Badge key={index} label={tagName as string} variant={ORDER_STATUS_BADGE_VARIANT[tag as keyof typeof ORDER_STATUS_BADGE_VARIANT] as any} className="self-start rounded-md px-1"/>
            </>
          })}
        </View>
      </View>
      <View className='flex gap-2 mt-3'>
        <View className='flex flex-row items-center'>
          <View style={{ width: COL_LEFT_WIDTH }}><Text className='text-gray-500'>Trạng thái</Text></View>
          <Badge
            label={statusName as string}
            extraLabel={
              <Text className="text-xs text-contentPrimary"> | &nbsp;
                {moment(orderTime).fromNow()}
              </Text>
            }
            variant={toLower(status as string) as any}
          />
        </View>
        <View className='flex flex-row items-center'>
          <View style={{ width: COL_LEFT_WIDTH }}><Text className='text-gray-500'>COD</Text></View>
          <Text>{payment?.method === "CASH_ON_DELIVERY" ? formatCurrency(amount, { unit: true }) : '0 đ'}</Text>
        </View>
        <View className='flex flex-row items-center'>
          <View style={{ width: COL_LEFT_WIDTH }}><Text className='text-gray-500'>Khách hàng</Text></View> 
          <Text>{customer?.name}</Text>
        </View>
        <View className='flex flex-row items-center'>
          <View style={{ width: COL_LEFT_WIDTH }}>
            <Text className='text-gray-500'>Giờ giao</Text>
          </View>
          <Text>
            {deliveryTimeRange && expectedDeliveryTime(deliveryTimeRange).hh}
            {deliveryTimeRange && ' - '}
            {deliveryTimeRange && expectedDeliveryTime(deliveryTimeRange).day}
            {!deliveryTimeRange && "--"}
          </Text>
        </View>
        <View className='flex flex-row'>
          <View style={{ width: COL_LEFT_WIDTH }}>
            <Text className='text-gray-500'>NV Pick</Text>
          </View>
          <View className='flex-1'>
            {shouldDisplayPicker ? <Text numberOfLines={2} ellipsizeMode='tail'>{picker?.username?.toUpperCase()} - {picker?.name}</Text> : <Text className='text-gray-500'>--</Text>}
          </View>
        </View>
        <View className='flex flex-row'>
          <View style={{ width: COL_LEFT_WIDTH }}>
            <Text className='text-gray-500'>ĐC giao hàng</Text>
          </View>
          <View className='flex-1'>
            <Text numberOfLines={2} ellipsizeMode='tail'>{deliveryAddress?.fullAddress}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 5,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#222',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        shadowColor: '#222',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.4,
        shadowRadius: 5.46,
        elevation: 2,
      },
    }),
  },
});

export default InvoiceInfo