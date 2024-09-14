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

const InvoiceInfo = () => {
  const { code } = useLocalSearchParams<{
    code: string;
  }>();

  const orderInvoice = useOrderInvoice.use.orderInvoice();
  const { header, delivery } = orderInvoice || {};
  const { status, deliveryAddress, statusName, amount, customer, expectedDeliveryTimeRange, tags } = header || {};


  const config = useConfig.use.config();
  const orderTags = config?.orderTags || [];

  return (
    <View className='bg-white mx-4 px-4 py-3' style={styles.box}>
      <View className='flex flex-row items-center gap-2 flex-wrap'>
        <Text className='text-lg font-medium'>{code}</Text>
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
        <View className='flex flex-row gap-2 items-center'>
          <Text className='text-gray-500'>Trạng thái: </Text>
          <Badge className="self-start" label={statusName as string} variant={toLower(status as string) as any} />
        </View>
        <Text>
          <Text className='text-gray-500'>COD: </Text>
          <Text>{formatCurrency(amount, { unit: true })}</Text>
        </Text>
        <Text>
          <Text className='text-gray-500'>Khách hàng: </Text>
          <Text>{customer?.name}</Text>
        </Text>
        <Text>
          <Text className='text-gray-500'>Giờ giao: </Text>
          <Text>
            {expectedDeliveryTimeRange && expectedDeliveryTime(expectedDeliveryTimeRange).hh}
            {expectedDeliveryTimeRange && ' - '}
            {expectedDeliveryTimeRange && expectedDeliveryTime(expectedDeliveryTimeRange).day}
          </Text>
        </Text>
        <Text>
          <Text className='text-gray-500'>Địa chỉ giao hàng: </Text>
          <Text>{deliveryAddress?.fullAddress}</Text>
        </Text>
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