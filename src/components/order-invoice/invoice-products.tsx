import { Image } from 'expo-image';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

const ProductItem = () => {
  return (
    <View className='flex flex-row justify-between items-center py-2 px-2'>
     <View className='flex flex-row gap-1'>
        <Image
          style={{ width: 64, height: 64 }}
          source={"https://bizweb.dktcdn.net/thumb/1024x1024/100/416/540/products/co-duong-220ml-1.jpg?v=1694770148113"}
          placeholder={{ blurhash }}
          contentFit="cover"
          transition={1000}
        />
        <View className='flex flex-col gap-3'>
          <Text>8938503131995</Text>
          <Text>Lê Nâu Singo </Text>
        </View>
     </View>
     <Text>0.5kg</Text>
    </View>
  )
}

const InvoiceProducts = () => {
  return (
    <View className='bg-white mx-4 mb-4' style={styles.box}>
      <ProductItem />
      <View className='border-b border-gray-200' />
      <ProductItem />
      <View className='border-b border-gray-200' />
      <ProductItem />
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