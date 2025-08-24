import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { setIsVisibleReplaceProduct, useOrderPick } from '~/src/core/store/order-pick';
import { getOrderPickProductsFlat } from '~/src/core/utils/order-bag';
import { Product } from '~/src/types/product';
import { Button } from '../Button';
import SBottomSheet from '../SBottomSheet';
import { useReplacePickedItem } from '~/src/api/app-pick/use-replace-picked-item';
import { useGlobalSearchParams } from 'expo-router';

const ReplacePickedProducts = () => {
  const actionRef = useRef<any>(null);
  const visible = useOrderPick.use.isVisibleReplaceProduct();
  const replacePickedProductId = useOrderPick.use.replacePickedProductId();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const { code } = useGlobalSearchParams<{ code: string }>();

  useEffect(() => {
    setSelectedProductId(replacePickedProductId);
  }, [replacePickedProductId]);

  const handleSelectProduct = (product: Product) => {
    if (product.id === replacePickedProductId) return;
    setSelectedProductId(product.id);
  };
  
  const orderPickProducts = useOrderPick.use.orderPickProducts();
  const orderPickProductsFlat = useMemo(() => getOrderPickProductsFlat(orderPickProducts), [orderPickProducts]);

  const product = orderPickProductsFlat.find((p: Product) => p.id === replacePickedProductId);

  const substituteItems = product?.substituteItems || [];

  const { mutate: replacePickedItem, isPending } = useReplacePickedItem(() => {
    setIsVisibleReplaceProduct(false);
    actionRef.current?.dismiss();
    setSelectedProductId(null);
  });


  useEffect(() => {
    if (visible) {
      actionRef.current?.present();
    }
  }, [visible]);

  const handleConfirmReplace = useCallback(() => {
    if (!replacePickedProductId || !selectedProductId) return;
    replacePickedItem({
      orderCode: code,
      replacedItemId: selectedProductId,
      pickedItemId: replacePickedProductId,
    });
  }, [replacePickedProductId, selectedProductId, code]);

  return (
    <SBottomSheet
      visible={visible}
      title="Chọn sản phẩm thay thế"
      ref={actionRef}
      snapPoints={['80%']}
      onClose={() => {
        setIsVisibleReplaceProduct(false);
        setSelectedProductId(null);
      }}
      extraButton={
        <View className="flex gap-3 mt-auto mb-10 px-4">
          <Button
            label="Xác nhận thay thế"
            disabled={!selectedProductId}
            loading={isPending}
            onPress={handleConfirmReplace}
          />
        </View>
      }
    >
      <View className="flex-1 mb-4">
        {product && [product, ...substituteItems]?.map((item: Product) => (
          <TouchableOpacity 
            key={item.id} 
            className={`flex flex-row items-center p-3 border-l-4 border-b-gray-200 border-b-2 mb-3 px-2 ${replacePickedProductId === item.id ? 'border-l-4 border-l-orange-500/80 bg-gray-50' : 'border-l-transparent'}`}
            onPress={() => handleSelectProduct(item)}
          >
            <Image 
              source={item.image ? { uri: item.image } : require('~/assets/default-img.jpg')}
              className="w-16 h-16 rounded-md mr-3"
              resizeMode="cover"
            />
            <View className="flex-1 flex gap-3">
              <Text className={`font-semibold text-base ${replacePickedProductId === item.id ? 'text-orange-500' : 'text-gray-600'}`} numberOfLines={2}>
                {item.name}
              </Text>
              <View className="flex-1 flex flex-row items-center justify-between gap-3">
                <View className="flex-row flex-1 justify-between gap-5">
                  <Text className="text-gray-600">
                    Đặt <Text className="font-bold">{item.quantity} HỘP</Text>
                  </Text>
                  <Text className="text-gray-600">
                    Tồn <Text className="font-bold">{item.stockAvailable || 0} HỘP</Text>
                  </Text>
                </View>
                {replacePickedProductId !== item.id ? 
                  <Pressable
                    onPress={() => handleSelectProduct(item)}
                    className={`w-6 h-6 rounded-full border-2 mx-4 ${
                      Number(selectedProductId) === Number(item.id) 
                        ? 'bg-blue-500 border-blue-200' 
                        : 'border-gray-300 bg-gray-200'
                    }`} 
                  >
                    <View className="w-6 h-6 border-2 border-transparent" />
                  </Pressable> : 
                  <View className="w-6 h-6 border-2 border-transparent mx-4" />
                }
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </SBottomSheet>
  )
}

export default ReplacePickedProducts;