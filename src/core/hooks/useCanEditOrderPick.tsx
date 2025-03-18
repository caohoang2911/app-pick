import { useOrderPick } from "../store/order-pick";

const PAYMENT_PROVIDER_EXCLUDE_EDITS = ['KINGFOOD_OFFLINE'];

export const useCanEditOrderPick = () => {
  const orderDetail = useOrderPick.use.orderDetail();
  const { status, saleChannel } = orderDetail?.header || {};

  return (status == "STORE_PICKING" || status == "STORE_PACKED") && !PAYMENT_PROVIDER_EXCLUDE_EDITS.includes(saleChannel || '');
};
