import React from 'react';
import { View, Text } from 'react-native';
import { GiftPack, Product } from '~/src/types/product';
import OrderPickProduct from './product';

const ProductCombo = ({ giftPack }: { giftPack : GiftPack}) => {

  return (
    <>
      <View className="bg-white border border-orange-200 rounded-md">
        <View className="bg-orange-50 rounded-t-md p-2 py-3">
          <Text className="text-sm text-orange-600 font-bold" numberOfLines={2}>{giftPack.name}</Text>
        </View>
        <View className="gap-2">
          {giftPack.elements?.map((product: Product, index: number) => (
              <OrderPickProduct {...product} isHiddenTag index={index} />
          ))}
        </View>
      </View>
    </>
  );
};

export default ProductCombo;
