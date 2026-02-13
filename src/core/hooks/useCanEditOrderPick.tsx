import { useOrderDetailStore } from '../store/order-detail';

const PAYMENT_PROVIDER_EXCLUDE_EDITS = ['KINGFOOD_OFFLINE'];

export const useCanEditOrderPick = (code: string) => {
  // Tối ưu: lấy header trực tiếp từ selector thay vì toàn bộ orderDetail
  const header = useOrderDetailStore((s) =>
    code ? s.orderDetails[code]?.header : undefined,
  );
  const { status, saleChannel } = header || {};

  return (
    (status == 'STORE_PICKING' || status == 'STORE_PACKED') &&
    !PAYMENT_PROVIDER_EXCLUDE_EDITS.includes(saleChannel || '')
  );
};
