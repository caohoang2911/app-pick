import React, { useRef } from 'react'
import { StyleSheet, View, Text, Platform } from 'react-native'
import { useOrderInvoice } from '~/src/core/store/order-invoice';
import TrackingButton from './tracking-button';
const COL_LEFT_WIDTH = 105;

const ShippingInfo = () => {
  const orderInvoice = useOrderInvoice.use.orderInvoice();
  const { header } = orderInvoice || {};
  const { shipping } = header || {};

  return (
    <View className='bg-white mx-4 px-4 py-3 gap-2' style={styles.box}> 
      <View className='flex flex-row items-center gap-2'>
        <View style={{ width: COL_LEFT_WIDTH }}><Text className='font-semibold'>Vận chuyển</Text></View>
        <View className='flex-1 flex flex-row items-center gap-2 justify-between'>
          {shipping?.trackingNumber && (
            <TrackingButton 
              trackingNumber={shipping.trackingNumber} 
              trackingUrl={shipping.trackingLink}
              carrierName={"Tracking mã vận đơn"}
            />
          )}
        </View>
      </View>
      <View className='flex flex-row items-center gap-2'>
        <View style={{ width: COL_LEFT_WIDTH }}><Text className='text-gray-500'>Kích thước</Text></View>
        <View className='flex-1'>
          <Text className='text-sm' numberOfLines={1} ellipsizeMode='tail'>{shipping?.packageName || shipping?.packageSize || '--'}</Text>
        </View>
      </View>
      <View className='flex flex-1 flex-row items-center justify-between gap-2'>
        <View style={{ width: COL_LEFT_WIDTH }}><Text className='text-gray-500'>Service</Text></View>
        <View className='flex-1'>
          <Text className='text-sm' numberOfLines={1} ellipsizeMode='tail'>{shipping?.serviceName || '--'}</Text> 
        </View>
      </View>
      <View className='flex flex-row items-center gap-2'>
        <View style={{ width: COL_LEFT_WIDTH }}><Text className='text-gray-500'>Tài xế</Text></View>
        <View className='flex-1'>
          <Text className='text-sm' numberOfLines={1} ellipsizeMode='tail'>{shipping?.driverName || '--'}</Text>
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
export default ShippingInfo