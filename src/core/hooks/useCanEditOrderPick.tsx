import { useOrderPick } from "../store/order-pick";

export const useCanEditOrderPick = () => {
  const orderDetail = useOrderPick.use.orderDetail();
  const { status } = orderDetail?.header || {};

  return status == "STORE_PICKING" || status == "STORE_PACKED";
};
