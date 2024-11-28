import { OrderBagCode, OrderBagItem, OrderBagType } from "~/src/types/order-bag";

export const transformBagsData: any = (bags: OrderBagItem[]) => {
  if (!bags) return { DRY: [], FROZEN: [], FRESH: [] };
  const dry = bags.filter((bag) => bag.type === 'DRY');
  const frozen = bags.filter((bag) => bag.type === 'FROZEN');
  const fresh = bags.filter((bag) => bag.type === 'FRESH');
  const nonFood = bags.filter((bag) => bag.type === 'NON_FOOD');

  const bagsType = {
    DRY: dry,
    FROZEN: frozen,
    FRESH: fresh,
    NON_FOOD: nonFood,
  };

  return bagsType;
}

export const generateBagCode = (type: OrderBagType, orderCode: string, index: number) => {
  return `${orderCode}-${OrderBagCode[type]}${index < 10 ? `0${index}` : index}`;
}