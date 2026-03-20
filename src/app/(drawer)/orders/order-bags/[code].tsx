import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { ScrollView } from 'react-native-gesture-handler';
import { useOrderDetailForCode } from '~/src/api/app-pick/use-get-order-detail';
import { useUpdateOrderBagLabels } from '~/src/api/app-pick/use-update-order-bag-labels';
import { queryClient } from '~/src/api/shared';
import { Button } from '~/src/components/Button';
import Loading from '~/src/components/Loading';
import Bags from '~/src/components/order-bags/bags';
import HeaderBag from '~/src/components/order-bags/header-bag';
import { SectionAlert } from '~/src/components/SectionAlert';
import { PackageSizePicker } from '~/src/components/shared/package-size-picker';
import { setLoading } from '~/src/core/store/loading';
import {
  setOrderDetail,
  undoLastChange,
  useOrderBag,
} from '~/src/core/store/order-bag';
import { OrderDetailHeader } from '~/src/types/order-pick';

const OrderBags = () => {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { isOrderDetailLoading, orderDetailError, orderDetail } =
    useOrderDetailForCode(code);
  const hasUpdateOrderBagLabels = useOrderBag.use.hasUpdateOrderBagLabels();

  const orderBags = useOrderBag.use.orderBags();

  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  const deliveryType = orderDetail?.header?.deliveryType;

  const isShowPackageSizePicker = ![
    'CUSTOMER_PICKUP',
    'APARTMENT_COMPLEX_DELIVERY',
  ].includes(deliveryType || '');

  const isDisabledPrintAll =
    orderBags.DRY.length === 0 &&
    orderBags.FRESH.length === 0 &&
    orderBags.FROZEN.length === 0;

  const { mutate: updateOrderBagLabels } = useUpdateOrderBagLabels((error) => {
    if (error) {
      setLoading(false);
      // Fallback: Undo the last change when there's an error
      undoLastChange();
      queryClient.invalidateQueries({ queryKey: ['order-pick'] });
      showMessage({
        message: `Lỗi cập nhật: ${error}. Đã hoàn tác thay đổi vừa thực hiện.`,
        type: 'danger',
        duration: 4000,
      });
    } else {
      // Success case
    }
  });

  useEffect(() => {
    if (orderDetail) {
      setOrderDetail(orderDetail);
    }
    if (!isOrderDetailLoading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [orderDetail, isOrderDetailLoading, isInitialLoad]);

  const { shipping } = orderDetail?.header as OrderDetailHeader;
  const { packageSize } = shipping || {};

  const handlePrintAll = () => {
    const messagePackageSize =
      !packageSize &&
      isShowPackageSizePicker &&
      'Vui lòng chọn kích thước gói hàng';
    const message = isDisabledPrintAll
      ? 'Vui lòng thêm tem'
      : messagePackageSize;
    if (message) {
      showMessage({
        message,
        type: 'danger',
      });

      return;
    }

    router.push(`/orders/print-preview?code=${code}`);
  };

  useEffect(() => {
    if (hasUpdateOrderBagLabels && !isInitialLoad) {
      const mergedOrderBags = [
        ...orderBags.DRY,
        ...orderBags.FRESH,
        ...orderBags.FROZEN,
      ];
      setLoading(true);
      updateOrderBagLabels({
        data: mergedOrderBags,
        orderCode: code,
      });
    }
  }, [orderBags.DRY, orderBags.FRESH, orderBags.FROZEN, isInitialLoad]);

  if (isOrderDetailLoading) {
    return <Loading />;
  }

  if (orderDetailError) {
    return (
      <SectionAlert variant="danger">
        <Text>{orderDetailError}</Text>
      </SectionAlert>
    );
  }

  return (
    <View className="flex-1 mb-4">
      <ScrollView className="flex-1 pt-3 mb-4">
        <View className="flex flex-col gap-4">
          <HeaderBag />
          {isShowPackageSizePicker && <PackageSizePicker />}
          <Bags />
        </View>
      </ScrollView>
      <View className="border-t border-gray-200 pb-4">
        <View className="px-4 py-3 bg-white ">
          <Button label="In tất cả" onPress={handlePrintAll} />
        </View>
      </View>
    </View>
  );
};

export default OrderBags;
