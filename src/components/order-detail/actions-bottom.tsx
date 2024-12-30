import { Button } from '@/components/Button';
import { useGlobalSearchParams } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { G } from 'react-native-svg';
import { useSetOrderStatusPacked } from '~/src/api/app-pick/use-set-order-status-packed';
import { useSetOrderStatusPicking } from '~/src/api/app-pick/use-set-order-status-picking';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { getOrderPickProductsFlat, useOrderPick } from '~/src/core/store/order-pick';
import { OrderDetail } from '~/src/types/order-detail';

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

  const orderPickProductsFlat : any = getOrderPickProductsFlat();
  const orderDetail: OrderDetail = useOrderPick.use.orderDetail();
  const { productItems } = orderDetail?.delivery || {};

  const { header } = orderDetail || {};
  const { status } = header || {};

  const canCompletePick =
    Object.keys(orderPickProductsFlat).filter((key) => {
      return orderPickProductsFlat[key].pickedTime;
    })?.length === productItems?.length;

  const disableButton = () => {
    if (status === 'CONFIRMED') return false;
    if (canCompletePick && status === 'STORE_PICKING') return false;

    return true;
  };

  const title = status !== 'STORE_PICKING' ? 'Xác nhận bắt đầu pick hàng' : 'Xác nhận đã pick hàng xong';
  const message = status !== 'STORE_PICKING' ? 'Nút scan sản phẩm sẽ được bật khi xác nhận pick hàng' : '';

  const handlePick = () => {
    showAlert({title, message, onConfirm: () => {
      status === 'STORE_PICKING'
        ? setOrderStatusPacked({ pickedItems: Object.values(orderPickProductsFlat).map((item: any) => ({
          ...item,
          name: item.name || '',
          quantity: item.quantity || 0,
          barcode: item.barcode || '',
          pickedQuantity: item.pickedQuantity || 0,
          pickedError: item.pickedError || '',
          pickedNote: item.pickedNote || '',
        })), orderCode: code})
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
