import { useLocalSearchParams } from 'expo-router'
import { toLower } from 'lodash'
import React from 'react'
import { Text, View } from 'react-native'
import { ORDER_STATUS_BADGE_VARIANT } from '~/src/contants/order'
import { useConfig } from '~/src/core/store/config'
import { useOrderInvoice } from '~/src/core/store/order-invoice'
import { getConfigNameById } from '~/src/core/utils/config'
import { expectedDeliveryTime, getRelativeTime } from '~/src/core/utils/moment'
import { formatCurrency } from '~/src/core/utils/number'
import { Badge } from '../Badge'
import Box from '../Box'


const COL_LEFT_WIDTH = 105;

const RowInfo = ({label, value}: {label: string, value: string | number}) => {
  return (
    <View className='flex flex-row items-center'>
      <View style={{ width: COL_LEFT_WIDTH }}><Text className='text-gray-500'>{label}</Text></View> 
      <Text>{value}</Text>
    </View>
  )
}

const InvoiceInfo = () => {
  const { code } = useLocalSearchParams<{
    code: string;
  }>();

  const orderInvoice = useOrderInvoice.use.orderInvoice();
  const { header } = orderInvoice || {};
  const { status, payment, orderTime, deliveryAddress, statusName, amount, customer, deliveryTimeRange, tags, bagLabels } = header || {};


  const config = useConfig.use.config();
  const orderTags = config?.orderTags || [];

  const formattedDeliveryTimeRange = deliveryTimeRange ? `${expectedDeliveryTime(deliveryTimeRange).hh} ${expectedDeliveryTime(deliveryTimeRange).day}` : "--";

  return (
    <Box>
      <View className='flex flex-row items-center flex-wrap'>
        <View className='flex flex-row items-center justify-between gap-2 w-full'>
          <Text className='text-base font-medium'>{code}</Text>
          <Badge
            label={statusName as string}
            extraLabel={
              <Text className="text-xs text-contentPrimary"> | &nbsp;
                {getRelativeTime(orderTime)}
              </Text>
            } 
            variant={toLower(status as string) as any}
          />  
        </View>
        <View className='flex flex-row gap-1 flex-wrap mt-4'>
          {tags?.map((tag: string, index: number) => {
            const tagName = getConfigNameById(orderTags, tag)
            return <>
              <Badge key={index} label={tagName as string} variant={ORDER_STATUS_BADGE_VARIANT[tag as keyof typeof ORDER_STATUS_BADGE_VARIANT] as any} className="self-start rounded-md px-1"/>
            </>
          })}
        </View>
      </View> 
      <View className='flex gap-2 mt-3'>
        <RowInfo label={payment?.methodName || '--'} value={formatCurrency(amount, { unit: true })} />
        <RowInfo label="Khách hàng" value={customer?.name || '' } />
        <RowInfo label="SDT" value={customer?.phone || ''} />
        <RowInfo label="Giờ giao" value={formattedDeliveryTimeRange} />
        <View className='flex flex-row'>
          <View style={{ width: COL_LEFT_WIDTH }}>
            <Text className='text-gray-500'>ĐC giao hàng</Text>
          </View>
          <View className='flex-1'>
            <Text numberOfLines={1} ellipsizeMode='tail'>{deliveryAddress?.fullAddress}</Text>
          </View>
        </View>
      </View>
    </Box>
  )
}

export default InvoiceInfo;