import { router } from 'expo-router';
import { showMessage } from 'react-native-flash-message';
import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { setLoading } from '~/src/core/store/loading';
import { queryClient } from '~/src/api/shared/api-provider';
import { useAssignOrderShippingToMe } from '~/src/api/app-pick-driver/useAssignOrderShippingToMe';
import { useDriverCancelMyOrderShipping } from '~/src/api/app-pick-driver/useDriverCancelMyOrderShipping';
import { useRoleDriver } from '~/src/core/hooks/useRole';
import { NavigationHelpers } from '~/src/core/utils/navigation';

export const useDriverOrderActions = (orderCode: string) => {
  const isDriver = useRoleDriver();

  const { mutate: assignOrderToMe } = useAssignOrderShippingToMe(() => {
    queryClient.invalidateQueries({ queryKey: ['orderDetail', orderCode] });
    showMessage({
      message: 'Gán đơn cho tài xế nội bộ thành công',
      type: 'success',
    });
  });

  const { mutate: cancelMyOrder } = useDriverCancelMyOrderShipping(() => {
    queryClient.invalidateQueries({ queryKey: ['orderDetail', orderCode] });
    showMessage({
      message: 'Huỷ gán đơn cho tôi thành công',
      type: 'success',
    });
  });

  const handleOrderInfo = () => {
    NavigationHelpers.toOrderInvoice(orderCode);
  };

  const handlePickOrder = () => {
    NavigationHelpers.toOrderPick(orderCode);
  };

  const handleScanBagDelivery = () => {
    NavigationHelpers.toOrderScanToDelivery(orderCode);
  };

  const handleUnassignOrder = () => {
    showAlert({
      title: 'Huỷ gán đơn cho tôi',
      message: 'Bạn có muốn huỷ gán đơn, để book AhaMove không?',
      onConfirm: () => {
        setLoading(true);
        hideAlert();
        cancelMyOrder({ orderCode });
      },
    });
  };

  const handleChangeDeliveryMethod = (
    onClose: () => void,
    setShowDeliveryTypeBottomSheet: (show: boolean) => void,
  ) => {
    onClose();
    setTimeout(() => {
      setShowDeliveryTypeBottomSheet(true);
    }, 100);
  };

  return {
    isDriver,
    handleOrderInfo,
    handlePickOrder,
    handleScanBagDelivery,
    handleUnassignOrder,
    handleChangeDeliveryMethod,
  };
};
