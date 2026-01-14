import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Image, Pressable, Text, TouchableOpacity, View } from 'react-native';
import {
  setIsVisibleReplaceProduct,
  useOrderPick,
} from '~/src/core/store/order-pick';
import { getOrderPickProductsFlat } from '~/src/core/utils/order-bag';
import { Product } from '~/src/types/product';
import { Button } from '../Button';
import SBottomSheet from '../SBottomSheet';
import { useReplacePickedItem } from '~/src/api/app-pick/use-replace-picked-item';
import { useGlobalSearchParams } from 'expo-router';
import { getConfigNameById } from '~/src/core/utils/config';
import { useConfig } from '~/src/core/store/config';

const ReplacePickedProducts = () => {
  const actionRef = useRef<any>(null);
  const visible = useOrderPick.use.isVisibleReplaceProduct();
  const replacePickedProductId = useOrderPick.use.replacePickedProductId();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );

  const config = useConfig.use.config();
  const productPickedErrorTypes = useMemo(
    () => config?.productPickedErrorTypes || [],
    [config],
  ) as any[];

  const { code } = useGlobalSearchParams<{ code: string }>();

  useEffect(() => {
    setSelectedProductId(replacePickedProductId);
  }, [replacePickedProductId]);

  const handleSelectProduct = (product: Product) => {
    if (product.id === replacePickedProductId) return;
    setSelectedProductId(product.id);
  };

  const orderPickProducts = useOrderPick.use.orderPickProducts();
  const orderPickProductsFlat = useMemo(
    () => getOrderPickProductsFlat(orderPickProducts),
    [orderPickProducts],
  );

  const product = orderPickProductsFlat.find(
    (p: Product) => p.id === replacePickedProductId,
  );

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
      hideHeader
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
        {product &&
          [product, ...substituteItems]?.map((item: Product) => {
            const isReplacedProduct = replacePickedProductId === item.id;
            const isSelectedProduct =
              Number(selectedProductId) === Number(item.id);

            return (
              <>
                {!isReplacedProduct && (
                  <View className="flex-1 flex flex-row items-center mt-4 mb-2 mx-4">
                    <Text className="font-semibold text-lg">
                      Chọn sản phẩm thay thế{' '}
                      <Text className="text-red-500 text-">*</Text>{' '}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  key={item.id}
                  className={`flex flex-row items-center p-3 border-l-4 border-b-gray-200 border-b-2 mb-3 px-2 ${
                    isReplacedProduct
                      ? 'border-l-4 border-l-orange-500/80 bg-gray-50'
                      : 'border-l-transparent'
                  }`}
                  onPress={() => handleSelectProduct(item)}
                >
                  <Image
                    source={
                      item.image
                        ? { uri: item.image }
                        : require('~/assets/default-img.jpg')
                    }
                    style={{ width: 64, height: 64 }}
                    className="rounded-md mr-3"
                    resizeMode="cover"
                  />
                  <View className="flex-1 flex gap-2 justify-center">
                    <Text
                      className={`font-semibold text-base text-gray-600`}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    {isReplacedProduct && (
                      <Text className="text-red-500 font-semibold">
                        {getConfigNameById(
                          productPickedErrorTypes,
                          product?.pickedErrorType,
                        )}
                      </Text>
                    )}
                    {!isReplacedProduct && (
                      <View className="flex-1 flex flex-row items-center gap-3">
                        <View className="flex-row flex-1 justify-between gap-5">
                          <Text className="text-gray-600">
                            Đặt{' '}
                            <Text className="font-bold">
                              {item.quantity} HỘP
                            </Text>
                          </Text>
                          <Text className="text-gray-600">
                            Tồn{' '}
                            <Text className="font-bold">
                              {item.stockAvailable || 0} HỘP
                            </Text>
                          </Text>
                        </View>

                        <Pressable
                          onPress={() => handleSelectProduct(item)}
                          className={`w-6 h-6 rounded-full border-2 mx-4 ${
                            isSelectedProduct
                              ? 'bg-blue-500 border-blue-200'
                              : 'border-gray-100 bg-gray-50'
                          }`}
                        >
                          <View className="w-6 h-6 border-2 border-transparent" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </>
            );
          })}
      </View>
    </SBottomSheet>
  );
};

export default ReplacePickedProducts;
