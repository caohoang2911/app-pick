import { useOrderPick } from '../store/order-pick';

const PAYMENT_PROVIDER_EXCLUDE_EDITS = ['KINGFOOD_OFFLINE'];

export const useCanEditOrderPick = () => {
  // Tối ưu: lấy header trực tiếp từ selector thay vì toàn bộ orderDetail
  const header = useOrderPick((state) => state.orderDetail?.header);
  const { status, saleChannel } = header || {};

  return (
    (status == 'STORE_PICKING' || status == 'STORE_PACKED') &&
    !PAYMENT_PROVIDER_EXCLUDE_EDITS.includes(saleChannel || '')
  );
};
