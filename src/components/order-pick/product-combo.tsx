import React, { Fragment, useMemo } from 'react';
import { Text, View } from 'react-native';
import { toggleConfirmationRemoveProductCombo } from '~/src/core/store/order-pick';
import { Product, ProductItemGroup } from '~/src/types/product';
import OrderPickProduct from './product';
import { ProductComboConfirmation } from './product-combo-cofirmation';

const ProductCombo = ({combo, statusOrder, pickingBarcode, indexBarcodeWithoutPickedTime}: {combo: ProductItemGroup, statusOrder: string, pickingBarcode: string, indexBarcodeWithoutPickedTime?: number}) => {

  const { elementRatio }  = combo || {};

  const isPickDoneCombo = useMemo(() => {
    return combo.elements?.filter((product: Product) => product.sellPrice).every((product: Product) => product.pickedTime);
  }, [combo.elements]);

  const pickedQuantityCombo = useMemo(() => {
    return Math.min(...combo.elements?.filter((product: Product) => product.sellPrice).map((product: Product) => product.pickedQuantity ? product.pickedQuantity / elementRatio[product.barcode as string] : 0) || [0]);
  }, [combo.elements, elementRatio]);


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
        <View className="gap-2 p-2">
          {combo.elements?.map((product: Product, index: number) => (
            <Fragment key={product.id || product.barcode || `combo-element-${index}`}>  
              <OrderPickProduct {...product} isHiddenTag statusOrder={statusOrder} pickingBarcode={pickingBarcode} indexBarcodeWithoutPickedTime={indexBarcodeWithoutPickedTime} />
            </Fragment>
          ))}
        </View>
      </View>
      {/*BOTTOM SHEET CONFIRMATION REMOVE PRODUCT COMBO */}
      <ProductComboConfirmation />
    </>
  );
};

export default ProductCombo;
