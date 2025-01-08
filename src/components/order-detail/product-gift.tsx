import React from 'react';
import { View } from 'react-native';
import { GiftPack, Product } from '~/src/types/product';
import OrderPickProduct from './product';
import { ProductComboConfirmation } from './product-combo-cofirmation';

const ProductCombo = ({ giftPack }: { giftPack : GiftPack}) => {

  return (
    <>
      <View className="rounded-md">
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
