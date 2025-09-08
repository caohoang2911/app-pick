import { Button } from '@/components/Button';
import { router, useGlobalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSetOrderStatusPacked } from '~/src/api/app-pick/use-set-order-status-packed';
import { useSetOrderStatusPicking } from '~/src/api/app-pick/use-set-order-status-picking';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { toggleScanQrCodeProduct, useOrderPick } from '~/src/core/store/order-pick';
import { getOrderPickProductsFlat } from '~/src/core/utils/order-bag';
import { OrderDetail } from '~/src/types/order-detail';
import { Product } from '~/src/types/product';
import PickedCompleteConfirmation from './picked-complete-confirmation';
import { FontAwesome } from '@expo/vector-icons';

const StartPickingButton = ({ onPress, loading }: { onPress: () => void; loading: boolean }) => (
  <Button
    loading={loading}
    onPress={onPress}
    label="Bắt đầu pick"
  />
);

const ScanButton = ({ onPress, loading }: { onPress: () => void; loading: boolean }) => (
  <Button
    loading={loading}
    onPress={onPress}
    icon={<FontAwesome name="qrcode" size={18} color="white" />}
    label="Quét mã"
  />
);

const CompletePickingButton = ({ onPress, loading }: { onPress: () => void; loading: boolean }) => (
  <Button
    loading={loading}
    onPress={onPress}
    label="Đã pick xong"
  />
);

const ActionsBottom = () => {
  const [visible, setVisible] = useState(false);
  const actionRef = useRef<any>(null);

  const {
    mutate: setOrderStatusPicking,
    isPending: isLoadingOrderStatusPicking,
  } = useSetOrderStatusPicking();

  const {
    mutate: setOrderStatusPacked,
    isPending: isLoadingOrderStatusPacked,
  } = useSetOrderStatusPacked(() => {
    showAlertPacked();
  });

  const showAlertPacked = () => {
    showAlert({
      message: 'Đã pick xong, bạn có muốn set kích thước & in tem',
      onConfirm: () => {
        router.push(`orders/order-bags/${code}`);
        hideAlert();
      },
      isHideCancelButton: true,
    })
  }

  const { code } = useGlobalSearchParams<{ code: string }>();

  const orderPickProducts = useOrderPick.use.orderPickProducts();

  const orderPickProductsFlat  = getOrderPickProductsFlat(orderPickProducts) 
  const orderDetail: OrderDetail = useOrderPick.use.orderDetail();

  const { shipping } = orderDetail?.header || {};
  const { header } = orderDetail || {};
  const { status } = header || {};

  const canCompletePick = useMemo(() => {
    return orderPickProductsFlat.filter((product: Product) => {
      return !product.pickedTime;
    })?.length === 0;
  }, [orderPickProductsFlat]);

  const isShowScanButton = () => {
    if (status === 'CONFIRMED') return false;
    if (canCompletePick && status === 'STORE_PICKING') return false;

    return true;
  };

  const title = status !== 'STORE_PICKING' ? 'Xác nhận bắt đầu pick hàng' : 'Xác nhận đã pick hàng xong';
  const message = status !== 'STORE_PICKING' ? 'Nút scan sản phẩm sẽ được bật khi xác nhận pick hàng' : '';

  const productFulfillError = orderPickProductsFlat.filter((item: Product) => Number(item.quantity || 0) !== Number(item.pickedQuantity || 0));

  const onConfirm = () => {
    hideAlert();
    if (status === 'STORE_PICKING') {
      setOrderStatusPacked({ orderCode: code});
    } else {
      setOrderStatusPicking({ orderCode: code });
    }
  }

  const handlePick = () => {
    if(isShowScanButton()) {
      toggleScanQrCodeProduct(true);
      return;
    }
    if (productFulfillError.length > 0 && status === 'STORE_PICKING') {
      actionRef.current?.present();
      setVisible(true);
    } else {
      showAlert({title, message, onConfirm: () => onConfirm()});
    }
  }

  const renderButton = () => {
    const loading = isLoadingOrderStatusPacked || isLoadingOrderStatusPicking;

    if (status === 'CONFIRMED') {
      return <StartPickingButton onPress={handlePick} loading={loading} />;
    }

    if (status === 'STORE_PICKING') {
      if (isShowScanButton()) {
        return <ScanButton onPress={handlePick} loading={loading} />;
      }
      return <CompletePickingButton onPress={handlePick} loading={loading} />;
    }

    return null;
  };

  if (!['CONFIRMED', 'STORE_PICKING'].includes(status as string)) return <></>;
  return (
    <View className="border-t border-gray-200 pb-4">
      <View className="px-4 py-3 bg-white ">
        {renderButton()}
      </View>
      <PickedCompleteConfirmation
        visible={visible}
        setVisible={setVisible}
        actionRef={actionRef}
        onConfirm={onConfirm}
        productFulfillError={productFulfillError}
      />
    </View>
  );
};

export default ActionsBottom;

