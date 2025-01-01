import { useLocalSearchParams } from 'expo-router'
import { toLower } from 'lodash'
import React from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { useOrderInvoice } from '~/src/core/store/order-invoice'
import { expectedDeliveryTime } from '~/src/core/utils/moment'
import { formatCurrency } from '~/src/core/utils/number'
import { Badge } from '../Badge'
import { useConfig } from '~/src/core/store/config'
import { getConfigNameById } from '~/src/core/utils/config'
import moment from 'moment'
import Box from '../Box';


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
  const { status, orderTime, deliveryAddress, statusName, amount, customer, deliveryTimeRange, tags, bagLabels } = header || {};


  console.log('bagLabels', bagLabels);

  const config = useConfig.use.config();
  const orderTags = config?.orderTags || [];

  return (
    <Box>
      <View className='flex flex-row items-center flex-wrap'>
        <View style={{ minWidth: COL_LEFT_WIDTH }}><Text className='text-base font-medium'>{code}</Text></View>
        <View className='flex flex-row gap-1 flex-wrap'>
          {tags?.map((tag: string, index: number) => {
            const tagName = getConfigNameById(orderTags, tag)
            return <>
              <Badge key={index} label={tagName as string} variant={tag?.startsWith("ERROR") ? "danger" : "default"} className="self-start rounded-md"/>
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
            variant={toLower(status) as any}
          />
        </View>
        <RowInfo label="COD" value={formatCurrency(amount, { unit: true })} />
        <RowInfo label="Khách hàng" value={customer?.name || '' } />
        <RowInfo label="SDT" value={customer?.phone.slice(customer?.phone.length - 4) || ''} />
        <RowInfo label="Giờ giao" value={deliveryTimeRange && expectedDeliveryTime(deliveryTimeRange).hh || ''} />
        <View className='flex flex-row'>
          <View style={{ width: COL_LEFT_WIDTH }}>
            <Text className='text-gray-500'>ĐC giao hàng</Text>
          </View>
          <View className='flex-1'>
            <Text numberOfLines={2} ellipsizeMode='tail'>{deliveryAddress?.fullAddress}</Text>
          </View>
        </View>
        <RowInfo label="Tổng số túi" value={bagLabels?.length || 0} />
      </View>
    </Box>
  )
}

export default InvoiceInfo;