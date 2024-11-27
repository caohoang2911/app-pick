import { useOrderPick } from "../store/order-pick";

export const useCanEditOrderPick = () => {
  const orderDetail = useOrderPick.use.orderDetail();
  const { status } = orderDetail?.header || {};

  const productsInvalid = orderDetail?.delivery?.productItems?.every((item) => item?.pickedError);

  return status == "STORE_PICKING" || (status == "STORE_PACKED" && productsInvalid);
};
