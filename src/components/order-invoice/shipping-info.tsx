import React from 'react'
import { StyleSheet, View, Text, Platform, Pressable, Linking } from 'react-native'
import { useOrderInvoice } from '~/src/core/store/order-invoice';
import Entypo from '@expo/vector-icons/Entypo';
const COL_LEFT_WIDTH = 105;

const ShippingInfo = () => {
  const orderInvoice = useOrderInvoice.use.orderInvoice();
  const { header } = orderInvoice || {};
  const { shipping  } = header || {};

  return (
    <View className='bg-white mx-4 px-4 py-3 gap-2' style={styles.box}> 
      <View className='flex flex-row items-center gap-2'>
        <View style={{ width: COL_LEFT_WIDTH }}><Text className='font-semibold'>Vận chuyển</Text></View>
        <View className='flex-1 flex flex-row items-center gap-2'>
          <Pressable onPress={() => Linking.openURL(shipping?.trackingLink || '')}>
            <Text className='text-sm text-orange-500'>{shipping?.trackingNumber || '--'}</Text>  
          </Pressable>
          {shipping?.trackingNumber && <Entypo name="chevron-small-right" size={20} color="gray" />}
        </View>
      </View>
      <View className='flex flex-row items-center gap-2'>
        <View style={{ width: COL_LEFT_WIDTH }}><Text className='text-gray-500'>Kích thước</Text></View>
        <Text className='text-sm'>{shipping?.packageSize || '--'}</Text>
      </View>
      <View className='flex flex-row items-center gap-2'>
        <View style={{ width: COL_LEFT_WIDTH }}><Text className='text-gray-500'>Service</Text></View>
        <Text className='text-sm'>{shipping?.serviceId && shipping?.provider ? `${shipping?.provider} - ${shipping?.serviceId}` : '--'}</Text>
      </View>
      <View className='flex flex-row items-center gap-2'>
        <View style={{ width: COL_LEFT_WIDTH }}><Text className='text-gray-500'>Tài xế</Text></View>
        <Text className='text-sm'>{shipping?.driverName || '--'}</Text>
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
export default ShippingInfo