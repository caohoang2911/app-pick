import { SimpleLineIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
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

  const { elementPerComboQuantities }  = combo || {};

  const isPickDoneCombo = useMemo(() => {
    return combo.elements?.every((product: Product) => product.pickedTime);
  }, [combo.elements]);

  const pickedQuantityCombo = useMemo(() => {
    return Math.min(...combo.elements?.map((product: Product) => product.pickedQuantity ? product.pickedQuantity / elementPerComboQuantities[product.barcode as string] : 0) || [0]);
  }, [combo.elements, elementPerComboQuantities]);

  console.log(pickedQuantityCombo, "pickedQuantityCombo");
  console.log(isPickDoneCombo, "isPickDoneCombo");

  return (
    <>
      <View className="bg-white border border-blue-200 rounded-md">
        <View className="bg-blue-50 rounded-t-md p-2 py-3">
          <Text className="text-sm text-blue-600 font-bold" numberOfLines={2}>{combo.name}</Text>
          <View className="flex flex-row items-center gap-2 justify-between">
            <Text className="text-sm text-blue-500 font-medium mt-2"><Text className="text-gray-500">Số lượng đặt: </Text> {combo.quantity || 0}</Text>
            <Text className="text-sm text-blue-500 font-medium"><Text className="text-gray-500">Thực pick: </Text> {isPickDoneCombo && !isNaN(pickedQuantityCombo) ? Math.floor(pickedQuantityCombo) : 0}</Text>
          </View>
        </View>
        <View className="gap-2">
          {combo.elements?.map((product: Product, index: number) => (
            // <Swipeable 
            //   renderRightActions={() => 
            //   <TouchableOpacity onPress={() => handleConfimationRemoveProductItem(product)}>
            //     <View className="bg-red-200 p-5 h-full justify-center items-center">
            //       <SimpleLineIcons name="trash" size={24} color="red" />
            //     </View>
            //   </TouchableOpacity>
            // }> // TODO: add swipeable
              <OrderPickProduct {...product} isHiddenTag />
            // </Swipeable>
          ))}
        </View>
      </View>
      {/*BOTTOM SHEET CONFIRMATION REMOVE PRODUCT COMBO */}
      <ProductComboConfirmation />
    </>
  );
};

export default ProductCombo;
