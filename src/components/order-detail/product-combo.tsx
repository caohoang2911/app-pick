import { SimpleLineIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { toggleConfirmationRemoveProductCombo } from '~/src/core/store/order-pick';
import { Product, ProductItemGroup } from '~/src/types/product';
import OrderPickProduct from './product';
import { ProductComboConfirmation } from './product-combo-cofirmation';

const ProductCombo = ({combo}: {combo: ProductItemGroup}) => {

  const handleConfimationRemoveProductItem = (product: Product) => {
    toggleConfirmationRemoveProductCombo(true, product);
  };

  return (
    <>
      <View className="bg-white border border-blue-200 rounded-md">
        <View className="bg-blue-50 rounded-t-md p-2 py-3">
          <Text className="text-sm blue text-blue-600 font-bold" numberOfLines={2}>{combo.name}</Text>
          <Text className="text-sm blue font-medium mt-2">Số lượng đặt {combo.quantity || 0}</Text>
          <Text className="text-sm blue font-medium">Thự tế pick 0</Text>
        </View>
        <View className="gap-2">
          {combo.elements?.map((product: Product, index: number) => (
            <Swipeable 
              
              renderRightActions={() => 
              <TouchableOpacity onPress={() => handleConfimationRemoveProductItem(product)}>
                <View className="bg-red-200 p-5 h-full justify-center items-center">
                  <SimpleLineIcons name="trash" size={24} color="red" />
                </View>
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
