import { router } from 'expo-router';
import { showMessage } from 'react-native-flash-message';
import { hideAlert, showAlert } from '@/core/store/alert-dialog';
import { setLoading } from '~/src/core/store/loading';
import { queryClient } from '~/src/api/shared/api-provider';
import { useAssignOrderShippingToMe } from '~/src/api/app-pick-driver/useAssignOrderShippingToMe';
import { useDriverCancelMyOrderShipping } from '~/src/api/app-pick-driver/useDriverCancelMyOrderShipping';
import { useRoleDriver } from '~/src/core/hooks/useRole';

export const useDriverOrderActions = (orderCode: string) => {
  const isDriver = useRoleDriver();

  const { mutate: assignOrderToMe } = useAssignOrderShippingToMe(() => {
    queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
    showMessage({
      message: 'Gán đơn cho tôi thành công',
      type: 'success',
    });
  });

  const { mutate: cancelMyOrder } = useDriverCancelMyOrderShipping(() => {
    queryClient.invalidateQueries({ queryKey: ['orderDetail'] });
    showMessage({
      message: 'Huỷ gán đơn cho tôi thành công',
      type: 'success',
    });
  });

  const handleOrderInfo = () => {
    router.push(`orders/order-invoice/${orderCode}`);
  };

  const handlePickOrder = () => {
    router.push({ pathname: `orders/order-pick/${orderCode}` });
  };

  const handleScanBagDelivery = () => {
    router.push(`orders/order-scan-to-delivery/${orderCode}`);
  };

  const handleAssignOrder = () => {
    showAlert({
      title: 'Gán đơn cho tôi',
      message: 'Bạn có muốn gán đơn cho mình không?',
      onConfirm: () => {
        hideAlert();
        setLoading(true);
        assignOrderToMe({ status: "ENABLE", orderCode });
      },
    });
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

  const handleChangeDeliveryMethod = (onClose: () => void, setShowDeliveryTypeBottomSheet: (show: boolean) => void) => {
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
    handleAssignOrder,
    handleUnassignOrder,
    handleChangeDeliveryMethod,
  };
};
