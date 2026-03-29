import { OrderDetail } from '~/src/types/order-pick';
import { Product } from '~/src/types/product';

export type OrderDetailQueryData = { data?: OrderDetail; error?: string };

const mergeProductIntoGroup = (group: any, picked: Product): any => {
  if (group?.elements?.length) {
    return {
      ...group,
      elements: group.elements.map((p: Product) =>
        p.id === picked.id ? { ...p, ...picked } : p,
      ),
    };
  }
  return group;
};

/**
 * Ghi đè product đã pick trong cache orderDetail (cùng phạm vi với setOrderPickProduct).
 */
export function mergePickedProductIntoOrderDetailData(
  old: OrderDetailQueryData | undefined,
  picked: Product,
): OrderDetailQueryData | undefined {
  if (!old?.data?.delivery) return old;

  const itemGroups = old.data.delivery.itemGroups;
  if (!itemGroups) return old;

  let nextItemGroups: typeof itemGroups;
  if (Array.isArray(itemGroups)) {
    nextItemGroups = itemGroups.map((g) =>
      mergeProductIntoGroup(g, picked),
    ) as typeof itemGroups;
  } else {
    nextItemGroups = Object.fromEntries(
      Object.entries(itemGroups as Record<string, unknown>).map(([k, v]) => [
        k,
        mergeProductIntoGroup(v, picked),
      ]),
    ) as typeof itemGroups;
  }

  return {
    ...old,
    data: {
      ...old.data,
      delivery: {
        ...old.data.delivery,
        itemGroups: nextItemGroups,
      },
    },
  };
}
