import React from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { Badge } from '../Badge'
import { formatCurrency } from '~/src/core/utils/number'
import moment from 'moment'
import { useLocalSearchParams } from 'expo-router'

const InvoiceInfo = () => {
  const { code } = useLocalSearchParams<{
    code: string;
  }>();

  return (
    <View className='bg-white mx-4 px-4 py-2' style={styles.box}>
      <View className='flex flex-row items-center gap-2'>
        <Text className='text-lg font-medium'>{code}</Text>
        <Badge label={'Home delivery'} variant={'secondary'} />
      </View>
      <View className='flex gap-2 mt-3'>
        <Text>
          <Text className='text-gray-500'>Trạng thái: </Text>
          <Text>Hoàn thành</Text>
        </Text>
        <Text>
          <Text className='text-gray-500'>COD: </Text>
          <Text>{formatCurrency(100000, { unit: true })}</Text>
        </Text>
        <Text>
          <Text className='text-gray-500'>Khách hàng: </Text>
          <Text>Cao Hoàng</Text>
        </Text>
        <Text>
          <Text className='text-gray-500'>Giờ giao: </Text>
          <Text>{moment(new Date()).format('DD/MM/YYYY HH:mm')}</Text>
        </Text>
        <Text>
          <Text className='text-gray-500'>Địa chỉ giao hàng: </Text>
          <Text>The 678 Building, 67 Hoàng Văn Thái, Tân Phú, Quận 7, Hồ Chí Minh</Text>
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