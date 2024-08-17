import React, { useEffect } from 'react';
import { Alert, View } from 'react-native';
import { Button } from '@/components/Button';
import { useSetOrderStatusPicking } from '~/src/api/app-pick/use-set-order-status-picking';
import { useGlobalSearchParams } from 'expo-router';
import { showMessage } from 'react-native-flash-message';
import { useOrderPick } from '~/src/core/store/order-pick';
import { OrderDetail } from '~/src/types/order-detail';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSetOrderStatusPacked } from '~/src/api/app-pick/use-set-order-status-packed';

const ActionBottom = () => {
  const queryClient = useQueryClient();

  const {
    mutate: setOrderStatusPicking,
    data: orderStatusPickingData,
    isPending: isLoadingOrderStatusPicking,
  } = useSetOrderStatusPicking();

  const {
    mutate: setOrderStatusPacked,
    data: orderStatusPickedData,
    isPending: isLoadingOrderStatusPicked,
  } = useSetOrderStatusPacked();

  const orderPickProducts: any = useOrderPick.use.orderPickProducts();

  const { error } = orderStatusPickingData || orderStatusPickedData || {};

  const { code } = useGlobalSearchParams<{
    code: string;
  }>();

  const data: any = useQuery({ queryKey: ['orderDetail', code] });

  const orderDetail: OrderDetail = data?.data?.data || {};
  const { productItems } = orderDetail?.deliveries?.[0] || {};

  const { header } = orderDetail || {};
  const { status } = header || {};

  const canCompletePick =
    Object.keys(orderPickProducts).filter((key) => {
      return orderPickProducts[key].picked;
    })?.length === productItems?.length;

  const disbleButton = () => {
    if (status === 'CONFIRMED') return false;
    if (canCompletePick && status === 'STORE_PICKING') return false;

    return true;
  };

  useEffect(() => {
    if (error) {
      showMessage({
        message: error as string,
        type: 'danger',
      });
    } else if (orderStatusPickingData || orderStatusPickedData) {
      showMessage({
        message:
          status !== 'STORE_PICKING'
            ? 'Xác nhận pick đơn thành công'
            : 'Đã pick đơn thành công',
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
    }
  }, [orderStatusPickingData, orderStatusPickedData]);

  const handlePick = () => {
    Alert.alert(
      status !== 'STORE_PICKING'
        ? 'Xác nhận bắt đầu pick hàng'
        : 'Xác nhận đã pick hàng xong',
      status !== 'STORE_PICKING'
        ? 'Nút scan sản phẩm sẽ được bật khi xác nhận pick hàng'
        : 'Xác nhận hoàn tất',
      [
        {
          text: 'Quay lại',
          onPress: () => console.log('Cancel Pressed'),
        },
        {
          text: 'Xác nhận',

          onPress: () =>
            status === 'STORE_PICKING'
              ? setOrderStatusPacked({ orderCode: code })
              : setOrderStatusPicking({ orderCode: code }),
        },
      ]
    );
  };

  if (!['CONFIRMED', 'STORE_PICKING'].includes(status as string)) return <></>;
  return (
    <View className="border-t border-gray-200 pb-4">
      <View className="px-4 py-5 bg-white ">
        <Button
          loading={isLoadingOrderStatusPicked || isLoadingOrderStatusPicking}
          onPress={handlePick}
          disabled={disbleButton()}
          label={status === 'STORE_PICKING' ? 'Đã pick xong' : 'Bắt đầu pick'}
        />
      </View>
    </View>
  );
};

export default ActionBottom;
