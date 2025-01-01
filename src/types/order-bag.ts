export enum OrderBagType {
  DRY = 'DRY',
  FROZEN = 'FROZEN',
  FRESH = 'FRESH',
  NON_FOOD = 'NON_FOOD',
}

export enum OrderBagCode {
  DRY = 'DR',
  FROZEN = 'FZ',
  FRESH = 'FR',
  NON_FOOD = 'NF',
}

export enum OrderBagLabel {
  DRY = 'Hàng khô',
  FROZEN = 'Hàng đông lạnh',
  FRESH = 'Hàng tươi mát',
  NON_FOOD = 'Hàng non - Food',
}

export type OrderBagItem = {
  code: string;
  type: OrderBagType;
  name: string;
  isDone?: boolean;
}

export type OrderBag = {
  DRY: Array<any>;
  FROZEN: Array<any>;
  FRESH: Array<any>;
  NON_FOOD: Array<any>;
}