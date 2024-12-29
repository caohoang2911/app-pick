import { SimpleLineIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { toggleConfirmationRemoveProductCombo } from '~/src/core/store/order-pick';
import { Product } from '~/src/types/product';
import OrderPickProduct from './product';
import { ProductComboConfirmation } from './product-combo-cofirmation';

const ProductCombo = ({products}: {products: Array<Product>}) => {

  const comboNameByProductName = products.map((product) => {
    return product.name;
  }).join(' và ');


  const handleConfimationRemoveProductItem = (product: Product) => {
    toggleConfirmationRemoveProductCombo(true, product);
  };

  return (
    <>
      <View className="bg-white border shadow-sm shadow-gray-200 border-gray-200 rounded-md">
        <View className="bg-blue-300 rounded-t-md p-2 py-3">
          <Text className="text-sm font-bold" numberOfLines={2}>COMBO {comboNameByProductName}</Text>
        </View>
        <View className="gap-2">
          {products.map((product: Product) => (
            <Swipeable renderRightActions={() => 
              <TouchableOpacity onPress={() => handleConfimationRemoveProductItem(product)} className="bg-red-300 px-5 justify-center items-center">
                <SimpleLineIcons name="trash" size={24} color="red" />
              </TouchableOpacity>
            }>
              <OrderPickProduct {...product} />
            </Swipeable>
            
          ))}
        </View>
      </View>
      {/*BOTTOM SHEET CONFIRMATION REMOVE PRODUCT COMBO */}
      <ProductComboConfirmation />
    </>
  );
};

export default ProductCombo;
