import { Button } from '@/components/Button';
import { useGlobalSearchParams } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useSetOrderStatusPacked } from '~/src/api/app-pick/use-set-order-status-packed';
import { useSetOrderStatusPicking } from '~/src/api/app-pick/use-set-order-status-picking';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { useOrderPick } from '~/src/core/store/order-pick';
import { getOrderPickProductsFlat } from '~/src/core/utils/order-bag';
import { OrderDetail } from '~/src/types/order-detail';
import { Product } from '~/src/types/product';

const ActionsBottom = () => {

  const {
    mutate: setOrderStatusPicking,
    isPending: isLoadingOrderStatusPicking,
  } = useSetOrderStatusPicking();

  const {
    mutate: setOrderStatusPacked,
    isPending: isLoadingOrderStatusPacked,
  } = useSetOrderStatusPacked();

  const { code } = useGlobalSearchParams<{ code: string }>();

  const orderPickProducts = useOrderPick.use.orderPickProducts();

  const orderPickProductsFlat  = getOrderPickProductsFlat(orderPickProducts) 
  const orderDetail: OrderDetail = useOrderPick.use.orderDetail();

  const { shipping } = orderDetail?.header || {};
  const { header } = orderDetail || {};
  const { status } = header || {};

  const canCompletePick = useMemo(() => {
    return orderPickProductsFlat.filter((product: Product) => {
      return !product.pickedTime && Number(product.sellPrice) > 0;
    })?.length === 0;
  }, [orderPickProductsFlat]);

  const disableButton = () => {
    if (status === 'CONFIRMED') return false;
    if (canCompletePick && status === 'STORE_PICKING' &&  shipping?.packageSize) return false;

    return true;
  };

  const title = status !== 'STORE_PICKING' ? 'Xác nhận bắt đầu pick hàng' : 'Xác nhận đã pick hàng xong';
  const message = status !== 'STORE_PICKING' ? 'Nút scan sản phẩm sẽ được bật khi xác nhận pick hàng' : '';

  // console.log(orderPickProductsFlat.length, "BB")

  const handlePick = () => {
    showAlert({title, message, onConfirm: () => {
      console.log(orderPickProductsFlat.length, "B33B")
      status === 'STORE_PICKING'
        ? setOrderStatusPacked({ orderCode: code})
        : setOrderStatusPicking({ orderCode: code });
        hideAlert();
    }});
  };

  if (!['CONFIRMED', 'STORE_PICKING'].includes(status as string)) return <></>;
  return (
    <View className="border-t border-gray-200 pb-4">
      <View className="px-4 py-3 bg-white ">
        <Button
          loading={isLoadingOrderStatusPacked || isLoadingOrderStatusPicking}
          onPress={handlePick}
          disabled={disableButton()}
          label={status === 'STORE_PICKING' ? 'Đã pick xong' : 'Bắt đầu pick'}
        />
      </View>
    </View>
  );
};

export default ActionsBottom;
