import { Image } from 'expo-image';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useOrderInvoice } from '~/src/core/store/order-invoice';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

const ProductItem = ({ image, name, quantity, unit, barcode }: { image: string, name: string, quantity: number, unit: string, barcode: string }) => {
  return (
    <View className='flex flex-row justify-between items-center py-3 px-4'>
     <View className='flex flex-row gap-3 items-center'>
        <Image
          style={{ width: 64, height: 64 }}
          source={image}
          placeholder={{ blurhash }}
          contentFit="cover"
          transition={1000}
        />
        <View className='flex flex-col gap-2 flex-1'>
          <Text numberOfLines={2}>{name}</Text>
          <View className='flex flex-row justify-between items-center'>
            <Text className='text-gray-500'>{barcode}</Text>
            <Text className='self-center text-gray-500'>{quantity} {unit}</Text>
          </View>
        </View>
     </View>
     {/* <Text>{quantity} {unit}</Text> */}
    </View>
  )
}

const InvoiceProducts = () => {
  const orderInvoice = useOrderInvoice.use.orderInvoice();
  const { delivery } = orderInvoice || {};

  const { productItems } = delivery || {};

  return (
    <View className='bg-white mx-4 mb-4' style={styles.box}>
      {productItems?.map((item, index) => (
        <React.Fragment key={item.barcode}>
          <ProductItem 
            image={item.image || ''}
            name={item.name || ''}
            quantity={item.quantity}
            unit={item.unit || ''}
            barcode={item.barcode || ''}
          />
          {index < productItems.length - 1 && <View className='border-b border-gray-200' />}
        </React.Fragment>
      ))}
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

export default InvoiceProducts