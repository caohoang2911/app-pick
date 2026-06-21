import React, { Fragment, memo, useMemo } from 'react';
import { Text, View } from 'react-native';
import { Product, ProductItemGroup } from '~/src/types/product';
import OrderPickProduct from './product';

const COMBO_COLOR = '#7F7F7F';

const ProductCombo = ({
  combo,
  statusOrder,
}: {
  combo: ProductItemGroup;
  statusOrder: string;
}) => {
  const { elementRatio } = combo || {};

  const isPickDoneCombo = useMemo(() => {
    return combo.elements
      ?.filter((product: Product) => product.sellPrice)
      .every((product: Product) => product.pickedTime);
  }, [combo.elements]);

  const pickedQuantityCombo = useMemo(() => {
    return Math.min(
      ...(combo.elements
        ?.filter((product: Product) => product.sellPrice)
        .map((product: Product) =>
          product.pickedQuantity
            ? product.pickedQuantity / elementRatio[product.barcode as string]
            : 0,
        ) || [0]),
    );
  }, [combo.elements, elementRatio]);

  return (
    <>
      <View
        className="rounded-md border"
        style={{ backgroundColor: COMBO_COLOR, borderColor: COMBO_COLOR }}
      >
        <View
          className="rounded-t-md p-2 py-3"
          style={{ backgroundColor: COMBO_COLOR }}
        >
          <Text className="text-base text-white font-bold" numberOfLines={2}>
            {combo.name}
          </Text>
          <View className="flex flex-row items-center gap-2 justify-between">
            <Text className="text-sm text-white font-medium mt-2">
              <Text className="text-gray-200">Số lượng đặt: </Text>{' '}
              <Text className="font-bold">{combo.quantity || 0}</Text>
            </Text>
            <Text className="text-sm text-white font-medium">
              <Text className="text-gray-200">Thực pick: </Text>{' '}
              <Text className="font-bold">
                {isPickDoneCombo && !isNaN(pickedQuantityCombo)
                  ? Math.floor(pickedQuantityCombo)
                  : 0}
              </Text>
            </Text>
          </View>
        </View>
        <View className="gap-2 p-2">
          {combo.elements?.map((product: Product, index: number) => (
            <Fragment
              key={product.id || product.barcode || `combo-element-${index}`}
            >
              <OrderPickProduct
                {...product}
                isHiddenTag
                statusOrder={statusOrder}
              />
            </Fragment>
          ))}
        </View>
      </View>
    </>
  );
};

export default memo(ProductCombo);
