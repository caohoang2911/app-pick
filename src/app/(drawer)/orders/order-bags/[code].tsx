import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { ScrollView } from 'react-native-gesture-handler';
import { useOrderDetailForCode } from '~/src/api/app-pick/use-get-order-detail';
import { useSetOrderBagLabels } from '~/src/api/app-pick/use-set-order-bag-labels';
import { queryClient } from '~/src/api/shared';
import { Button } from '~/src/components/Button';
import Loading from '~/src/components/Loading';
import BagQuantities from '~/src/components/order-bags/bag-quantities';
import Bags from '~/src/components/order-bags/bags';
import HeaderBag from '~/src/components/order-bags/header-bag';
import { SectionAlert } from '~/src/components/SectionAlert';
import { PackageSizePicker } from '~/src/components/shared/package-size-picker';
import { hideAlert, showAlert } from '~/src/core/store/alert-dialog';
import { setLoading } from '~/src/core/store/loading';
import {
  setHasUpdateOrderBagLabels,
  setOrderBags,
  undoLastChange,
  useOrderBag,
} from '~/src/core/store/order-bag';
import { transformBagsData } from '~/src/core/utils/order-bag';

const UNSAVED_BAG_TITLE = 'Chưa lưu túi hàng';
const UNSAVED_BAG_MSG = 'Bạn có thay đổi số túi chưa được lưu. Bạn có muốn tiếp tục không?';

const OrderBags = () => {
  const { code } = useLocalSearchParams<{ code: string }>();
  const navigation = useNavigation();
  const hasBagUnsavedRef = useRef(false);
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

  const { mutate: setOrderBagLabels } = useSetOrderBagLabels((error) => {
    if (error) {
      setLoading(false);
      // Fallback: Undo the last change when there's an error
      undoLastChange();
      queryClient.invalidateQueries({ queryKey: ['orderDetail', code] });
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
      setHasUpdateOrderBagLabels(false);
      setOrderBags(transformBagsData(orderDetail?.header?.bagLabels));
    }
    if (!isOrderDetailLoading && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [orderDetail, isOrderDetailLoading, isInitialLoad]);

  const shipping = orderDetail?.header?.shipping;
  const { packageSize } = shipping || {};

  const handleBagQuantitiesHasChanged = useCallback((hasChanged: boolean) => {
    hasBagUnsavedRef.current = hasChanged;
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove' as any, (e: any) => {
      if (!hasBagUnsavedRef.current) return;
      e.preventDefault();
      showAlert({
        title: UNSAVED_BAG_TITLE,
        message: UNSAVED_BAG_MSG,
        cancelText: 'Ở lại',
        confirmText: 'Thoát',
        onConfirm: () => {
          hideAlert();
          navigation.dispatch(e.data.action);
        },
      });
    });
    return unsubscribe;
  }, [navigation]);

  const doPrintAll = useCallback(() => {
    const messagePackageSize =
      !packageSize &&
      isShowPackageSizePicker &&
      'Vui lòng chọn kích thước gói hàng';
    const message = isDisabledPrintAll
      ? 'Vui lòng thêm tem'
      : messagePackageSize;
    if (message) {
      showMessage({ message, type: 'danger' });
      return;
    }
    router.push(`/orders/print-preview?code=${code}`);
  }, [packageSize, isShowPackageSizePicker, isDisabledPrintAll, code]);

  const handlePrintAll = useCallback(() => {
    if (hasBagUnsavedRef.current) {
      showAlert({
        title: UNSAVED_BAG_TITLE,
        message: UNSAVED_BAG_MSG,
        cancelText: 'Quay lại lưu',
        confirmText: 'Tiếp tục',
        onConfirm: () => {
          hideAlert();
          doPrintAll();
        },
      });
      return;
    }
    doPrintAll();
  }, [doPrintAll]);

  useEffect(() => {
    if (!code || !hasUpdateOrderBagLabels || isInitialLoad) return;

    const mergedOrderBags = [
      ...orderBags.DRY,
      ...orderBags.FRESH,
      ...orderBags.FROZEN,
    ];
    setLoading(true);
    setOrderBagLabels({
      data: mergedOrderBags,
      orderCode: code,
    });
  }, [
    code,
    hasUpdateOrderBagLabels,
    isInitialLoad,
    orderBags.DRY,
    orderBags.FRESH,
    orderBags.FROZEN,
    setOrderBagLabels,
  ]);

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
    <View className="flex-1">
      <ScrollView
        className="flex-1 pt-3"
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View className="flex flex-col gap-4">
          <HeaderBag />
          {isShowPackageSizePicker && <PackageSizePicker />}
          <Bags />
          <BagQuantities onHasChangedChange={handleBagQuantitiesHasChanged} />
        </View>
      </ScrollView>
      <View className="border-t border-gray-200 bg-white pb-4">
        <View className="px-4 py-3 bg-white">
          <Button label="In tất cả" onPress={handlePrintAll} />
        </View>
      </View>
    </View>
  );
};

export default OrderBags;
