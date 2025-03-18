import React from 'react';
import { View, Text } from 'react-native';
import { GiftPack, Product } from '~/src/types/product';
import OrderPickProduct from './product';
import { colors } from '~/src/ui/colors';

const ProductCombo = ({ giftPack }: { giftPack : GiftPack}) => {
  const isHasPickedQuantity = giftPack.elements?.some((product: Product) => {
    return product.pickedQuantity === 0 || product.pickedQuantity === null
  });
  return (
    <>
      <View className="bg-white border rounded-md " style={{borderColor: colors.purple[200]}}>
        <View className="bg-orange-50 rounded-t-md p-2 py-3">
          <Text className="text-sm text-orange-600 font-bold" numberOfLines={2}>{giftPack.name}</Text>
        </View>
        <View className="gap-2 p-2">
          {giftPack.elements?.map((product: Product, index: number) => (
            <OrderPickProduct {...product} key={product.id} index={index} disable={isHasPickedQuantity} />
          ))}
        </View>
      </View>
    </>
  );
};

export default ProductCombo;
