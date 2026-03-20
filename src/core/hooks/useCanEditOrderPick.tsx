import { useOrderDetailForCode } from '~/src/api/app-pick/use-get-order-detail';

const PAYMENT_PROVIDER_EXCLUDE_EDITS = ['KINGFOOD_OFFLINE'];

export const useCanEditOrderPick = (code: string) => {
  const { orderDetail } = useOrderDetailForCode(code);
  const header = orderDetail?.header;
  const { status, saleChannel } = header || {};

  return (
    (status == 'STORE_PICKING' || status == 'STORE_PACKED') &&
    !PAYMENT_PROVIDER_EXCLUDE_EDITS.includes(saleChannel || '')
  );
};
