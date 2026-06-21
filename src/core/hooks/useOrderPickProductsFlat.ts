import { useMemo } from 'react';
import { useOrderPick } from '~/src/core/store/order-pick';
import { getOrderPickProductsFlat } from '~/src/core/utils/order-bags';
import { Product } from '~/src/types/product';

/** Danh sách product phẳng từ `orderPickProducts` (memo theo store). */
export function useOrderPickProductsFlat(): Product[] {
  const orderPickProducts = useOrderPick.use.orderPickProducts();

  return useMemo(
    () => getOrderPickProductsFlat(orderPickProducts),
    [orderPickProducts],
  );
}
